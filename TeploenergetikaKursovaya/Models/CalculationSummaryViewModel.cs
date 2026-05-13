namespace TeploenergetikaKursovaya.Models;

public class CalculationSummaryViewModel
{
    public double TotalPressureDrop { get; set; }
    public double FrictionLoss { get; set; }
    public double LocalLoss { get; set; }
    public double GeometricLoss { get; set; }
    public double TotalRouteLength { get; set; }
    public double TotalHeightChange { get; set; }
    public double AverageVelocity { get; set; }
    public double MaxVelocity { get; set; }
    public double AmbientAirDensity { get; set; }
    public string CriticalSectionName { get; set; } = string.Empty;
    public double CriticalSectionLoss { get; set; }
    public string EfficiencyLabel { get; set; } = "Требует анализа";
}
