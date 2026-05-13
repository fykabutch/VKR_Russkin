using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Data;

public class SavedCalculationSummary
{
    [Key]
    public int Id { get; set; }

    public int SavedCalculationId { get; set; }

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

    public string EfficiencyLabel { get; set; } = string.Empty;

    public SavedCalculation? SavedCalculation { get; set; }
}
