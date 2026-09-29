namespace Application.Common.Interfaces;

public interface IAppConfigContext
{
    DbSet<Domain.Entities.AppConfig.Configuration> Configurations { get; }
    DbSet<Domain.Entities.AppConfig.Environment> Environments { get; }
    DbSet<Domain.Entities.AppConfig.Application> Applications { get; }
}
