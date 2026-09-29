using System.Diagnostics.CodeAnalysis;

namespace Application.Common.Exceptions;

public static class Guards
{
    /// <returns><paramref name="input" /> if the value is not null.</returns>
    public static T NotFound<T>(this IGuardClause guardClause,
        [NotNull][ValidatedNotNull] T? input, string message)
    {
        guardClause.NullOrEmpty(message, nameof(message));

        if (input is null)
            throw new NotFoundException(message);

        return input;
    }

    public static void ForbiddenAccess(this IGuardClause guardClause, string message)
    {
        guardClause.NullOrEmpty(message, nameof(message));

        throw new ForbiddenAccessException(message);
    }

    public static T InvalidInput<T>(this IGuardClause guardClause, T input, Func<T, bool> predicate, string message)
    {
        guardClause.NullOrEmpty(message, nameof(message));

        if (!predicate(input))
            throw new ArgumentException(message);

        return input;
    }
}