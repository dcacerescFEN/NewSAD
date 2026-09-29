namespace Domain.Entities.AppConfig;

public class Environment : AuditableEntity
{
    public int EnvironmentId { get; set; }
    public string EnvironmentName { get; set; } = null!;
    public bool IsActive { get; set; }
    public ICollection<Configuration> Configurations { get; set; } = null!;
}
