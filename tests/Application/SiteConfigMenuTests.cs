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

    [Fact]
    public async Task OldCallersExposeUnconfiguredDestinationClientIdsAndReports()
    {
        ConfigSite.Initialize("App", "Test", "1", "", "", "", "", "", "", "", "");
        var result = await new GetSiteConfigHandler(new ResponseService()).Handle(new GetSiteConfig(), CancellationToken.None);
        Assert.True(result.Success);
        var json = System.Text.Json.JsonSerializer.SerializeToElement(result.Data);
        foreach (var module in new[] { "Students", "Teachers", "Courses", "Exams", "Activities", "Assistants", "Processes", "Reports", "Administration" })
            Assert.Null(json.GetProperty(module + "MenuClientId").GetString());
        Assert.Equal("", json.GetProperty("ReportsMenuUrl").GetString());
    }

    [Fact]
    public async Task SiteConfigPreservesEveryExactClientAndReportsUrlThenClearsOnReload()
    {
        ConfigSite.Initialize("App", "Test", "1", "s", "t", "c", "e", "a", "h", "p", "admin",
            studentsMenuClientId: "SADAlumnos-iis", teachersMenuClientId: "SADProfesores",
            coursesMenuClientId: "SADCursos-iis", examsMenuClientId: "SADExamenes",
            activitiesMenuClientId: "SADActividades", assistantsMenuClientId: "SADAyudantes",
            processesMenuClientId: "SADProcesos", administrationMenuClientId: "SADAdministracion-iis",
            reportsMenuUrl: "https://reports.test/custom", reportsMenuClientId: "SADInformes-iis");
        var response = await new GetSiteConfigHandler(new ResponseService()).Handle(new GetSiteConfig(), CancellationToken.None);
        Assert.True(response.Success);
        var json = System.Text.Json.JsonSerializer.SerializeToElement(response.Data);
        string[] modules = ["Students", "Teachers", "Courses", "Exams", "Activities", "Assistants", "Processes", "Administration", "Reports"];
        string[] clients = ["SADAlumnos-iis", "SADProfesores", "SADCursos-iis", "SADExamenes", "SADActividades", "SADAyudantes", "SADProcesos", "SADAdministracion-iis", "SADInformes-iis"];
        for (var index = 0; index < modules.Length; index++)
            Assert.Equal(clients[index], json.GetProperty(modules[index] + "MenuClientId").GetString());
        Assert.Equal("https://reports.test/custom", response.Data.ReportsMenuUrl);
        await OldCallersExposeUnconfiguredDestinationClientIdsAndReports();
    }

    private sealed class ResponseService : IApiResponseService
    {
        public ApiResponse Success(string message) => new() { Success = true, Message = message };
        public ApiResponse<T> Success<T>(T data) => new() { Success = true, Data = data };
        public ApiResponse Fail(string message) => new() { Success = false, Message = message };
        public ApiResponse<T> Fail<T>(string message) => new() { Success = false, Message = message };
    }
}
