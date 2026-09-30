using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Configuration;

public static class InitialiserExtensions
{
    public static async Task InitialiseConfigurationAsync(this WebApplication app, IConfiguration configuration)
    {
        using var scope = app.Services.CreateScope();

        var initialiser = scope.ServiceProvider.GetRequiredService<ConfigurationInitialiser>();

        await initialiser.InitialiseAsync(configuration);
    }
}

public class ConfigurationInitialiser(ILogger<ConfigurationInitialiser> logger, AppConfigContext configContext)
{
    private readonly ILogger<ConfigurationInitialiser> _logger = logger;
    private readonly AppConfigContext _configContext = configContext;

    public async Task InitialiseAsync(IConfiguration configuration)
    {
        try
        {
            var applicationName = configuration.GetSection("ConfigureSite").GetSection("ApplicationName").Value!;
            var environmentName = configuration.GetSection("ConfigureSite").GetSection("EnvironmentName").Value!;


            var configurations = await _configContext.Configurations
                .Where(x => x.Application.ApplicationName == applicationName && x.Environment.EnvironmentName == environmentName && x.IsActive)
                .ToListAsync();

            ConfigSite.Initialize(
                applicationName,
                environmentName,
                configurations.Find(x => x.ConfigurationName.Equals("StatusSite", StringComparison.CurrentCultureIgnoreCase))?.ConfigurationValue ?? "1",
                ResolveMenuUrl(configurations, "StudentsMenuUrl", "https://sadalumnos-dev.fen.uchile.cl"),
                ResolveMenuUrl(configurations, "TeachersMenuUrl", "https://sadprofesores-dev.fen.uchile.cl"),
                ResolveMenuUrl(configurations, "CoursesMenuUrl", "https://sadcursos-dev.fen.uchile.cl"),
                ResolveMenuUrl(configurations, "ExamsMenuUrl", "https://sadexamenes-dev.fen.uchile.cl"),
                ResolveMenuUrl(configurations, "ActivitiesMenuUrl", "https://sadactividades-dev.fen.uchile.cl"),
                ResolveMenuUrl(configurations, "AssistantsMenuUrl", "https://sadasistentes-dev.fen.uchile.cl"),
                ResolveMenuUrl(configurations, "ProcessesMenuUrl", "https://sadprocesos-dev.fen.uchile.cl"),
                ResolveMenuUrl(configurations, "AdministrationMenuUrl", "https://sadadministracion-dev.fen.uchile.cl")
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Se produjo un error al tratar de obtener las configuraciones base de datos.");
            throw;
        }
    }

    internal static string ResolveMenuUrl(List<Domain.Entities.AppConfig.Configuration> activeConfigurations, string key, string fallback) =>
        activeConfigurations.Find(x => x.ConfigurationName.Equals(key, StringComparison.CurrentCultureIgnoreCase))?.ConfigurationValue ?? fallback;
}
