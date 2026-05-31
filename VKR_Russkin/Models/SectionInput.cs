using System.ComponentModel.DataAnnotations;

namespace VKR_Russkin.Models;

public class SectionInput : IValidatableObject
{
    [Required(ErrorMessage = "Выберите тип элемента")]
    public string SectionKind { get; set; } = SectionKinds.Straight;

    [Required(ErrorMessage = "Выберите форму сечения")]
    public string CrossSectionShape { get; set; } = SectionShapeKinds.Round;

    public string OutletCrossSectionShape { get; set; } = SectionShapeKinds.Round;

    [StringLength(120, ErrorMessage = "Название элемента должно быть не длиннее 120 символов")]
    public string? BlockTitle { get; set; }

    [Range(0.001, double.MaxValue, ErrorMessage = "Размер входного сечения должен быть не менее 0.001 м")]
    public double? Diameter { get; set; }

    public string DiameterUnit { get; set; } = "m";

    [Range(0.001, double.MaxValue, ErrorMessage = "Вторая сторона входного прямоугольного сечения должна быть не менее 0.001 м")]
    public double? DiameterB { get; set; }

    public string DiameterBUnit { get; set; } = "m";

    [Range(0.001, double.MaxValue, ErrorMessage = "Размер выходного сечения должен быть не менее 0.001 м")]
    public double? OutletDiameter { get; set; }

    public string OutletDiameterUnit { get; set; } = "m";

    [Range(0.001, double.MaxValue, ErrorMessage = "Вторая сторона выходного прямоугольного сечения должна быть не менее 0.001 м")]
    public double? OutletDiameterB { get; set; }

    public string OutletDiameterBUnit { get; set; } = "m";

    [Range(0.001, double.MaxValue, ErrorMessage = "Длина должна быть не менее 0.001 м")]
    public double? Length { get; set; }

    public string LengthUnit { get; set; } = "m";

    [Range(0, 10, ErrorMessage = "Теплопотери должны быть в пределах 0-10°C/м")]
    public double? TemperatureLossPerMeter { get; set; }

    public string TemperatureLossUnit { get; set; } = "cPerM";

    [Range(1, 180, ErrorMessage = "Угол поворота должен быть в пределах 1-180°")]
    public double? TurnAngle { get; set; }

    public string TurnAngleUnit { get; set; } = "deg";

    [Range(-1000, 1000, ErrorMessage = "Перепад высоты должен быть в пределах -1000...1000 м")]
    public double HeightDelta { get; set; }

    public string HeightDeltaUnit { get; set; } = "m";

    public string? LocalResistanceType { get; set; }

    public double? LocalResistanceParamX { get; set; }

    public double? LocalResistanceParamY { get; set; }

    public double? LocalResistanceParamZ { get; set; }

    public string LocalResistanceParamZUnit { get; set; } = "m";

    [Range(0, double.MaxValue, ErrorMessage = "Коэффициент местного сопротивления должен быть неотрицательным")]
    public double? CustomLRC { get; set; }

    public bool UseCustomLRC { get; set; }

    public bool UseIndividualMaterial { get; set; }

    public string? MaterialType { get; set; }

    public string? SurfaceCondition { get; set; }

    public bool UseCustomRoughness { get; set; }

    [Range(0.000001, 0.1, ErrorMessage = "Шероховатость должна быть между 0.000001 и 0.1 м")]
    public double? CustomRoughness { get; set; }

    public string CustomRoughnessUnit { get; set; } = "m";

    public string DisplayTitle(int sectionNumber)
    {
        if (!string.IsNullOrWhiteSpace(BlockTitle))
        {
            return BlockTitle!;
        }

        return SectionKinds.Normalize(SectionKind) switch
        {
            SectionKinds.Straight => $"Прямой участок {sectionNumber}",
            SectionKinds.Bend => $"Поворот {sectionNumber}",
            SectionKinds.Contraction => $"Сужение {sectionNumber}",
            SectionKinds.Expansion => $"Расширение {sectionNumber}",
            SectionKinds.LocalResistance => $"Местное сопротивление {sectionNumber}",
            _ => $"Элемент {sectionNumber}"
        };
    }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var kind = SectionKinds.Normalize(SectionKind);
        var wasSquare = string.Equals(CrossSectionShape, "Square", StringComparison.Ordinal);
        var shape = SectionShapeKinds.Normalize(CrossSectionShape);
        var outletShape = string.IsNullOrWhiteSpace(OutletCrossSectionShape)
            ? shape
            : SectionShapeKinds.Normalize(OutletCrossSectionShape);

        if (kind == SectionKinds.LocalResistance &&
            (IsConicalCollector(LocalResistanceType) || IsStraightPipeEntrance(LocalResistanceType)))
        {
            shape = SectionShapeKinds.Round;
            outletShape = SectionShapeKinds.Round;
            DiameterB = null;
            OutletDiameterB = null;
        }

        CrossSectionShape = shape;
        OutletCrossSectionShape = kind is SectionKinds.Contraction or SectionKinds.Expansion
            ? outletShape
            : shape;

        if (wasSquare && Diameter.HasValue && !DiameterB.HasValue)
        {
            DiameterB = Diameter;
        }

        if (wasSquare && OutletDiameter.HasValue && !OutletDiameterB.HasValue)
        {
            OutletDiameterB = OutletDiameter;
        }

        if (!Diameter.HasValue)
        {
            yield return new ValidationResult("Укажите размер входного сечения элемента.", [nameof(Diameter)]);
        }

        if (shape == SectionShapeKinds.Rectangle && !DiameterB.HasValue)
        {
            yield return new ValidationResult("Для прямоугольного сечения укажите вторую сторону входа b.", [nameof(DiameterB)]);
        }

        var requiresLength = kind != SectionKinds.LocalResistance || !SkipsRouteLength(LocalResistanceType);
        if (requiresLength && !Length.HasValue)
        {
            yield return new ValidationResult("Поле «Длина элемента» обязательно для каждого блока маршрута.", [nameof(Length)]);
        }

        if (kind == SectionKinds.Bend && !TurnAngle.HasValue)
        {
            yield return new ValidationResult("Для поворота требуется угол.", [nameof(TurnAngle)]);
        }

        if (kind == SectionKinds.Bend && !UseCustomLRC && !LocalResistanceParamX.HasValue)
        {
            yield return new ValidationResult("Для расчета поворота по диаграмме 6-1 укажите радиус отвода R0.", [nameof(LocalResistanceParamX)]);
        }

        if ((kind == SectionKinds.Contraction || kind == SectionKinds.Expansion) && !OutletDiameter.HasValue)
        {
            yield return new ValidationResult("Для перехода требуется размер выходного сечения.", [nameof(OutletDiameter)]);
        }

        if ((kind == SectionKinds.Contraction || kind == SectionKinds.Expansion) &&
            OutletCrossSectionShape == SectionShapeKinds.Rectangle && !OutletDiameterB.HasValue)
        {
            yield return new ValidationResult("Для прямоугольного перехода укажите вторую сторону выхода b.", [nameof(OutletDiameterB)]);
        }

        var inletArea = TryCalculateArea(shape, Diameter, DiameterB);
        var outletArea = TryCalculateArea(OutletCrossSectionShape, OutletDiameter, OutletDiameterB);
        var isShapeTransition = kind is SectionKinds.Contraction or SectionKinds.Expansion &&
            !string.Equals(shape, OutletCrossSectionShape, StringComparison.Ordinal);

        if (kind == SectionKinds.Contraction && inletArea.HasValue && outletArea.HasValue &&
            outletArea.Value >= inletArea.Value && !isShapeTransition)
        {
            yield return new ValidationResult("Для сужения площадь выходного сечения должна быть меньше входной.", [nameof(OutletDiameter), nameof(OutletDiameterB)]);
        }

        if (kind == SectionKinds.Expansion && inletArea.HasValue && outletArea.HasValue &&
            outletArea.Value <= inletArea.Value && !isShapeTransition)
        {
            yield return new ValidationResult("Для расширения площадь выходного сечения должна быть больше входной.", [nameof(OutletDiameter), nameof(OutletDiameterB)]);
        }

        if (kind == SectionKinds.LocalResistance && !UseCustomLRC && string.IsNullOrWhiteSpace(LocalResistanceType))
        {
            yield return new ValidationResult("Выберите тип местного сопротивления или задайте коэффициент вручную.", [nameof(LocalResistanceType)]);
        }

        if (UseCustomLRC && !CustomLRC.HasValue)
        {
            yield return new ValidationResult("Укажите коэффициент местного сопротивления.", [nameof(CustomLRC)]);
        }

        if (UseIndividualMaterial && !UseCustomRoughness &&
            (string.IsNullOrWhiteSpace(MaterialType) || string.IsNullOrWhiteSpace(SurfaceCondition)))
        {
            yield return new ValidationResult(
                "Для индивидуального материала выберите материал и состояние поверхности.",
                [nameof(MaterialType), nameof(SurfaceCondition)]);
        }

        if (UseCustomRoughness && !CustomRoughness.HasValue)
        {
            yield return new ValidationResult("Укажите индивидуальную шероховатость элемента.", [nameof(CustomRoughness)]);
        }
    }

    private static double? TryCalculateArea(string shape, double? sizeA, double? sizeB)
    {
        if (!sizeA.HasValue)
        {
            return null;
        }

        return SectionShapeKinds.Normalize(shape) == SectionShapeKinds.Rectangle
            ? sizeB.HasValue ? sizeA.Value * sizeB.Value : null
            : Math.PI * Math.Pow(sizeA.Value, 2) / 4.0;
    }

    public static bool IsConicalCollector(string? localResistanceType) =>
        !string.IsNullOrWhiteSpace(localResistanceType) &&
        localResistanceType.Contains("коничес", StringComparison.OrdinalIgnoreCase);

    public static bool IsArcCollectorWithoutScreen(string? localResistanceType) =>
        !string.IsNullOrWhiteSpace(localResistanceType) &&
        localResistanceType.Contains("по дуге круга", StringComparison.OrdinalIgnoreCase) &&
        localResistanceType.Contains("без экрана", StringComparison.OrdinalIgnoreCase);

    public static bool IsArcCollectorWithScreen(string? localResistanceType) =>
        !string.IsNullOrWhiteSpace(localResistanceType) &&
        localResistanceType.Contains("по дуге круга", StringComparison.OrdinalIgnoreCase) &&
        !localResistanceType.Contains("без экрана", StringComparison.OrdinalIgnoreCase) &&
        localResistanceType.Contains("экран", StringComparison.OrdinalIgnoreCase);

    public static bool IsArcCollector(string? localResistanceType) =>
        IsArcCollectorWithoutScreen(localResistanceType) ||
        IsArcCollectorWithScreen(localResistanceType);

    public static bool IsRostrumCollector(string? localResistanceType) =>
        !string.IsNullOrWhiteSpace(localResistanceType) &&
        localResistanceType.Contains("раструб", StringComparison.OrdinalIgnoreCase) &&
        localResistanceType.Contains("торцов", StringComparison.OrdinalIgnoreCase);

    public static bool IsLengthRatioCollector(string? localResistanceType) =>
        IsConicalCollector(localResistanceType) ||
        IsRostrumCollector(localResistanceType);

    public static bool IsSuddenExpansion(string? localResistanceType) =>
        !string.IsNullOrWhiteSpace(localResistanceType) &&
        localResistanceType.Contains("внезапн", StringComparison.OrdinalIgnoreCase) &&
        localResistanceType.Contains("расширен", StringComparison.OrdinalIgnoreCase);

    public static bool IsStraightPipeEntrance(string? localResistanceType) =>
        !string.IsNullOrWhiteSpace(localResistanceType) &&
        localResistanceType.Contains("вход", StringComparison.OrdinalIgnoreCase) &&
        localResistanceType.Contains("труб", StringComparison.OrdinalIgnoreCase) &&
        (localResistanceType.Contains("диаграмма 3-1", StringComparison.OrdinalIgnoreCase) ||
         localResistanceType.Contains("постоянного поперечного сечения", StringComparison.OrdinalIgnoreCase));

    public static bool IsFlushWallEntrance(string? localResistanceType) =>
        !string.IsNullOrWhiteSpace(localResistanceType) &&
        (localResistanceType.Contains("диаграмма 3-2", StringComparison.OrdinalIgnoreCase) ||
         (localResistanceType.Contains("заподлицо", StringComparison.OrdinalIgnoreCase) &&
          localResistanceType.Contains("стенк", StringComparison.OrdinalIgnoreCase)));

    public static bool IsPassingFlowEntrance(string? localResistanceType) =>
        !string.IsNullOrWhiteSpace(localResistanceType) &&
        (localResistanceType.Contains("диаграмма 3-3", StringComparison.OrdinalIgnoreCase) ||
         (localResistanceType.Contains("проходящ", StringComparison.OrdinalIgnoreCase) &&
          localResistanceType.Contains("поток", StringComparison.OrdinalIgnoreCase)));

    public static bool SkipsRouteLength(string? localResistanceType) =>
        IsStraightPipeEntrance(localResistanceType) ||
        IsFlushWallEntrance(localResistanceType) ||
        IsPassingFlowEntrance(localResistanceType) ||
        IsArcCollector(localResistanceType) ||
        IsSuddenExpansion(localResistanceType);
}

public static class SectionShapeKinds
{
    public const string Round = "Round";
    public const string Rectangle = "Rectangle";

    public static string Normalize(string? value) =>
        value switch
        {
            Rectangle => Rectangle,
            "Square" => Rectangle,
            Round => Round,
            "Circular" => Round,
            _ => Round
        };

    public static string Translate(string? value) =>
        Normalize(value) switch
        {
            Rectangle => "Прямоугольное",
            _ => "Круглое"
        };
}
