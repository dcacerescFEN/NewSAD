namespace Application.Common.Mediator;

/// <summary>
/// Dispatches application requests to their corresponding handlers.
/// </summary>
public interface IRequestDispatcher
{
    /// <summary>
    /// Sends the specified request to its registered handler.
    /// </summary>
    /// <typeparam name="TResponse">The response type expected from the handler.</typeparam>
    /// <param name="request">The request to execute.</param>
    /// <param name="cancellationToken">The cancellation token for the asynchronous operation.</param>
    /// <returns>The handler response.</returns>
    Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default);
}
