namespace Application.Common.Models;

public record SiteConfigDto
{
    public string StudentsMenuUrl { get; init; } = default!;
    public string TeachersMenuUrl { get; init; } = default!;
    public string CoursesMenuUrl { get; init; } = default!;
    public string ExamsMenuUrl { get; init; } = default!;
    public string ActivitiesMenuUrl { get; init; } = default!;
    public string AssistantsMenuUrl { get; init; } = default!;
    public string ProcessesMenuUrl { get; init; } = default!;
    public string AdministrationMenuUrl { get; init; } = default!;
}
