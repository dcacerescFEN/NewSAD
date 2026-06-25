using Application.Auth.Commands.UserLogin;
using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Constants;
using Moq;

namespace Application.UnitTests.Auth.Commands.UserLoginTests;

public sealed class UserLoginHandlerTests
{
    [Fact]
    public async Task Handle_ShouldAuthorizeActiveUser_WhenLocalAccessExists()
    {
        // Arrange
        var access = new SadAdministracionUserAccess(
            "ada",
            "Ada",
            "Lovelace",
            true,
            [Roles.Administrator, Roles.Administrator, "Reporter"],
            ["reports.view", "reports.view", "portal.open"]);

        var sadAdministracionAccess = new Mock<ISadAdministracionAccess>();
        sadAdministracionAccess
            .Setup(service => service.FindUserAccessAsync("ada", It.IsAny<CancellationToken>()))
            .ReturnsAsync(access);

        var handler = new UserLoginHandler(sadAdministracionAccess.Object);

        // Act
        var response = await handler.Handle(new Application.Auth.Commands.UserLogin.UserLogin(" ada "), CancellationToken.None);

        // Assert
        response.Success.Should().BeTrue();
        response.Message.Should().Be("The user is authorized for a NewSAD session.");
        response.Data.UserName.Should().Be("ada");
        response.Data.FirstName.Should().Be("Ada");
        response.Data.LastName.Should().Be("Lovelace");
        response.Data.Roles.Should().Equal(Roles.Administrator, "Reporter");
        response.Data.Permissions.Should().Equal("reports.view", "portal.open");
        response.Data.IsAdministrator.Should().BeTrue();
        response.Data.CanImpersonate.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_ShouldDenyUser_WhenLocalAccessIsInactive()
    {
        // Arrange
        var access = new SadAdministracionUserAccess(
            "ada",
            "Ada",
            "Lovelace",
            false,
            [],
            []);

        var sadAdministracionAccess = new Mock<ISadAdministracionAccess>();
        sadAdministracionAccess
            .Setup(service => service.FindUserAccessAsync("ada", It.IsAny<CancellationToken>()))
            .ReturnsAsync(access);

        var handler = new UserLoginHandler(sadAdministracionAccess.Object);

        // Act
        var response = await handler.Handle(new Application.Auth.Commands.UserLogin.UserLogin("ada"), CancellationToken.None);

        // Assert
        response.Success.Should().BeFalse();
        response.Message.Should().Be("The user does not exist or is inactive in the local authorization store.");
        response.Data.Should().BeNull();
    }
}
