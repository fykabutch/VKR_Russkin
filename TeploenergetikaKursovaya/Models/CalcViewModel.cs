using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Models;

public class CalcViewModel : IValidatableObject
{
    [Required(ErrorMessage = "Обязательное поле")]
    [Range(0, 1500, ErrorMessage = "Допустимый диапазон: 0-1500°C")]
    public double TgasInitial { get; set; } = 180;

    public string TgasInitialUnit { get; set; } = "c";

    [Required(ErrorMessage = "Обязательное поле")]
    [Range(0.01, 10, ErrorMessage = "Допустимый диапазон: 0.01-10°C/м")]
    public double TemperatureLossPerMeter { get; set; } = 0.18;

    [Required(ErrorMessage = "Обязательное поле")]
    [Range(0.01, 1000, ErrorMessage = "Допустимый диапазон: 0.01-1000 м³/с")]
    public double GasFlow { get; set; } = 0.85;

    public string GasFlowUnit { get; set; } = "m3s";

    public string MaterialType { get; set; } = string.Empty;

    public string SurfaceCondition { get; set; } = string.Empty;

    public bool UseCustomRoughness { get; set; }

    [Range(0.000001, 0.1, ErrorMessage = "Шероховатость должна быть между 0.000001 и 0.1 м")]
    public double? CustomRoughness { get; set; }

    public string CustomRoughnessUnit { get; set; } = "m";

    public double HeightDifference { get; set; }

    public string? HeightDirection { get; set; }

    public int? CurrentCalculationId { get; set; }

    public string? CurrentCalculationName { get; set; }

    public bool UseGeometricPressure { get; set; }

    [Range(-80, 80, ErrorMessage = "Температура наружного воздуха должна быть в пределах -80...80°C")]
    public double? AmbientAirTemperature { get; set; } = 20;

    public string AmbientAirTemperatureUnit { get; set; } = "c";

    public double AmbientAirDensity { get; set; } = 1.293;

    public double AirDensityAtNormalConditions { get; set; } = 1.293;

    [Range(0, 1, ErrorMessage = "Доля азота должна быть от 0 до 1")]
    public double? Y_N2 { get; set; } = 0.72;

    public string Y_N2Unit { get; set; } = "fraction";

    [Range(0, 1, ErrorMessage = "Доля кислорода должна быть от 0 до 1")]
    public double? Y_O2 { get; set; } = 0.07;

    public string Y_O2Unit { get; set; } = "fraction";

    [Range(0, 1, ErrorMessage = "Доля углекислого газа должна быть от 0 до 1")]
    public double? Y_CO2 { get; set; } = 0.11;

    public string Y_CO2Unit { get; set; } = "fraction";

    [Range(0, 1, ErrorMessage = "Доля водяного пара должна быть от 0 до 1")]
    public double? Y_H2O { get; set; } = 0.10;

    public string Y_H2OUnit { get; set; } = "fraction";

    [Required(ErrorMessage = "Выберите цель оптимизации")]
    public string OptimizationGoal { get; set; } = "energy";

    public List<string> Materials { get; set; } = [];

    public List<string> SurfaceConditions { get; set; } = [];

    public List<string> LocalResistanceTypes { get; set; } = [];

    public Dictionary<string, LocalResistanceCatalogItemViewModel> LocalResistanceCatalog { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, List<string>> MaterialCatalog { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public List<MaterialRoughnessCatalogItemViewModel> RoughnessCatalog { get; set; } = [];

    public List<UserPresetListItemViewModel> SavedPresets { get; set; } = [];

    public List<SectionInput> Sections { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var sum = (Y_N2 ?? 0) + (Y_O2 ?? 0) + (Y_CO2 ?? 0) + (Y_H2O ?? 0);
        if (sum > 1.000001)
        {
            yield return new ValidationResult(
                $"Сумма компонентов газа больше 100% ({sum * 100:F1}%). Сформировать отчет невозможно, уменьшите доли компонентов.",
                [nameof(Y_N2), nameof(Y_O2), nameof(Y_CO2), nameof(Y_H2O)]);
        }
        else if (sum < 0.99)
        {
            yield return new ValidationResult(
                $"Сумма компонентов газа меньше 100% ({sum * 100:F1}%). Проверьте состав газа перед формированием отчета.",
                [nameof(Y_N2), nameof(Y_O2), nameof(Y_CO2), nameof(Y_H2O)]);
        }

        if (!UseCustomRoughness && (string.IsNullOrWhiteSpace(MaterialType) || string.IsNullOrWhiteSpace(SurfaceCondition)))
        {
            yield return new ValidationResult(
                "Выберите базовый материал и состояние поверхности либо задайте собственную шероховатость.",
                [nameof(MaterialType), nameof(SurfaceCondition), nameof(UseCustomRoughness)]);
        }

        if (UseCustomRoughness && !CustomRoughness.HasValue)
        {
            yield return new ValidationResult(
                "Укажите собственную шероховатость.",
                [nameof(CustomRoughness)]);
        }

        if (Sections.Count == 0)
        {
            yield return new ValidationResult(
                "Добавьте хотя бы один элемент трассы.",
                [nameof(Sections)]);
        }

        if (UseGeometricPressure && !AmbientAirTemperature.HasValue)
        {
            yield return new ValidationResult(
                "Для учета геометрического давления укажите температуру наружного воздуха.",
                [nameof(AmbientAirTemperature)]);
        }
    }
}

public static class SectionKinds
{
    public const string Straight = "Straight";
    public const string Bend = "Bend";
    public const string Contraction = "Contraction";
    public const string Expansion = "Expansion";
    public const string LocalResistance = "LocalResistance";

    public static string Normalize(string? value) =>
        value switch
        {
            "Прямой" => Straight,
            "МС" => LocalResistance,
            Straight or Bend or Contraction or Expansion or LocalResistance => value,
            _ => Straight
        };
}
