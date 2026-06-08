using IWallet.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace IWallet.Api.Features.Reports;

public static class ReportEndpoints
{
    public static RouteGroupBuilder MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reports").WithTags("Reports");

        group.MapGet("/monthly", async (int? year, int? month, AppDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            var reportYear = year ?? today.Year;
            var reportMonth = month ?? today.Month;

            var incomeEntries = await dbContext.IncomeEntries
                .AsNoTracking()
                .Where(entry => entry.ReceivedOn.Year == reportYear && entry.ReceivedOn.Month == reportMonth)
                .ToListAsync(cancellationToken);

            var expenseEntries = await dbContext.ExpenseEntries
                .AsNoTracking()
                .Include(entry => entry.Category)
                .Where(entry => entry.SpentOn.Year == reportYear && entry.SpentOn.Month == reportMonth)
                .ToListAsync(cancellationToken);

            var expenseBreakdown = expenseEntries
                .GroupBy(entry => entry.Category != null ? entry.Category.Name : "Uncategorized")
                .Select(group => new CategoryBreakdownDto(group.Key, group.Sum(item => item.Amount)))
                .OrderByDescending(item => item.Total)
                .ToList();

            var totalIncome = incomeEntries.Sum(entry => entry.Amount);
            var totalExpenses = expenseBreakdown.Sum(item => item.Total);

            var response = new MonthlyReportDto(
                reportYear,
                reportMonth,
                totalIncome,
                totalExpenses,
                totalIncome - totalExpenses,
                expenseBreakdown);

            return Results.Ok(response);
        })
        .WithName("GetMonthlyReport")
        .WithOpenApi();

        group.MapGet("/daily", async (DateOnly? date, AppDbContext dbContext, CancellationToken cancellationToken) =>
        {
            var reportDate = date ?? DateOnly.FromDateTime(DateTime.Today);

            var incomeEntries = await dbContext.IncomeEntries
                .AsNoTracking()
                .Where(entry => entry.ReceivedOn == reportDate)
                .ToListAsync(cancellationToken);

            var expenseEntries = await dbContext.ExpenseEntries
                .AsNoTracking()
                .Include(entry => entry.Category)
                .Where(entry => entry.SpentOn == reportDate)
                .ToListAsync(cancellationToken);

            var expenseBreakdown = expenseEntries
                .GroupBy(entry => entry.Category != null ? entry.Category.Name : "Uncategorized")
                .Select(group => new CategoryBreakdownDto(group.Key, group.Sum(item => item.Amount)))
                .OrderByDescending(item => item.Total)
                .ToList();

            var totalIncome = incomeEntries.Sum(entry => entry.Amount);
            var totalExpenses = expenseBreakdown.Sum(item => item.Total);

            var response = new DailyReportDto(
                reportDate,
                totalIncome,
                totalExpenses,
                totalIncome - totalExpenses,
                expenseBreakdown);

            return Results.Ok(response);
        })
        .WithName("GetDailyReport")
        .WithOpenApi();

        return group;
    }

    public sealed record MonthlyReportDto(
        int Year,
        int Month,
        decimal TotalIncome,
        decimal TotalExpenses,
        decimal NetBalance,
        IReadOnlyCollection<CategoryBreakdownDto> ExpenseBreakdown);

    public sealed record DailyReportDto(
        DateOnly Date,
        decimal TotalIncome,
        decimal TotalExpenses,
        decimal NetBalance,
        IReadOnlyCollection<CategoryBreakdownDto> ExpenseBreakdown);

    public sealed record CategoryBreakdownDto(string CategoryName, decimal Total);
}
