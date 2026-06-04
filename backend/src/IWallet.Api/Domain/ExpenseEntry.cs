namespace IWallet.Api.Domain;

public sealed class ExpenseEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public decimal Amount { get; set; }
    public string Merchant { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public DateOnly SpentOn { get; set; }
    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }
}
