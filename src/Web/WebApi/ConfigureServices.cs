using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Application.Common.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using WebApi.Services;

namespace WebApi;

public static class ConfigureServices
{
    public static IServiceCollection AddWebApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        var keycloakUrl = configuration["Keycloak:Url"]
            ?? throw new InvalidOperationException("Keycloak:Url must be configured.");
        var keycloakRealm = configuration["Keycloak:Realm"]
            ?? throw new InvalidOperationException("Keycloak:Realm must be configured.");
        var keycloakClientId = configuration["Keycloak:ClientId"]
            ?? throw new InvalidOperationException("Keycloak:ClientId must be configured.");
        var keycloakAuthority = $"{keycloakUrl.TrimEnd('/')}/realms/{keycloakRealm}";

        services.AddOpenApi("v1", options =>
        {
            options.AddDocumentTransformer((doc, _, _) =>
            {
                doc.Info = new OpenApiInfo
                {
                    Title = "SADAlumnos API",
                    Version = "1.0",
                };
                doc.Components ??= new OpenApiComponents();
                doc.Components.SecuritySchemes = new Dictionary<string, IOpenApiSecurityScheme>
                {
                    ["Keycloak"] = new OpenApiSecurityScheme
                    {
                        Type = SecuritySchemeType.OAuth2,
                        Flows = new OpenApiOAuthFlows
                        {
                            AuthorizationCode = new OpenApiOAuthFlow
                            {
                                AuthorizationUrl = new Uri($"{keycloakAuthority}/protocol/openid-connect/auth"),
                                TokenUrl = new Uri($"{keycloakAuthority}/protocol/openid-connect/token"),
                                Scopes = new Dictionary<string, string>
                                {
                                    ["openid"] = "Identidad del usuario",
                                    ["profile"] = "Perfil del usuario",
                                },
                            },
                        },
                    },
                };

                var tags = doc.Paths.Values
                    .Where(path => path.Operations is not null)
                    .SelectMany(path => path.Operations!.Values)
                    .SelectMany(operation => operation.Tags ?? Enumerable.Empty<OpenApiTagReference>())
                    .Select(tag => tag.Name)
                    .OfType<string>()
                    .Where(name => !string.IsNullOrWhiteSpace(name))
                    .Distinct(StringComparer.Ordinal)
                    .ToArray();

                var nestedTags = tags
                    .Where(name => name.Contains('/', StringComparison.Ordinal))
                    .GroupBy(name => name[..name.IndexOf('/')], StringComparer.Ordinal)
                    .ToArray();

                if (nestedTags.Length > 0)
                {
                    doc.Tags ??= new HashSet<OpenApiTag>();
                    foreach (var name in nestedTags.SelectMany(group => group))
                    {
                        var tag = doc.Tags.FirstOrDefault(item => item.Name == name);
                        if (tag is null)
                        {
                            tag = new OpenApiTag { Name = name };
                            doc.Tags.Add(tag);
                        }

                        tag.Extensions ??= new Dictionary<string, IOpenApiExtension>();
                        tag.Extensions["x-displayName"] = new JsonNodeExtension(
                            JsonValue.Create(name[(name.LastIndexOf('/') + 1)..])!);
                    }

                    var groups = nestedTags.Select(group => new
                    {
                        name = group.Key,
                        tags = (tags.Contains(group.Key, StringComparer.Ordinal)
                            ? new[] { group.Key }.Concat(group)
                            : group.AsEnumerable()).ToArray(),
                    });

                    doc.Extensions ??= new Dictionary<string, IOpenApiExtension>();
                    doc.Extensions["x-tagGroups"] = new JsonNodeExtension(JsonSerializer.SerializeToNode(groups)!);
                }

                return Task.CompletedTask;
            });
            options.AddOperationTransformer((operation, context, _) =>
            {
                var metadata = context.Description.ActionDescriptor.EndpointMetadata;
                if (metadata.OfType<IAuthorizeData>().Any()
                    && !metadata.OfType<IAllowAnonymous>().Any())
                {
                    operation.Security ??= [];
                    operation.Security.Add(new OpenApiSecurityRequirement
                    {
                        [new OpenApiSecuritySchemeReference("Keycloak", context.Document)] = ["openid", "profile"],
                    });
                }
                return Task.CompletedTask;
            });
        });

        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddHttpContextAccessor();
        services.AddSingleton<Authentication.IImpersonationContextStore, Authentication.ImpersonationContextStore>();
        services.AddMemoryCache();
        services.AddHttpClient();
        services.AddAuthorization();
        services.AddAuthentication(options =>
        {
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
            .AddJwtBearer(options =>
            {
                options.Authority = keycloakAuthority;
                options.Audience = keycloakClientId;
                options.RequireHttpsMetadata = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = options.Authority,
                    ValidateAudience = true,
                    ValidAudience = keycloakClientId,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    NameClaimType = "preferred_username",
                    RoleClaimType = System.Security.Claims.ClaimTypes.Role,
                    ClockSkew = TimeSpan.FromSeconds(30),
                };
                options.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = context =>
                    {
                        var logger = context.HttpContext.RequestServices
                            .GetRequiredService<ILoggerFactory>()
                            .CreateLogger("WebApi.Authentication.Keycloak");
                        logger.LogWarning(
                            "Keycloak bearer token validation failed: {FailureKind}",
                            GetTokenValidationFailureKind(context.Exception));
                        return Task.CompletedTask;
                    },
                    OnTokenValidated = context =>
                    {
                        if (context.Principal?.Identity is not System.Security.Claims.ClaimsIdentity identity)
                            return Task.CompletedTask;

                        Authentication.KeycloakClaimsMapper.Map(identity, keycloakClientId);
                        var bearerToken = context.Request.Headers.Authorization.ToString();
                        if (bearerToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                            && context.HttpContext.RequestServices.GetRequiredService<Authentication.IImpersonationContextStore>()
                                .TryGet(bearerToken["Bearer ".Length..].Trim(), out var target))
                            Authentication.KeycloakClaimsMapper.ApplyImpersonation(identity, target);

                        return Task.CompletedTask;
                    },
                };
            });

        return services;
    }


    private static string GetTokenValidationFailureKind(Exception exception) => exception switch
    {
        SecurityTokenInvalidAudienceException => "audience",
        SecurityTokenInvalidIssuerException => "issuer",
        SecurityTokenInvalidSignatureException or SecurityTokenSignatureKeyNotFoundException => "signature",
        _ => "token-validation",
    };
}
