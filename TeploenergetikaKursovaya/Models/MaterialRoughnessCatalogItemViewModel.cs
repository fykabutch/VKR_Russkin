namespace TeploenergetikaKursovaya.Models;

public class MaterialRoughnessCatalogItemViewModel
{
    public string Type { get; set; } = string.Empty;

    public string Condition { get; set; } = string.Empty;

    public string ReferenceValue { get; set; } = string.Empty;

    public double EquivalentRoughness { get; set; }
}
