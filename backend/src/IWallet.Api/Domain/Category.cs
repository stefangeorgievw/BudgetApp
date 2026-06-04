namespace IWallet.Api.Domain;

public sealed class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public CategoryType Type { get; set; }
}
