namespace TeploenergetikaKursovaya.Models;

public class CalculationSaveRequest
{
    public string Name { get; set; } = string.Empty;

    public CalcViewModel Model { get; set; } = new();

    public int? CalculationId { get; set; }

    public bool Repeat { get; set; }

    public bool IsTemplate { get; set; }
}
