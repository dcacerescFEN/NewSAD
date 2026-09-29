namespace Domain.Entities.AppConfig;

public class Application : AuditableEntity
{
    public int ApplicationId { get; set; }
    public string ApplicationName { get; set; } = null!;
    public bool IsActive { get; set; }
    public ICollection<Configuration> Configurations { get; set; } = null!;
}
