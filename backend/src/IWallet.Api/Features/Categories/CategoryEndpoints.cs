using IWallet.Api.Domain;
using IWallet.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace IWallet.Api.Features.Categories;

public static class CategoryEndpoints
{
    public static RouteGroupBuilder MapCategoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/categories").WithTags("Categories");

        group.MapGet(string.Empty, async (string? type, AppDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var query = dbContext.Categories.AsNoTracking();

            if (Enum.TryParse<CategoryType>(type, true, out var parsedType))
            {
                query = query.Where(category => category.Type == parsedType);
            }

            var categories = await query
                .OrderBy(category => category.Type)
                .ThenBy(category => category.Name)
                .Select(category => new CategoryDto(category.Id, category.Name, category.Type.ToString()))
                .ToListAsync(cancellationToken);

            return Results.Ok(categories);
        })
        .WithName("GetCategories")
        .WithOpenApi();

        return group;
    }

    public sealed record CategoryDto(Guid Id, string Name, string Type);
}
