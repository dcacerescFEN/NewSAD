namespace Domain.Common;

/// <summary>
/// Represents the non-generic outcome of an application operation.
/// </summary>
public class ApiResponse
{
    /// <summary>
    /// Gets or sets a value indicating whether the operation completed successfully.
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Gets or sets the message describing the operation outcome.
    /// </summary>
    public string Message { get; set; } = null!;
}

/// <summary>
/// Represents the outcome of an application operation with payload data.
/// </summary>
/// <typeparam name="T">The payload type returned by the operation.</typeparam>
public class ApiResponse<T> : ApiResponse
{
    /// <summary>
    /// Gets or sets the payload returned by the operation.
    /// </summary>
    public T Data { get; set; } = default!;
}
