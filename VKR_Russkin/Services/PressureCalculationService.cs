using Microsoft.EntityFrameworkCore;
using VKR_Russkin.Data;
using VKR_Russkin.Models;

namespace VKR_Russkin.Services;

public interface IPressureCalculationService
{
    PressureCalculationResponse Calculate(CalcViewModel model);
}

public class PressureCalculationService : IPressureCalculationService
{
    private readonly TeploDBContext _context;
    private readonly ILogger<PressureCalculationService> _logger;
    private static readonly double[] DiffuserDiagram52Alphas = [3, 4, 6, 8, 10, 12, 14, 16, 20, 30, 45, 60, 90, 120, 180];
    private static readonly double[] DiffuserDiagram52Ratios = [2, 4, 6, 10, 16];
    private static readonly double[] DiffuserDiagram52ReScales = [0.5, 1, 2, 4, 6];
    private static readonly IReadOnlyDictionary<double, double[,]> DiffuserDiagram52Values = new Dictionary<double, double[,]>
    {
        [2] = new double[,]
        {
            { 0.148, 0.135, 0.121, 0.112, 0.107, 0.109, 0.120, 0.141, 0.191, 0.315, 0.331, 0.326, 0.315, 0.308, 0.298 },
            { 0.120, 0.106, 0.090, 0.083, 0.080, 0.088, 0.102, 0.122, 0.196, 0.298, 0.297, 0.286, 0.283, 0.279, 0.276 },
            { 0.093, 0.082, 0.070, 0.068, 0.062, 0.062, 0.063, 0.073, 0.120, 0.229, 0.279, 0.268, 0.268, 0.265, 0.263 },
            { 0.079, 0.068, 0.056, 0.048, 0.048, 0.048, 0.051, 0.051, 0.068, 0.120, 0.271, 0.272, 0.272, 0.268, 0.268 },
            { 0.079, 0.068, 0.056, 0.048, 0.048, 0.048, 0.051, 0.051, 0.068, 0.120, 0.271, 0.272, 0.272, 0.268, 0.268 }
        },
        [4] = new double[,]
        {
            { 0.197, 0.180, 0.165, 0.151, 0.157, 0.174, 0.197, 0.225, 0.298, 0.461, 0.606, 0.680, 0.643, 0.630, 0.615 },
            { 0.154, 0.141, 0.126, 0.119, 0.120, 0.131, 0.155, 0.183, 0.262, 0.479, 0.680, 0.628, 0.600, 0.593, 0.585 },
            { 0.120, 0.112, 0.101, 0.096, 0.096, 0.107, 0.120, 0.146, 0.180, 0.360, 0.548, 0.586, 0.585, 0.580, 0.567 },
            { 0.101, 0.091, 0.085, 0.079, 0.082, 0.090, 0.107, 0.124, 0.172, 0.292, 0.462, 0.562, 0.582, 0.577, 0.567 },
            { 0.101, 0.091, 0.085, 0.089, 0.080, 0.107, 0.135, 0.169, 0.240, 0.382, 0.506, 0.560, 0.582, 0.577, 0.567 }
        },
        [6] = new double[,]
        {
            { 0.182, 0.170, 0.168, 0.168, 0.179, 0.200, 0.240, 0.268, 0.330, 0.482, 0.655, 0.766, 0.742, 0.730, 0.722 },
            { 0.153, 0.144, 0.131, 0.126, 0.132, 0.159, 0.193, 0.218, 0.286, 0.488, 0.680, 0.755, 0.731, 0.720, 0.707 },
            { 0.129, 0.118, 0.109, 0.101, 0.101, 0.118, 0.151, 0.185, 0.280, 0.440, 0.895, 0.700, 0.710, 0.708, 0.690 },
            { 0.106, 0.095, 0.090, 0.084, 0.087, 0.104, 0.151, 0.160, 0.224, 0.360, 0.588, 0.660, 0.696, 0.695, 0.680 },
            { 0.092, 0.090, 0.080, 0.079, 0.080, 0.098, 0.137, 0.160, 0.286, 0.456, 0.600, 0.690, 0.707, 0.700, 0.695 }
        },
        [10] = new double[,]
        {
            { 0.195, 0.181, 0.184, 0.190, 0.200, 0.227, 0.256, 0.290, 0.380, 0.585, 0.760, 0.800, 0.834, 0.840, 0.827 },
            { 0.160, 0.156, 0.155, 0.156, 0.162, 0.184, 0.212, 0.240, 0.332, 0.572, 0.812, 0.800, 0.820, 0.820, 0.815 },
            { 0.123, 0.120, 0.120, 0.123, 0.134, 0.151, 0.167, 0.195, 0.240, 0.426, 0.760, 0.800, 0.806, 0.807, 0.808 },
            { 0.100, 0.097, 0.097, 0.100, 0.106, 0.128, 0.160, 0.195, 0.254, 0.407, 0.605, 0.735, 0.804, 0.805, 0.809 },
            { 0.085, 0.084, 0.084, 0.085, 0.086, 0.114, 0.160, 0.212, 0.332, 0.520, 0.600, 0.760, 0.825, 0.840, 0.825 }
        },
        [16] = new double[,]
        {
            { 0.179, 0.174, 0.176, 0.185, 0.196, 0.224, 0.270, 0.306, 0.378, 0.600, 0.840, 0.880, 0.880, 0.880, 0.880 },
            { 0.148, 0.146, 0.147, 0.147, 0.151, 0.179, 0.233, 0.275, 0.340, 0.600, 0.840, 0.905, 0.877, 0.876, 0.876 },
            { 0.118, 0.120, 0.120, 0.120, 0.120, 0.140, 0.176, 0.208, 0.280, 0.520, 0.760, 0.868, 0.868, 0.868, 0.868 },
            { 0.102, 0.098, 0.095, 0.094, 0.095, 0.118, 0.160, 0.191, 0.264, 0.480, 0.700, 0.778, 0.847, 0.868, 0.869 },
            { 0.094, 0.085, 0.084, 0.085, 0.094, 0.118, 0.160, 0.212, 0.342, 0.560, 0.720, 0.790, 0.853, 0.874, 0.886 }
        }
    };
    private static readonly double[] DiffuserDiagram54Alphas = [4, 6, 8, 10, 12, 14, 16, 20, 30, 45, 60, 90, 120, 180];
    private static readonly double[] DiffuserDiagram54Ratios = [2, 4, 6, 10];
    private static readonly double[] DiffuserDiagram54ReScales = [0.5, 1, 2, 4];
    private static readonly IReadOnlyDictionary<double, IReadOnlyDictionary<double, double[,]>> DiffuserDiagram54Values =
        new Dictionary<double, IReadOnlyDictionary<double, double[,]>>
        {
            [0] = new Dictionary<double, double[,]>
            {
                [2] = new double[,]
                {
                    { 0.140, 0.136, 0.135, 0.152, 0.175, 0.200, 0.235, 0.250, 0.300, 0.325, 0.326, 0.325, 0.320, 0.300 },
                    { 0.110, 0.110, 0.105, 0.130, 0.160, 0.185, 0.200, 0.230, 0.270, 0.300, 0.315, 0.310, 0.310, 0.300 },
                    { 0.095, 0.090, 0.095, 0.116, 0.150, 0.175, 0.180, 0.216, 0.250, 0.285, 0.310, 0.315, 0.325, 0.300 },
                    { 0.085, 0.085, 0.090, 0.112, 0.145, 0.175, 0.185, 0.220, 0.250, 0.285, 0.310, 0.315, 0.325, 0.310 }
                },
                [4] = new double[,]
                {
                    { 0.170, 0.185, 0.200, 0.245, 0.300, 0.335, 0.380, 0.450, 0.520, 0.580, 0.620, 0.640, 0.640, 0.640 },
                    { 0.145, 0.155, 0.180, 0.225, 0.280, 0.335, 0.360, 0.430, 0.500, 0.560, 0.605, 0.630, 0.630, 0.625 },
                    { 0.115, 0.135, 0.150, 0.200, 0.260, 0.335, 0.360, 0.430, 0.500, 0.560, 0.605, 0.630, 0.630, 0.625 },
                    { 0.106, 0.118, 0.130, 0.195, 0.260, 0.335, 0.360, 0.430, 0.500, 0.560, 0.605, 0.630, 0.630, 0.625 }
                },
                [6] = new double[,]
                {
                    { 0.185, 0.190, 0.205, 0.295, 0.370, 0.420, 0.460, 0.525, 0.625, 0.715, 0.775, 0.790, 0.790, 0.785 },
                    { 0.155, 0.165, 0.185, 0.250, 0.320, 0.380, 0.420, 0.485, 0.600, 0.695, 0.750, 0.775, 0.770, 0.760 },
                    { 0.130, 0.140, 0.165, 0.235, 0.320, 0.360, 0.420, 0.465, 0.580, 0.675, 0.720, 0.760, 0.760, 0.750 },
                    { 0.120, 0.125, 0.145, 0.230, 0.300, 0.360, 0.400, 0.465, 0.580, 0.675, 0.720, 0.760, 0.760, 0.750 }
                },
                [10] = new double[,]
                {
                    { 0.180, 0.195, 0.240, 0.300, 0.375, 0.430, 0.470, 0.530, 0.635, 0.750, 0.840, 0.890, 0.890, 0.880 },
                    { 0.160, 0.175, 0.205, 0.265, 0.340, 0.400, 0.440, 0.550, 0.615, 0.725, 0.815, 0.880, 0.880, 0.865 },
                    { 0.130, 0.155, 0.180, 0.240, 0.320, 0.370, 0.420, 0.490, 0.590, 0.700, 0.795, 0.870, 0.850, 0.860 },
                    { 0.120, 0.135, 0.160, 0.235, 0.320, 0.370, 0.420, 0.490, 0.590, 0.700, 0.795, 0.870, 0.850, 0.860 }
                }
            },
            [10] = new Dictionary<double, double[,]>
            {
                [2] = new double[,]
                {
                    { 0.200, 0.240, 0.280, 0.280, 0.298, 0.305, 0.315, 0.325, 0.340, 0.355, 0.355, 0.350, 0.340, 0.310 },
                    { 0.175, 0.200, 0.215, 0.235, 0.250, 0.260, 0.275, 0.290, 0.310, 0.330, 0.340, 0.340, 0.320, 0.310 },
                    { 0.140, 0.160, 0.180, 0.195, 0.210, 0.225, 0.240, 0.260, 0.280, 0.310, 0.320, 0.335, 0.320, 0.310 },
                    { 0.105, 0.125, 0.140, 0.160, 0.200, 0.195, 0.210, 0.235, 0.265, 0.300, 0.320, 0.335, 0.320, 0.310 }
                },
                [4] = new double[,]
                {
                    { 0.260, 0.320, 0.360, 0.400, 0.430, 0.455, 0.480, 0.510, 0.565, 0.610, 0.635, 0.655, 0.650, 0.640 },
                    { 0.220, 0.270, 0.320, 0.365, 0.400, 0.435, 0.460, 0.495, 0.550, 0.600, 0.630, 0.650, 0.650, 0.640 },
                    { 0.180, 0.230, 0.275, 0.320, 0.365, 0.400, 0.430, 0.470, 0.530, 0.590, 0.620, 0.650, 0.650, 0.640 },
                    { 0.130, 0.180, 0.220, 0.270, 0.320, 0.350, 0.380, 0.430, 0.500, 0.580, 0.620, 0.650, 0.650, 0.640 }
                },
                [6] = new double[,]
                {
                    { 0.310, 0.360, 0.400, 0.450, 0.490, 0.530, 0.560, 0.615, 0.685, 0.750, 0.775, 0.795, 0.785, 0.760 },
                    { 0.250, 0.305, 0.375, 0.405, 0.455, 0.500, 0.530, 0.580, 0.650, 0.720, 0.775, 0.780, 0.775, 0.760 },
                    { 0.190, 0.265, 0.305, 0.370, 0.420, 0.460, 0.495, 0.545, 0.635, 0.710, 0.745, 0.775, 0.775, 0.760 },
                    { 0.140, 0.205, 0.255, 0.320, 0.380, 0.425, 0.460, 0.520, 0.615, 0.695, 0.740, 0.770, 0.775, 0.760 }
                },
                [10] = new double[,]
                {
                    { 0.300, 0.360, 0.415, 0.470, 0.520, 0.570, 0.600, 0.670, 0.760, 0.850, 0.900, 0.960, 0.920, 0.880 },
                    { 0.240, 0.315, 0.370, 0.455, 0.490, 0.540, 0.580, 0.640, 0.730, 0.830, 0.880, 0.940, 0.910, 0.880 },
                    { 0.185, 0.265, 0.325, 0.400, 0.460, 0.515, 0.550, 0.610, 0.715, 0.810, 0.860, 0.930, 0.910, 0.880 },
                    { 0.130, 0.200, 0.270, 0.345, 0.400, 0.460, 0.500, 0.570, 0.680, 0.790, 0.855, 0.930, 0.910, 0.880 }
                }
            }
        };
    private static readonly double[] ContractionDiagram523Alphas = [3, 5, 10, 15, 40, 50, 60, 76, 90, 105, 120, 150, 180];
    private static readonly double[] ContractionDiagram523AreaRatios = [0.10, 0.16, 0.25, 0.39, 0.45, 0.64];
    private static readonly double[,] ContractionDiagram523Values =
    {
        { 0.118, 0.093, 0.053, 0.050, 0.050, 0.079, 0.079, 0.142, 0.190, 0.237, 0.285, 0.367, 0.427 },
        { 0.108, 0.084, 0.048, 0.044, 0.044, 0.074, 0.074, 0.136, 0.184, 0.232, 0.278, 0.362, 0.420 },
        { 0.100, 0.071, 0.047, 0.044, 0.044, 0.068, 0.068, 0.127, 0.174, 0.220, 0.268, 0.352, 0.408 },
        { 0.098, 0.070, 0.051, 0.046, 0.046, 0.064, 0.064, 0.110, 0.162, 0.210, 0.250, 0.319, 0.364 },
        { 0.076, 0.064, 0.052, 0.050, 0.050, 0.072, 0.072, 0.104, 0.138, 0.170, 0.202, 0.246, 0.255 },
        { 0.072, 0.067, 0.054, 0.040, 0.040, 0.058, 0.058, 0.076, 0.094, 0.112, 0.131, 0.167, 0.190 }
    };
    private static readonly double[] BendDiagram61Angles = [0, 20, 30, 45, 60, 75, 90, 110, 130, 150, 180];
    private static readonly double[] BendDiagram61A1Values = [0, 0.31, 0.45, 0.60, 0.78, 0.90, 1.00, 1.13, 1.20, 1.28, 1.40];
    private static readonly double[] BendDiagram61RadiusRatios = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.25, 1.5, 2, 4, 6, 8, 10, 20, 30, 40];
    private static readonly double[] BendDiagram61B1Values = [1.18, 0.77, 0.51, 0.37, 0.28, 0.21, 0.19, 0.17, 0.15, 0.11, 0.09, 0.07, 0.07, 0.05, 0.04, 0.03];
    private static readonly double[] BendDiagram61AspectRatios = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 7, 8];
    private static readonly double[] BendDiagram61C1Values = [1.30, 1.17, 1.09, 1.00, 0.90, 0.85, 0.85, 0.90, 0.95, 0.98, 1.00, 1.00];
    private static readonly double[] BendDiagram61KReScales = [0.1, 0.14, 0.2, 0.3, 0.4, 0.6, 0.8, 1, 1.4, 2, 3, 4];
    private static readonly double[,] BendDiagram61KReValues =
    {
        { 1.40, 1.33, 1.26, 1.19, 1.14, 1.09, 1.06, 1.04, 1.00, 1.00, 1.00, 1.00 },
        { 1.67, 1.58, 1.49, 1.40, 1.34, 1.26, 1.21, 1.19, 1.17, 1.14, 1.06, 1.00 },
        { 2.00, 1.89, 1.77, 1.64, 1.56, 1.46, 1.38, 1.30, 1.15, 1.02, 1.00, 1.00 }
    };
    private static readonly double[] TransitionContractionDiagram527ReScales = [1, 2, 4, 6, 8, 10, 20, 40, 50];
    private static readonly double[] TransitionContractionDiagram527DeltaValues = [0.272, 0.245, 0.201, 0.165, 0.135, 0.111, 0.041, 0.005, 0.002];
    private static readonly double[] TransitionContractionDiagram527LengthRatios = [1, 1.5, 2, 2.5, 3, 4, 5];
    private static readonly double[] TransitionContractionDiagram527C1Values = [0.002, 0.002, 0.002, 0.002, 0.0015, 0.001, 0];

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
                AddLocalResistanceReynoldsNotice(section, kind, reynolds, title, notices);

                var lambda = CalculateLambda(reynolds, hydraulicDiameter, roughnessResolution.Value);
                var dynamicPressure = gasDensity * Math.Pow(flowVelocity, 2) / 2.0;
                var usesBendDiagram = UsesBendDiagram61(section, kind);
                var usesRoundContractionDiagram = UsesRoundContractionDiagram523(section, kind, shape, outletShape);
                var usesTransitionContractionDiagram = UsesTransitionContractionDiagram527(section, kind, shape, outletShape);
                var usesDiffuserDiagram =
                    UsesRoundDiffuserDiagram52(section, kind, shape, outletShape) ||
                    UsesRectangularDiffuserDiagram54(section, kind, shape, outletShape) ||
                    UsesTransitionDiffuserDiagram528(section, kind, shape, outletShape);
                var frictionLoss = length > 0
                    && !usesBendDiagram
                    && !usesDiffuserDiagram
                    && !usesRoundContractionDiagram
                    && !usesTransitionContractionDiagram
                    ? lambda * length / frictionDiameter * dynamicPressure
                    : 0;
                var usesOutletReferenceVelocity = usesRoundContractionDiagram || usesTransitionContractionDiagram;
                var resistanceVelocity = usesOutletReferenceVelocity
                    ? CalculateVelocity(model.GasFlow, outletGeometry.Area)
                    : flowVelocity;
                var resistanceHydraulicDiameter = usesOutletReferenceVelocity
                    ? outletGeometry.EquivalentDiameter
                    : hydraulicDiameter;
                var resistanceReynolds = usesOutletReferenceVelocity
                    ? resistanceVelocity * resistanceHydraulicDiameter / viscosityResolution.Value
                    : reynolds;
                var localDynamicPressure = usesOutletReferenceVelocity
                    ? gasDensity * Math.Pow(resistanceVelocity, 2) / 2.0
                    : dynamicPressure;

                var zetaResolution = ResolveLocalResistanceCoefficient(
                    section,
                    kind,
                    inletGeometry.Area,
                    outletGeometry.Area,
                    shape != outletShape,
                    localResistanceCatalog,
                    resistanceVelocity,
                    resistanceReynolds,
                    roughnessResolution.Value);
                if (!zetaResolution.Success)
                {
                    return Fail($"{title}: {zetaResolution.ErrorMessage}");
                }

                if (zetaResolution.Notice is not null)
                {
                    notices.Add($"{title}: {zetaResolution.Notice}");
                }

                var localLoss = zetaResolution.Value * localDynamicPressure;
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

    private static double CalculateSmoothLambda(double reynolds)
    {
        if (reynolds <= 0)
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

        return 0.3164 / Math.Pow(reynolds, 0.25);
    }

    private static ResolutionResult ResolveLocalResistanceCoefficient(
        SectionInput section,
        string kind,
        double inletArea,
        double outletArea,
        bool isShapeTransition,
        IReadOnlyDictionary<string, LRC> localResistanceCatalog,
        double flowVelocity,
        double reynolds,
        double roughness)
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
            SectionKinds.Bend => ResolveBendDiagram61Coefficient(section, inletArea, reynolds, roughness),
            SectionKinds.Contraction => ResolveContractionCoefficient(section, inletArea, outletArea, isShapeTransition, reynolds, roughness),
            SectionKinds.Expansion => ResolveExpansionCoefficient(section, inletArea, outletArea, isShapeTransition, reynolds),
            SectionKinds.LocalResistance => ResolveCatalogCoefficient(section, localResistanceCatalog, flowVelocity),
            _ => ResolutionResult.Ok(0)
        };
    }

    private static bool UsesBendDiagram61(SectionInput section, string kind) =>
        kind == SectionKinds.Bend && !section.UseCustomLRC;

    private static ResolutionResult ResolveBendDiagram61Coefficient(
        SectionInput section,
        double inletArea,
        double reynolds,
        double roughness)
    {
        if (!section.TurnAngle.HasValue)
        {
            return ResolutionResult.Fail("не указан угол поворота");
        }

        var angle = section.TurnAngle.Value;
        var radius = section.LocalResistanceParamX ?? 0;
        var shape = SectionShapeKinds.Normalize(section.CrossSectionShape);
        var sizeA = section.Diameter ?? 0;
        var sizeB = shape == SectionShapeKinds.Rectangle ? section.DiameterB ?? 0 : 0;
        var hydraulicDiameter = shape == SectionShapeKinds.Rectangle && sizeA > 0 && sizeB > 0
            ? 2 * sizeA * sizeB / (sizeA + sizeB)
            : sizeA;
        var referenceSize = shape == SectionShapeKinds.Rectangle ? sizeB : sizeA;

        if (angle <= 0 || angle > 180)
        {
            return ResolutionResult.Fail("для расчета поворота по диаграмме 6-1 укажите угол δ в пределах 0...180°");
        }

        if (radius <= 0 || referenceSize <= 0 || hydraulicDiameter <= 0 || inletArea <= 0)
        {
            return ResolutionResult.Fail("для расчета поворота по диаграмме 6-1 укажите радиус отвода R0 и размеры входного сечения");
        }

        if (reynolds <= 0)
        {
            return ResolutionResult.Fail("для расчета поворота по диаграмме 6-1 не удалось определить число Рейнольдса");
        }

        var radiusRatio = radius / referenceSize;
        var aspectRatio = shape == SectionShapeKinds.Rectangle ? sizeA / sizeB : 1.0;
        var lambda = CalculateLambda(reynolds, hydraulicDiameter, roughness);
        var lambdaSmooth = CalculateSmoothLambda(reynolds);
        var relativeRoughness = roughness / hydraulicDiameter;
        var notices = new List<string>
        {
            "диаграмма 6-1 применена для отвода; коэффициент ζ включает местную составляющую и трение в отводе, поэтому отдельная потеря на трение по длине блока не добавлялась",
            "условие справочника l0/Dг >= 10 должно обеспечиваться прямым участком перед отводом"
        };

        if (reynolds < 3000)
        {
            notices.Add($"Re = {reynolds:F0} ниже нижней расчетной области диаграммы 6-1; результат следует считать ориентировочным");
        }

        if (radiusRatio >= 3)
        {
            notices.Add($"{(shape == SectionShapeKinds.Rectangle ? "R0/b0" : "R0/D0")} = {radiusRatio:F3} выше основного условия заголовка диаграммы 6-1 (< 3); расчет следует считать справочным");
        }

        var effectiveAngle = ClampDiagramParameter(angle, BendDiagram61Angles.First(), BendDiagram61Angles.Last(), "δ", "F1", "°", notices, "6-1");
        var effectiveRadiusRatio = ClampDiagramParameter(radiusRatio, BendDiagram61RadiusRatios.First(), BendDiagram61RadiusRatios.Last(), shape == SectionShapeKinds.Rectangle ? "R0/b0" : "R0/D0", "F3", string.Empty, notices, "6-1");
        var effectiveAspectRatio = shape == SectionShapeKinds.Rectangle
            ? ClampDiagramParameter(aspectRatio, BendDiagram61AspectRatios.First(), BendDiagram61AspectRatios.Last(), "a0/b0", "F3", string.Empty, notices, "6-1")
            : 1.0;
        var reScale = reynolds / 100000.0;
        var effectiveReScale = ClampDiagramParameter(reScale, BendDiagram61KReScales.First(), BendDiagram61KReScales.Last(), "Re·10^-5", "F3", string.Empty, notices, "6-1");
        var a1 = InterpolateBendDiagram61A1(effectiveAngle);
        var b1 = InterpolateBendDiagram61B1(effectiveRadiusRatio);
        var c1 = shape == SectionShapeKinds.Rectangle ? InterpolateBendDiagram61C1(effectiveAspectRatio) : 1.0;
        var zetaLocal = a1 * b1 * c1;
        var zetaFriction = 0.0175 * angle * lambda * radiusRatio;
        double zeta;

        if (relativeRoughness > 0 && reynolds >= 10000)
        {
            var kDelta = CalculateBendDiagram61KDelta(relativeRoughness, reynolds, effectiveRadiusRatio, lambda, lambdaSmooth);
            var kRe = InterpolateBendDiagram61KRe(effectiveReScale, effectiveRadiusRatio);
            zeta = kDelta * kRe * zetaLocal + zetaFriction;
        }
        else if (reynolds > 3000 && reynolds < 10000)
        {
            zeta = CalculateBendDiagram61A2(effectiveRadiusRatio) / reynolds + zetaLocal + zetaFriction;
        }
        else
        {
            zeta = zetaLocal + zetaFriction;
        }

        return ResolutionResult.Ok(zeta, string.Join("; ", notices));
    }

    private static ResolutionResult ResolveContractionCoefficient(
        SectionInput section,
        double inletArea,
        double outletArea,
        bool isShapeTransition,
        double reynolds,
        double roughness)
    {
        var inletShape = SectionShapeKinds.Normalize(section.CrossSectionShape);
        var outletShape = SectionShapeKinds.Normalize(section.OutletCrossSectionShape ?? section.CrossSectionShape);
        var usesRoundContraction = UsesRoundContractionDiagram523(section, SectionKinds.Contraction, inletShape, outletShape);

        if (usesRoundContraction)
        {
            return ResolveRoundContractionDiagram523Coefficient(section, inletArea, outletArea, reynolds);
        }

        if (UsesTransitionContractionDiagram527(section, SectionKinds.Contraction, inletShape, outletShape))
        {
            return ResolveTransitionContractionDiagram527Coefficient(section, inletArea, outletArea, reynolds, roughness);
        }

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

    private static ResolutionResult ResolveExpansionCoefficient(
        SectionInput section,
        double inletArea,
        double outletArea,
        bool isShapeTransition,
        double reynolds)
    {
        var inletShape = SectionShapeKinds.Normalize(section.CrossSectionShape);
        var outletShape = SectionShapeKinds.Normalize(section.OutletCrossSectionShape ?? section.CrossSectionShape);
        var usesTransitionDiffuser = UsesTransitionDiffuserDiagram528(section, SectionKinds.Expansion, inletShape, outletShape);

        if (outletArea <= inletArea && usesTransitionDiffuser)
        {
            return ResolutionResult.Fail("для расчета переходного диффузора по диаграмме 5-28 выходная площадь F1 должна быть больше входной F0");
        }

        if (outletArea <= inletArea && !isShapeTransition)
        {
            return ResolutionResult.Fail("для расширения выходное сечение должно быть больше входного");
        }

        if (outletArea <= inletArea && isShapeTransition)
        {
            return ResolutionResult.Ok(0.18);
        }

        if (UsesRoundDiffuserDiagram52(
                section,
                SectionKinds.Expansion,
                inletShape,
                outletShape))
        {
            return ResolveRoundDiffuserDiagram52Coefficient(section, inletArea, outletArea, reynolds);
        }

        if (UsesRectangularDiffuserDiagram54(
                section,
                SectionKinds.Expansion,
                inletShape,
                outletShape))
        {
            return ResolveRectangularDiffuserDiagram54Coefficient(section, inletArea, outletArea, reynolds);
        }

        if (usesTransitionDiffuser)
        {
            return ResolveTransitionDiffuserDiagram528Coefficient(section, inletArea, outletArea, inletShape, outletShape, reynolds);
        }

        var areaRatio = inletArea / outletArea;
        var zeta = Math.Pow(1 - areaRatio, 2);
        return ResolutionResult.Ok(zeta);
    }

    private static bool UsesRoundContractionDiagram523(SectionInput section, string kind, string inletShape, string outletShape) =>
        kind == SectionKinds.Contraction &&
        !section.UseCustomLRC &&
        SectionShapeKinds.Normalize(inletShape) == SectionShapeKinds.Round &&
        SectionShapeKinds.Normalize(outletShape) == SectionShapeKinds.Round;

    private static bool UsesTransitionContractionDiagram527(SectionInput section, string kind, string inletShape, string outletShape) =>
        kind == SectionKinds.Contraction &&
        !section.UseCustomLRC &&
        SectionShapeKinds.Normalize(inletShape) == SectionShapeKinds.Rectangle &&
        SectionShapeKinds.Normalize(outletShape) == SectionShapeKinds.Round;

    private static bool UsesRoundDiffuserDiagram52(SectionInput section, string kind, string inletShape, string outletShape) =>
        kind == SectionKinds.Expansion &&
        !section.UseCustomLRC &&
        SectionShapeKinds.Normalize(inletShape) == SectionShapeKinds.Round &&
        SectionShapeKinds.Normalize(outletShape) == SectionShapeKinds.Round;

    private static bool UsesRectangularDiffuserDiagram54(SectionInput section, string kind, string inletShape, string outletShape) =>
        kind == SectionKinds.Expansion &&
        !section.UseCustomLRC &&
        SectionShapeKinds.Normalize(inletShape) == SectionShapeKinds.Rectangle &&
        SectionShapeKinds.Normalize(outletShape) == SectionShapeKinds.Rectangle;

    private static bool UsesTransitionDiffuserDiagram528(SectionInput section, string kind, string inletShape, string outletShape)
    {
        if (kind != SectionKinds.Expansion || section.UseCustomLRC)
        {
            return false;
        }

        var normalizedInlet = SectionShapeKinds.Normalize(inletShape);
        var normalizedOutlet = SectionShapeKinds.Normalize(outletShape);
        return (normalizedInlet == SectionShapeKinds.Round && normalizedOutlet == SectionShapeKinds.Rectangle) ||
               (normalizedInlet == SectionShapeKinds.Rectangle && normalizedOutlet == SectionShapeKinds.Round);
    }

    private static ResolutionResult ResolveRoundContractionDiagram523Coefficient(
        SectionInput section,
        double inletArea,
        double outletArea,
        double reynolds)
    {
        var inletDiameter = section.Diameter ?? 0;
        var outletDiameter = section.OutletDiameter ?? 0;
        var length = section.Length ?? 0;

        if (inletDiameter <= 0 || outletDiameter <= 0 || outletArea >= inletArea)
        {
            return ResolutionResult.Fail("для расчета круглого сужения по диаграмме 5-23 укажите D1 и D0, причем D0 должен быть меньше D1");
        }

        if (length <= 0)
        {
            return ResolutionResult.Fail("для расчета круглого сужения по диаграмме 5-23 укажите длину конфузора l0");
        }

        var areaRatio = outletArea / inletArea;
        var alpha = 2.0 * Math.Atan((inletDiameter - outletDiameter) / (2.0 * length)) * 180.0 / Math.PI;
        var notices = new List<string>
        {
            "диаграмма 5-23 применена для круглого конфузора (схема а, прямолинейные образующие); коэффициент ζ задан относительно динамического давления в выходном сечении w0, поэтому локальная потеря рассчитана по выходной скорости; отдельная потеря на трение по длине сужения не добавлялась"
        };

        if (reynolds > 0 && reynolds < 100000)
        {
            notices.Add($"Re = {reynolds:F0} ниже области применения диаграммы 5-23 (Re >= 10^5); результат следует считать ориентировочным");
        }

        var effectiveAlpha = ClampDiagramParameter(alpha, ContractionDiagram523Alphas.First(), ContractionDiagram523Alphas.Last(), "α", "F1", "°", notices, "5-23");
        var effectiveAreaRatio = ClampDiagramParameter(areaRatio, ContractionDiagram523AreaRatios.First(), ContractionDiagram523AreaRatios.Last(), "n0", "F3", string.Empty, notices, "5-23");
        var zeta = InterpolateContractionDiagram523(effectiveAreaRatio, effectiveAlpha);

        return ResolutionResult.Ok(zeta, string.Join("; ", notices));
    }

    private static ResolutionResult ResolveTransitionContractionDiagram527Coefficient(
        SectionInput section,
        double inletArea,
        double outletArea,
        double reynolds,
        double roughness)
    {
        var inletA = section.Diameter ?? 0;
        var inletB = section.DiameterB ?? 0;
        var outletDiameter = section.OutletDiameter ?? 0;
        var length = section.Length ?? 0;

        if (inletA <= 0 || inletB <= 0 || outletDiameter <= 0 || outletArea >= inletArea)
        {
            return ResolutionResult.Fail("для расчета перехода прямоугольник → круг по диаграмме 5-27 укажите a1, b1 и D0, причем площадь круглого выхода F0 должна быть меньше входной F1");
        }

        if (length <= 0)
        {
            return ResolutionResult.Fail("для расчета перехода прямоугольник → круг по диаграмме 5-27 укажите длину перехода l");
        }

        if (reynolds <= 0)
        {
            return ResolutionResult.Fail("для расчета перехода прямоугольник → круг по диаграмме 5-27 не удалось определить число Рейнольдса");
        }

        var areaRatio = outletArea / inletArea;
        var lengthRatio = length / outletDiameter;
        var transitionDiameter = inletA * inletB / (inletA + inletB) + 0.5 * outletDiameter;
        var transitionReynolds = reynolds * transitionDiameter / outletDiameter;
        var lambda = CalculateLambda(transitionReynolds, transitionDiameter, roughness);
        var c0 = lambda * length / transitionDiameter;
        var aspectRatio = Math.Max(inletA, inletB) / Math.Min(inletA, inletB);
        var reScale = reynolds / 10000.0;
        var notices = new List<string>
        {
            "диаграмма 5-27 применена для конфузорного перехода прямоугольник → круг; коэффициент ζк задан относительно динамического давления в круглом выходном сечении w0, поэтому локальная потеря рассчитана по выходной скорости; отдельная потеря на трение по длине перехода не добавлялась"
        };

        if (reynolds < 10000)
        {
            notices.Add($"Re = {reynolds:F0} ниже области применения диаграммы 5-27 (Re > 10^4); результат следует считать ориентировочным");
        }

        var effectiveReScale = ClampDiagramParameter(reScale, TransitionContractionDiagram527ReScales.First(), TransitionContractionDiagram527ReScales.Last(), "Re·10^-4", "F3", string.Empty, notices, "5-27");
        var effectiveLengthRatio = ClampDiagramParameter(lengthRatio, TransitionContractionDiagram527LengthRatios.First(), TransitionContractionDiagram527LengthRatios.Last(), "l/D0", "F3", string.Empty, notices, "5-27");
        var deltaZeta = InterpolateTransitionContractionDiagram527Delta(effectiveReScale);
        var c1 = InterpolateTransitionContractionDiagram527C1(effectiveLengthRatio);
        var zetaEquivalent = (c0 + c1 * aspectRatio) * Math.Pow(areaRatio, 2);
        var zeta = zetaEquivalent + deltaZeta;

        return ResolutionResult.Ok(zeta, string.Join("; ", notices));
    }

    private static ResolutionResult ResolveRoundDiffuserDiagram52Coefficient(
        SectionInput section,
        double inletArea,
        double outletArea,
        double reynolds)
    {
        var inletDiameter = section.Diameter ?? 0;
        var outletDiameter = section.OutletDiameter ?? 0;
        var length = section.Length ?? 0;

        if (inletDiameter <= 0 || outletDiameter <= 0 || outletArea <= inletArea)
        {
            return ResolutionResult.Fail("для расчета диффузора по диаграмме 5-2 укажите D0 и D1, причем D1 должен быть больше D0");
        }

        if (length <= 0)
        {
            return ResolutionResult.Fail("для расчета диффузора по диаграмме 5-2 укажите длину диффузора");
        }

        if (reynolds <= 0)
        {
            return ResolutionResult.Fail("для расчета диффузора по диаграмме 5-2 не удалось определить число Рейнольдса");
        }

        var expansionRatio = outletArea / inletArea;
        var alpha = 2.0 * Math.Atan((outletDiameter - inletDiameter) / (2.0 * length)) * 180.0 / Math.PI;
        var reScale = reynolds / 100000.0;
        var notices = new List<string>
        {
            "диаграмма 5-2 применена для круглого диффузора; коэффициент ζд уже учитывает сопротивление диффузора, поэтому отдельная потеря на трение по его длине не добавлялась"
        };

        var effectiveAlpha = ClampDiagramParameter(alpha, DiffuserDiagram52Alphas.First(), DiffuserDiagram52Alphas.Last(), "α", "F1", "°", notices);
        var effectiveRatio = ClampDiagramParameter(expansionRatio, DiffuserDiagram52Ratios.First(), DiffuserDiagram52Ratios.Last(), "nп1", "F2", string.Empty, notices);
        var effectiveReScale = ClampDiagramParameter(reScale, DiffuserDiagram52ReScales.First(), DiffuserDiagram52ReScales.Last(), "Re·10^-5", "F2", string.Empty, notices);
        var zeta = InterpolateDiffuserDiagram52(effectiveRatio, effectiveReScale, effectiveAlpha);

        return ResolutionResult.Ok(zeta, string.Join("; ", notices));
    }

    private static ResolutionResult ResolveRectangularDiffuserDiagram54Coefficient(
        SectionInput section,
        double inletArea,
        double outletArea,
        double reynolds)
    {
        var inletA = section.Diameter ?? 0;
        var inletB = section.DiameterB ?? 0;
        var outletA = section.OutletDiameter ?? 0;
        var outletB = section.OutletDiameterB ?? 0;
        var length = section.Length ?? 0;

        if (inletA <= 0 || inletB <= 0 || outletA <= 0 || outletB <= 0 || outletArea <= inletArea)
        {
            return ResolutionResult.Fail("для расчета прямоугольного диффузора по диаграмме 5-4 укажите a0, b0, a1 и b1, причем выходная площадь должна быть больше входной");
        }

        if (outletA < inletA || outletB < inletB)
        {
            return ResolutionResult.Fail("диаграмма 5-4 применяется для прямоугольного диффузора: выходные стороны a1 и b1 не должны быть меньше входных a0 и b0");
        }

        if (length <= 0)
        {
            return ResolutionResult.Fail("для расчета прямоугольного диффузора по диаграмме 5-4 укажите длину диффузора");
        }

        if (reynolds <= 0)
        {
            return ResolutionResult.Fail("для расчета прямоугольного диффузора по диаграмме 5-4 не удалось определить число Рейнольдса");
        }

        var alphaA = 2.0 * Math.Atan((outletA - inletA) / (2.0 * length)) * 180.0 / Math.PI;
        var alphaB = 2.0 * Math.Atan((outletB - inletB) / (2.0 * length)) * 180.0 / Math.PI;
        var alpha = Math.Max(alphaA, alphaB);
        var expansionRatio = outletArea / inletArea;
        var reScale = reynolds / 100000.0;
        var profile = GetRectangularDiffuserProfile(section);
        var profileText = profile >= 10 ? "l0/Dг >= 10" : "l0/Dг = 0";
        var notices = new List<string>
        {
            $"диаграмма 5-4 применена для прямоугольного диффузора ({profileText}); коэффициент ζд уже учитывает сопротивление диффузора, поэтому отдельная потеря на трение по его длине не добавлялась"
        };

        var effectiveAlpha = ClampDiagramParameter(alpha, DiffuserDiagram54Alphas.First(), DiffuserDiagram54Alphas.Last(), "α", "F1", "°", notices, "5-4");
        var effectiveRatio = ClampDiagramParameter(expansionRatio, DiffuserDiagram54Ratios.First(), DiffuserDiagram54Ratios.Last(), "nп1", "F2", string.Empty, notices, "5-4");
        var effectiveReScale = ClampDiagramParameter(reScale, DiffuserDiagram54ReScales.First(), DiffuserDiagram54ReScales.Last(), "Re·10^-5", "F2", string.Empty, notices, "5-4");
        var zeta = InterpolateDiffuserDiagram54(profile, effectiveRatio, effectiveReScale, effectiveAlpha);

        return ResolutionResult.Ok(zeta, string.Join("; ", notices));
    }

    private static ResolutionResult ResolveTransitionDiffuserDiagram528Coefficient(
        SectionInput section,
        double inletArea,
        double outletArea,
        string inletShape,
        string outletShape,
        double reynolds)
    {
        var length = section.Length ?? 0;
        var normalizedInlet = SectionShapeKinds.Normalize(inletShape);
        var normalizedOutlet = SectionShapeKinds.Normalize(outletShape);

        if (length <= 0)
        {
            return ResolutionResult.Fail("для расчета переходного диффузора по диаграмме 5-28 укажите длину диффузора");
        }

        if (reynolds <= 0)
        {
            return ResolutionResult.Fail("для расчета переходного диффузора по диаграмме 5-28 не удалось определить число Рейнольдса");
        }

        double alpha;
        string directionText;
        if (normalizedInlet == SectionShapeKinds.Round && normalizedOutlet == SectionShapeKinds.Rectangle)
        {
            var inletDiameter = section.Diameter ?? 0;
            var outletA = section.OutletDiameter ?? 0;
            var outletB = section.OutletDiameterB ?? 0;
            if (inletDiameter <= 0 || outletA <= 0 || outletB <= 0 || outletArea <= inletArea)
            {
                return ResolutionResult.Fail("для диаграммы 5-28 при переходе с круга на прямоугольник укажите D0, a1 и b1; выходная площадь F1 должна быть больше F0");
            }

            var outletEquivalentAreaDiameter = 2.0 * Math.Sqrt(outletA * outletB / Math.PI);
            if (outletEquivalentAreaDiameter <= inletDiameter)
            {
                return ResolutionResult.Fail("для диаграммы 5-28 при переходе с круга на прямоугольник эквивалентный диаметр выходного прямоугольника должен быть больше D0");
            }

            alpha = 2.0 * Math.Atan((outletEquivalentAreaDiameter - inletDiameter) / (2.0 * length)) * 180.0 / Math.PI;
            directionText = "круг → прямоугольник";
        }
        else if (normalizedInlet == SectionShapeKinds.Rectangle && normalizedOutlet == SectionShapeKinds.Round)
        {
            var inletA = section.Diameter ?? 0;
            var inletB = section.DiameterB ?? 0;
            var outletDiameter = section.OutletDiameter ?? 0;
            if (inletA <= 0 || inletB <= 0 || outletDiameter <= 0 || outletArea <= inletArea)
            {
                return ResolutionResult.Fail("для диаграммы 5-28 при переходе с прямоугольника на круг укажите a0, b0 и D1; выходная площадь F1 должна быть больше F0");
            }

            var inletEquivalentAreaDiameter = 2.0 * Math.Sqrt(inletA * inletB / Math.PI);
            if (outletDiameter <= inletEquivalentAreaDiameter)
            {
                return ResolutionResult.Fail("для диаграммы 5-28 при переходе с прямоугольника на круг D1 должен быть больше эквивалентного диаметра входного прямоугольника");
            }

            alpha = 2.0 * Math.Atan((outletDiameter - inletEquivalentAreaDiameter) / (2.0 * length)) * 180.0 / Math.PI;
            directionText = "прямоугольник → круг";
        }
        else
        {
            return ResolutionResult.Fail("диаграмма 5-28 применяется только для переходов круг ↔ прямоугольник");
        }

        var expansionRatio = outletArea / inletArea;
        var reScale = reynolds / 100000.0;
        var profile = GetRectangularDiffuserProfile(section);
        var profileText = profile >= 10 ? "l0/Dг >= 10" : "l0/Dг = 0";
        var notices = new List<string>
        {
            $"диаграмма 5-28 применена для переходного диффузора ({directionText}); коэффициент ζ определяется по таблицам диаграммы 5-4 с эквивалентным углом α ({profileText}), поэтому отдельная потеря на трение по длине диффузора не добавлялась"
        };

        var effectiveAlpha = ClampDiagramParameter(alpha, DiffuserDiagram54Alphas.First(), DiffuserDiagram54Alphas.Last(), "α", "F1", "°", notices, "5-28");
        var effectiveRatio = ClampDiagramParameter(expansionRatio, DiffuserDiagram54Ratios.First(), DiffuserDiagram54Ratios.Last(), "nп1", "F2", string.Empty, notices, "5-28");
        var effectiveReScale = ClampDiagramParameter(reScale, DiffuserDiagram54ReScales.First(), DiffuserDiagram54ReScales.Last(), "Re·10^-5", "F2", string.Empty, notices, "5-28");
        var zeta = InterpolateDiffuserDiagram54(profile, effectiveRatio, effectiveReScale, effectiveAlpha);

        return ResolutionResult.Ok(zeta, string.Join("; ", notices));
    }

    private static double ClampDiagramParameter(
        double value,
        double min,
        double max,
        string label,
        string format,
        string suffix,
        List<string> notices,
        string diagramNumber = "5-2")
    {
        const double tolerance = 0.000001;
        if (value < min - tolerance)
        {
            notices.Add($"{label} = {value.ToString(format)}{suffix} ниже диапазона диаграммы {diagramNumber}; использовано {label} = {min.ToString(format)}{suffix}");
            return min;
        }

        if (value > max + tolerance)
        {
            notices.Add($"{label} = {value.ToString(format)}{suffix} выше диапазона диаграммы {diagramNumber}; использовано {label} = {max.ToString(format)}{suffix}");
            return max;
        }

        return value;
    }

    private static double InterpolateContractionDiagram523(double areaRatio, double alpha)
    {
        var ratioBounds = FindBounds(ContractionDiagram523AreaRatios, areaRatio);
        var alphaBounds = FindBounds(ContractionDiagram523Alphas, alpha);

        if (!ratioBounds.Success || !alphaBounds.Success)
        {
            return 0.5 * (1 / areaRatio - 1);
        }

        var q11 = GetContractionDiagram523Value(ratioBounds.Lower, alphaBounds.Lower);
        var q21 = GetContractionDiagram523Value(ratioBounds.Upper, alphaBounds.Lower);
        var q12 = GetContractionDiagram523Value(ratioBounds.Lower, alphaBounds.Upper);
        var q22 = GetContractionDiagram523Value(ratioBounds.Upper, alphaBounds.Upper);

        return Interpolate2D(
            areaRatio,
            alpha,
            ratioBounds.Lower,
            ratioBounds.Upper,
            alphaBounds.Lower,
            alphaBounds.Upper,
            q11,
            q21,
            q12,
            q22);
    }

    private static double GetContractionDiagram523Value(double areaRatio, double alpha)
    {
        var ratioIndex = Array.FindIndex(ContractionDiagram523AreaRatios, value => Math.Abs(value - areaRatio) < 0.000001);
        var alphaIndex = Array.FindIndex(ContractionDiagram523Alphas, value => Math.Abs(value - alpha) < 0.000001);
        return ContractionDiagram523Values[ratioIndex, alphaIndex];
    }

    private static double InterpolateBendDiagram61A1(double angle) =>
        InterpolateOneDimensional(BendDiagram61Angles, BendDiagram61A1Values, angle);

    private static double InterpolateBendDiagram61B1(double radiusRatio) =>
        InterpolateOneDimensional(BendDiagram61RadiusRatios, BendDiagram61B1Values, radiusRatio);

    private static double InterpolateBendDiagram61C1(double aspectRatio) =>
        InterpolateOneDimensional(BendDiagram61AspectRatios, BendDiagram61C1Values, aspectRatio);

    private static double InterpolateBendDiagram61KRe(double reScale, double radiusRatio)
    {
        var rowIndex = GetBendDiagram61KReRowIndex(radiusRatio);
        var bounds = FindBounds(BendDiagram61KReScales, reScale);
        if (!bounds.Success)
        {
            return 1;
        }

        var lowerIndex = Array.FindIndex(BendDiagram61KReScales, value => Math.Abs(value - bounds.Lower) < 0.000001);
        var upperIndex = Array.FindIndex(BendDiagram61KReScales, value => Math.Abs(value - bounds.Upper) < 0.000001);
        return LinearInterpolate(
            reScale,
            bounds.Lower,
            bounds.Upper,
            BendDiagram61KReValues[rowIndex, lowerIndex],
            BendDiagram61KReValues[rowIndex, upperIndex]);
    }

    private static double InterpolateOneDimensional(double[] points, double[] values, double value)
    {
        var bounds = FindBounds(points, value);
        if (!bounds.Success)
        {
            return values.Last();
        }

        var lowerIndex = Array.FindIndex(points, point => Math.Abs(point - bounds.Lower) < 0.000001);
        var upperIndex = Array.FindIndex(points, point => Math.Abs(point - bounds.Upper) < 0.000001);
        return LinearInterpolate(value, bounds.Lower, bounds.Upper, values[lowerIndex], values[upperIndex]);
    }

    private static int GetBendDiagram61KReRowIndex(double radiusRatio)
    {
        if (radiusRatio <= 0.55)
        {
            return 0;
        }

        return radiusRatio <= 0.7 ? 1 : 2;
    }

    private static double CalculateBendDiagram61KDelta(
        double relativeRoughness,
        double reynolds,
        double radiusRatio,
        double lambda,
        double lambdaSmooth)
    {
        if (relativeRoughness <= 0)
        {
            return 1;
        }

        if (radiusRatio <= 0.55)
        {
            return reynolds > 40000 && relativeRoughness > 0.001 ? 1.5 : 1;
        }

        if (reynolds <= 40000)
        {
            return 1;
        }

        if (relativeRoughness > 0.001)
        {
            return 2;
        }

        if (reynolds <= 200000)
        {
            return lambdaSmooth > 0 ? lambda / lambdaSmooth : 1;
        }

        return 1 + relativeRoughness * 1000;
    }

    private static double CalculateBendDiagram61A2(double radiusRatio)
    {
        if (radiusRatio <= 0.55)
        {
            return 4000;
        }

        if (radiusRatio <= 0.7)
        {
            return 6000;
        }

        if (radiusRatio <= 1)
        {
            return LinearInterpolate(radiusRatio, 0.7, 1, 4000, 2000);
        }

        return radiusRatio <= 2 ? 1000 : 600;
    }

    private static double InterpolateTransitionContractionDiagram527Delta(double reScale)
    {
        var bounds = FindBounds(TransitionContractionDiagram527ReScales, reScale);
        if (!bounds.Success)
        {
            return 0.3 * Math.Exp(-reScale / 10.0);
        }

        var lowerValue = GetTransitionContractionDiagram527Delta(bounds.Lower);
        var upperValue = GetTransitionContractionDiagram527Delta(bounds.Upper);
        return LinearInterpolate(reScale, bounds.Lower, bounds.Upper, lowerValue, upperValue);
    }

    private static double GetTransitionContractionDiagram527Delta(double reScale)
    {
        var index = Array.FindIndex(TransitionContractionDiagram527ReScales, value => Math.Abs(value - reScale) < 0.000001);
        return TransitionContractionDiagram527DeltaValues[index];
    }

    private static double InterpolateTransitionContractionDiagram527C1(double lengthRatio)
    {
        var bounds = FindBounds(TransitionContractionDiagram527LengthRatios, lengthRatio);
        if (!bounds.Success)
        {
            return 0;
        }

        var lowerValue = GetTransitionContractionDiagram527C1(bounds.Lower);
        var upperValue = GetTransitionContractionDiagram527C1(bounds.Upper);
        return LinearInterpolate(lengthRatio, bounds.Lower, bounds.Upper, lowerValue, upperValue);
    }

    private static double GetTransitionContractionDiagram527C1(double lengthRatio)
    {
        var index = Array.FindIndex(TransitionContractionDiagram527LengthRatios, value => Math.Abs(value - lengthRatio) < 0.000001);
        return TransitionContractionDiagram527C1Values[index];
    }

    private static double InterpolateDiffuserDiagram52(double ratio, double reScale, double alpha)
    {
        var ratioBounds = FindBounds(DiffuserDiagram52Ratios, ratio);
        var reBounds = FindBounds(DiffuserDiagram52ReScales, reScale);
        var alphaBounds = FindBounds(DiffuserDiagram52Alphas, alpha);

        if (!ratioBounds.Success || !reBounds.Success || !alphaBounds.Success)
        {
            return Math.Pow(1 - 1 / ratio, 2);
        }

        var lowerRatioValue = InterpolateDiffuserDiagram52ForRatio(ratioBounds.Lower, reScale, alpha, reBounds, alphaBounds);
        var upperRatioValue = InterpolateDiffuserDiagram52ForRatio(ratioBounds.Upper, reScale, alpha, reBounds, alphaBounds);
        return LinearInterpolate(ratio, ratioBounds.Lower, ratioBounds.Upper, lowerRatioValue, upperRatioValue);
    }

    private static double InterpolateDiffuserDiagram52ForRatio(
        double ratio,
        double reScale,
        double alpha,
        BoundResult reBounds,
        BoundResult alphaBounds)
    {
        var q11 = GetDiffuserDiagram52Value(ratio, reBounds.Lower, alphaBounds.Lower);
        var q21 = GetDiffuserDiagram52Value(ratio, reBounds.Upper, alphaBounds.Lower);
        var q12 = GetDiffuserDiagram52Value(ratio, reBounds.Lower, alphaBounds.Upper);
        var q22 = GetDiffuserDiagram52Value(ratio, reBounds.Upper, alphaBounds.Upper);

        return Interpolate2D(
            reScale,
            alpha,
            reBounds.Lower,
            reBounds.Upper,
            alphaBounds.Lower,
            alphaBounds.Upper,
            q11,
            q21,
            q12,
            q22);
    }

    private static double GetDiffuserDiagram52Value(double ratio, double reScale, double alpha)
    {
        var ratioKey = Math.Abs(ratio - 16) < 0.000001 ? 16 : ratio;
        var values = DiffuserDiagram52Values[ratioKey];
        var reIndex = Array.FindIndex(DiffuserDiagram52ReScales, value => Math.Abs(value - reScale) < 0.000001);
        var alphaIndex = Array.FindIndex(DiffuserDiagram52Alphas, value => Math.Abs(value - alpha) < 0.000001);
        return values[reIndex, alphaIndex];
    }

    private static double GetRectangularDiffuserProfile(SectionInput section) =>
        (section.LocalResistanceParamX ?? 0) >= 10 ? 10 : 0;

    private static double InterpolateDiffuserDiagram54(double profile, double ratio, double reScale, double alpha)
    {
        var ratioBounds = FindBounds(DiffuserDiagram54Ratios, ratio);
        var reBounds = FindBounds(DiffuserDiagram54ReScales, reScale);
        var alphaBounds = FindBounds(DiffuserDiagram54Alphas, alpha);

        if (!ratioBounds.Success || !reBounds.Success || !alphaBounds.Success)
        {
            return Math.Pow(1 - 1 / ratio, 2);
        }

        var lowerRatioValue = InterpolateDiffuserDiagram54ForRatio(profile, ratioBounds.Lower, reScale, alpha, reBounds, alphaBounds);
        var upperRatioValue = InterpolateDiffuserDiagram54ForRatio(profile, ratioBounds.Upper, reScale, alpha, reBounds, alphaBounds);
        return LinearInterpolate(ratio, ratioBounds.Lower, ratioBounds.Upper, lowerRatioValue, upperRatioValue);
    }

    private static double InterpolateDiffuserDiagram54ForRatio(
        double profile,
        double ratio,
        double reScale,
        double alpha,
        BoundResult reBounds,
        BoundResult alphaBounds)
    {
        var q11 = GetDiffuserDiagram54Value(profile, ratio, reBounds.Lower, alphaBounds.Lower);
        var q21 = GetDiffuserDiagram54Value(profile, ratio, reBounds.Upper, alphaBounds.Lower);
        var q12 = GetDiffuserDiagram54Value(profile, ratio, reBounds.Lower, alphaBounds.Upper);
        var q22 = GetDiffuserDiagram54Value(profile, ratio, reBounds.Upper, alphaBounds.Upper);

        return Interpolate2D(
            reScale,
            alpha,
            reBounds.Lower,
            reBounds.Upper,
            alphaBounds.Lower,
            alphaBounds.Upper,
            q11,
            q21,
            q12,
            q22);
    }

    private static double GetDiffuserDiagram54Value(double profile, double ratio, double reScale, double alpha)
    {
        var profileKey = profile >= 10 ? 10 : 0;
        var values = DiffuserDiagram54Values[profileKey][ratio];
        var reIndex = Array.FindIndex(DiffuserDiagram54ReScales, value => Math.Abs(value - reScale) < 0.000001);
        var alphaIndex = Array.FindIndex(DiffuserDiagram54Alphas, value => Math.Abs(value - alpha) < 0.000001);
        return values[reIndex, alphaIndex];
    }

    private static ResolutionResult ResolveCatalogCoefficient(
        SectionInput section,
        IReadOnlyDictionary<string, LRC> localResistanceCatalog,
        double flowVelocity)
    {
        var localResistanceType = section.LocalResistanceType;
        if (string.IsNullOrWhiteSpace(localResistanceType))
        {
            return ResolutionResult.Fail("не выбран тип местного сопротивления");
        }

        if (!localResistanceCatalog.TryGetValue(localResistanceType, out var resistance))
        {
            var normalizedType = NormalizeLocalResistanceCatalogName(localResistanceType);
            if (string.Equals(normalizedType, localResistanceType, StringComparison.Ordinal) ||
                !localResistanceCatalog.TryGetValue(normalizedType, out resistance))
            {
                return ResolutionResult.Fail($"не найден коэффициент для типа \"{localResistanceType}\"");
            }

            localResistanceType = normalizedType;
        }

        if (SectionInput.IsSuddenExpansion(localResistanceType))
        {
            return ResolveSuddenExpansionCoefficient(section, localResistanceType);
        }

        if (!resistance.IsTabular)
        {
            return resistance.ValueofLR.HasValue
                ? ResolutionResult.Ok(resistance.ValueofLR.Value)
                : ResolutionResult.Fail($"для типа \"{localResistanceType}\" не задан коэффициент КМС");
        }

        var isConicalCollector = SectionInput.IsConicalCollector(localResistanceType);
        var isStraightPipeEntrance = SectionInput.IsStraightPipeEntrance(localResistanceType);
        var isFlushWallEntrance = SectionInput.IsFlushWallEntrance(localResistanceType);
        var isPassingFlowEntrance = SectionInput.IsPassingFlowEntrance(localResistanceType);
        var isArcCollectorWithoutScreen = SectionInput.IsArcCollectorWithoutScreen(localResistanceType);
        var isArcCollectorWithScreen = SectionInput.IsArcCollectorWithScreen(localResistanceType);
        var isRostrumCollector = SectionInput.IsRostrumCollector(localResistanceType);
        var isLengthRatioCollector = SectionInput.IsLengthRatioCollector(localResistanceType);
        var paramX = section.LocalResistanceParamX;
        var paramY = section.LocalResistanceParamY;
        if (isLengthRatioCollector)
        {
            if (!section.Length.HasValue || section.Length.Value <= 0 ||
                !section.Diameter.HasValue || section.Diameter.Value <= 0)
            {
                return ResolutionResult.Fail(isConicalCollector
                    ? $"для конического коллектора \"{localResistanceType}\" укажите выходной диаметр d0 и длину раструба"
                    : $"для сопротивления \"{localResistanceType}\" укажите диаметр Dг и длину раструба l");
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

        if (isArcCollectorWithoutScreen)
        {
            if (!section.Diameter.HasValue || section.Diameter.Value <= 0)
            {
                return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" укажите диаметр Dг");
            }

            if (!section.LocalResistanceParamX.HasValue || section.LocalResistanceParamX.Value < 0)
            {
                return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" укажите неотрицательный радиус закругления r");
            }

            paramX = section.LocalResistanceParamX.Value / section.Diameter.Value;
            paramY = 0;
        }

        if (isArcCollectorWithScreen)
        {
            if (!section.Diameter.HasValue || section.Diameter.Value <= 0)
            {
                return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" укажите диаметр Dг");
            }

            if (!section.LocalResistanceParamX.HasValue || !section.LocalResistanceParamY.HasValue)
            {
                return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" укажите расстояние h и радиус r");
            }

            if (section.LocalResistanceParamX.Value < 0 || section.LocalResistanceParamY.Value < 0)
            {
                return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" расстояние h и радиус r не могут быть отрицательными");
            }

            paramX = section.LocalResistanceParamX.Value / section.Diameter.Value;
            paramY = section.LocalResistanceParamY.Value / section.Diameter.Value;
        }

        if (isFlushWallEntrance)
        {
            if (!section.Diameter.HasValue || section.Diameter.Value <= 0)
            {
                return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" укажите характерный размер входного отверстия a");
            }

            if (!section.LocalResistanceParamY.HasValue || section.LocalResistanceParamY.Value < 0)
            {
                return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" укажите длину входного участка l");
            }

            paramY = section.LocalResistanceParamY.Value / section.Diameter.Value;
        }

        if (isPassingFlowEntrance)
        {
            if (flowVelocity <= 0)
            {
                return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" невозможно рассчитать скорость w0: проверьте расход газа и площадь входного сечения");
            }

            if (!section.LocalResistanceParamX.HasValue || section.LocalResistanceParamX.Value < 0)
            {
                return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" укажите неотрицательную скорость проходящего внешнего потока w∞");
            }

            paramX = section.LocalResistanceParamX.Value / flowVelocity;
        }

        if (!paramX.HasValue || !paramY.HasValue)
        {
            return ResolutionResult.Fail(isLengthRatioCollector
                ? isConicalCollector
                    ? $"для конического коллектора \"{localResistanceType}\" укажите угол α, выходной диаметр d0 и длину раструба"
                    : $"для сопротивления \"{localResistanceType}\" укажите угол α, диаметр Dг и длину раструба l"
                : isStraightPipeEntrance
                    ? $"для сопротивления \"{localResistanceType}\" укажите диаметр Dг, размер b и размер δ1"
                    : isArcCollectorWithoutScreen
                        ? $"для сопротивления \"{localResistanceType}\" укажите диаметр Dг и радиус r"
                    : isArcCollectorWithScreen
                        ? $"для сопротивления \"{localResistanceType}\" укажите диаметр Dг, расстояние h и радиус r"
                    : isFlushWallEntrance
                        ? $"для сопротивления \"{localResistanceType}\" укажите угол δ, длину l и характерный размер a"
                        : isPassingFlowEntrance
                            ? $"для сопротивления \"{localResistanceType}\" укажите скорость w∞ и угол δ"
                    : $"для табличного сопротивления \"{localResistanceType}\" укажите угол α и отношение l/d0");
        }

        var paramXLabel = "α";
        var paramYLabel = "l/d0";
        var paramXDigits = 0;
        var paramYDigits = 3;
        if (isStraightPipeEntrance)
        {
            paramXLabel = "b/Dг";
            paramYLabel = "δ1/Dг";
            paramXDigits = 3;
        }
        else if (isFlushWallEntrance)
        {
            paramXLabel = "δ";
            paramYLabel = "l/a";
            paramXDigits = 0;
        }
        else if (isPassingFlowEntrance)
        {
            paramXLabel = "w∞/w0";
            paramYLabel = "δ";
            paramXDigits = 3;
            paramYDigits = 0;
        }
        else if (isArcCollectorWithoutScreen)
        {
            paramXLabel = "r/Dг";
            paramYLabel = "служебный параметр";
            paramXDigits = 3;
            paramYDigits = 0;
        }
        else if (isArcCollectorWithScreen)
        {
            paramXLabel = "h/Dг";
            paramYLabel = "r/Dг";
            paramXDigits = 3;
        }
        else if (isRostrumCollector)
        {
            paramXLabel = "α";
            paramYLabel = "l/Dг";
            paramXDigits = 0;
            paramYDigits = 3;
        }

        return ResolveTabularCoefficient(
            localResistanceType,
            resistance.DataPoints,
            paramX.Value,
            paramY.Value,
            clampHighX: isStraightPipeEntrance || isArcCollectorWithoutScreen,
            clampHighY: isConicalCollector || isStraightPipeEntrance,
            paramXLabel: paramXLabel,
            paramYLabel: paramYLabel,
            paramXDigits: paramXDigits,
            paramYDigits: paramYDigits);
    }

    private static ResolutionResult ResolveSuddenExpansionCoefficient(SectionInput section, string localResistanceType)
    {
        if (!section.Diameter.HasValue || section.Diameter.Value <= 0)
        {
            return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" укажите входной диаметр D0");
        }

        if (!section.LocalResistanceParamX.HasValue || section.LocalResistanceParamX.Value <= 0)
        {
            return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" укажите выходной диаметр D2");
        }

        var inletDiameter = section.Diameter.Value;
        var outletDiameter = section.LocalResistanceParamX.Value;
        if (outletDiameter <= inletDiameter)
        {
            return ResolutionResult.Fail($"для сопротивления \"{localResistanceType}\" выходной диаметр D2 должен быть больше входного D0");
        }

        var inletArea = Math.PI * Math.Pow(inletDiameter, 2) / 4.0;
        var outletArea = Math.PI * Math.Pow(outletDiameter, 2) / 4.0;
        var areaRatio = inletArea / outletArea;
        var zeta = Math.Pow(1 - areaRatio, 2);
        return ResolutionResult.Ok(zeta);
    }

    private static void AddLocalResistanceReynoldsNotice(
        SectionInput section,
        string kind,
        double reynolds,
        string title,
        ICollection<string> notices)
    {
        if (kind != SectionKinds.LocalResistance || section.UseCustomLRC)
        {
            return;
        }

        if (SectionInput.IsStraightPipeEntrance(section.LocalResistanceType) && reynolds <= 10000)
        {
            notices.Add($"{title}: диаграмма 3-1 для входа в прямую трубу применима при Re > 10^4; сейчас Re = {reynolds:F0}. КМС рассчитан по справочной таблице, но результат следует считать ориентировочным.");
            return;
        }

        if (SectionInput.IsSuddenExpansion(section.LocalResistanceType) && reynolds <= 10000)
        {
            notices.Add($"{title}: внезапное расширение по 4-1 применяется при Re > 10^4 и равномерном профиле скорости перед расширением; сейчас Re = {reynolds:F0}. Результат следует считать ориентировочным.");
            return;
        }

        var diagramNumber = GetLocalResistanceDiagramNumber(section.LocalResistanceType);
        if (diagramNumber is >= 2 and <= 7 && reynolds < 10000)
        {
            notices.Add($"{title}: диаграмма 3-{diagramNumber} применима при Re ≥ 10^4; сейчас Re = {reynolds:F0}. КМС рассчитан по справочной таблице, но результат следует считать ориентировочным.");
        }
    }

    private static int? GetLocalResistanceDiagramNumber(string? localResistanceType)
    {
        if (SectionInput.IsFlushWallEntrance(localResistanceType))
        {
            return 2;
        }

        if (SectionInput.IsPassingFlowEntrance(localResistanceType))
        {
            return 3;
        }

        if (SectionInput.IsArcCollectorWithoutScreen(localResistanceType))
        {
            return 4;
        }

        if (SectionInput.IsArcCollectorWithScreen(localResistanceType))
        {
            return 5;
        }

        if (SectionInput.IsRostrumCollector(localResistanceType) &&
            localResistanceType?.Contains("без торцов", StringComparison.OrdinalIgnoreCase) == true)
        {
            return 6;
        }

        if (SectionInput.IsRostrumCollector(localResistanceType) &&
            localResistanceType?.Contains("с торцов", StringComparison.OrdinalIgnoreCase) == true)
        {
            return 7;
        }

        return null;
    }

    private static string NormalizeLocalResistanceCatalogName(string localResistanceType)
    {
        var normalized = localResistanceType.Trim();
        for (var diagram = 1; diagram <= 7; diagram++)
        {
            normalized = normalized.Replace($" (диаграмма 3-{diagram})", string.Empty, StringComparison.OrdinalIgnoreCase);
        }

        normalized = normalized.Replace(" (диаграмма 4-1)", string.Empty, StringComparison.OrdinalIgnoreCase);
        return normalized.Trim();
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
