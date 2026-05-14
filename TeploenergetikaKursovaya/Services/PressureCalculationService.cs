using Microsoft.EntityFrameworkCore;
using TeploenergetikaKursovaya.Data;
using TeploenergetikaKursovaya.Models;

namespace TeploenergetikaKursovaya.Services;

public interface IPressureCalculationService
{
    PressureCalculationResponse Calculate(CalcViewModel model);
}

public class PressureCalculationService : IPressureCalculationService
{
    private readonly TeploDBContext _context;
    private readonly ILogger<PressureCalculationService> _logger;

    public PressureCalculationService(TeploDBContext context, ILogger<PressureCalculationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public PressureCalculationResponse Calculate(CalcViewModel model)
    {
        try
        {
            if (model.Sections.Count == 0)
            {
                return Fail("Добавьте хотя бы один элемент трассы.");
            }

            var gasCompositionSum = model.GetGasCompositionSum();
            if (!CalcViewModel.IsGasCompositionValid(gasCompositionSum))
            {
                return Fail($"Сумма компонентов газа должна быть равна 100%. Сейчас: {gasCompositionSum * 100:F1}%.");
            }

            var componentDensities = _context.DotMCs
                .Where(c => c.ComponentName != null)
                .ToDictionary(c => c.ComponentName!, c => c.ComponentDensity, StringComparer.OrdinalIgnoreCase);

            var viscosityData = _context.KVoAs
                .Where(x => x.KinematicViscosity > 1e-8)
                .OrderBy(x => x.GasTemperature)
                .ToList();

            if (viscosityData.Count == 0)
            {
                return Fail("В базе отсутствуют данные о кинематической вязкости.");
            }

            var roughnessEntries = _context.Roughnesses
                .Include(r => r.Material)
                .Include(r => r.SurfaceCondition)
                .ToList();
            var localResistanceEntries = _context.LRCs
                .Include(x => x.DataPoints)
                .Where(x => !string.IsNullOrWhiteSpace(x.TypeofLR))
                .ToList();
            var localResistanceCatalog = localResistanceEntries
                .GroupBy(x => x.TypeofLR)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var baselineRoughness = ResolveRoughness(
                model.UseCustomRoughness,
                model.CustomRoughness,
                model.MaterialType,
                model.SurfaceCondition,
                roughnessEntries);

            if (!baselineRoughness.Success)
            {
                return Fail(baselineRoughness.ErrorMessage!);
            }

            const double beta = 1.0 / 273.0;
            var ambientAirDensity = CalculateAmbientAirDensity(
                ResolveAmbientAirDensity(componentDensities),
                model.AmbientAirTemperature ?? 20);
            var routeHeightChange = model.Sections.Sum(section => section.HeightDelta);
            var applyGeometricPressure = model.UseGeometricPressure && Math.Abs(routeHeightChange) >= 0.0001;
            double runningTemperature = model.TgasInitial;

            var results = new List<CalcResultsViewModel>();
            var notices = new List<string>();
            AddRouteConnectionNotices(model.Sections, notices);
            if (model.UseGeometricPressure)
            {
                AddGeometricPressureNotice(routeHeightChange, notices);
            }

            foreach (var (section, index) in model.Sections.Select((value, idx) => (value, idx)))
            {
                var kind = SectionKinds.Normalize(section.SectionKind);
                var shape = SectionShapeKinds.Normalize(section.CrossSectionShape);
                var outletShape = kind is SectionKinds.Contraction or SectionKinds.Expansion
                    ? (string.IsNullOrWhiteSpace(section.OutletCrossSectionShape)
                        ? shape
                        : SectionShapeKinds.Normalize(section.OutletCrossSectionShape))
                    : shape;
                var title = section.DisplayTitle(index + 1);

                var roughnessResolution = section.UseIndividualMaterial || section.UseCustomRoughness
                    ? ResolveRoughness(
                        section.UseCustomRoughness,
                        section.CustomRoughness,
                        section.MaterialType,
                        section.SurfaceCondition,
                        roughnessEntries)
                    : baselineRoughness;

                if (!roughnessResolution.Success)
                {
                    return Fail($"{title}: {roughnessResolution.ErrorMessage}");
                }

                var inletSize = section.Diameter ?? 0;
                var inletSizeB = shape == SectionShapeKinds.Rectangle
                    ? section.DiameterB ?? inletSize
                    : 0;
                var outletSize = kind switch
                {
                    SectionKinds.Contraction or SectionKinds.Expansion => section.OutletDiameter ?? inletSize,
                    _ => inletSize
                };
                var outletSizeB = outletShape == SectionShapeKinds.Rectangle
                    ? kind switch
                    {
                        SectionKinds.Contraction or SectionKinds.Expansion => section.OutletDiameterB ?? inletSizeB,
                        _ => inletSizeB
                    }
                    : 0;

                var inletGeometry = ResolveCrossSectionGeometry(shape, inletSize, inletSizeB);
                if (!inletGeometry.Success)
                {
                    return Fail($"{title}: {inletGeometry.ErrorMessage}");
                }

                var outletGeometry = ResolveCrossSectionGeometry(outletShape, outletSize, outletSizeB);
                if (!outletGeometry.Success)
                {
                    return Fail($"{title}: {outletGeometry.ErrorMessage}");
                }

                var length = section.Length ?? 0;
                var hydraulicDiameter = ResolveHydraulicDiameter(kind, inletGeometry.EquivalentDiameter, outletGeometry.EquivalentDiameter);
                var frictionDiameter = kind switch
                {
                    SectionKinds.Contraction or SectionKinds.Expansion => (inletGeometry.EquivalentDiameter + outletGeometry.EquivalentDiameter) / 2.0,
                    _ => inletGeometry.EquivalentDiameter
                };

                if (hydraulicDiameter <= 0 || frictionDiameter <= 0 || inletGeometry.Area <= 0)
                {
                    return Fail($"{title}: указан некорректный размер или эквивалентный диаметр сечения.");
                }

                var inletTemperature = runningTemperature;
                double averageTemperature;
                double outletTemperature;
                var sectionTemperatureLoss = section.TemperatureLossPerMeter ?? model.TemperatureLossPerMeter;

                if (length > 0)
                {
                    averageTemperature = Math.Max(0, inletTemperature - sectionTemperatureLoss * length / 2.0);
                    outletTemperature = Math.Max(0, inletTemperature - sectionTemperatureLoss * length);
                }
                else
                {
                    averageTemperature = inletTemperature;
                    outletTemperature = inletTemperature;
                }

                var gasDensity = CalculateGasDensity(componentDensities, model, averageTemperature, beta);

                var flowVelocity = CalculateVelocity(model.GasFlow, inletGeometry.Area);
                var viscosityResolution = ResolveViscosity(viscosityData, averageTemperature);
                if (!viscosityResolution.Success)
                {
                    return Fail($"{title}: {viscosityResolution.ErrorMessage}");
                }

                if (viscosityResolution.Notice is not null)
                {
                    notices.Add($"{title}: {viscosityResolution.Notice}");
                }

                var reynolds = (flowVelocity * hydraulicDiameter) / viscosityResolution.Value;
                var lambda = CalculateLambda(reynolds, hydraulicDiameter, roughnessResolution.Value);
                var dynamicPressure = gasDensity * Math.Pow(flowVelocity, 2) / 2.0;
                var frictionLoss = length > 0
                    ? lambda * length / frictionDiameter * dynamicPressure
                    : 0;

                var zetaResolution = ResolveLocalResistanceCoefficient(
                    section,
                    kind,
                    inletGeometry.Area,
                    outletGeometry.Area,
                    shape != outletShape,
                    localResistanceCatalog);
                if (!zetaResolution.Success)
                {
                    return Fail($"{title}: {zetaResolution.ErrorMessage}");
                }

                if (zetaResolution.Notice is not null)
                {
                    notices.Add($"{title}: {zetaResolution.Notice}");
                }

                var localLoss = zetaResolution.Value * dynamicPressure;
                var geometricLoss = CalculateGeometricPressureDrop(
                    section.HeightDelta,
                    gasDensity,
                    ambientAirDensity,
                    applyGeometricPressure);
                var totalLoss = frictionLoss + localLoss + geometricLoss;

                results.Add(new CalcResultsViewModel
                {
                    SectionNumber = index + 1,
                    SectionName = title,
                    SectionType = TranslateKind(kind),
                    CrossSectionShape = TranslateShape(shape),
                    OutletCrossSectionShape = TranslateShape(outletShape),
                    MaterialType = section.UseIndividualMaterial ? (section.MaterialType ?? model.MaterialType) : model.MaterialType,
                    SurfaceCondition = section.UseIndividualMaterial ? (section.SurfaceCondition ?? model.SurfaceCondition) : model.SurfaceCondition,
                    Length = length,
                    Diameter = inletSize,
                    DiameterB = inletSizeB,
                    OutletDiameter = outletSize,
                    OutletDiameterB = outletSizeB,
                    EquivalentDiameter = inletGeometry.EquivalentDiameter,
                    OutletEquivalentDiameter = outletGeometry.EquivalentDiameter,
                    CrossSectionArea = inletGeometry.Area,
                    HeightDelta = section.HeightDelta,
                    Roughness = roughnessResolution.Value * 1000,
                    AverageTemperature = averageTemperature,
                    InletTemperature = inletTemperature,
                    OutletTemperature = outletTemperature,
                    GasDensity = gasDensity,
                    AmbientAirDensity = ambientAirDensity,
                    FlowVelocity = flowVelocity,
                    Re = reynolds,
                    Lambda = lambda,
                    Zeta = zetaResolution.Value,
                    PressureDropFriction = frictionLoss,
                    PressureDropLocal = localLoss,
                    GeometricPressureDrop = geometricLoss,
                    TotalPressureDrop = totalLoss,
                    DominantLossType = ResolveDominantLoss(frictionLoss, localLoss, geometricLoss)
                });

                runningTemperature = outletTemperature;
            }

            var summary = BuildSummary(results);
            var recommendations = BuildRecommendations(model, results, summary);

            if (Math.Abs(summary.GeometricLoss) > Math.Abs(summary.TotalPressureDrop) * 0.15)
            {
                notices.Add(summary.GeometricLoss > 0
                    ? "Геометрическая составляющая заметно увеличивает сопротивление: горячие газы в итоге движутся вниз относительно начальной отметки."
                    : "Геометрическая составляющая заметно помогает движению: конечная точка трассы выше начальной отметки.");
            }

            if (summary.MaxVelocity > 20)
            {
                notices.Add("Максимальная скорость газа превышает 20 м/с. Это может привести к росту шума и энергозатрат.");
            }

            return new PressureCalculationResponse
            {
                Success = true,
                Summary = summary,
                Results = results,
                Recommendations = recommendations,
                Notices = notices.Distinct().ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при расчете дымовой трассы");
            return Fail("Во время расчета произошла ошибка. Проверьте исходные данные и повторите попытку.");
        }
    }

    private static PressureCalculationResponse Fail(string errorMessage) =>
        new()
        {
            Success = false,
            ErrorMessage = errorMessage
        };

    private static double ResolveHydraulicDiameter(string kind, double inletDiameter, double outletDiameter) =>
        kind switch
        {
            SectionKinds.Contraction => Math.Min(inletDiameter, outletDiameter),
            SectionKinds.Expansion => Math.Min(inletDiameter, outletDiameter),
            _ => inletDiameter
        };

    private static double CalculateVelocity(double flowRate, double area) =>
        area <= 0 ? 0 : flowRate / area;

    private static void AddRouteConnectionNotices(IReadOnlyList<SectionInput> sections, List<string> notices)
    {
        for (var index = 1; index < sections.Count; index++)
        {
            var previous = GetOutletConnection(sections[index - 1]);
            var current = GetInletConnection(sections[index]);
            var shapeMismatch = !string.Equals(previous.Shape, current.Shape, StringComparison.Ordinal);
            var sizeMismatch = previous.SizeA.HasValue && current.SizeA.HasValue &&
                Math.Abs(previous.SizeA.Value - current.SizeA.Value) > 0.000001;
            var secondSizeMismatch = previous.Shape == SectionShapeKinds.Rectangle &&
                current.Shape == SectionShapeKinds.Rectangle &&
                previous.SizeB.HasValue && current.SizeB.HasValue &&
                Math.Abs(previous.SizeB.Value - current.SizeB.Value) > 0.000001;

            if (shapeMismatch || sizeMismatch || secondSizeMismatch)
            {
                notices.Add(
                    $"Между блоками {index} и {index + 1} есть изменение формы или размера сечения. Для более корректной схемы можно вставить блок «Переход».");
            }
        }
    }

    private static void AddGeometricPressureNotice(double routeHeightChange, List<string> notices)
    {
        if (Math.Abs(routeHeightChange) < 0.0001)
        {
            notices.Add("Конечная отметка трассы совпадает с начальной: H = 0, геометрическое давление не учитывается.");
            return;
        }

        notices.Add(routeHeightChange > 0
            ? "Конечная точка выше начальной: для горячих газов геометрическое давление берется со знаком минус и уменьшает общее сопротивление."
            : "Конечная точка ниже начальной: для горячих газов геометрическое давление берется со знаком плюс и увеличивает общее сопротивление.");
    }

    private static SectionConnection GetInletConnection(SectionInput section) =>
        new(
            SectionShapeKinds.Normalize(section.CrossSectionShape),
            section.Diameter,
            SectionShapeKinds.Normalize(section.CrossSectionShape) == SectionShapeKinds.Rectangle ? section.DiameterB : null);

    private static SectionConnection GetOutletConnection(SectionInput section)
    {
        var kind = SectionKinds.Normalize(section.SectionKind);
        if (kind is SectionKinds.Contraction or SectionKinds.Expansion)
        {
            var inletShape = SectionShapeKinds.Normalize(section.CrossSectionShape);
            var outletShape = string.IsNullOrWhiteSpace(section.OutletCrossSectionShape)
                ? inletShape
                : SectionShapeKinds.Normalize(section.OutletCrossSectionShape);
            return new SectionConnection(
                outletShape,
                section.OutletDiameter ?? section.Diameter,
                outletShape == SectionShapeKinds.Rectangle ? section.OutletDiameterB ?? section.DiameterB : null);
        }

        return GetInletConnection(section);
    }

    private static double CalculateGasDensity(
        IReadOnlyDictionary<string, double> componentDensities,
        CalcViewModel model,
        double temperature,
        double beta)
    {
        double GetDensity(string component) => componentDensities.TryGetValue(component, out var density) ? density : 0;

        return (model.Y_N2 ?? 0) * (GetDensity("N2") / (1 + beta * temperature))
             + (model.Y_O2 ?? 0) * (GetDensity("O2") / (1 + beta * temperature))
             + (model.Y_CO2 ?? 0) * (GetDensity("CO2") / (1 + beta * temperature))
             + (model.Y_H2O ?? 0) * (GetDensity("H2O") / (1 + beta * temperature));
    }

    private static double ResolveAmbientAirDensity(IReadOnlyDictionary<string, double> componentDensities)
    {
        if (componentDensities.TryGetValue("Air", out var airDensity))
        {
            return airDensity;
        }

        if (componentDensities.TryGetValue("Воздух", out var localizedAirDensity))
        {
            return localizedAirDensity;
        }

        return 1.293;
    }

    private static double CalculateAmbientAirDensity(double referenceDensity, double temperatureCelsius)
    {
        const double normalTemperatureKelvin = 273.15;
        var absoluteTemperature = temperatureCelsius + normalTemperatureKelvin;
        return absoluteTemperature <= 0
            ? referenceDensity
            : referenceDensity * normalTemperatureKelvin / absoluteTemperature;
    }

    private static double CalculateGeometricPressureDrop(
        double heightDelta,
        double gasDensity,
        double ambientAirDensity,
        bool applyGeometricPressure)
    {
        if (!applyGeometricPressure || Math.Abs(heightDelta) < 0.0001)
        {
            return 0;
        }

        var height = Math.Abs(heightDelta);
        return heightDelta < 0
            ? 9.81 * height * (ambientAirDensity - gasDensity)
            : 9.81 * height * (gasDensity - ambientAirDensity);
    }

    private static ResolutionResult ResolveRoughness(
        bool useCustomRoughness,
        double? customRoughness,
        string? materialType,
        string? surfaceCondition,
        List<Roughness> roughnessEntries)
    {
        if (useCustomRoughness)
        {
            if (!customRoughness.HasValue || customRoughness.Value <= 0)
            {
                return ResolutionResult.Fail("не задана собственная шероховатость");
            }

            return ResolutionResult.Ok(customRoughness.Value);
        }

        var roughnessEntry = roughnessEntries.FirstOrDefault(r =>
            string.Equals(r.Type, materialType, StringComparison.OrdinalIgnoreCase) &&
            string.Equals(r.Condition, surfaceCondition, StringComparison.OrdinalIgnoreCase));

        return roughnessEntry is null
            ? ResolutionResult.Fail("не найдена запись по материалу и состоянию поверхности")
            : ResolutionResult.Ok(roughnessEntry.EquivalentRoughness);
    }

    private static ResolutionResult ResolveViscosity(List<KVoA> viscosityData, double temperature)
    {
        var lower = viscosityData.LastOrDefault(x => x.GasTemperature <= temperature);
        var upper = viscosityData.FirstOrDefault(x => x.GasTemperature >= temperature);

        if (lower is null && upper is null)
        {
            return ResolutionResult.Fail($"температура {temperature:F1}°C выходит за пределы справочных данных");
        }

        if (lower is null)
        {
            return ResolutionResult.Ok(
                viscosityData.First().KinematicViscosity,
                $"использовано минимальное значение вязкости для температуры {temperature:F1}°C");
        }

        if (upper is null)
        {
            return ResolutionResult.Ok(
                viscosityData.Last().KinematicViscosity,
                $"использовано максимальное значение вязкости для температуры {temperature:F1}°C");
        }

        if (lower.GasTemperature == upper.GasTemperature)
        {
            return ResolutionResult.Ok(lower.KinematicViscosity);
        }

        var value = lower.KinematicViscosity +
                    (temperature - lower.GasTemperature) *
                    (upper.KinematicViscosity - lower.KinematicViscosity) /
                    (upper.GasTemperature - lower.GasTemperature);

        return value <= 0
            ? ResolutionResult.Fail("рассчитанная кинематическая вязкость получилась неположительной")
            : ResolutionResult.Ok(value);
    }

    private static double CalculateLambda(double reynolds, double diameter, double roughness)
    {
        if (reynolds <= 0 || diameter <= 0)
        {
            return 0;
        }

        if (reynolds < 2300)
        {
            return 64 / reynolds;
        }

        if (reynolds < 4000)
        {
            var lambdaLaminar = 64 / 2300;
            var lambdaTurbulent = 0.3164 / Math.Pow(4000, 0.25);
            return lambdaLaminar + (lambdaTurbulent - lambdaLaminar) * (reynolds - 2300) / (4000 - 2300);
        }

        var relativeRoughness = roughness / diameter;
        var reBoundary1 = 10 * diameter / roughness;
        var reBoundary2 = 560 * diameter / roughness;

        if (reynolds < reBoundary1)
        {
            return 0.3164 / Math.Pow(reynolds, 0.25);
        }

        if (reynolds < reBoundary2)
        {
            return 0.11 * Math.Pow(relativeRoughness + 68 / reynolds, 0.25);
        }

        return 0.11 * Math.Pow(relativeRoughness, 0.25);
    }

    private static ResolutionResult ResolveLocalResistanceCoefficient(
        SectionInput section,
        string kind,
        double inletArea,
        double outletArea,
        bool isShapeTransition,
        IReadOnlyDictionary<string, LRC> localResistanceCatalog)
    {
        if (kind == SectionKinds.Straight)
        {
            return ResolutionResult.Ok(0);
        }

        if (section.UseCustomLRC && section.CustomLRC.HasValue)
        {
            return ResolutionResult.Ok(section.CustomLRC.Value);
        }

        return kind switch
        {
            SectionKinds.Bend => ResolveBendCoefficient(section.TurnAngle),
            SectionKinds.Contraction => ResolveContractionCoefficient(inletArea, outletArea, isShapeTransition),
            SectionKinds.Expansion => ResolveExpansionCoefficient(inletArea, outletArea, isShapeTransition),
            SectionKinds.LocalResistance => ResolveCatalogCoefficient(section, localResistanceCatalog),
            _ => ResolutionResult.Ok(0)
        };
    }

    private static ResolutionResult ResolveBendCoefficient(double? turnAngle)
    {
        if (!turnAngle.HasValue)
        {
            return ResolutionResult.Fail("не указан угол поворота");
        }

        var normalized = Math.Clamp(turnAngle.Value, 1, 180);
        var angleFactor = Math.Sin(normalized * Math.PI / 360.0);
        var zeta = 0.18 + 0.9 * angleFactor * angleFactor;
        return ResolutionResult.Ok(zeta);
    }

    private static ResolutionResult ResolveContractionCoefficient(double inletArea, double outletArea, bool isShapeTransition)
    {
        if (outletArea >= inletArea && !isShapeTransition)
        {
            return ResolutionResult.Fail("для сужения выходное сечение должно быть меньше входного");
        }

        if (outletArea >= inletArea && isShapeTransition)
        {
            return ResolutionResult.Ok(0.18);
        }

        var beta = Math.Sqrt(outletArea / inletArea);
        var zeta = 0.5 * (1 / Math.Pow(beta, 2) - 1);
        return ResolutionResult.Ok(zeta);
    }

    private static ResolutionResult ResolveExpansionCoefficient(double inletArea, double outletArea, bool isShapeTransition)
    {
        if (outletArea <= inletArea && !isShapeTransition)
        {
            return ResolutionResult.Fail("для расширения выходное сечение должно быть больше входного");
        }

        if (outletArea <= inletArea && isShapeTransition)
        {
            return ResolutionResult.Ok(0.18);
        }

        var areaRatio = inletArea / outletArea;
        var zeta = Math.Pow(1 - areaRatio, 2);
        return ResolutionResult.Ok(zeta);
    }

    private static ResolutionResult ResolveCatalogCoefficient(
        SectionInput section,
        IReadOnlyDictionary<string, LRC> localResistanceCatalog)
    {
        var localResistanceType = section.LocalResistanceType;
        if (string.IsNullOrWhiteSpace(localResistanceType))
        {
            return ResolutionResult.Fail("не выбран тип местного сопротивления");
        }

        if (!localResistanceCatalog.TryGetValue(localResistanceType, out var resistance))
        {
            return ResolutionResult.Fail($"не найден коэффициент для типа \"{localResistanceType}\"");
        }

        if (!resistance.IsTabular)
        {
            return resistance.ValueofLR.HasValue
                ? ResolutionResult.Ok(resistance.ValueofLR.Value)
                : ResolutionResult.Fail($"для типа \"{localResistanceType}\" не задан коэффициент КМС");
        }

        var isConicalCollector = SectionInput.IsConicalCollector(localResistanceType);
        var isStraightPipeEntrance = SectionInput.IsStraightPipeEntrance(localResistanceType);
        var paramX = section.LocalResistanceParamX;
        var paramY = section.LocalResistanceParamY;
        if (isConicalCollector)
        {
            if (!section.Length.HasValue || section.Length.Value <= 0 ||
                !section.Diameter.HasValue || section.Diameter.Value <= 0)
            {
                return ResolutionResult.Fail($"для конического коллектора \"{localResistanceType}\" укажите выходной диаметр d0 и длину раструба");
            }

            paramY = section.Length.Value / section.Diameter.Value;
        }

        if (isStraightPipeEntrance)
        {
            if (!section.Diameter.HasValue || section.Diameter.Value <= 0)
            {
                return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" укажите диаметр Dг");
            }

            if (!section.LocalResistanceParamX.HasValue || !section.LocalResistanceParamY.HasValue)
            {
                return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" укажите размеры b и δ1");
            }

            if (section.LocalResistanceParamX.Value < 0 || section.LocalResistanceParamY.Value < 0)
            {
                return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" размеры b и δ1 не могут быть отрицательными");
            }

            paramX = section.LocalResistanceParamX.Value / section.Diameter.Value;
            paramY = section.LocalResistanceParamY.Value / section.Diameter.Value;
        }

        if (!paramX.HasValue || !paramY.HasValue)
        {
            return ResolutionResult.Fail(isConicalCollector
                ? $"для конического коллектора \"{localResistanceType}\" укажите угол α, выходной диаметр d0 и длину раструба"
                : isStraightPipeEntrance
                    ? $"для сопротивления \"{localResistanceType}\" укажите диаметр Dг, размер b и размер δ1"
                    : $"для табличного сопротивления \"{localResistanceType}\" укажите угол α и отношение l/d0");
        }

        return ResolveTabularCoefficient(
            localResistanceType,
            resistance.DataPoints,
            paramX.Value,
            paramY.Value,
            clampHighX: isStraightPipeEntrance,
            clampHighY: isConicalCollector || isStraightPipeEntrance,
            paramXLabel: isStraightPipeEntrance ? "b/Dг" : "α",
            paramYLabel: isStraightPipeEntrance ? "δ1/Dг" : "l/d0",
            paramXDigits: isStraightPipeEntrance ? 3 : 0,
            paramYDigits: 3);
    }

    private static ResolutionResult ResolveTabularCoefficient(
        string localResistanceType,
        IEnumerable<ResistanceDataPoint> points,
        double paramX,
        double paramY,
        bool clampHighX = false,
        bool clampHighY = false,
        string paramXLabel = "α",
        string paramYLabel = "l/d0",
        int paramXDigits = 0,
        int paramYDigits = 3)
    {
        var grid = points.ToList();
        if (grid.Count == 0)
        {
            return ResolutionResult.Fail($"для табличного сопротивления \"{localResistanceType}\" нет расчетных точек");
        }

        var xs = grid.Select(point => point.ParamX).Distinct().OrderBy(value => value).ToList();
        var ys = grid.Select(point => point.ParamY).Distinct().OrderBy(value => value).ToList();
        var effectiveParamX = paramX;
        var effectiveParamY = paramY;
        var notices = new List<string>();
        const double tolerance = 0.000001;
        if (clampHighX && xs.Count > 0 && paramX > xs.Last() + tolerance)
        {
            effectiveParamX = xs.Last();
            notices.Add($"{paramXLabel} = {paramX.ToString($"F{paramXDigits}")} выше диапазона таблицы; для расчета использована последняя колонка {paramXLabel} = {effectiveParamX.ToString($"F{paramXDigits}")}");
        }

        if (clampHighY && ys.Count > 0 && paramY > ys.Last() + tolerance)
        {
            effectiveParamY = ys.Last();
            notices.Add($"{paramYLabel} = {paramY.ToString($"F{paramYDigits}")} выше диапазона таблицы; для расчета использована последняя строка {paramYLabel} = {effectiveParamY.ToString($"F{paramYDigits}")}");
        }

        var xBounds = FindBounds(xs, effectiveParamX);
        var yBounds = FindBounds(ys, effectiveParamY);

        if (!xBounds.Success || !yBounds.Success)
        {
            return ResolutionResult.Fail(
                $"параметры табличного сопротивления \"{localResistanceType}\" вне диапазона: {paramXLabel} {xs.First().ToString($"F{paramXDigits}")}...{xs.Last().ToString($"F{paramXDigits}")}, {paramYLabel} {ys.First().ToString($"F{paramYDigits}")}...{ys.Last().ToString($"F{paramYDigits}")}");
        }

        var q11 = TryGetGridValue(grid, xBounds.Lower, yBounds.Lower);
        var q21 = TryGetGridValue(grid, xBounds.Upper, yBounds.Lower);
        var q12 = TryGetGridValue(grid, xBounds.Lower, yBounds.Upper);
        var q22 = TryGetGridValue(grid, xBounds.Upper, yBounds.Upper);

        if (!q11.HasValue || !q21.HasValue || !q12.HasValue || !q22.HasValue)
        {
            return ResolutionResult.Fail($"в таблице сопротивления \"{localResistanceType}\" не хватает точек для интерполяции");
        }

        var zeta = Interpolate2D(
            effectiveParamX,
            effectiveParamY,
            xBounds.Lower,
            xBounds.Upper,
            yBounds.Lower,
            yBounds.Upper,
            q11.Value,
            q21.Value,
            q12.Value,
            q22.Value);

        var notice = notices.Count == 0 ? null : string.Join("; ", notices);
        return ResolutionResult.Ok(zeta, notice);
    }

    private static BoundResult FindBounds(IReadOnlyList<double> values, double value)
    {
        const double tolerance = 0.000001;
        if (values.Count == 0 || value < values.First() - tolerance || value > values.Last() + tolerance)
        {
            return new BoundResult(false, 0, 0);
        }

        foreach (var point in values)
        {
            if (Math.Abs(point - value) <= tolerance)
            {
                return new BoundResult(true, point, point);
            }
        }

        for (var index = 0; index < values.Count - 1; index++)
        {
            if (values[index] <= value && value <= values[index + 1])
            {
                return new BoundResult(true, values[index], values[index + 1]);
            }
        }

        return new BoundResult(false, 0, 0);
    }

    private static double? TryGetGridValue(IEnumerable<ResistanceDataPoint> points, double x, double y)
    {
        var point = points.FirstOrDefault(item =>
            Math.Abs(item.ParamX - x) < 0.000001 &&
            Math.Abs(item.ParamY - y) < 0.000001);

        return point?.ZetaValue;
    }

    private static double Interpolate2D(
        double x,
        double y,
        double x1,
        double x2,
        double y1,
        double y2,
        double q11,
        double q21,
        double q12,
        double q22)
    {
        if (Math.Abs(x2 - x1) < 0.000001 && Math.Abs(y2 - y1) < 0.000001)
        {
            return q11;
        }

        if (Math.Abs(x2 - x1) < 0.000001)
        {
            return LinearInterpolate(y, y1, y2, q11, q12);
        }

        if (Math.Abs(y2 - y1) < 0.000001)
        {
            return LinearInterpolate(x, x1, x2, q11, q21);
        }

        var r1 = LinearInterpolate(x, x1, x2, q11, q21);
        var r2 = LinearInterpolate(x, x1, x2, q12, q22);
        return LinearInterpolate(y, y1, y2, r1, r2);
    }

    private static double LinearInterpolate(double value, double lower, double upper, double lowerValue, double upperValue)
    {
        if (Math.Abs(upper - lower) < 0.000001)
        {
            return lowerValue;
        }

        var ratio = (value - lower) / (upper - lower);
        return lowerValue + ratio * (upperValue - lowerValue);
    }

    private static string ResolveDominantLoss(double frictionLoss, double localLoss, double geometricLoss)
    {
        var contributions = new Dictionary<string, double>
        {
            ["Трение"] = Math.Abs(frictionLoss),
            ["Местное сопротивление"] = Math.Abs(localLoss),
            ["Геометрия"] = Math.Abs(geometricLoss)
        };

        return contributions.OrderByDescending(x => x.Value).First().Key;
    }

    private static string TranslateKind(string kind) =>
        kind switch
        {
            SectionKinds.Straight => "Прямой участок",
            SectionKinds.Bend => "Поворот",
            SectionKinds.Contraction => "Сужение",
            SectionKinds.Expansion => "Расширение",
            SectionKinds.LocalResistance => "Местное сопротивление",
            _ => "Элемент трассы"
        };

    private static string TranslateShape(string shape) =>
        shape switch
        {
            SectionShapeKinds.Rectangle => "Прямоугольное",
            _ => "Круглое"
        };

    private static CalculationSummaryViewModel BuildSummary(List<CalcResultsViewModel> results)
    {
        var totalPressureDrop = results.Sum(x => x.TotalPressureDrop);
        var frictionLoss = results.Sum(x => x.PressureDropFriction);
        var localLoss = results.Sum(x => x.PressureDropLocal);
        var geometricLoss = results.Sum(x => x.GeometricPressureDrop);
        var criticalSection = results.OrderByDescending(x => Math.Abs(x.TotalPressureDrop)).First();
        var avgVelocity = results.Count == 0 ? 0 : results.Average(x => x.FlowVelocity);
        var maxVelocity = results.Count == 0 ? 0 : results.Max(x => x.FlowVelocity);
        var totalLength = results.Sum(x => x.Length);
        var height = results.Sum(x => x.HeightDelta);

        return new CalculationSummaryViewModel
        {
            TotalPressureDrop = totalPressureDrop,
            FrictionLoss = frictionLoss,
            LocalLoss = localLoss,
            GeometricLoss = geometricLoss,
            TotalRouteLength = totalLength,
            TotalHeightChange = height,
            AverageVelocity = avgVelocity,
            MaxVelocity = maxVelocity,
            AmbientAirDensity = results.FirstOrDefault()?.AmbientAirDensity ?? 1.293,
            CriticalSectionName = criticalSection.SectionName,
            CriticalSectionLoss = criticalSection.TotalPressureDrop,
            EfficiencyLabel = ResolveEfficiencyLabel(totalPressureDrop, totalLength, maxVelocity)
        };
    }

    private static string ResolveEfficiencyLabel(double totalPressureDrop, double totalLength, double maxVelocity)
    {
        var normalizedLoss = totalLength > 0 ? totalPressureDrop / totalLength : totalPressureDrop;

        if (normalizedLoss < 80 && maxVelocity < 14)
        {
            return "Высокая эффективность";
        }

        if (normalizedLoss < 150 && maxVelocity < 18)
        {
            return "Сбалансированная схема";
        }

        if (normalizedLoss < 260)
        {
            return "Требуется точечная оптимизация";
        }

        return "Высокие потери давления";
    }

    private List<OptimizationRecommendationViewModel> BuildRecommendations(
        CalcViewModel model,
        List<CalcResultsViewModel> results,
        CalculationSummaryViewModel summary)
    {
        var recommendations = new List<OptimizationRecommendationViewModel>();
        var criticalSection = results.OrderByDescending(x => Math.Abs(x.TotalPressureDrop)).First();

        if (criticalSection.SectionType == "Прямой участок" && criticalSection.FlowVelocity > 14)
        {
            var estimatedSaving = criticalSection.PressureDropFriction * 0.32;
            recommendations.Add(new OptimizationRecommendationViewModel
            {
                Title = $"Снизить скорость на участке «{criticalSection.SectionName}»",
                Description = "Увеличьте эквивалентный диаметр прямого участка на 10-15% либо перераспределите расход по параллельным каналам. Это уменьшит гидравлическое сопротивление и суммарные потери давления.",
                Priority = model.OptimizationGoal == "energy" ? "Высокий" : "Средний",
                ImpactText = $"Ожидаемое снижение потерь на участке: до {estimatedSaving:F1} Па.",
                EstimatedSavingPa = estimatedSaving
            });
        }

        var bendSection = results
            .Where(x => x.SectionType == "Поворот" && x.Zeta > 0.45)
            .OrderByDescending(x => x.PressureDropLocal)
            .FirstOrDefault();

        if (bendSection is not null)
        {
            var estimatedSaving = bendSection.PressureDropLocal * 0.28;
            recommendations.Add(new OptimizationRecommendationViewModel
            {
                Title = $"Смягчить поворот «{bendSection.SectionName}»",
                Description = "Используйте более плавный радиус или уменьшите угол поворота. На резких поворотах местные потери часто становятся доминирующими.",
                Priority = "Высокий",
                ImpactText = $"Потенциальное снижение местных потерь: около {estimatedSaving:F1} Па.",
                EstimatedSavingPa = estimatedSaving
            });
        }

        var transitionSection = results
            .Where(x => (x.SectionType == "Сужение" || x.SectionType == "Расширение") && x.PressureDropLocal > 0)
            .OrderByDescending(x => x.PressureDropLocal)
            .FirstOrDefault();

        if (transitionSection is not null)
        {
            var estimatedSaving = transitionSection.PressureDropLocal * 0.35;
            recommendations.Add(new OptimizationRecommendationViewModel
            {
                Title = $"Оптимизировать переход «{transitionSection.SectionName}»",
                Description = "Сделайте переход более плавным или увеличьте его длину. Это уменьшит вихреобразование и местное сопротивление.",
                Priority = model.OptimizationGoal == "materials" ? "Средний" : "Высокий",
                ImpactText = $"Оценка снижения потерь: до {estimatedSaving:F1} Па.",
                EstimatedSavingPa = estimatedSaving
            });
        }

        if (Math.Abs(summary.LocalLoss) > Math.Abs(summary.FrictionLoss) * 1.2 && Math.Abs(summary.LocalLoss) > 1)
        {
            var estimatedSaving = Math.Abs(summary.LocalLoss) * 0.18;
            recommendations.Add(new OptimizationRecommendationViewModel
            {
                Title = "Снизить долю местных сопротивлений",
                Description = "Если местные сопротивления превышают потери на трение, стоит уменьшить количество резких фасонных элементов, заменить арматуру на элементы с меньшим ζ или объединить несколько поворотов в один плавный участок.",
                Priority = "Высокий",
                ImpactText = $"Ориентировочный резерв снижения: до {estimatedSaving:F1} Па.",
                EstimatedSavingPa = estimatedSaving
            });
        }

        var bendCount = results.Count(x => x.SectionType == "Поворот");
        if (bendCount >= 3)
        {
            var estimatedSaving = results
                .Where(x => x.SectionType == "Поворот")
                .Sum(x => Math.Abs(x.PressureDropLocal)) * 0.2;
            recommendations.Add(new OptimizationRecommendationViewModel
            {
                Title = "Пересмотреть компоновку поворотов",
                Description = "В трассе несколько поворотов подряд. Проверьте возможность выпрямить маршрут, увеличить радиусы поворотов или заменить последовательность коротких поворотов одним более плавным направлением.",
                Priority = model.OptimizationGoal == "energy" ? "Высокий" : "Средний",
                ImpactText = $"Возможное снижение потерь на поворотах: около {estimatedSaving:F1} Па.",
                EstimatedSavingPa = estimatedSaving
            });
        }

        if (summary.AverageVelocity > 12 && summary.MaxVelocity > 16)
        {
            var estimatedSaving = Math.Abs(summary.TotalPressureDrop) * 0.1;
            recommendations.Add(new OptimizationRecommendationViewModel
            {
                Title = "Проверить равномерность скоростей по трассе",
                Description = "Высокая средняя и максимальная скорость указывают, что сечения могут быть подобраны слишком компактно. Увеличение наиболее нагруженных участков уменьшит динамическое давление и снизит шум.",
                Priority = model.OptimizationGoal == "energy" ? "Высокий" : "Средний",
                ImpactText = $"Оценочный эффект: до {estimatedSaving:F1} Па по всей трассе.",
                EstimatedSavingPa = estimatedSaving
            });
        }

        if (summary.GeometricLoss > Math.Abs(summary.TotalPressureDrop) * 0.12)
        {
            var estimatedSaving = Math.Abs(summary.GeometricLoss) * 0.4;
            recommendations.Add(new OptimizationRecommendationViewModel
            {
                Title = "Сократить движение горячих газов вниз",
                Description = "Конечная отметка трассы ниже начальной, поэтому геометрическая составляющая увеличивает сопротивление. Перераспределите высоты, если компоновка это допускает.",
                Priority = "Средний",
                ImpactText = $"Потенциальный резерв: около {estimatedSaving:F1} Па.",
                EstimatedSavingPa = estimatedSaving
            });
        }

        return recommendations
            .OrderByDescending(x => PriorityWeight(x.Priority, model.OptimizationGoal))
            .ThenByDescending(x => x.EstimatedSavingPa)
            .Take(6)
            .ToList();
    }

    private static int PriorityWeight(string priority, string optimizationGoal)
    {
        var baseWeight = priority switch
        {
            "Высокий" => 3,
            "Средний" => 2,
            _ => 1
        };

        return optimizationGoal switch
        {
            "energy" => baseWeight * 10,
            "materials" => baseWeight * 8,
            _ => baseWeight * 9
        };
    }

    private static GeometryResolutionResult ResolveCrossSectionGeometry(string shape, double sizeA, double sizeB)
    {
        if (sizeA <= 0)
        {
            return GeometryResolutionResult.Fail("некорректно задан размер сечения");
        }

        var normalizedShape = SectionShapeKinds.Normalize(shape);
        if (normalizedShape == SectionShapeKinds.Rectangle && sizeB <= 0)
        {
            return GeometryResolutionResult.Fail("для прямоугольного сечения укажите стороны a и b");
        }

        var area = normalizedShape switch
        {
            SectionShapeKinds.Rectangle => sizeA * sizeB,
            _ => Math.PI * Math.Pow(sizeA, 2) / 4.0
        };

        var perimeter = normalizedShape switch
        {
            SectionShapeKinds.Rectangle => 2.0 * (sizeA + sizeB),
            _ => Math.PI * sizeA
        };

        if (area <= 0 || perimeter <= 0)
        {
            return GeometryResolutionResult.Fail("не удалось определить площадь и периметр сечения");
        }

        var equivalentDiameter = 4.0 * area / perimeter;
        return equivalentDiameter <= 0
            ? GeometryResolutionResult.Fail("не удалось определить эквивалентный диаметр")
            : GeometryResolutionResult.Ok(area, perimeter, equivalentDiameter);
    }

    private readonly record struct ResolutionResult(bool Success, double Value, string? ErrorMessage, string? Notice)
    {
        public static ResolutionResult Ok(double value, string? notice = null) => new(true, value, null, notice);

        public static ResolutionResult Fail(string error) => new(false, 0, error, null);
    }

    private readonly record struct SectionConnection(string Shape, double? SizeA, double? SizeB);

    private readonly record struct BoundResult(bool Success, double Lower, double Upper);

    private readonly record struct GeometryResolutionResult(
        bool Success,
        double Area,
        double Perimeter,
        double EquivalentDiameter,
        string? ErrorMessage)
    {
        public static GeometryResolutionResult Ok(double area, double perimeter, double equivalentDiameter) =>
            new(true, area, perimeter, equivalentDiameter, null);

        public static GeometryResolutionResult Fail(string error) =>
            new(false, 0, 0, 0, error);
    }
}
