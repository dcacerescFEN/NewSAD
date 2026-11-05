using Application.Common.Models;

namespace Infrastructure.Services;

/// <summary>Resolves the menu destinations from the site configuration loaded at startup.</summary>
public sealed class SiteMenuProvider : ISiteMenuProvider
{
    /// <inheritdoc />
    public SiteMenuDto GetMenu() => new()
    {
        StudentsMenuClientId = ConfigSite.StudentsMenuClientId,
        TeachersMenuClientId = ConfigSite.TeachersMenuClientId,
        CoursesMenuClientId = ConfigSite.CoursesMenuClientId,
        ExamsMenuClientId = ConfigSite.ExamsMenuClientId,
        ActivitiesMenuClientId = ConfigSite.ActivitiesMenuClientId,
        AssistantsMenuClientId = ConfigSite.AssistantsMenuClientId,
        ProcessesMenuClientId = ConfigSite.ProcessesMenuClientId,
        ReportsMenuClientId = ConfigSite.ReportsMenuClientId,
        AdministrationMenuClientId = ConfigSite.AdministrationMenuClientId,
    };
}
