namespace TeploenergetikaKursovaya.Models;

public class SavedCalculationListItemViewModel
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAtLocal { get; set; }

    public DateTime UpdatedAtLocal { get; set; }

    public bool IsTemplate { get; set; }

    public double TotalPressureDrop { get; set; }
}
