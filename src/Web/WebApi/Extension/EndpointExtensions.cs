using System.Reflection;

namespace WebApi.Extension;

public static class EndpointExtensions
{
    public static IServiceCollection AddEndpoints(
        this IServiceCollection services,
        Assembly assembly)
    {
        var endpoints = assembly
            .DefinedTypes
            .Where(type =>
                !type.IsAbstract &&
                !type.IsInterface &&
                type.IsAssignableTo(typeof(IEndpoint)))
            .Select(type =>
                Activator.CreateInstance(type.AsType()) as IEndpoint)
            .Where(endpoint => endpoint is not null);

        foreach (var endpoint in endpoints)
        {
            services.AddSingleton(endpoint!);
        }

        return services;
    }

    public static WebApplication MapEndpoints(
        this WebApplication app)
    {
        var endpoints = app.Services
            .GetRequiredService<IEnumerable<IEndpoint>>();

        foreach (var endpoint in endpoints)
        {
            endpoint.MapEndpoint(app);
        }

        return app;
    }
}