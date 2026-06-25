using Application.Common.Interfaces;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure;

/// <summary>
/// Registers infrastructure-layer services for the NewSAD solution.
/// </summary>
public static class ConfigureServices
{
    /// <summary>
    /// Adds infrastructure-layer services to the dependency injection container.
    /// </summary>
    /// <param name="services">The dependency injection service collection.</param>
    /// <param name="configuration">The application configuration root.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var sadConnectionString = configuration.GetConnectionString("SAD")
            ?? throw new InvalidOperationException("Connection string 'SAD' is required.");

        services.AddDbContext<SADAdministracionContext>(options =>
            options.UseSqlServer(sadConnectionString));

        services.AddScoped<ISadAdministracionAccess, SadAdministracionAccess>();

        return services;
    }
}
