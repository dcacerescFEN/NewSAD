using Application.Common.Mediator;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

/// <summary>
/// Registers application-layer services for the NewSAD solution.
/// </summary>
public static class ConfigureServices
{
    /// <summary>
    /// Adds application-layer services to the dependency injection container.
    /// </summary>
    /// <param name="services">The dependency injection service collection.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IRequestDispatcher, RequestDispatcher>();

        services.Scan(scan => scan
            .FromAssemblies(typeof(ConfigureServices).Assembly)
            .AddClasses(classes => classes.AssignableTo(typeof(IRequestHandler<,>)))
            .AsImplementedInterfaces()
            .WithScopedLifetime());

        return services;
    }
}
