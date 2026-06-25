using System.Net;
using System.Net.Http.Json;
using Domain.Common;
using Microsoft.AspNetCore.WebUtilities;
using WebApi.IntegrationTests.TestInfrastructure;
using WebApi.Services;

namespace WebApi.IntegrationTests.Endpoints.Auth;

public sealed class AuthEndpointsTests
{
    [Fact]
    public async Task Login_ShouldPreserveSafeLocalReturnUrl_InChallengeState()
    {
        // Arrange
        await using var factory = new LoginChallengeWebApplicationFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        // Act
        using var response = await client.GetAsync("/api/auth/login?returnUrl=%2Freports%3Ftab%3D1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Redirect);
        response.Headers.Location.Should().NotBeNull();
        response.Headers.Location!.AbsoluteUri.Should().StartWith("https://identity.example.com/authorize");

        var state = QueryHelpers.ParseQuery(response.Headers.Location.Query)["state"].ToString();
        state.Should().NotBeNullOrWhiteSpace();

        var authenticationProperties = factory.UnprotectState(state);
        authenticationProperties.RedirectUri.Should().Be("/reports?tab=1");
    }

    [Fact]
    public async Task Login_ShouldFallbackToRoot_WhenReturnUrlIsUnsafe()
    {
        // Arrange
        await using var factory = new LoginChallengeWebApplicationFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        // Act
        using var response = await client.GetAsync("/api/auth/login?returnUrl=https%3A%2F%2Fevil.example.com");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Redirect);
        response.Headers.Location.Should().NotBeNull();

        var state = QueryHelpers.ParseQuery(response.Headers.Location!.Query)["state"].ToString();
        var authenticationProperties = factory.UnprotectState(state);

        authenticationProperties.RedirectUri.Should().Be("/");
    }

    [Fact]
    public async Task UserInfo_ShouldReturnAuthStatusHeaders_WhenSessionIsMissing()
    {
        // Arrange
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        // Act
        using var response = await client.GetAsync("/api/auth/user-info");
        var payload = await response.Content.ReadFromJsonAsync<ApiResponse>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        response.Headers.TryGetValues(SessionPrincipalFactory.AuthStatusHeaderName, out var authStatuses).Should().BeTrue();
        authStatuses.Should().ContainSingle().Which.Should().Be(SessionPrincipalFactory.UnauthenticatedStatus);
        response.Headers.TryGetValues(SessionPrincipalFactory.AuthActionHeaderName, out var authActions).Should().BeTrue();
        authActions.Should().ContainSingle().Which.Should().Be(SessionPrincipalFactory.LoginAction);
        payload.Should().NotBeNull();
        payload!.Success.Should().BeFalse();
        payload.Message.Should().Be(SessionPrincipalFactory.AuthenticationRequiredMessage);
    }
}
