using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Config.Queries.GetSiteConfig;
using Domain.Common;

namespace Application;

public class SiteConfigMenuTests
{
    [Fact]
    public async Task SiteConfigReturnsAllEightMenuDestinations()
    {
        var destinations = new ConfigSite.MenuDestinations(
            "https://example.org/alumnos", "https://example.org/profesores",
            "https://example.org/cursos", "https://example.org/examenes",
            "https://example.org/actividades", "https://example.org/ayudantes",
            "https://example.org/procesos", "https://example.org/administracion");
        ConfigSite.UpdateMenuDestinations(destinations);

        var result = await new GetSiteConfigHandler(new ResponseService())
            .Handle(new GetSiteConfig(), CancellationToken.None);

        Assert.True(result.Success);
        Assert.Equal(destinations, result.Data.Menu);
    }

    [Fact]
    public void MissingMenuDestinationsRemainUnavailable()
    {
        var missing = new ConfigSite.MenuDestinations("", "", "", "", "", "", "", "");
        ConfigSite.UpdateMenuDestinations(missing);

        Assert.Equal(missing, ConfigSite.Menu);
    }

    private sealed class ResponseService : IApiResponseService
    {
        public ApiResponse Success(string message) => new() { Success = true, Message = message };
        public ApiResponse<T> Success<T>(T data) => new() { Success = true, Data = data };
        public ApiResponse Fail(string message) => new() { Success = false, Message = message };
        public ApiResponse<T> Fail<T>(string message) => new() { Success = false, Message = message };
    }
}
