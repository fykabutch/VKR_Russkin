namespace VKR_Russkin.Models;

public class CalcResultsViewModel
{
    public int SectionNumber { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public string SectionType { get; set; } = string.Empty;
    public string CrossSectionShape { get; set; } = string.Empty;
    public string OutletCrossSectionShape { get; set; } = string.Empty;
    public string MaterialType { get; set; } = string.Empty;
    public string SurfaceCondition { get; set; } = string.Empty;
    public double Length { get; set; }
    public double Diameter { get; set; }
    public double DiameterB { get; set; }
    public double OutletDiameter { get; set; }
    public double OutletDiameterB { get; set; }
    public double EquivalentDiameter { get; set; }
    public double OutletEquivalentDiameter { get; set; }
    public double CrossSectionArea { get; set; }
    public double HeightDelta { get; set; }
    public double Roughness { get; set; }
    public double AverageTemperature { get; set; }
    public double InletTemperature { get; set; }
    public double OutletTemperature { get; set; }
    public double GasDensity { get; set; }
    public double AmbientAirDensity { get; set; }
    public double FlowVelocity { get; set; }
    public double Re { get; set; }
    public double Lambda { get; set; }
    public double Zeta { get; set; }
    public double PressureDropFriction { get; set; }
    public double PressureDropLocal { get; set; }
    public double GeometricPressureDrop { get; set; }
    public double TotalPressureDrop { get; set; }
    public string DominantLossType { get; set; } = string.Empty;
}
