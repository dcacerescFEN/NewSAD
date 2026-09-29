using Infrastructure.Configuration;
using Infrastructure.Services;
using Microsoft.Extensions.Configuration;

namespace Infrastructure;

public static class ConfigureServices
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {

        services.AddDbContext<AppConfigContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("AppConfig")));



        services.AddScoped<IAppConfigContext>(provider => provider.GetRequiredService<AppConfigContext>());

        services.AddScoped<IApiResponseService, ApiResponseService>();
        services.AddScoped<ConfigurationInitialiser>();

        return services;
    }
}