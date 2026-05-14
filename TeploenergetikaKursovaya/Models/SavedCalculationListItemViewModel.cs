namespace TeploenergetikaKursovaya.Models;

public class SavedCalculationListItemViewModel
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public bool IsTemplate { get; set; }

    public double TotalPressureDrop { get; set; }
}
