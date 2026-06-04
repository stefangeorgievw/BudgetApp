using IWallet.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IWallet.Api.Infrastructure.Persistence.Seed;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext dbContext, CancellationToken cancellationToken = default)
    {
        var defaultCategories = new[]
        {
            ("Salary", CategoryType.Income),
            ("Freelance", CategoryType.Income),
            ("Investments", CategoryType.Income),
            ("Housing", CategoryType.Expense),
            ("Groceries", CategoryType.Expense),
            ("Transport", CategoryType.Expense),
            ("Utilities", CategoryType.Expense),
            ("Health", CategoryType.Expense),
            ("Leisure", CategoryType.Expense),
        };

        var existingCategories = await dbContext.Categories
            .AsNoTracking()
            .Select(category => new { category.Name, category.Type })
            .ToListAsync(cancellationToken);

        var existingKeys = existingCategories
            .Select(category => $"{category.Type}:{category.Name}")
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var missingCategories = defaultCategories
            .Where(category => !existingKeys.Contains($"{category.Item2}:{category.Item1}"))
            .Select(category => CreateCategory(category.Item1, category.Item2))
            .ToArray();

        if (missingCategories.Length == 0)
        {
            return;
        }

        dbContext.Categories.AddRange(missingCategories);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static Category CreateCategory(string name, CategoryType type) => new()
    {
        Name = name,
        Type = type,
    };
}
