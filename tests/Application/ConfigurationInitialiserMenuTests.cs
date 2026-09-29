using Domain.Entities.AppConfig;
using Infrastructure.Configuration;

namespace Application;

public class ConfigurationInitialiserMenuTests
{
    [Fact]
    public void DuplicateActiveKeysAreUnavailableRegardlessOfRowOrder()
    {
        var first = Row("MenuAlumnosUrl", "https://example.org/first");
        var second = Row("menualumnosurl", "https://example.org/second");

        Assert.Equal(string.Empty, ConfigurationInitialiser.ResolveMenuUrl([first, second], "MenuAlumnosUrl"));
        Assert.Equal(string.Empty, ConfigurationInitialiser.ResolveMenuUrl([second, first], "MenuAlumnosUrl"));
        Assert.Equal(string.Empty, ConfigurationInitialiser.ResolveMenuUrl([first, Row("MenuAlumnosUrl", "https://example.org/third")], "MenuAlumnosUrl"));
    }

    [Fact]
    public void MissingAndInactiveKeysAreUnavailableButAnInactiveDuplicateDoesNotHideTheActiveKey()
    {
        var active = Row("MenuAlumnosUrl", "https://example.org/alumnos");
        var inactive = Row("menualumnosurl", "https://example.org/inactive", false);

        Assert.Equal(string.Empty, ConfigurationInitialiser.ResolveMenuUrl([], "MenuAlumnosUrl"));
        Assert.Equal(string.Empty, ConfigurationInitialiser.ResolveMenuUrl([inactive], "MenuAlumnosUrl"));
        Assert.Equal(active.ConfigurationValue, ConfigurationInitialiser.ResolveMenuUrl([inactive, active], "MenuAlumnosUrl"));
    }

    private static Configuration Row(string key, string value, bool isActive = true) => new()
    {
        ConfigurationName = key,
        ConfigurationValue = value,
        IsActive = isActive
    };
}
