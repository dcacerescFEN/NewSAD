namespace Infrastructure.Data;

public class AppConfigContext(DbContextOptions<AppConfigContext> options) : DbContext(options), IAppConfigContext
{
    public DbSet<Domain.Entities.AppConfig.Configuration> Configurations => Set<Domain.Entities.AppConfig.Configuration>();
    public DbSet<Domain.Entities.AppConfig.Environment> Environments => Set<Domain.Entities.AppConfig.Environment>();
    public DbSet<Domain.Entities.AppConfig.Application> Applications => Set<Domain.Entities.AppConfig.Application>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<Domain.Entities.AppConfig.Application>(entity =>
        {
            entity.Property(e => e.ApplicationName)
            .HasColumnType("varchar(30)");
        });

        builder.Entity<Domain.Entities.AppConfig.Configuration>(entity =>
        {
            entity.Property(e => e.ConfigurationName)
            .HasColumnType("varchar(100)");

            entity.Property(e => e.ConfigurationValue)
            .HasColumnType("varchar(4000)");
        });

        builder.Entity<Domain.Entities.AppConfig.Environment>(entity =>
        {
            entity.Property(e => e.EnvironmentName)
            .HasColumnType("varchar(30)");
        });

        base.OnModelCreating(builder);
    }
}