namespace Application.Common.Mediator;

/// <summary>
/// Handles an application request.
/// </summary>
/// <typeparam name="TRequest">The request type handled by this handler.</typeparam>
/// <typeparam name="TResponse">The response type returned by this handler.</typeparam>
public interface IRequestHandler<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    /// <summary>
    /// Handles the specified request.
    /// </summary>
    /// <param name="request">The request to handle.</param>
    /// <param name="cancellationToken">The cancellation token for the asynchronous operation.</param>
    /// <returns>The handler response.</returns>
    Task<TResponse> Handle(TRequest request, CancellationToken cancellationToken);
}
