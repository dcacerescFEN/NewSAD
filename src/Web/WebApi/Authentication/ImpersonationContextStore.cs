using System.Security.Cryptography;
using Application.Common.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace WebApi.Authentication;

/// <summary>Stores an impersonation context only for the lifetime of its originating bearer token.</summary>
public interface IImpersonationContextStore
{
    /// <summary>Associates a target context with an authenticated bearer token until its expiration.</summary>
    void Start(string bearerToken, ImpersonationTarget target, DateTimeOffset expiresAt);

    /// <summary>Gets the target context associated with an authenticated bearer token.</summary>
    bool TryGet(string bearerToken, out ImpersonationTarget target);

    /// <summary>Removes the target context associated with an authenticated bearer token.</summary>
    void Stop(string bearerToken);
}

/// <summary>In-memory implementation that never retains a raw bearer token.</summary>
public sealed class ImpersonationContextStore(IMemoryCache cache) : IImpersonationContextStore
{
    /// <inheritdoc />
    public void Start(string bearerToken, ImpersonationTarget target, DateTimeOffset expiresAt)
    {
        if (expiresAt <= DateTimeOffset.UtcNow) throw new InvalidOperationException("The bearer token is expired.");

        cache.Set(GetCacheKey(bearerToken), target, new MemoryCacheEntryOptions
        {
            AbsoluteExpiration = expiresAt,
        });
    }

    /// <inheritdoc />
    public bool TryGet(string bearerToken, out ImpersonationTarget target) =>
        cache.TryGetValue(GetCacheKey(bearerToken), out target!);

    /// <inheritdoc />
    public void Stop(string bearerToken) => cache.Remove(GetCacheKey(bearerToken));

    private static string GetCacheKey(string bearerToken) =>
        "impersonation:" + Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(bearerToken)));
}
