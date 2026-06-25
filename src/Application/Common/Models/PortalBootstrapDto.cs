namespace Application.Common.Models;

/// <summary>
/// Represents the authenticated session user returned to the frontend bootstrap payload.
/// </summary>
public sealed record SessionUserDto(string UserName, string DisplayName, IReadOnlyList<string> Roles, IReadOnlyList<string> Permissions);

/// <summary>
/// Represents a navigation link returned by the portal bootstrap endpoint.
/// </summary>
public sealed record NavigationLinkDto(string Label, string Icon, string Url);

/// <summary>
/// Represents a report entry returned by the portal bootstrap endpoint.
/// </summary>
public sealed record ReportItemDto(string Key, string Label, string EmbedUrl);

/// <summary>
/// Represents theme settings returned by the portal bootstrap endpoint.
/// </summary>
public sealed record ThemeConfigDto(string DefaultMode, string StorageKey);

/// <summary>
/// Represents the complete bootstrap payload required by the Angular portal shell.
/// </summary>
public sealed record PortalBootstrapDto(
    SessionUserDto User,
    IReadOnlyList<NavigationLinkDto> NavigationLinks,
    IReadOnlyList<ReportItemDto> Reports,
    ThemeConfigDto Theme);
