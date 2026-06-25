using Microsoft.Extensions.DependencyInjection;

namespace Application.Common.Mediator;

/// <summary>
/// Resolves and executes application request handlers through dependency injection.
/// </summary>
/// <param name="serviceProvider">The service provider used to resolve request handlers.</param>
public sealed class RequestDispatcher(IServiceProvider serviceProvider) : IRequestDispatcher
{
    private readonly IServiceProvider _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));

    /// <inheritdoc />
    public Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var handlerType = typeof(IRequestHandler<,>).MakeGenericType(request.GetType(), typeof(TResponse));
        dynamic handler = _serviceProvider.GetRequiredService(handlerType);
        return handler.Handle((dynamic)request, cancellationToken);
    }
}
