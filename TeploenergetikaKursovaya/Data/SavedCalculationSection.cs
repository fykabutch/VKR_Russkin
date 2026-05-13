using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TeploenergetikaKursovaya.Data;

public class SavedCalculationSection
{
    [Key]
    public int Id { get; set; }

    public int SavedCalculationId { get; set; }

    public int SortOrder { get; set; }

    public string SectionKind { get; set; } = string.Empty;

    public string CrossSectionShape { get; set; } = string.Empty;

    public string OutletCrossSectionShape { get; set; } = string.Empty;

    public string? BlockTitle { get; set; }

    public double? Diameter { get; set; }

    public string DiameterUnit { get; set; } = "m";

    public double? DiameterB { get; set; }

    public string DiameterBUnit { get; set; } = "m";

    public double? OutletDiameter { get; set; }

    public string OutletDiameterUnit { get; set; } = "m";

    public double? OutletDiameterB { get; set; }

    public string OutletDiameterBUnit { get; set; } = "m";

    public double? Length { get; set; }

    public string LengthUnit { get; set; } = "m";

    public double? TemperatureLossPerMeter { get; set; }

    public string TemperatureLossUnit { get; set; } = "cPerM";

    public double? TurnAngle { get; set; }

    public string TurnAngleUnit { get; set; } = "deg";

    public double HeightDelta { get; set; }

    public string HeightDeltaUnit { get; set; } = "m";

    [NotMapped]
    public string? LocalResistanceType => LocalResistance?.TypeofLR;

    public int? LocalResistanceId { get; set; }

    public double? LocalResistanceParamX { get; set; }

    public double? LocalResistanceParamY { get; set; }

    public double? CustomLRC { get; set; }

    public bool UseCustomLRC { get; set; }

    public bool UseIndividualMaterial { get; set; }

    [NotMapped]
    public string? MaterialType => Roughness?.Type;

    [NotMapped]
    public string? SurfaceCondition => Roughness?.Condition;

    public int? RoughnessId { get; set; }

    public bool UseCustomRoughness { get; set; }

    public double? CustomRoughness { get; set; }

    public string CustomRoughnessUnit { get; set; } = "m";

    public SavedCalculation? SavedCalculation { get; set; }

    public LRC? LocalResistance { get; set; }

    public Roughness? Roughness { get; set; }
}
