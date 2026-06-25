using System.Reflection;

namespace WebApi.Extension;

/// <summary>
/// Provides endpoint discovery and mapping helpers for minimal APIs.
/// </summary>
public static class EndpointExtensions
{
    /// <summary>
    /// Discovers and registers endpoint implementations from the provided assembly.
    /// </summary>
    /// <param name="services">The dependency injection service collection.</param>
    /// <param name="assembly">The assembly containing endpoint implementations.</param>
    /// <returns>The updated service collection.</returns>
    public static IServiceCollection AddEndpoints(this IServiceCollection services, Assembly assembly)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(assembly);

        var endpoints = assembly
            .DefinedTypes
            .Where(type =>
                !type.IsAbstract
                && !type.IsInterface
                && type.IsAssignableTo(typeof(IEndpoint)))
            .Select(type => Activator.CreateInstance(type.AsType()) as IEndpoint)
            .Where(static endpoint => endpoint is not null);

        foreach (var endpoint in endpoints)
        {
            services.AddSingleton(endpoint!);
        }

        return services;
    }

    /// <summary>
    /// Maps every registered endpoint implementation into the current application.
    /// </summary>
    /// <param name="app">The web application.</param>
    /// <returns>The current web application.</returns>
    public static WebApplication MapEndpoints(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        var endpoints = app.Services.GetRequiredService<IEnumerable<IEndpoint>>();

        foreach (var endpoint in endpoints)
        {
            endpoint.MapEndpoint(app);
        }

        return app;
    }
}
