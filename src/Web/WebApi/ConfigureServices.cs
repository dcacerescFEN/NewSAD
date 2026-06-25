using Domain.Common;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using WebApi.Extension;
using WebApi.Services;

namespace WebApi;

/// <summary>
/// Registers Web API services for the NewSAD host.
/// </summary>
public static class ConfigureServices
{
    /// <summary>
    /// Adds Web API services to the dependency injection container.
    /// </summary>
    /// <param name="services">The dependency injection service collection.</param>
    /// <param name="configuration">The application configuration root.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection AddWebApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "NewSAD API",
                Version = "v1"
            });
        });

        services.AddAuthorizationBuilder();
        services.AddHttpContextAccessor();
        services.AddScoped<SessionPrincipalFactory>();
        services.AddSingleton(CreatePortalConfiguration(configuration.GetSection("Portal")));
        services.AddEndpoints(typeof(ConfigureServices).Assembly);

        var keycloakUrl = configuration["Keycloak:Url"]
            ?? throw new InvalidOperationException("Configuration value 'Keycloak:Url' is required.");

        var keycloakRealm = configuration["Keycloak:Realm"]
            ?? throw new InvalidOperationException("Configuration value 'Keycloak:Realm' is required.");

        var keycloakClientId = configuration["Keycloak:ClientId"]
            ?? throw new InvalidOperationException("Configuration value 'Keycloak:ClientId' is required.");

        var keycloakClientSecret = configuration["Keycloak:ClientSecret"];

        services.AddAuthentication(options =>
        {
            options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        })
        .AddCookie(options =>
        {
            options.Cookie.Name = ".NewSAD.Session";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Strict;
            options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
            options.ExpireTimeSpan = TimeSpan.FromMinutes(60);
            options.SlidingExpiration = true;

            options.Events.OnRedirectToLogin = context =>
            {
                var sessionPrincipalFactory = context.HttpContext.RequestServices.GetRequiredService<SessionPrincipalFactory>();
                var sessionValidationFailure = sessionPrincipalFactory.GetSessionValidationFailure(context.HttpContext);

                if (sessionValidationFailure is not null)
                {
                    return WriteAuthenticationFailureResponseAsync(
                        context.HttpContext,
                        sessionPrincipalFactory,
                        StatusCodes.Status503ServiceUnavailable,
                        SessionPrincipalFactory.SessionValidationFailedStatus,
                        sessionValidationFailure.Message);
                }

                if (ShouldReturnAuthenticationStatusCode(context.Request))
                {
                    return WriteAuthenticationFailureResponseAsync(
                        context.HttpContext,
                        sessionPrincipalFactory,
                        StatusCodes.Status401Unauthorized,
                        SessionPrincipalFactory.UnauthenticatedStatus,
                        SessionPrincipalFactory.AuthenticationRequiredMessage,
                        canStartLogin: true);
                }

                context.Response.Redirect($"/api/auth/login?returnUrl={Uri.EscapeDataString(BuildReturnUrl(context.Request))}");
                return Task.CompletedTask;
            };

            options.Events.OnRedirectToAccessDenied = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            };

            options.Events.OnValidatePrincipal = async context =>
            {
                var sessionPrincipalFactory = context.HttpContext.RequestServices.GetRequiredService<SessionPrincipalFactory>();
                var currentTime = DateTimeOffset.UtcNow;

                if (!sessionPrincipalFactory.ShouldRevalidate(context.Properties, currentTime))
                {
                    return;
                }

                try
                {
                    var userName = sessionPrincipalFactory.ResolveUserName(context.Principal);
                    var snapshot = await sessionPrincipalFactory
                        .GetRequiredSnapshotAsync(userName, context.HttpContext.RequestAborted)
                        .ConfigureAwait(false);

                    context.ReplacePrincipal(sessionPrincipalFactory.CreatePrincipal(snapshot));
                    context.ShouldRenew = true;

                    if (context.Properties is not null)
                    {
                        sessionPrincipalFactory.StampRevalidation(context.Properties, currentTime);
                    }
                }
                catch (Exception)
                {
                    sessionPrincipalFactory.MarkSessionValidationFailure(
                        context.HttpContext,
                        "The current session could not be validated.");
                    context.RejectPrincipal();
                    await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme).ConfigureAwait(false);
                }
            };
        })
        .AddOpenIdConnect(OpenIdConnectDefaults.AuthenticationScheme, options =>
        {
            options.Authority = $"{keycloakUrl.TrimEnd('/')}/realms/{keycloakRealm}";
            options.ClientId = keycloakClientId;

            if (!string.IsNullOrWhiteSpace(keycloakClientSecret))
            {
                options.ClientSecret = keycloakClientSecret;
            }

            options.CallbackPath = "/api/signin-oidc";
            options.SignedOutCallbackPath = "/api/signout-callback-oidc";
            options.RemoteSignOutPath = "/api/signout-oidc";
            options.RequireHttpsMetadata = true;
            options.ResponseType = OpenIdConnectResponseType.Code;
            options.SaveTokens = true;
            options.GetClaimsFromUserInfoEndpoint = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                NameClaimType = "preferred_username"
            };
            options.Scope.Add("openid");
            options.Scope.Add("profile");
            options.Scope.Add("email");
            options.Events = new OpenIdConnectEvents
            {
                OnRemoteFailure = HandleOidcRemoteFailureAsync,
                OnAuthenticationFailed = HandleOidcAuthenticationFailureAsync,
                OnAccessDenied = HandleOidcAccessDeniedAsync,
                OnTokenValidated = async context =>
                {
                    var sessionPrincipalFactory = context.HttpContext.RequestServices.GetRequiredService<SessionPrincipalFactory>();

                    try
                    {
                        var userName = sessionPrincipalFactory.ResolveUserName(context.Principal);
                        var snapshot = await sessionPrincipalFactory
                            .GetRequiredSnapshotAsync(userName, context.HttpContext.RequestAborted)
                            .ConfigureAwait(false);

                        context.Principal = sessionPrincipalFactory.CreatePrincipal(snapshot);

                        if (context.Properties is not null)
                        {
                            sessionPrincipalFactory.StampRevalidation(context.Properties, DateTimeOffset.UtcNow);
                        }
                    }
                    catch (InvalidOperationException exception)
                    {
                        context.Fail(exception.Message);
                    }
                }
            };
        });

        return services;
    }

    private static PortalConfiguration CreatePortalConfiguration(IConfigurationSection portalSection)
    {
        ArgumentNullException.ThrowIfNull(portalSection);

        var navigationLinks = portalSection
            .GetSection("NavigationLinks")
            .GetChildren()
            .Select(static section => new PortalNavigationLink(
                section["Label"] ?? string.Empty,
                section["Icon"] ?? string.Empty,
                section["Url"] ?? string.Empty))
            .ToArray();

        var reports = portalSection
            .GetSection("Reports")
            .GetChildren()
            .Select(static section => new PortalReport(
                section["Key"] ?? string.Empty,
                section["Label"] ?? string.Empty,
                section["EmbedUrl"] ?? string.Empty))
            .ToArray();

        var themeSection = portalSection.GetSection("Theme");

        return new PortalConfiguration(
            navigationLinks,
            reports,
            new PortalTheme(
                themeSection["DefaultMode"] ?? "auto",
                themeSection["StorageKey"] ?? "newsad.theme"));
    }

    private static bool ShouldReturnAuthenticationStatusCode(HttpRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return request.Path.StartsWithSegments("/api")
            || string.Equals(request.Headers["X-Requested-With"], "XMLHttpRequest", StringComparison.Ordinal);
    }

    private static string BuildReturnUrl(HttpRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var path = $"{request.PathBase}{request.Path}{request.QueryString}";
        return string.IsNullOrWhiteSpace(path) ? "/" : path;
    }

    private static async Task HandleOidcRemoteFailureAsync(RemoteFailureContext context)
    {
        var oidcOptions = context.Options as OpenIdConnectOptions;
        var protocolError = await ResolveOidcRequestValueAsync(context.Request, "error").ConfigureAwait(false);
        var protectedState = await ResolveOidcRequestValueAsync(context.Request, "state").ConfigureAwait(false);
        var failureCode = ResolveOidcRemoteFailureCode(context, protocolError);

        LogOidcFailure(context.HttpContext, LogLevel.Warning, failureCode, context.Failure, context.Request.Path);

        context.HandleResponse();
        context.Response.Redirect(BuildOidcFailureRedirect(
            context.Request,
            failureCode,
            ResolveOidcFailureReturnUrl(
                context.Properties?.RedirectUri,
                protectedState,
                oidcOptions?.StateDataFormat)));
    }

    private static Task HandleOidcAuthenticationFailureAsync(AuthenticationFailedContext context)
    {
        var failureCode = ResolveOidcAuthenticationFailureCode(context);

        LogOidcFailure(context.HttpContext, LogLevel.Error, failureCode, context.Exception, context.Request.Path);

        context.HandleResponse();
        context.Response.Redirect(BuildOidcFailureRedirect(
            context.Request,
            failureCode,
            ResolveOidcFailureReturnUrl(
                context.Properties?.RedirectUri,
                context.ProtocolMessage?.State,
                context.Options.StateDataFormat)));

        return Task.CompletedTask;
    }

    private static Task HandleOidcAccessDeniedAsync(AccessDeniedContext context)
    {
        var oidcOptions = context.Options as OpenIdConnectOptions;
        const string failureCode = "access-denied";

        LogOidcFailure(context.HttpContext, LogLevel.Warning, failureCode, exception: null, context.Request.Path);

        context.HandleResponse();
        context.Response.Redirect(BuildOidcFailureRedirect(
            context.Request,
            failureCode,
            ResolveOidcFailureReturnUrl(
                context.Properties?.RedirectUri ?? context.ReturnUrl,
                protectedState: null,
                oidcOptions?.StateDataFormat)));

        return Task.CompletedTask;
    }

    private static string ResolveOidcRemoteFailureCode(RemoteFailureContext context, string? protocolError)
    {
        if (string.Equals(protocolError, "access_denied", StringComparison.OrdinalIgnoreCase))
        {
            return "access-denied";
        }

        return IsCallbackFailure(context.Failure, context.Request.Path)
            ? "callback-failed"
            : "remote-failure";
    }

    private static string ResolveOidcAuthenticationFailureCode(AuthenticationFailedContext context)
    {
        return IsCallbackFailure(context.Exception, context.Request.Path)
            ? "callback-failed"
            : "authentication-failed";
    }

    private static bool IsCallbackFailure(Exception? exception, PathString requestPath)
    {
        if (requestPath.StartsWithSegments("/api/signin-oidc", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var exceptionTypeName = exception?.GetType().Name;

        return exceptionTypeName?.Contains("Correlation", StringComparison.OrdinalIgnoreCase) == true
            || exceptionTypeName?.Contains("Nonce", StringComparison.OrdinalIgnoreCase) == true
            || exceptionTypeName?.Contains("OpenIdConnectProtocol", StringComparison.OrdinalIgnoreCase) == true;
    }

    private static void LogOidcFailure(
        HttpContext httpContext,
        LogLevel logLevel,
        string failureCode,
        Exception? exception,
        PathString requestPath)
    {
        ArgumentNullException.ThrowIfNull(httpContext);

        var logger = httpContext.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("WebApi.Auth.Oidc");

        logger.Log(
            logLevel,
            "OIDC authentication flow failed. FailureCode={FailureCode} ExceptionType={ExceptionType} RequestPath={RequestPath}",
            failureCode,
            exception?.GetType().Name ?? "None",
            requestPath.Value ?? string.Empty);
    }

    private static string BuildOidcFailureRedirect(HttpRequest request, string failureCode, string? returnUrl)
    {
        ArgumentNullException.ThrowIfNull(request);

        var safeReturnUrl = NormalizeLocalReturnUrl(returnUrl);
        return $"{request.PathBase}/login?error={Uri.EscapeDataString(failureCode)}&returnUrl={Uri.EscapeDataString(safeReturnUrl)}";
    }

    private static string ResolveOidcFailureReturnUrl(
        string? redirectUri,
        string? protectedState,
        ISecureDataFormat<AuthenticationProperties>? stateDataFormat)
    {
        var safeRedirectUri = NormalizeLocalReturnUrl(redirectUri);

        if (!string.Equals(safeRedirectUri, "/", StringComparison.Ordinal))
        {
            return safeRedirectUri;
        }

        if (string.IsNullOrWhiteSpace(protectedState) || stateDataFormat is null)
        {
            return safeRedirectUri;
        }

        try
        {
            var stateProperties = stateDataFormat.Unprotect(protectedState);
            return NormalizeLocalReturnUrl(stateProperties?.RedirectUri);
        }
        catch
        {
            return safeRedirectUri;
        }
    }

    private static async Task<string?> ResolveOidcRequestValueAsync(HttpRequest request, string key)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.Query.TryGetValue(key, out var queryValue)
            && !string.IsNullOrWhiteSpace(queryValue))
        {
            return queryValue.ToString();
        }

        if (!request.HasFormContentType)
        {
            return null;
        }

        try
        {
            var form = await request.ReadFormAsync().ConfigureAwait(false);

            if (form.TryGetValue(key, out var formValue)
                && !string.IsNullOrWhiteSpace(formValue))
            {
                return formValue.ToString();
            }
        }
        catch
        {
            return null;
        }

        return null;
    }

    private static string NormalizeLocalReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl)
            || !returnUrl.StartsWith('/')
            || returnUrl.StartsWith("//", StringComparison.Ordinal)
            || returnUrl.StartsWith(@"/\", StringComparison.Ordinal)
            || !Uri.TryCreate(returnUrl, UriKind.Relative, out _))
        {
            return "/";
        }

        return returnUrl;
    }

    private static Task WriteAuthenticationFailureResponseAsync(
        HttpContext httpContext,
        SessionPrincipalFactory sessionPrincipalFactory,
        int statusCode,
        string authStatus,
        string message,
        bool canStartLogin = false)
    {
        ArgumentNullException.ThrowIfNull(httpContext);
        ArgumentNullException.ThrowIfNull(sessionPrincipalFactory);

        sessionPrincipalFactory.SetAuthResponseHeaders(httpContext.Response, authStatus, canStartLogin);
        httpContext.Response.StatusCode = statusCode;

        return httpContext.Response.WriteAsJsonAsync(new ApiResponse
        {
            Success = false,
            Message = message
        });
    }
}
