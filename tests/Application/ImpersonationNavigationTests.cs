using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using Application.Common.Interfaces;
using Application.Common.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using WebApi.Authentication;
using WebApi.Services;

namespace Application;

public sealed class ImpersonationNavigationTests
{
    [Fact]
    public async Task ResolvesImpersonatedDestinationGrantsWithoutMixingTheActorAuthorization()
    {
        var handler = new NavigationHandler();
        var service = CreateService(handler);

        var target = await service.GetImpersonationTargetAsync("target-user", "actor-token", CancellationToken.None);

        var json = JsonSerializer.SerializeToElement(target);
        Assert.True(json.TryGetProperty("SiteAccess", out var sites));
        Assert.Equal(["ADMINISTRATION_ACCESS"], Values(sites, "SADAdministracion-iis", "Permissions"));
        Assert.Equal(["ADMINISTRATION_ADMIN"], Values(sites, "SADAdministracion-iis", "Roles"));
        Assert.False(sites.TryGetProperty("SADAdministracion", out _));
        Assert.Equal(["STUDENT_ACCESS_STUDENT_MODULE"], target.Permissions);
        Assert.Empty(target.Roles);

        var identity = new ClaimsIdentity([new Claim("preferred_username", "admin")], "Bearer");
        KeycloakClaimsMapper.ApplyImpersonation(identity, target);
        Assert.False(identity.HasClaim(ClaimTypes.Role, "ADMINISTRATION_ADMIN"));
        Assert.False(identity.HasClaim(KeycloakClaimsMapper.PermissionsClaimType, "ADMINISTRATION_ACCESS"));
        Assert.All(handler.Requests, request => Assert.Equal("Bearer actor-token", request.Headers.Authorization!.ToString()));
        Assert.Equal(5, handler.Requests.Count);
        Assert.Contains(handler.Requests, request =>
            request.RequestUri!.AbsolutePath.EndsWith("/users/target-id/role-mappings/clients/administration-uuid/composite"));
    }

    [Fact]
    public async Task KeepsOnlyTheActiveClientWhenNoDestinationIsConfigured()
    {
        var service = CreateService(new NavigationHandler(), new SiteMenuDto());

        var target = await service.GetImpersonationTargetAsync("target-user", "actor-token", CancellationToken.None);

        Assert.Equal(["SADAlumnos"], target.SiteAccess.Keys);
    }

    [Theory]
    [InlineData(HttpStatusCode.Forbidden, "keycloak_user_query_denied")]
    [InlineData(HttpStatusCode.BadGateway, "keycloak_unavailable")]
    public async Task ReturnsNoPartialAccessWhenADestinationQueryFails(HttpStatusCode status, string code)
    {
        var handler = new NavigationHandler(status);
        var exception = await Assert.ThrowsAsync<ImpersonationException>(() =>
            CreateService(handler).GetImpersonationTargetAsync("target-user", "actor-token", CancellationToken.None));
        Assert.Equal(code, exception.Code);
    }

    private static string?[] Values(JsonElement sites, string clientId, string member) =>
        sites.GetProperty(clientId).GetProperty(member).EnumerateArray().Select(value => value.GetString()).ToArray();

    private static AuthService CreateService(NavigationHandler handler, SiteMenuDto? menu = null)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Keycloak:Url"] = "https://keycloak.example.test",
            ["Keycloak:Realm"] = "SAD",
            ["Keycloak:ClientId"] = "SADAlumnos",
        }).Build();
        var menuProvider = new StubSiteMenuProvider(menu ?? new SiteMenuDto
        {
            AdministrationMenuClientId = "SADAdministracion-iis",
        });
        return new AuthService(new HttpContextAccessor(), new StubHttpClientFactory(handler), configuration,
            NullLogger<AuthService>.Instance, menuProvider);
    }

    private sealed class StubHttpClientFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private sealed class StubSiteMenuProvider(SiteMenuDto menu) : ISiteMenuProvider
    {
        public SiteMenuDto GetMenu() => menu;
    }

    private sealed class NavigationHandler(HttpStatusCode destinationStatus = HttpStatusCode.OK) : HttpMessageHandler
    {
        public List<HttpRequestMessage> Requests { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request);
            var uri = request.RequestUri!;
            if (uri.Query == "?clientId=SADAdministracion-iis" && destinationStatus != HttpStatusCode.OK)
                return Task.FromResult(new HttpResponseMessage(destinationStatus));
            object data = uri.Query switch
            {
                "?username=target-user%40fen.uchile.cl&exact=true" => new[] { new { id = "target-id", username = "target-user@fen.uchile.cl" } },
                "?clientId=SADAlumnos" => new[] { new { id = "student-uuid", clientId = "SADAlumnos" } },
                "?clientId=SADAdministracion-iis" => new[] { new { id = "administration-uuid", clientId = "SADAdministracion-iis" } },
                _ when uri.AbsolutePath.EndsWith("/clients/student-uuid/composite") => new[] { new { name = "PERMISSION_STUDENT_ACCESS_STUDENT_MODULE" } },
                _ when uri.AbsolutePath.EndsWith("/clients/administration-uuid/composite") => new[] { new { name = "ROLE_ADMINISTRATION_ADMIN" }, new { name = "PERMISSION_ADMINISTRATION_ACCESS" } },
                _ => throw new InvalidOperationException("Unexpected navigation query in the impersonation test."),
            };
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = JsonContent.Create(data) });
        }
    }
}
