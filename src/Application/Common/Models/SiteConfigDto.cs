namespace Application.Common.Models;

public record SiteConfigDto
{
    public string DefaultSemester { get; init; } = default!;
    public string DefaultSemesterPostgraduate { get; init; } = default!;
    public string[] PregraduateStudentTypes { get; init; } = default!;
    public string[] AcademicSituationsForModifyGrades { get; init; } = [];
    public string[] SpecialGradeRecordAllowedAcademicSituations { get; init; } = [];
    public string[] OtherRequestTypesWithoutReason { get; init; } = [];
    public string[] AdminProcessingAllowedTypes { get; init; } = [];
    public string FileAttachmentExcludedRequestType { get; init; } = default!;
    public ConfigSite.MenuDestinations Menu { get; init; } = new("", "", "", "", "", "", "", "");
}
