using System.Net;
using System.Net.Http.Json;
using Application.Common.Models;
using Domain.Common;
using WebApi.IntegrationTests.TestInfrastructure;
using WebApi.Services;

namespace WebApi.IntegrationTests.Endpoints.Portal;

public sealed class PortalEndpointsTests
{
    [Fact]
    public async Task Bootstrap_ShouldReturnAuthStatusHeaders_WhenSessionIsMissing()
    {
        // Arrange
        await using var factory = new WebApplicationFactory<Program>();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        // Act
        using var response = await client.GetAsync("/api/portal/bootstrap");
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

    [Fact]
    public async Task Bootstrap_ShouldReturnConfiguredPortalParity_ForAuthenticatedUser()
    {
        // Arrange
        await using var factory = new AuthenticatedWebApplicationFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        var expectedPortal = factory.Services.GetRequiredService<PortalConfiguration>();

        // Act
        using var response = await client.GetAsync("/api/portal/bootstrap");
        var payload = await response.Content.ReadFromJsonAsync<ApiResponse<PortalBootstrapDto>>();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        payload.Should().NotBeNull();
        payload!.Success.Should().BeTrue();
        payload.Data.User.UserName.Should().Be("ada");
        payload.Data.User.DisplayName.Should().Be("Ada Lovelace");
        payload.Data.User.Roles.Should().Equal("Administrator", "Reporter");
        payload.Data.User.Permissions.Should().Equal("reports.view", "portal.open");

        payload.Data.NavigationLinks
            .Select(link => new { link.Label, link.Icon, link.Url })
            .Should()
            .Equal(expectedPortal.NavigationLinks.Select(link => new { link.Label, link.Icon, link.Url }));

        payload.Data.Reports
            .Select(report => new { report.Key, report.Label, report.EmbedUrl })
            .Should()
            .Equal(expectedPortal.Reports.Select(report => new { report.Key, report.Label, report.EmbedUrl }));

        payload.Data.Theme.DefaultMode.Should().Be(expectedPortal.Theme.DefaultMode);
        payload.Data.Theme.StorageKey.Should().Be(expectedPortal.Theme.StorageKey);
    }
}
