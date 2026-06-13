using System.Net;
using System.Net.Http.Json;
using IWallet.Api.Domain;
using IWallet.Api.Features.Categories;
using IWallet.Api.Features.Expenses;
using IWallet.Api.Features.Income;
using IWallet.Api.Features.Reports;
using IWallet.Api.Infrastructure.Persistence;
using IWallet.Api.Tests.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace IWallet.Api.Tests;

public sealed class CategoryEndpointTests : IAsyncDisposable
{
    private readonly IWalletApiFactory _factory = new();
    private readonly HttpClient _client;

    public CategoryEndpointTests()
    {
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });
    }

    [Fact]
    public async Task GetCategories_FiltersByType_AndSortsByName()
    {
        var categories = await _client.GetFromJsonAsync<List<CategoryEndpoints.CategoryDto>>("/api/categories?type=Expense");

        Assert.NotNull(categories);
        Assert.NotEmpty(categories);
        Assert.All(categories, category => Assert.Equal(nameof(CategoryType.Expense), category.Type));

        var orderedNames = categories.Select(category => category.Name).OrderBy(name => name, StringComparer.Ordinal).ToList();
        Assert.Equal(orderedNames, categories.Select(category => category.Name).ToList());
    }

    public async ValueTask DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }
}

public sealed class IncomeEndpointTests : IAsyncDisposable
{
    private readonly IWalletApiFactory _factory = new();
    private readonly HttpClient _client;

    public IncomeEndpointTests()
    {
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });
    }

    [Fact]
    public async Task PostIncome_CreatesTrimmedRoundedEntry_AndPutDeleteFlowWorks()
    {
        var categoryId = await GetCategoryIdAsync("Salary", CategoryType.Income);
        var createRequest = new IncomeEndpoints.UpsertIncomeRequest(1234.567m, " Salary ", " First paycheck ", new DateOnly(2026, 6, 11), categoryId);

        var createResponse = await _client.PostAsJsonAsync("/api/income", createRequest);

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<CreatedResponse>();
        Assert.NotNull(created);

        var updateRequest = new IncomeEndpoints.UpsertIncomeRequest(1500.111m, " Consulting ", " Updated note ", new DateOnly(2026, 6, 12), categoryId);
        var updateResponse = await _client.PutAsJsonAsync($"/api/income/{created!.Id}", updateRequest);

        Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);

        var entries = await _client.GetFromJsonAsync<List<IncomeEndpoints.IncomeItemDto>>("/api/income?year=2026&month=6");

        Assert.NotNull(entries);
        var entry = Assert.Single(entries, item => item.Id == created.Id);
        Assert.Equal(1500.11m, entry.Amount);
        Assert.Equal("Consulting", entry.Source);
        Assert.Equal("Updated note", entry.Notes);
        Assert.Equal(new DateOnly(2026, 6, 12), entry.ReceivedOn);

        var deleteResponse = await _client.DeleteAsync($"/api/income/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var afterDelete = await _client.GetFromJsonAsync<List<IncomeEndpoints.IncomeItemDto>>("/api/income?year=2026&month=6");
        Assert.NotNull(afterDelete);
        Assert.DoesNotContain(afterDelete, item => item.Id == created.Id);
    }

    [Fact]
    public async Task PostIncome_RejectsExpenseCategory()
    {
        var expenseCategoryId = await GetCategoryIdAsync("Groceries", CategoryType.Expense);
        var request = new IncomeEndpoints.UpsertIncomeRequest(10m, "Bonus", string.Empty, new DateOnly(2026, 6, 10), expenseCategoryId);

        var response = await _client.PostAsJsonAsync("/api/income", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains(nameof(IncomeEndpoints.UpsertIncomeRequest.CategoryId), problem.Errors.Keys);
    }

    private Task<Guid> GetCategoryIdAsync(string name, CategoryType type) => _factory.ExecuteDbContextAsync(async dbContext =>
        await dbContext.Categories
            .Where(category => category.Name == name && category.Type == type)
            .Select(category => category.Id)
            .SingleAsync());

    public async ValueTask DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }
}

public sealed class ExpenseEndpointTests : IAsyncDisposable
{
    private readonly IWalletApiFactory _factory = new();
    private readonly HttpClient _client;

    public ExpenseEndpointTests()
    {
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });
    }

    [Fact]
    public async Task GetExpenses_FiltersByMonth_AndSortsByAmountWithinDay()
    {
        var housingCategoryId = await GetCategoryIdAsync("Housing", CategoryType.Expense);

        await _factory.ExecuteDbContextAsync(async dbContext =>
        {
            dbContext.ExpenseEntries.AddRange(
                new ExpenseEntry
                {
                    Amount = 90.45m,
                    Merchant = "Train",
                    Notes = string.Empty,
                    SpentOn = new DateOnly(2026, 6, 20),
                    CategoryId = housingCategoryId,
                },
                new ExpenseEntry
                {
                    Amount = 120.10m,
                    Merchant = "Rent",
                    Notes = string.Empty,
                    SpentOn = new DateOnly(2026, 6, 20),
                    CategoryId = housingCategoryId,
                },
                new ExpenseEntry
                {
                    Amount = 75m,
                    Merchant = "Older",
                    Notes = string.Empty,
                    SpentOn = new DateOnly(2026, 5, 20),
                    CategoryId = housingCategoryId,
                });

            await dbContext.SaveChangesAsync();
        });

        var entries = await _client.GetFromJsonAsync<List<ExpenseEndpoints.ExpenseItemDto>>("/api/expenses?year=2026&month=6");

        Assert.NotNull(entries);
        Assert.Equal(2, entries.Count);
        Assert.Equal("Rent", entries[0].Merchant);
        Assert.Equal(120.10m, entries[0].Amount);
        Assert.Equal("Train", entries[1].Merchant);
    }

    [Fact]
    public async Task PostExpense_RejectsNonPositiveAmount()
    {
        var expenseCategoryId = await GetCategoryIdAsync("Groceries", CategoryType.Expense);
        var request = new ExpenseEndpoints.UpsertExpenseRequest(0m, "Store", string.Empty, new DateOnly(2026, 6, 15), expenseCategoryId);

        var response = await _client.PostAsJsonAsync("/api/expenses", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>();
        Assert.NotNull(problem);
        Assert.Contains(nameof(ExpenseEndpoints.UpsertExpenseRequest.Amount), problem.Errors.Keys);
    }

    private Task<Guid> GetCategoryIdAsync(string name, CategoryType type) => _factory.ExecuteDbContextAsync(async dbContext =>
        await dbContext.Categories
            .Where(category => category.Name == name && category.Type == type)
            .Select(category => category.Id)
            .SingleAsync());

    public async ValueTask DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }
}

public sealed class ReportEndpointTests : IAsyncDisposable
{
    private readonly IWalletApiFactory _factory = new();
    private readonly HttpClient _client;

    public ReportEndpointTests()
    {
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
        });
    }

    [Fact]
    public async Task GetMonthlyReport_ReturnsAggregatedTotals_AndBreakdown()
    {
        var salaryCategoryId = await GetCategoryIdAsync("Salary", CategoryType.Income);
        var groceriesCategoryId = await GetCategoryIdAsync("Groceries", CategoryType.Expense);
        var transportCategoryId = await GetCategoryIdAsync("Transport", CategoryType.Expense);

        await SeedReportEntriesAsync(salaryCategoryId, groceriesCategoryId, transportCategoryId);

        var report = await _client.GetFromJsonAsync<ReportEndpoints.MonthlyReportDto>("/api/reports/monthly?year=2026&month=6");

        Assert.NotNull(report);
        Assert.Equal(2026, report.Year);
        Assert.Equal(6, report.Month);
        Assert.Equal(1000m, report.TotalIncome);
        Assert.Equal(125m, report.TotalExpenses);
        Assert.Equal(875m, report.NetBalance);

        var breakdown = report.ExpenseBreakdown.ToList();
        Assert.Equal(2, breakdown.Count);
        Assert.Equal("Groceries", breakdown[0].CategoryName);
        Assert.Equal(75m, breakdown[0].Total);
        Assert.Equal("Transport", breakdown[1].CategoryName);
        Assert.Equal(50m, breakdown[1].Total);
    }

    [Fact]
    public async Task GetDailyReport_UsesRequestedDate()
    {
        var salaryCategoryId = await GetCategoryIdAsync("Salary", CategoryType.Income);
        var groceriesCategoryId = await GetCategoryIdAsync("Groceries", CategoryType.Expense);
        var transportCategoryId = await GetCategoryIdAsync("Transport", CategoryType.Expense);

        await SeedReportEntriesAsync(salaryCategoryId, groceriesCategoryId, transportCategoryId);

        var report = await _client.GetFromJsonAsync<ReportEndpoints.DailyReportDto>("/api/reports/daily?date=2026-06-15");

        Assert.NotNull(report);
        Assert.Equal(new DateOnly(2026, 6, 15), report.Date);
        Assert.Equal(1000m, report.TotalIncome);
        Assert.Equal(75m, report.TotalExpenses);
        Assert.Equal(925m, report.NetBalance);
        var breakdown = Assert.Single(report.ExpenseBreakdown);
        Assert.Equal("Groceries", breakdown.CategoryName);
        Assert.Equal(75m, breakdown.Total);
    }

    private async Task SeedReportEntriesAsync(Guid incomeCategoryId, Guid groceriesCategoryId, Guid transportCategoryId)
    {
        await _factory.ExecuteDbContextAsync(async dbContext =>
        {
            dbContext.IncomeEntries.Add(new IncomeEntry
            {
                Amount = 1000m,
                Source = "Salary",
                Notes = string.Empty,
                ReceivedOn = new DateOnly(2026, 6, 15),
                CategoryId = incomeCategoryId,
            });

            dbContext.ExpenseEntries.AddRange(
                new ExpenseEntry
                {
                    Amount = 75m,
                    Merchant = "Grocer",
                    Notes = string.Empty,
                    SpentOn = new DateOnly(2026, 6, 15),
                    CategoryId = groceriesCategoryId,
                },
                new ExpenseEntry
                {
                    Amount = 50m,
                    Merchant = "Metro",
                    Notes = string.Empty,
                    SpentOn = new DateOnly(2026, 6, 16),
                    CategoryId = transportCategoryId,
                });

            await dbContext.SaveChangesAsync();
        });
    }

    private Task<Guid> GetCategoryIdAsync(string name, CategoryType type) => _factory.ExecuteDbContextAsync(async dbContext =>
        await dbContext.Categories
            .Where(category => category.Name == name && category.Type == type)
            .Select(category => category.Id)
            .SingleAsync());

    public async ValueTask DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }
}

public sealed record CreatedResponse(Guid Id);