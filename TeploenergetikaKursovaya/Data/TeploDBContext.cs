using Microsoft.EntityFrameworkCore;

namespace TeploenergetikaKursovaya.Data
{
    public class TeploDBContext : DbContext
    {
        public DbSet<LRC> LRCs { get; set; }
        public DbSet<ResistanceDataPoint> ResistanceDataPoints { get; set; }
        public DbSet<KVoA> KVoAs { get; set; }
        public DbSet<DotMC> DotMCs { get; set; }
        public DbSet<RoughnessMaterial> RoughnessMaterials { get; set; }
        public DbSet<RoughnessCondition> RoughnessConditions { get; set; }
        public DbSet<Roughness> Roughnesses { get; set; }
        public DbSet<UserPreset> UserPresets { get; set; }
        public DbSet<AppUser> AppUsers { get; set; }
        public DbSet<UserSession> UserSessions { get; set; }
        public DbSet<SavedCalculation> SavedCalculations { get; set; }
        public DbSet<SavedCalculationInput> SavedCalculationInputs { get; set; }
        public DbSet<SavedCalculationSummary> SavedCalculationSummaries { get; set; }
        public DbSet<SavedCalculationSection> SavedCalculationSections { get; set; }
        public DbSet<SavedCalculationResult> SavedCalculationResults { get; set; }
        public DbSet<SavedCalculationRecommendation> SavedCalculationRecommendations { get; set; }
        public DbSet<SavedCalculationNotice> SavedCalculationNotices { get; set; }
        public TeploDBContext(DbContextOptions<TeploDBContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<LRC>()
                .HasMany(item => item.DataPoints)
                .WithOne(point => point.Resistance)
                .HasForeignKey(point => point.ResistanceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ResistanceDataPoint>()
                .HasIndex(point => new { point.ResistanceId, point.ParamX, point.ParamY })
                .IsUnique();

            modelBuilder.Entity<RoughnessMaterial>()
                .HasIndex(material => material.Name)
                .IsUnique();

            modelBuilder.Entity<RoughnessCondition>()
                .HasIndex(condition => condition.Name)
                .IsUnique();

            modelBuilder.Entity<Roughness>()
                .HasOne(roughness => roughness.Material)
                .WithMany(material => material.Roughnesses)
                .HasForeignKey(roughness => roughness.MaterialId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Roughness>()
                .HasOne(roughness => roughness.SurfaceCondition)
                .WithMany(condition => condition.Roughnesses)
                .HasForeignKey(roughness => roughness.SurfaceConditionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Roughness>()
                .HasIndex(roughness => new { roughness.MaterialId, roughness.SurfaceConditionId })
                .IsUnique();

            modelBuilder.Entity<Roughness>()
                .Navigation(roughness => roughness.Material)
                .AutoInclude();

            modelBuilder.Entity<Roughness>()
                .Navigation(roughness => roughness.SurfaceCondition)
                .AutoInclude();

            modelBuilder.Entity<AppUser>()
                .HasIndex(user => user.Login)
                .IsUnique();

            modelBuilder.Entity<UserSession>()
                .HasIndex(session => session.TokenHash)
                .IsUnique();

            modelBuilder.Entity<UserSession>()
                .HasOne(session => session.User)
                .WithMany()
                .HasForeignKey(session => session.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserPreset>()
                .HasOne(preset => preset.User)
                .WithMany(user => user.Presets)
                .HasForeignKey(preset => preset.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserPreset>()
                .HasIndex(preset => new { preset.UserId, preset.Name })
                .IsUnique();

            modelBuilder.Entity<UserPreset>()
                .HasOne(preset => preset.SavedCalculation)
                .WithMany()
                .HasForeignKey(preset => preset.SavedCalculationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserPreset>()
                .HasIndex(preset => preset.SavedCalculationId);

            modelBuilder.Entity<SavedCalculation>()
                .HasOne(calculation => calculation.User)
                .WithMany(user => user.Calculations)
                .HasForeignKey(calculation => calculation.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SavedCalculationInput>()
                .HasOne(input => input.SavedCalculation)
                .WithOne(calculation => calculation.Input)
                .HasForeignKey<SavedCalculationInput>(input => input.SavedCalculationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SavedCalculationInput>()
                .HasOne(input => input.Roughness)
                .WithMany()
                .HasForeignKey(input => input.RoughnessId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SavedCalculationInput>()
                .HasIndex(input => input.SavedCalculationId)
                .IsUnique();

            modelBuilder.Entity<SavedCalculationSummary>()
                .HasOne(summary => summary.SavedCalculation)
                .WithOne(calculation => calculation.Summary)
                .HasForeignKey<SavedCalculationSummary>(summary => summary.SavedCalculationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SavedCalculationSummary>()
                .HasIndex(summary => summary.SavedCalculationId)
                .IsUnique();

            modelBuilder.Entity<SavedCalculationSection>()
                .HasOne(section => section.SavedCalculation)
                .WithMany(calculation => calculation.Sections)
                .HasForeignKey(section => section.SavedCalculationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SavedCalculationSection>()
                .HasOne(section => section.LocalResistance)
                .WithMany()
                .HasForeignKey(section => section.LocalResistanceId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SavedCalculationSection>()
                .HasOne(section => section.Roughness)
                .WithMany()
                .HasForeignKey(section => section.RoughnessId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SavedCalculationResult>()
                .HasOne(result => result.SavedCalculation)
                .WithMany(calculation => calculation.Results)
                .HasForeignKey(result => result.SavedCalculationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SavedCalculationResult>()
                .HasOne(result => result.RoughnessReference)
                .WithMany()
                .HasForeignKey(result => result.RoughnessId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<SavedCalculationRecommendation>()
                .HasOne(recommendation => recommendation.SavedCalculation)
                .WithMany(calculation => calculation.Recommendations)
                .HasForeignKey(recommendation => recommendation.SavedCalculationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SavedCalculationNotice>()
                .HasOne(notice => notice.SavedCalculation)
                .WithMany(calculation => calculation.Notices)
                .HasForeignKey(notice => notice.SavedCalculationId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
