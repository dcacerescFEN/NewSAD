namespace Application.Common.Models;

/// <summary>Identifies the physical client of every menu destination this application can link to.</summary>
public sealed record SiteMenuDto
{
    public string? StudentsMenuClientId { get; init; }
    public string? TeachersMenuClientId { get; init; }
    public string? CoursesMenuClientId { get; init; }
    public string? ExamsMenuClientId { get; init; }
    public string? ActivitiesMenuClientId { get; init; }
    public string? AssistantsMenuClientId { get; init; }
    public string? ProcessesMenuClientId { get; init; }
    public string? ReportsMenuClientId { get; init; }
    public string? AdministrationMenuClientId { get; init; }
}
