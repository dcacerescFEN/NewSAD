using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Configuration;

public static class InitialiserExtensions
{
    public static async Task InitialiseConfigurationAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var initialiser = scope.ServiceProvider.GetRequiredService<ConfigurationInitialiser>();

        await initialiser.InitialiseAsync();
    }
}

public class ConfigurationInitialiser(ILogger<ConfigurationInitialiser> logger, AppConfigContext configContext)
{
    private readonly ILogger<ConfigurationInitialiser> _logger = logger;
    private readonly AppConfigContext _configContext = configContext;

    public async Task InitialiseAsync()
    {
        try
        {
            var configurations = await _configContext.Configurations
                .Where(x => x.Application.ApplicationName == ConfigSite.ApplicationName && x.Environment.EnvironmentName == ConfigSite.EnvironmentName)
                .ToListAsync();

            ConfigSite.StatusSite = configurations.Find(x => x.ConfigurationName.Equals("StatusSite", StringComparison.CurrentCultureIgnoreCase))?.ConfigurationValue ?? "1";
            string MenuUrl(string key) => ResolveMenuUrl(configurations, key);

            ConfigSite.UpdateMenuDestinations(new ConfigSite.MenuDestinations(
                MenuUrl("MenuAlumnosUrl"),
                MenuUrl("MenuProfesoresUrl"),
                MenuUrl("MenuCursosUrl"),
                MenuUrl("MenuExamenesUrl"),
                MenuUrl("MenuActividadesUrl"),
                MenuUrl("MenuAyudantesUrl"),
                MenuUrl("MenuProcesosUrl"),
                MenuUrl("MenuAdministracionUrl")));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Se produjo un error al tratar de obtener las configuraciones base de datos.");
            throw;
        }
    }

    internal static string ResolveMenuUrl(IEnumerable<Domain.Entities.AppConfig.Configuration> configurations, string key)
    {
        var matches = configurations
            .Where(x => x.IsActive && x.ConfigurationName.Equals(key, StringComparison.OrdinalIgnoreCase))
            .Take(2)
            .ToArray();

        return matches.Length == 1 ? matches[0].ConfigurationValue : string.Empty;
    }
}
