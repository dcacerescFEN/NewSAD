namespace Domain.Common;

public static class ConfigSite
{
    private sealed record Settings(
        string ApplicationName,
        string EnvironmentName,
        string StatusSite,
        string StudentsMenuUrl,
        string TeachersMenuUrl,
        string CoursesMenuUrl,
        string ExamsMenuUrl,
        string ActivitiesMenuUrl,
        string AssistantsMenuUrl,
        string ProcessesMenuUrl,
        string AdministrationMenuUrl);

    private static Settings? _settings;

    private static Settings Current =>
        Volatile.Read(ref _settings)
        ?? throw new InvalidOperationException(
            "Config todavía no ha sido inicializada.");

    public static string StatusSite => Current.StatusSite;
    public static string ApplicationName => Current.ApplicationName;
    public static string EnvironmentName => Current.EnvironmentName;
    public static string StudentsMenuUrl => Current.StudentsMenuUrl;
    public static string TeachersMenuUrl => Current.TeachersMenuUrl;
    public static string CoursesMenuUrl => Current.CoursesMenuUrl;
    public static string ExamsMenuUrl => Current.ExamsMenuUrl;
    public static string ActivitiesMenuUrl => Current.ActivitiesMenuUrl;
    public static string AssistantsMenuUrl => Current.AssistantsMenuUrl;
    public static string ProcessesMenuUrl => Current.ProcessesMenuUrl;
    public static string AdministrationMenuUrl => Current.AdministrationMenuUrl;

    public static void Initialize(
        string applicationName,
        string environmentName,
        string statusSite,
        string studentsMenuUrl,
        string teachersMenuUrl,
        string coursesMenuUrl,
        string examsMenuUrl,
        string activitiesMenuUrl,
        string assistantsMenuUrl,
        string processesMenuUrl,
        string administrationMenuUrl)
    {
        var settings = new Settings(
            applicationName,
            environmentName,
            statusSite,
            studentsMenuUrl,
            teachersMenuUrl,
            coursesMenuUrl,
            examsMenuUrl,
            activitiesMenuUrl,
            assistantsMenuUrl,
            processesMenuUrl,
            administrationMenuUrl);

        Volatile.Write(ref _settings, settings);
    }

}
