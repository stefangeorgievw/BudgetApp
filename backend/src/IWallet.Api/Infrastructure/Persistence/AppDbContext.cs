using IWallet.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IWallet.Api.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<IncomeEntry> IncomeEntries => Set<IncomeEntry>();
    public DbSet<ExpenseEntry> ExpenseEntries => Set<ExpenseEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(builder =>
        {
            builder.ToTable("Categories");
            builder.HasKey(category => category.Id);
            builder.Property(category => category.Name)
                .HasMaxLength(80)
                .IsRequired();
            builder.Property(category => category.Type)
                .HasConversion<string>()
                .HasMaxLength(20);
            builder.HasIndex(category => new { category.Type, category.Name }).IsUnique();
        });

        modelBuilder.Entity<IncomeEntry>(builder =>
        {
            builder.ToTable("IncomeEntries");
            builder.HasKey(entry => entry.Id);
            builder.Property(entry => entry.Amount).HasColumnType("decimal(18,2)");
            builder.Property(entry => entry.Source)
                .HasMaxLength(120)
                .IsRequired();
            builder.Property(entry => entry.Notes).HasMaxLength(400);
            builder.Property(entry => entry.ReceivedOn).IsRequired();
            builder.HasOne(entry => entry.Category)
                .WithMany()
                .HasForeignKey(entry => entry.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.HasIndex(entry => entry.ReceivedOn);
        });

        modelBuilder.Entity<ExpenseEntry>(builder =>
        {
            builder.ToTable("ExpenseEntries");
            builder.HasKey(entry => entry.Id);
            builder.Property(entry => entry.Amount).HasColumnType("decimal(18,2)");
            builder.Property(entry => entry.Merchant)
                .HasMaxLength(120)
                .IsRequired();
            builder.Property(entry => entry.Notes).HasMaxLength(400);
            builder.Property(entry => entry.SpentOn).IsRequired();
            builder.HasOne(entry => entry.Category)
                .WithMany()
                .HasForeignKey(entry => entry.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.HasIndex(entry => entry.SpentOn);
        });
    }
}
