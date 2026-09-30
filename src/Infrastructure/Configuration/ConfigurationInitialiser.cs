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
                configurations.Find(x => x.ConfigurationName.Equals("StudentsMenuUrl", StringComparison.CurrentCultureIgnoreCase))?.ConfigurationValue ?? "https://sadalumnos-dev.fen.uchile.cl",
                configurations.Find(x => x.ConfigurationName.Equals("TeachersMenuUrl", StringComparison.CurrentCultureIgnoreCase))?.ConfigurationValue ?? "https://sadprofesores-dev.fen.uchile.cl",
                configurations.Find(x => x.ConfigurationName.Equals("CoursesMenuUrl", StringComparison.CurrentCultureIgnoreCase))?.ConfigurationValue ?? "https://sadcursos-dev.fen.uchile.cl",
                configurations.Find(x => x.ConfigurationName.Equals("ExamsMenuUrl", StringComparison.CurrentCultureIgnoreCase))?.ConfigurationValue ?? "https://sadexamenes-dev.fen.uchile.cl",
                configurations.Find(x => x.ConfigurationName.Equals("ActivitiesMenuUrl", StringComparison.CurrentCultureIgnoreCase))?.ConfigurationValue ?? "https://sadactividades-dev.fen.uchile.cl",
                configurations.Find(x => x.ConfigurationName.Equals("AssistantsMenuUrl", StringComparison.CurrentCultureIgnoreCase))?.ConfigurationValue ?? "https://sadasistentes-dev.fen.uchile.cl",
                configurations.Find(x => x.ConfigurationName.Equals("ProcessesMenuUrl", StringComparison.CurrentCultureIgnoreCase))?.ConfigurationValue ?? "https://sadprocesos-dev.fen.uchile.cl",
                configurations.Find(x => x.ConfigurationName.Equals("AdministrationMenuUrl", StringComparison.CurrentCultureIgnoreCase))?.ConfigurationValue ?? "https://sadadministracion-dev.fen.uchile.cl"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Se produjo un error al tratar de obtener las configuraciones base de datos.");
            throw;
        }
    }
}
