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
        var urls = new[] {
            "https://example.org/students", "https://example.org/teachers",
            "https://example.org/courses", "https://example.org/exams",
            "https://example.org/activities", "https://example.org/assistants",
            "https://example.org/processes", "https://example.org/administration"
        };
        ConfigSite.Initialize("App", "Test", "1", urls[0], urls[1], urls[2], urls[3], urls[4], urls[5], urls[6], urls[7]);

        var result = await new GetSiteConfigHandler(new ResponseService())
            .Handle(new GetSiteConfig(), CancellationToken.None);

        Assert.True(result.Success);
        Assert.Equal(urls[0], result.Data.StudentsMenuUrl);
        Assert.Equal(urls[1], result.Data.TeachersMenuUrl);
        Assert.Equal(urls[2], result.Data.CoursesMenuUrl);
        Assert.Equal(urls[3], result.Data.ExamsMenuUrl);
        Assert.Equal(urls[4], result.Data.ActivitiesMenuUrl);
        Assert.Equal(urls[5], result.Data.AssistantsMenuUrl);
        Assert.Equal(urls[6], result.Data.ProcessesMenuUrl);
        Assert.Equal(urls[7], result.Data.AdministrationMenuUrl);
    }

    [Fact]
    public void MissingMenuDestinationsRemainUnavailable()
    {
        ConfigSite.Initialize("App", "Test", "1", "", "", "", "", "", "", "", "");

        Assert.Equal("", ConfigSite.StudentsMenuUrl);
        Assert.Equal("", ConfigSite.AdministrationMenuUrl);
    }

    private sealed class ResponseService : IApiResponseService
    {
        public ApiResponse Success(string message) => new() { Success = true, Message = message };
        public ApiResponse<T> Success<T>(T data) => new() { Success = true, Data = data };
        public ApiResponse Fail(string message) => new() { Success = false, Message = message };
        public ApiResponse<T> Fail<T>(string message) => new() { Success = false, Message = message };
    }
}
