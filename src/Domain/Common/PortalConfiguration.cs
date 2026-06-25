namespace Domain.Common;

/// <summary>
/// Represents the portal configuration required to bootstrap the migrated NewSAD shell.
/// </summary>
public sealed record PortalConfiguration(
    IReadOnlyList<PortalNavigationLink> NavigationLinks,
    IReadOnlyList<PortalReport> Reports,
    PortalTheme Theme);

/// <summary>
/// Represents an external navigation destination exposed by the NewSAD shell.
/// </summary>
public sealed record PortalNavigationLink(string Label, string Icon, string Url);

/// <summary>
/// Represents a Power BI report made available to authenticated portal users.
/// </summary>
public sealed record PortalReport(string Key, string Label, string EmbedUrl);

/// <summary>
/// Represents theme bootstrap settings for the migrated portal.
/// </summary>
public sealed record PortalTheme(string DefaultMode, string StorageKey);
