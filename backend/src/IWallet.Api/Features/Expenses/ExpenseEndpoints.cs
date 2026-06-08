using IWallet.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace IWallet.Api.Features.Expenses;

public static class ExpenseEndpoints
{
    public static RouteGroupBuilder MapExpenseEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/expenses").WithTags("Expenses");

        group.MapGet(string.Empty, async (int? year, int? month, AppDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var query = dbContext.ExpenseEntries
                .AsNoTracking()
                .Include(entry => entry.Category)
                .AsQueryable();

            if (year.HasValue && month.HasValue)
            {
                query = query.Where(entry => entry.SpentOn.Year == year.Value && entry.SpentOn.Month == month.Value);
            }

            var items = await query
                .OrderByDescending(entry => entry.SpentOn)
                .Select(entry => new ExpenseItemDto(
                    entry.Id,
                    entry.Amount,
                    entry.Merchant,
                    entry.Notes,
                    entry.SpentOn,
                    entry.CategoryId,
                    entry.Category != null ? entry.Category.Name : string.Empty))
                .ToListAsync(cancellationToken);

            items = items
                .OrderByDescending(entry => entry.SpentOn)
                .ThenByDescending(entry => entry.Amount)
                .ToList();

            return Results.Ok(items);
        })
        .WithName("GetExpenseEntries")
        .WithOpenApi();

        group.MapPost(string.Empty, async (UpsertExpenseRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var validationError = await ValidateCategoryAsync(request.CategoryId, dbContext, cancellationToken);
            if (validationError is not null)
            {
                return validationError;
            }

            if (request.Amount <= 0)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [nameof(request.Amount)] = ["Amount must be greater than zero."],
                });
            }

            var entry = new Domain.ExpenseEntry
            {
                Amount = decimal.Round(request.Amount, 2),
                Merchant = request.Merchant.Trim(),
                Notes = request.Notes.Trim(),
                SpentOn = request.SpentOn,
                CategoryId = request.CategoryId,
            };

            dbContext.ExpenseEntries.Add(entry);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/expenses/{entry.Id}", new { entry.Id });
        })
        .WithName("CreateExpenseEntry")
        .WithOpenApi();

        group.MapPut("/{id:guid}", async (Guid id, UpsertExpenseRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var entry = await dbContext.ExpenseEntries.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
            if (entry is null)
            {
                return Results.NotFound();
            }

            var validationError = await ValidateCategoryAsync(request.CategoryId, dbContext, cancellationToken);
            if (validationError is not null)
            {
                return validationError;
            }

            if (request.Amount <= 0)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [nameof(request.Amount)] = ["Amount must be greater than zero."],
                });
            }

            entry.Amount = decimal.Round(request.Amount, 2);
            entry.Merchant = request.Merchant.Trim();
            entry.Notes = request.Notes.Trim();
            entry.SpentOn = request.SpentOn;
            entry.CategoryId = request.CategoryId;

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        })
        .WithName("UpdateExpenseEntry")
        .WithOpenApi();

        group.MapDelete("/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var entry = await dbContext.ExpenseEntries.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
            if (entry is null)
            {
                return Results.NotFound();
            }

            dbContext.ExpenseEntries.Remove(entry);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        })
        .WithName("DeleteExpenseEntry")
        .WithOpenApi();

        return group;
    }

    private static async Task<IResult?> ValidateCategoryAsync(Guid categoryId, AppDbContext dbContext, CancellationToken cancellationToken)
    {
        var category = await dbContext.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == categoryId, cancellationToken);

        if (category is null)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(UpsertExpenseRequest.CategoryId)] = ["Selected category does not exist."],
            });
        }

        if (category.Type != Domain.CategoryType.Expense)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(UpsertExpenseRequest.CategoryId)] = ["Selected category must be an expense category."],
            });
        }

        return null;
    }

    public sealed record ExpenseItemDto(
        Guid Id,
        decimal Amount,
        string Merchant,
        string Notes,
        DateOnly SpentOn,
        Guid CategoryId,
        string CategoryName);

    public sealed record UpsertExpenseRequest(
        decimal Amount,
        string Merchant,
        string Notes,
        DateOnly SpentOn,
        Guid CategoryId);
}
