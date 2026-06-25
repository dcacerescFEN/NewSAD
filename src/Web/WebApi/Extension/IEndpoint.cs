namespace WebApi.Extension;

/// <summary>
/// Defines a minimal API endpoint that can register itself with the application route builder.
/// </summary>
public interface IEndpoint
{
    /// <summary>
    /// Maps the endpoint routes into the application pipeline.
    /// </summary>
    /// <param name="app">The endpoint route builder.</param>
    void MapEndpoint(IEndpointRouteBuilder app);
}
