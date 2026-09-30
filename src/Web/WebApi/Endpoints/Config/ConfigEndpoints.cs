using Application.Config.Queries.GetSiteConfig;

namespace WebApi.Endpoints.Config;

public class ConfigEndpoints : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/config")
            .RequireAuthorization()
            .WithTags("Config");

        group.MapGet("/site", GetSiteConfig)
            .RequireAuthorization(Domain.Constants.Permission.SAD_Enter);
    }

    [EndpointSummary("Obtiene configuración inicial del sitio")]
    private static async Task<IResult> GetSiteConfig(IRequestDispatcher sender)
    {
        var result = await sender.Send(new GetSiteConfig());
        return Results.Ok(result);
    }
}
