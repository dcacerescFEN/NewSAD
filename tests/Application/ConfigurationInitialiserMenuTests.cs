using Domain.Entities.AppConfig;
using Infrastructure.Configuration;

namespace Application;

public class ConfigurationInitialiserMenuTests
{
    [Fact]
    public void ResolvesCurrentMenuKeyIgnoringCase()
    {
        var activeRows = new List<Configuration> { Row("studentsmenuurl", "https://example.org/students") };

        Assert.Equal("https://example.org/students",
            ConfigurationInitialiser.ResolveMenuUrl(activeRows, "StudentsMenuUrl", "fallback"));
    }

    [Fact]
    public void MissingKeyUsesFallback()
    {
        var activeRows = new List<Configuration> { Row("TeachersMenuUrl", "https://example.org/teachers") };

        Assert.Equal("fallback", ConfigurationInitialiser.ResolveMenuUrl(activeRows, "StudentsMenuUrl", "fallback"));
        Assert.Equal("fallback", ConfigurationInitialiser.ResolveMenuUrl([], "StudentsMenuUrl", "fallback"));
    }

    private static Configuration Row(string key, string value) => new()
    {
        ConfigurationName = key,
        ConfigurationValue = value,
        IsActive = true
    };
}
