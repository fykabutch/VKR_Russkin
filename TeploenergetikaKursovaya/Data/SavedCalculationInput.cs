using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Data;

public class SavedCalculationInput
{
    [Key]
    public int Id { get; set; }

    public int SavedCalculationId { get; set; }

    public double TgasInitial { get; set; }

    public string TgasInitialUnit { get; set; } = "c";

    public double TemperatureLossPerMeter { get; set; }

    public double GasFlow { get; set; }

    public string GasFlowUnit { get; set; } = "m3s";

    public int? RoughnessId { get; set; }

    public bool UseCustomRoughness { get; set; }

    public double? CustomRoughness { get; set; }

    public string CustomRoughnessUnit { get; set; } = "m";

    public bool UseGeometricPressure { get; set; }

    public double? AmbientAirTemperature { get; set; }

    public string AmbientAirTemperatureUnit { get; set; } = "c";

    public double AirDensityAtNormalConditions { get; set; }

    public double? Y_N2 { get; set; }

    public string Y_N2Unit { get; set; } = "fraction";

    public double? Y_O2 { get; set; }

    public string Y_O2Unit { get; set; } = "fraction";

    public double? Y_CO2 { get; set; }

    public string Y_CO2Unit { get; set; } = "fraction";

    public double? Y_H2O { get; set; }

    public string Y_H2OUnit { get; set; } = "fraction";

    public SavedCalculation? SavedCalculation { get; set; }

    public Roughness? Roughness { get; set; }
}
