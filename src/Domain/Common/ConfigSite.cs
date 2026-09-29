namespace Domain.Common;

public static class ConfigSite
{
    public sealed record MenuDestinations(
        string Alumnos,
        string Profesores,
        string Cursos,
        string Examenes,
        string Actividades,
        string Ayudantes,
        string Procesos,
        string Administracion);

    private static MenuDestinations _menuDestinations = new("", "", "", "", "", "", "", "");

    public static MenuDestinations Menu => Volatile.Read(ref _menuDestinations);

    public static void UpdateMenuDestinations(MenuDestinations destinations)
    {
        ArgumentNullException.ThrowIfNull(destinations);
        Volatile.Write(ref _menuDestinations, destinations);
    }

    private sealed record DynamicConfigurationSnapshot(
        string DefaultSemester,
        string DefaultSemesterPosgraduate,
        string[] PregraduateStudentTypes);

    private static DynamicConfigurationSnapshot _dynamicConfiguration = new(
        string.Empty,
        string.Empty,
        []);
    private static string? _statusSite;
    private static string? _applicationName;
    private static string? _environmentName;

    public static string StatusSite
    {
        get => _statusSite!;
        set => SetOnce(ref _statusSite, value);
    }


    public static string ApplicationName
    {
        get => _applicationName!;
        set => SetOnce(ref _applicationName, value);
    }

    public static string EnvironmentName
    {
        get => _environmentName!;
        set => SetOnce(ref _environmentName, value);
    }

    public static string DefaultSemester
    {
        get => Volatile.Read(ref _dynamicConfiguration).DefaultSemester;
    }

    public static string DefaultSemesterPosgraduate
    {
        get => Volatile.Read(ref _dynamicConfiguration).DefaultSemesterPosgraduate;
    }

    public static string[] PregraduateStudentTypes
    {
        get => Volatile.Read(ref _dynamicConfiguration).PregraduateStudentTypes;
    }

    public static void UpdateDynamicConfiguration(
        string? defaultSemester,
        string? defaultSemesterPosgraduate,
        IEnumerable<string> pregraduateStudentTypes)
    {
        ArgumentNullException.ThrowIfNull(pregraduateStudentTypes);

        var normalizedStudentTypes = pregraduateStudentTypes
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .Select(static value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        Volatile.Write(
            ref _dynamicConfiguration,
            new DynamicConfigurationSnapshot(
                defaultSemester ?? string.Empty,
                defaultSemesterPosgraduate ?? string.Empty,
                normalizedStudentTypes));
    }

    private static void SetOnce<T>(ref T? field, T value) where T : class
    {
        if (field is not null)
            throw new InvalidOperationException($"'{nameof(ConfigSite)}' ya fue inicializado y no puede modificarse.");
        field = value;
    }

    private static void SetOnce<T>(ref T? field, T value) where T : struct
    {
        if (field.HasValue)
            throw new InvalidOperationException($"'{nameof(ConfigSite)}' ya fue inicializado y no puede modificarse.");
        field = value;
    }
}
