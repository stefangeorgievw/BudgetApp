using IWallet.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace IWallet.Api.Features.Income;

public static class IncomeEndpoints
{
    public static RouteGroupBuilder MapIncomeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/income").WithTags("Income");

        group.MapGet(string.Empty, async (int? year, int? month, AppDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var query = dbContext.IncomeEntries
                .AsNoTracking()
                .Include(entry => entry.Category)
                .AsQueryable();

            if (year.HasValue && month.HasValue)
            {
                query = query.Where(entry => entry.ReceivedOn.Year == year.Value && entry.ReceivedOn.Month == month.Value);
            }

            var items = await query
                .OrderByDescending(entry => entry.ReceivedOn)
                .ThenByDescending(entry => entry.Amount)
                .Select(entry => new IncomeItemDto(
                    entry.Id,
                    entry.Amount,
                    entry.Source,
                    entry.Notes,
                    entry.ReceivedOn,
                    entry.CategoryId,
                    entry.Category != null ? entry.Category.Name : string.Empty))
                .ToListAsync(cancellationToken);

            return Results.Ok(items);
        })
        .WithName("GetIncomeEntries")
        .WithOpenApi();

        group.MapPost(string.Empty, async (UpsertIncomeRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
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

            var entry = new Domain.IncomeEntry
            {
                Amount = decimal.Round(request.Amount, 2),
                Source = request.Source.Trim(),
                Notes = request.Notes.Trim(),
                ReceivedOn = request.ReceivedOn,
                CategoryId = request.CategoryId,
            };

            dbContext.IncomeEntries.Add(entry);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Created($"/api/income/{entry.Id}", new { entry.Id });
        })
        .WithName("CreateIncomeEntry")
        .WithOpenApi();

        group.MapPut("/{id:guid}", async (Guid id, UpsertIncomeRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var entry = await dbContext.IncomeEntries.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
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
            entry.Source = request.Source.Trim();
            entry.Notes = request.Notes.Trim();
            entry.ReceivedOn = request.ReceivedOn;
            entry.CategoryId = request.CategoryId;

            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        })
        .WithName("UpdateIncomeEntry")
        .WithOpenApi();

        group.MapDelete("/{id:guid}", async (Guid id, AppDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var entry = await dbContext.IncomeEntries.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
            if (entry is null)
            {
                return Results.NotFound();
            }

            dbContext.IncomeEntries.Remove(entry);
            await dbContext.SaveChangesAsync(cancellationToken);
            return Results.NoContent();
        })
        .WithName("DeleteIncomeEntry")
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
                [nameof(UpsertIncomeRequest.CategoryId)] = ["Selected category does not exist."],
            });
        }

        if (category.Type != Domain.CategoryType.Income)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(UpsertIncomeRequest.CategoryId)] = ["Selected category must be an income category."],
            });
        }

        return null;
    }

    public sealed record IncomeItemDto(
        Guid Id,
        decimal Amount,
        string Source,
        string Notes,
        DateOnly ReceivedOn,
        Guid CategoryId,
        string CategoryName);

    public sealed record UpsertIncomeRequest(
        decimal Amount,
        string Source,
        string Notes,
        DateOnly ReceivedOn,
        Guid CategoryId);
}
