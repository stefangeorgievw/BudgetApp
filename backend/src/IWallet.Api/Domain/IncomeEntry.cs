namespace IWallet.Api.Domain;

public sealed class IncomeEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public decimal Amount { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public DateOnly ReceivedOn { get; set; }
    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }
}
