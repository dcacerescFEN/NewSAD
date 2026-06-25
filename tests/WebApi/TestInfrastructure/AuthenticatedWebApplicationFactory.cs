using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace WebApi.IntegrationTests.TestInfrastructure;

internal sealed class AuthenticatedWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureTestServices(services =>
        {
            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = AuthenticatedTestAuthHandler.SchemeName;
                    options.DefaultChallengeScheme = AuthenticatedTestAuthHandler.SchemeName;
                    options.DefaultScheme = AuthenticatedTestAuthHandler.SchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, AuthenticatedTestAuthHandler>(AuthenticatedTestAuthHandler.SchemeName, _ =>
                {
                });
        });
    }
}
