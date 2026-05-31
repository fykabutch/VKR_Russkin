(function () {
  const form = document.getElementById("routeForm");
  if (!form) {
    return;
  }

  const config = window.routeEditorConfig || {};
  const draftKey = "dymtrassa.routeDraft.v3";
  const guestPresetKey = "dymtrassa.guestPresets.v1";
  let sectionCounter = 0;

  const elements = {
    validationPanel: form.querySelector(".validation-panel"),
    routePalette: document.getElementById("routePalette"),
    routeCanvas: document.getElementById("routeCanvas"),
    routeCountBadge: document.getElementById("routeCountBadge"),
    blockInspectorBody: document.getElementById("blockInspectorBody"),
    inspectorTitle: document.getElementById("inspectorTitle"),
    removeSelectedBlockBtn: document.getElementById("removeSelectedBlockBtn"),
    sectionInputsHost: document.getElementById("sectionInputsHost"),
    previewStatus: document.getElementById("previewStatus"),
    previewEmpty: document.getElementById("previewEmpty"),
    liveResultsWrapper: document.getElementById("liveResultsWrapper"),
    liveResultsTable: document.getElementById("liveResultsTable"),
    metricTotal: document.getElementById("metricTotal"),
    metricFriction: document.getElementById("metricFriction"),
    metricLocal: document.getElementById("metricLocal"),
    metricGeometric: document.getElementById("metricGeometric"),
    metricLength: document.getElementById("metricLength"),
    metricVelocity: document.getElementById("metricVelocity"),
    metricCritical: document.getElementById("metricCritical"),
    efficiencyLabel: document.getElementById("efficiencyLabel"),
    heightSummary: document.getElementById("heightSummary"),
    geometryPressurePanel: document.getElementById("geometryPressurePanel"),
    toggleGeometryPressureBtn: document.getElementById("toggleGeometryPressureBtn"),
    geometricPressureBody: document.getElementById("geometricPressureBody"),
    geometryPressureSummary: document.getElementById("geometryPressureSummary"),
    geometryPressureSignHint: document.getElementById("geometryPressureSignHint"),
    routeHeightDelta: document.getElementById("RouteHeightDelta"),
    ambientAirTemperature: document.getElementById("AmbientAirTemperature"),
    ambientAirDensityValue: document.getElementById("ambientAirDensityValue"),
    recommendationsList: document.getElementById("recommendationsList"),
    noticesList: document.getElementById("noticesList"),
    presetName: document.getElementById("presetName"),
    presetSelect: document.getElementById("presetSelect"),
    presetStatus: document.getElementById("presetStatus"),
    savePresetBtn: document.getElementById("savePresetBtn"),
    loadPresetBtn: document.getElementById("loadPresetBtn"),
    deletePresetBtn: document.getElementById("deletePresetBtn"),
    clearDraftBtn: document.getElementById("clearDraftBtn"),
    globalMaterialType: document.getElementById("MaterialType"),
    globalSurfaceCondition: document.getElementById("SurfaceCondition"),
    useCustomRoughness: document.getElementById("UseCustomRoughness"),
    globalCustomRoughnessField: document.getElementById("globalCustomRoughnessField"),
    globalRoughnessSummary: document.getElementById("globalRoughnessSummary"),
    gasCompositionSummary: document.getElementById("gasCompositionSummary")
  };

  const materialCatalog = config.materialCatalog || {};
  const roughnessCatalog = Array.isArray(config.roughnessCatalog) ? config.roughnessCatalog : [];
  const kinematicViscosityCatalog = Array.isArray(config.kinematicViscosityCatalog) ? config.kinematicViscosityCatalog : [];
  const localResistanceTypes = Array.isArray(config.localResistanceTypes) ? config.localResistanceTypes : [];
  const localResistanceCatalog = config.localResistanceCatalog || {};
  const diffuserDiagram52Alphas = [3, 4, 6, 8, 10, 12, 14, 16, 20, 30, 45, 60, 90, 120, 180];
  const diffuserDiagram52Ratios = [2, 4, 6, 10, 16];
  const diffuserDiagram52ReScales = [0.5, 1, 2, 4, 6];
  const diffuserDiagram52Values = {
    2: [
      [0.148, 0.135, 0.121, 0.112, 0.107, 0.109, 0.120, 0.141, 0.191, 0.315, 0.331, 0.326, 0.315, 0.308, 0.298],
      [0.120, 0.106, 0.090, 0.083, 0.080, 0.088, 0.102, 0.122, 0.196, 0.298, 0.297, 0.286, 0.283, 0.279, 0.276],
      [0.093, 0.082, 0.070, 0.068, 0.062, 0.062, 0.063, 0.073, 0.120, 0.229, 0.279, 0.268, 0.268, 0.265, 0.263],
      [0.079, 0.068, 0.056, 0.048, 0.048, 0.048, 0.051, 0.051, 0.068, 0.120, 0.271, 0.272, 0.272, 0.268, 0.268],
      [0.079, 0.068, 0.056, 0.048, 0.048, 0.048, 0.051, 0.051, 0.068, 0.120, 0.271, 0.272, 0.272, 0.268, 0.268]
    ],
    4: [
      [0.197, 0.180, 0.165, 0.151, 0.157, 0.174, 0.197, 0.225, 0.298, 0.461, 0.606, 0.680, 0.643, 0.630, 0.615],
      [0.154, 0.141, 0.126, 0.119, 0.120, 0.131, 0.155, 0.183, 0.262, 0.479, 0.680, 0.628, 0.600, 0.593, 0.585],
      [0.120, 0.112, 0.101, 0.096, 0.096, 0.107, 0.120, 0.146, 0.180, 0.360, 0.548, 0.586, 0.585, 0.580, 0.567],
      [0.101, 0.091, 0.085, 0.079, 0.082, 0.090, 0.107, 0.124, 0.172, 0.292, 0.462, 0.562, 0.582, 0.577, 0.567],
      [0.101, 0.091, 0.085, 0.089, 0.080, 0.107, 0.135, 0.169, 0.240, 0.382, 0.506, 0.560, 0.582, 0.577, 0.567]
    ],
    6: [
      [0.182, 0.170, 0.168, 0.168, 0.179, 0.200, 0.240, 0.268, 0.330, 0.482, 0.655, 0.766, 0.742, 0.730, 0.722],
      [0.153, 0.144, 0.131, 0.126, 0.132, 0.159, 0.193, 0.218, 0.286, 0.488, 0.680, 0.755, 0.731, 0.720, 0.707],
      [0.129, 0.118, 0.109, 0.101, 0.101, 0.118, 0.151, 0.185, 0.280, 0.440, 0.895, 0.700, 0.710, 0.708, 0.690],
      [0.106, 0.095, 0.090, 0.084, 0.087, 0.104, 0.151, 0.160, 0.224, 0.360, 0.588, 0.660, 0.696, 0.695, 0.680],
      [0.092, 0.090, 0.080, 0.079, 0.080, 0.098, 0.137, 0.160, 0.286, 0.456, 0.600, 0.690, 0.707, 0.700, 0.695]
    ],
    10: [
      [0.195, 0.181, 0.184, 0.190, 0.200, 0.227, 0.256, 0.290, 0.380, 0.585, 0.760, 0.800, 0.834, 0.840, 0.827],
      [0.160, 0.156, 0.155, 0.156, 0.162, 0.184, 0.212, 0.240, 0.332, 0.572, 0.812, 0.800, 0.820, 0.820, 0.815],
      [0.123, 0.120, 0.120, 0.123, 0.134, 0.151, 0.167, 0.195, 0.240, 0.426, 0.760, 0.800, 0.806, 0.807, 0.808],
      [0.100, 0.097, 0.097, 0.100, 0.106, 0.128, 0.160, 0.195, 0.254, 0.407, 0.605, 0.735, 0.804, 0.805, 0.809],
      [0.085, 0.084, 0.084, 0.085, 0.086, 0.114, 0.160, 0.212, 0.332, 0.520, 0.600, 0.760, 0.825, 0.840, 0.825]
    ],
    16: [
      [0.179, 0.174, 0.176, 0.185, 0.196, 0.224, 0.270, 0.306, 0.378, 0.600, 0.840, 0.880, 0.880, 0.880, 0.880],
      [0.148, 0.146, 0.147, 0.147, 0.151, 0.179, 0.233, 0.275, 0.340, 0.600, 0.840, 0.905, 0.877, 0.876, 0.876],
      [0.118, 0.120, 0.120, 0.120, 0.120, 0.140, 0.176, 0.208, 0.280, 0.520, 0.760, 0.868, 0.868, 0.868, 0.868],
      [0.102, 0.098, 0.095, 0.094, 0.095, 0.118, 0.160, 0.191, 0.264, 0.480, 0.700, 0.778, 0.847, 0.868, 0.869],
      [0.094, 0.085, 0.084, 0.085, 0.094, 0.118, 0.160, 0.212, 0.342, 0.560, 0.720, 0.790, 0.853, 0.874, 0.886]
    ]
  };
  const diffuserDiagram54Alphas = [4, 6, 8, 10, 12, 14, 16, 20, 30, 45, 60, 90, 120, 180];
  const diffuserDiagram54Ratios = [2, 4, 6, 10];
  const diffuserDiagram54ReScales = [0.5, 1, 2, 4];
  const diffuserDiagram54Values = {
    0: {
      2: [
        [0.140, 0.136, 0.135, 0.152, 0.175, 0.200, 0.235, 0.250, 0.300, 0.325, 0.326, 0.325, 0.320, 0.300],
        [0.110, 0.110, 0.105, 0.130, 0.160, 0.185, 0.200, 0.230, 0.270, 0.300, 0.315, 0.310, 0.310, 0.300],
        [0.095, 0.090, 0.095, 0.116, 0.150, 0.175, 0.180, 0.216, 0.250, 0.285, 0.310, 0.315, 0.325, 0.300],
        [0.085, 0.085, 0.090, 0.112, 0.145, 0.175, 0.185, 0.220, 0.250, 0.285, 0.310, 0.315, 0.325, 0.310]
      ],
      4: [
        [0.170, 0.185, 0.200, 0.245, 0.300, 0.335, 0.380, 0.450, 0.520, 0.580, 0.620, 0.640, 0.640, 0.640],
        [0.145, 0.155, 0.180, 0.225, 0.280, 0.335, 0.360, 0.430, 0.500, 0.560, 0.605, 0.630, 0.630, 0.625],
        [0.115, 0.135, 0.150, 0.200, 0.260, 0.335, 0.360, 0.430, 0.500, 0.560, 0.605, 0.630, 0.630, 0.625],
        [0.106, 0.118, 0.130, 0.195, 0.260, 0.335, 0.360, 0.430, 0.500, 0.560, 0.605, 0.630, 0.630, 0.625]
      ],
      6: [
        [0.185, 0.190, 0.205, 0.295, 0.370, 0.420, 0.460, 0.525, 0.625, 0.715, 0.775, 0.790, 0.790, 0.785],
        [0.155, 0.165, 0.185, 0.250, 0.320, 0.380, 0.420, 0.485, 0.600, 0.695, 0.750, 0.775, 0.770, 0.760],
        [0.130, 0.140, 0.165, 0.235, 0.320, 0.360, 0.420, 0.465, 0.580, 0.675, 0.720, 0.760, 0.760, 0.750],
        [0.120, 0.125, 0.145, 0.230, 0.300, 0.360, 0.400, 0.465, 0.580, 0.675, 0.720, 0.760, 0.760, 0.750]
      ],
      10: [
        [0.180, 0.195, 0.240, 0.300, 0.375, 0.430, 0.470, 0.530, 0.635, 0.750, 0.840, 0.890, 0.890, 0.880],
        [0.160, 0.175, 0.205, 0.265, 0.340, 0.400, 0.440, 0.550, 0.615, 0.725, 0.815, 0.880, 0.880, 0.865],
        [0.130, 0.155, 0.180, 0.240, 0.320, 0.370, 0.420, 0.490, 0.590, 0.700, 0.795, 0.870, 0.850, 0.860],
        [0.120, 0.135, 0.160, 0.235, 0.320, 0.370, 0.420, 0.490, 0.590, 0.700, 0.795, 0.870, 0.850, 0.860]
      ]
    },
    10: {
      2: [
        [0.200, 0.240, 0.280, 0.280, 0.298, 0.305, 0.315, 0.325, 0.340, 0.355, 0.355, 0.350, 0.340, 0.310],
        [0.175, 0.200, 0.215, 0.235, 0.250, 0.260, 0.275, 0.290, 0.310, 0.330, 0.340, 0.340, 0.320, 0.310],
        [0.140, 0.160, 0.180, 0.195, 0.210, 0.225, 0.240, 0.260, 0.280, 0.310, 0.320, 0.335, 0.320, 0.310],
        [0.105, 0.125, 0.140, 0.160, 0.200, 0.195, 0.210, 0.235, 0.265, 0.300, 0.320, 0.335, 0.320, 0.310]
      ],
      4: [
        [0.260, 0.320, 0.360, 0.400, 0.430, 0.455, 0.480, 0.510, 0.565, 0.610, 0.635, 0.655, 0.650, 0.640],
        [0.220, 0.270, 0.320, 0.365, 0.400, 0.435, 0.460, 0.495, 0.550, 0.600, 0.630, 0.650, 0.650, 0.640],
        [0.180, 0.230, 0.275, 0.320, 0.365, 0.400, 0.430, 0.470, 0.530, 0.590, 0.620, 0.650, 0.650, 0.640],
        [0.130, 0.180, 0.220, 0.270, 0.320, 0.350, 0.380, 0.430, 0.500, 0.580, 0.620, 0.650, 0.650, 0.640]
      ],
      6: [
        [0.310, 0.360, 0.400, 0.450, 0.490, 0.530, 0.560, 0.615, 0.685, 0.750, 0.775, 0.795, 0.785, 0.760],
        [0.250, 0.305, 0.375, 0.405, 0.455, 0.500, 0.530, 0.580, 0.650, 0.720, 0.775, 0.780, 0.775, 0.760],
        [0.190, 0.265, 0.305, 0.370, 0.420, 0.460, 0.495, 0.545, 0.635, 0.710, 0.745, 0.775, 0.775, 0.760],
        [0.140, 0.205, 0.255, 0.320, 0.380, 0.425, 0.460, 0.520, 0.615, 0.695, 0.740, 0.770, 0.775, 0.760]
      ],
      10: [
        [0.300, 0.360, 0.415, 0.470, 0.520, 0.570, 0.600, 0.670, 0.760, 0.850, 0.900, 0.960, 0.920, 0.880],
        [0.240, 0.315, 0.370, 0.455, 0.490, 0.540, 0.580, 0.640, 0.730, 0.830, 0.880, 0.940, 0.910, 0.880],
        [0.185, 0.265, 0.325, 0.400, 0.460, 0.515, 0.550, 0.610, 0.715, 0.810, 0.860, 0.930, 0.910, 0.880],
        [0.130, 0.200, 0.270, 0.345, 0.400, 0.460, 0.500, 0.570, 0.680, 0.790, 0.855, 0.930, 0.910, 0.880]
      ]
    }
  };
  const contractionDiagram523Alphas = [3, 5, 10, 15, 40, 50, 60, 76, 90, 105, 120, 150, 180];
  const contractionDiagram523DisplayAlphas = [
    { label: "3", min: 3, max: 3 },
    { label: "5", min: 5, max: 5 },
    { label: "10", min: 10, max: 10 },
    { label: "15...40", min: 15, max: 40 },
    { label: "50...60", min: 50, max: 60 },
    { label: "76", min: 76, max: 76 },
    { label: "90", min: 90, max: 90 },
    { label: "105", min: 105, max: 105 },
    { label: "120", min: 120, max: 120 },
    { label: "150", min: 150, max: 150 },
    { label: "180", min: 180, max: 180 }
  ];
  const contractionDiagram523AreaRatios = [0.10, 0.16, 0.25, 0.39, 0.45, 0.64];
  const contractionDiagram523DisplayAreaRatios = [0.64, 0.45, 0.39, 0.25, 0.16, 0.10];
  const contractionDiagram523Values = {
    0.10: [0.118, 0.093, 0.053, 0.050, 0.050, 0.079, 0.079, 0.142, 0.190, 0.237, 0.285, 0.367, 0.427],
    0.16: [0.108, 0.084, 0.048, 0.044, 0.044, 0.074, 0.074, 0.136, 0.184, 0.232, 0.278, 0.362, 0.420],
    0.25: [0.100, 0.071, 0.047, 0.044, 0.044, 0.068, 0.068, 0.127, 0.174, 0.220, 0.268, 0.352, 0.408],
    0.39: [0.098, 0.070, 0.051, 0.046, 0.046, 0.064, 0.064, 0.110, 0.162, 0.210, 0.250, 0.319, 0.364],
    0.45: [0.076, 0.064, 0.052, 0.050, 0.050, 0.072, 0.072, 0.104, 0.138, 0.170, 0.202, 0.246, 0.255],
    0.64: [0.072, 0.067, 0.054, 0.040, 0.040, 0.058, 0.058, 0.076, 0.094, 0.112, 0.131, 0.167, 0.190]
  };
  const bendDiagram61Angles = [0, 20, 30, 45, 60, 75, 90, 110, 130, 150, 180];
  const bendDiagram61A1Values = [0, 0.31, 0.45, 0.60, 0.78, 0.90, 1.00, 1.13, 1.20, 1.28, 1.40];
  const bendDiagram61RadiusRatios = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.25, 1.5, 2, 4, 6, 8, 10, 20, 30, 40];
  const bendDiagram61B1Values = [1.18, 0.77, 0.51, 0.37, 0.28, 0.21, 0.19, 0.17, 0.15, 0.11, 0.09, 0.07, 0.07, 0.05, 0.04, 0.03];
  const bendDiagram61AspectRatios = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 7, 8];
  const bendDiagram61C1Values = [1.30, 1.17, 1.09, 1.00, 0.90, 0.85, 0.85, 0.90, 0.95, 0.98, 1.00, 1.00];
  const bendDiagram61KReScales = [0.1, 0.14, 0.2, 0.3, 0.4, 0.6, 0.8, 1, 1.4, 2, 3, 4];
  const bendDiagram61KReValues = [
    [1.40, 1.33, 1.26, 1.19, 1.14, 1.09, 1.06, 1.04, 1.00, 1.00, 1.00, 1.00],
    [1.67, 1.58, 1.49, 1.40, 1.34, 1.26, 1.21, 1.19, 1.17, 1.14, 1.06, 1.00],
    [2.00, 1.89, 1.77, 1.64, 1.56, 1.46, 1.38, 1.30, 1.15, 1.02, 1.00, 1.00]
  ];
  const transitionContractionDiagram527ReScales = [1, 2, 4, 6, 8, 10, 20, 40, 50];
  const transitionContractionDiagram527DeltaValues = [0.272, 0.245, 0.201, 0.165, 0.135, 0.111, 0.041, 0.005, 0.002];
  const transitionContractionDiagram527LengthRatios = [1, 1.5, 2, 2.5, 3, 4, 5];
  const transitionContractionDiagram527C1Values = [0.002, 0.002, 0.002, 0.002, 0.0015, 0.001, 0];
  const gasCompositionTolerance = 0.0005;
  const fieldUnitIds = [
    "TgasInitial",
    "TemperatureLossPerMeter",
    "GasFlow",
    "CustomRoughness",
    "RouteHeightDelta",
    "AmbientAirTemperature",
    "Y_N2",
    "Y_O2",
    "Y_CO2",
    "Y_H2O"
  ];
  const gasComponentFieldIds = ["Y_N2", "Y_O2", "Y_CO2", "Y_H2O"];

  const unitDefinitions = {
    c: { toBase: (value) => value, fromBase: (value) => value },
    k: { toBase: (value) => value - 273.15, fromBase: (value) => value + 273.15 },
    cPerM: { toBase: (value) => value, fromBase: (value) => value },
    cPer10M: { toBase: (value) => value / 10, fromBase: (value) => value * 10 },
    cTotal: { toBase: (value) => value, fromBase: (value) => value },
    m3s: { toBase: (value) => value, fromBase: (value) => value },
    m3h: { toBase: (value) => value / 3600, fromBase: (value) => value * 3600 },
    m: { toBase: (value) => value, fromBase: (value) => value },
    mm: { toBase: (value) => value / 1000, fromBase: (value) => value * 1000 },
    deg: { toBase: (value) => value, fromBase: (value) => value },
    rad: { toBase: (value) => value * 180 / Math.PI, fromBase: (value) => value * Math.PI / 180 },
    fraction: { toBase: (value) => value, fromBase: (value) => value },
    percent: { toBase: (value) => value / 100, fromBase: (value) => value * 100 }
  };

  const baseUnitsByField = {
    TgasInitial: "c",
    TemperatureLossPerMeter: "cPerM",
    GasFlow: "m3s",
    CustomRoughness: "m",
    RouteHeightDelta: "m",
    AmbientAirTemperature: "c",
    Y_N2: "fraction",
    Y_O2: "fraction",
    Y_CO2: "fraction",
    Y_H2O: "fraction"
  };

  const sectionBaseUnits = {
    diameter: "m",
    diameterB: "m",
    outletDiameter: "m",
    outletDiameterB: "m",
    localResistanceParamX: "m",
    localResistanceParamY: "m",
    length: "m",
    heightDelta: "m",
    customRoughness: "m",
    turnAngle: "deg",
    temperatureLossPerMeter: "cPerM"
  };
  const numericSectionFields = new Set([
    "diameter",
    "diameterB",
    "outletDiameter",
    "outletDiameterB",
    "localResistanceParamX",
    "localResistanceParamY",
    "length",
    "heightDelta",
    "customRoughness",
    "customLrc",
    "turnAngle",
    "temperatureLossPerMeter"
  ]);

  const state = {
    sections: [],
    selectedId: null,
    presets: (Array.isArray(config.savedPresets) ? [...config.savedPresets] : []).concat(loadGuestPresets()),
    previewTimer: null,
    previewAbortController: null,
    dragPayload: null,
    useGeometricPressure: Boolean(config.useGeometricPressure)
  };

  const staticTooltips = {
    presetName: {
      title: "Название заготовки",
      essence: "Имя сохраненного набора исходных данных.",
      logic: "Используется только для списка заготовок и не влияет на расчет трассы."
    },
    presetSelect: {
      title: "Сохраненные заготовки",
      essence: "Ранее сохраненные варианты исходных данных и маршрута.",
      logic: "При загрузке заготовка переносит параметры в редактор, после чего их можно менять вручную."
    },
    TgasInitial: {
      title: "Начальная температура газа",
      essence: "Температура дымовых газов на входе в первый элемент трассы.",
      logic: "От нее программа последовательно считает температуру в каждом блоке с учетом теплопотерь."
    },
    GasFlow: {
      title: "Расход газа",
      essence: "Объемный расход газа в рабочем состоянии.",
      logic: "Используется для расчета скорости потока, динамического давления и потерь давления."
    },
    MaterialType: {
      title: "Базовый материал трассы",
      essence: "Материал стенки, по которому выбирается справочная эквивалентная шероховатость.",
      logic: "Применяется ко всей трассе, пока для отдельного блока не включен индивидуальный материал."
    },
    SurfaceCondition: {
      title: "Состояние поверхности",
      essence: "Качество внутренней поверхности выбранного материала.",
      logic: "Вместе с материалом определяет Δ для расчета коэффициента трения."
    },
    UseCustomRoughness: {
      title: "Собственная шероховатость трассы",
      essence: "Ручное значение эквивалентной шероховатости вместо справочника.",
      logic: "Если включено, программа использует введенное Δ для всей трассы, кроме блоков со своими настройками."
    },
    CustomRoughness: {
      title: "Δ",
      essence: "Числовое значение эквивалентной шероховатости, характеризующее неровность стенки канала.",
      logic: "Попадает в расчет коэффициента трения. Можно вводить в метрах или миллиметрах."
    },
    AmbientAirTemperature: {
      title: "Температура наружного воздуха",
      essence: "Температура воздуха вокруг дымовой трассы.",
      logic: "Используется только при включенном учете геометрического давления: по ней программа вычисляет плотность наружного воздуха."
    },
    Y_N2: {
      title: "Доля азота",
      essence: "Объемная доля N₂ в составе дымовых газов.",
      logic: "Участвует в расчете плотности смеси. Сумма компонентов должна быть близка к 100%."
    },
    Y_O2: {
      title: "Доля кислорода",
      essence: "Объемная доля O₂ в составе дымовых газов.",
      logic: "Участвует в расчете плотности смеси. Можно задавать долей или процентами."
    },
    Y_CO2: {
      title: "Доля углекислого газа",
      essence: "Объемная доля CO₂ в составе дымовых газов.",
      logic: "Влияет на расчетную плотность газа и итоговые потери давления."
    },
    Y_H2O: {
      title: "Доля водяного пара",
      essence: "Объемная доля H₂O в составе дымовых газов.",
      logic: "Учитывается в расчете плотности газовой смеси."
    }
  };

  const tooltipState = {
    showTimer: null,
    hideTimer: null,
    trigger: null,
    tooltip: null
  };

  const kindMeta = {
    Straight: {
      label: "Прямой участок",
      createDefaults: () => ({ diameter: "0.9", length: "12", heightDelta: "0" }),
      icon: [
        '<svg class="block-svg" viewBox="0 0 64 40" aria-hidden="true">',
        '<rect x="6" y="15" width="52" height="10" rx="5" fill="#507f82"></rect>',
        '<rect x="10" y="18" width="44" height="4" rx="2" fill="#cce0e0"></rect>',
        "</svg>"
      ].join("")
    },
    Bend: {
      label: "Поворот",
      createDefaults: () => ({ diameter: "0.9", length: "2", turnAngle: "90", localResistanceParamX: "0.9", heightDelta: "0" }),
      icon: [
        '<svg class="block-svg" viewBox="0 0 64 40" aria-hidden="true">',
        '<path d="M12 28V14a6 6 0 0 1 6-6h24" fill="none" stroke="#8f3d2e" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"></path>',
        '<path d="M12 28V14a6 6 0 0 1 6-6h24" fill="none" stroke="#f3ddd3" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>',
        "</svg>"
      ].join("")
    },
    Contraction: {
      label: "Сужение",
      createDefaults: () => ({ diameter: "0.9", outletDiameter: "0.75", length: "1.5", heightDelta: "0" }),
      icon: [
        '<svg class="block-svg" viewBox="0 0 64 40" aria-hidden="true">',
        '<path d="M6 13h18l10 7-10 7H6z" fill="#d8a661"></path>',
        '<path d="M34 15h20v10H34z" fill="#8f3d2e"></path>',
        '<path d="M10 17h12l7 3-7 3H10z" fill="#f7ecd4"></path>',
        "</svg>"
      ].join("")
    },
    Expansion: {
      label: "Расширение",
      createDefaults: () => ({ diameter: "0.75", outletDiameter: "0.9", length: "1.5", heightDelta: "0" }),
      icon: [
        '<svg class="block-svg" viewBox="0 0 64 40" aria-hidden="true">',
        '<path d="M10 15h20v10H10z" fill="#8f3d2e"></path>',
        '<path d="M30 13h18l10 7-10 7H30z" fill="#507f82"></path>',
        '<path d="M34 17h12l7 3-7 3H34z" fill="#d8edf0"></path>',
        "</svg>"
      ].join("")
    },
    LocalResistance: {
      label: "Местное сопротивление",
      createDefaults: () => ({
        diameter: "0.9",
        length: "0.5",
        heightDelta: "0",
        localResistanceType: localResistanceTypes[0] || ""
      }),
      icon: [
        '<svg class="block-svg" viewBox="0 0 64 40" aria-hidden="true">',
        '<rect x="6" y="17" width="16" height="6" rx="3" fill="#507f82"></rect>',
        '<circle cx="32" cy="20" r="9" fill="#8f3d2e"></circle>',
        '<circle cx="32" cy="20" r="4" fill="#f9e4dc"></circle>',
        '<rect x="42" y="17" width="16" height="6" rx="3" fill="#507f82"></rect>',
        "</svg>"
      ].join("")
    }
  };

  init();

  function init() {
    initUnitSelectors();
    decoratePalette();
    bindStaticEvents();
    decorateStaticTooltips();
    hydratePresetSelect();
    syncGlobalSurfaceOptions();
    toggleGlobalRoughnessField();
    updateGlobalRoughnessSummary();
    hydrateGeometryPressureWidget(state.useGeometricPressure);
    updateAmbientAirDensity();
    updateGasCompositionSummary();

    const shouldPreferInitialSnapshot = Boolean(config.preferInitialSnapshot);
    const draft = shouldPreferInitialSnapshot ? null : loadDraft();
    if (draft) {
      applySnapshot(draft, "Восстановлен последний черновик редактора.");
      return;
    }

    state.sections = normalizeSections(config.initialSections);
    state.selectedId = state.sections[0] ? state.sections[0].id : null;
    renderAll({ schedulePreview: true, saveDraft: true });
    if (shouldPreferInitialSnapshot) {
      setPresetStatus("В редактор загружены данные выбранного сохраненного расчета.");
      return;
    }
    setPresetStatus("Черновик редактора сохраняется автоматически и не стирается после перехода к отчёту.");
  }

  function bindStaticEvents() {
    form.addEventListener("input", handleFormInteraction);
    form.addEventListener("change", handleFormInteraction);
    form.addEventListener("click", handleFormClick);
    form.addEventListener("submit", handleSubmit);
    document.addEventListener("mouseover", handleContextTooltipMouseOver);
    document.addEventListener("mouseout", handleContextTooltipMouseOut);
    document.addEventListener("focusin", handleContextTooltipFocusIn);
    document.addEventListener("focusout", handleContextTooltipFocusOut);
    document.addEventListener("click", handleContextTooltipClick, true);
    document.addEventListener("keydown", hideContextTooltipNow);
    document.addEventListener("teplo:auth-state", handleAuthStateChange);
    window.addEventListener("scroll", hideContextTooltipNow, true);
    window.addEventListener("resize", hideContextTooltipNow);

    elements.routeCanvas.addEventListener("dragover", handleCanvasDragOver);
    elements.routeCanvas.addEventListener("dragleave", handleCanvasDragLeave);
    elements.routeCanvas.addEventListener("drop", handleCanvasDrop);

    elements.blockInspectorBody.addEventListener("input", handleInspectorInteraction);
    elements.blockInspectorBody.addEventListener("change", handleInspectorInteraction);
    elements.blockInspectorBody.addEventListener("click", handleInspectorClick);

    elements.removeSelectedBlockBtn.addEventListener("click", removeSelectedSection);
    elements.savePresetBtn.addEventListener("click", savePreset);
    elements.loadPresetBtn.addEventListener("click", loadPreset);
    elements.deletePresetBtn.addEventListener("click", deletePreset);
    elements.clearDraftBtn.addEventListener("click", clearDraft);
    if (elements.toggleGeometryPressureBtn) {
      elements.toggleGeometryPressureBtn.addEventListener("click", toggleGeometryPressureAnalysis);
    }
    if (elements.noticesList) {
      elements.noticesList.addEventListener("click", handleNoticeAction);
    }
  }

  function decoratePalette() {
    const items = elements.routePalette ? elements.routePalette.querySelectorAll(".palette-item") : [];
    items.forEach((button) => {
      const kind = normalizeKind(button.dataset.kind);
      const meta = kindMeta[kind];

      button.innerHTML = [
        `<span class="palette-item__art">${meta.icon}</span>`,
        `<span class="palette-item__label">${meta.label}</span>`
      ].join("");

      button.addEventListener("click", () => insertSection(kind, null, true));
      button.addEventListener("dragstart", (event) => {
        state.dragPayload = { type: "new", kind: kind };
        event.dataTransfer.effectAllowed = "copy";
      });
      button.addEventListener("dragend", cleanupDragState);
    });
  }

  function handleFormInteraction(event) {
    if (event.target.closest("#blockInspectorBody")) {
      return;
    }

    if (event.target.matches("[data-unit-for]")) {
      handleGlobalUnitChange(event.target);
      updateGlobalRoughnessSummary();
      if (event.target.closest("#geometryPressurePanel")) {
        updateAmbientAirDensity();
        updateHeightSummary();
        renderHiddenInputs();
        saveDraftSilently();
        schedulePreview();
        return;
      }
    }

    if (event.target.closest("#geometryPressurePanel")) {
      updateAmbientAirDensity();
      updateHeightSummary();
      renderHiddenInputs();
      saveDraftSilently();
      schedulePreview();
      return;
    }

    if (event.target === elements.globalMaterialType) {
      syncGlobalSurfaceOptions();
      updateGlobalRoughnessSummary();
      renderInspector();
    }

    if (event.target === elements.globalSurfaceCondition) {
      updateGlobalRoughnessSummary();
      renderInspector();
    }

    if (event.target === elements.useCustomRoughness) {
      toggleGlobalRoughnessField();
      updateGlobalRoughnessSummary();
      renderInspector();
    }

    if (event.target && event.target.id === "CustomRoughness") {
      updateGlobalRoughnessSummary();
      renderInspector();
    }

    renderHiddenInputs();
    updateGasCompositionSummary();
    updateHeightSummary();
    schedulePreview();
    saveDraftSilently();
  }

  function handleInspectorInteraction(event) {
    if (event.target.dataset.unitField) {
      handleSectionUnitChange(event.target);
      return;
    }

    const field = event.target.dataset.field;
    if (!field) {
      return;
    }

    const section = getSelectedSection();
    if (!section) {
      return;
    }

      section[field] = event.target.type === "checkbox"
        ? event.target.checked
        : normalizeSectionFieldValue(field, event.target.value);

      if (field === "useCustomLrc" && section.useCustomLrc && !section.customLrc) {
        section.customLrc = getAutoKmsValue(section);
      }

    ensureSection(section);

    if (field === "materialType") {
      const conditions = getSurfaceOptions(section.materialType);
      if (!conditions.includes(section.surfaceCondition)) {
        section.surfaceCondition = conditions[0] || "";
      }
    }

    if (field === "localResistanceType") {
      applyTabularParameterDefaults(section, true);
    }

    if (isConicalCollectorSection(section) || isEntranceWithoutRouteLengthSection(section)) {
      updateDerivedLocalResistanceParams(section);
      if (["diameter", "localResistanceType", "crossSectionShape"].includes(field) ||
          (isSuddenExpansionSection(section) && field === "localResistanceParamX")) {
        syncConicalCollectorOutletToNext(section);
      }
    }

      if (["useCustomLrc", "useIndividualMaterial", "useCustomRoughness", "materialType", "localResistanceType", "crossSectionShape", "outletCrossSectionShape"].includes(field)) {
        renderInspector();
      }
      updateAutoKmsField();
      updateDerivedLocalResistanceDisplays(section);
      updateSectionRoughnessSummary(section);

    renderCanvas();
    renderHiddenInputs();
    updateHeightSummary();
    schedulePreview();
    saveDraftSilently();
  }

  function handleFormClick(event) {
    const roughnessButton = event.target.closest("[data-open-roughness-table]");
    if (!roughnessButton) {
      return;
    }

    event.preventDefault();
    const section = roughnessButton.dataset.roughnessContext === "section"
      ? getSelectedSection()
      : null;
    showRoughnessGuide(section);
  }

  function handleAuthStateChange(event) {
    const authState = event.detail || {};
    if (authState.isAuthenticated && Array.isArray(authState.presets)) {
      state.presets = authState.presets;
      hydratePresetSelect("");
      setPresetStatus("Профиль подключен: заготовки теперь сохраняются в базе данных.");
    } else if (!authState.isAuthenticated) {
      state.presets = loadGuestPresets();
      hydratePresetSelect("");
    }
  }

  function handleInspectorClick(event) {
    const guideButton = event.target.closest("[data-open-resistance-table]");
    if (!guideButton) {
      return;
    }

    event.preventDefault();
    const section = getSelectedSection();
    if (!section) {
      return;
    }

    showResistanceGuide(section);
  }

  function handleSubmit(event) {
    renderHiddenInputs();
    const blockingMessages = collectBlockingMessages();
    if (blockingMessages.length > 0) {
      event.preventDefault();
      showValidationMessages(blockingMessages);
      renderNotices(blockingMessages);
      setPreviewStatus("Есть ошибки в данных", "is-error");
      return;
    }

    saveDraftSilently();
    applyBaseValuesToStaticFields();
  }

  function handleCanvasDragOver(event) {
    event.preventDefault();
    elements.routeCanvas.classList.add("is-dragover");

    const node = event.target.closest(".route-node");
    clearDropIndicators();
    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const isAfter = event.clientX > rect.left + rect.width / 2;
    node.classList.add(isAfter ? "drop-after" : "drop-before");
  }

  function handleCanvasDragLeave(event) {
    if (!elements.routeCanvas.contains(event.relatedTarget)) {
      clearDropIndicators();
      elements.routeCanvas.classList.remove("is-dragover");
    }
  }

  function handleCanvasDrop(event) {
    event.preventDefault();
    elements.routeCanvas.classList.remove("is-dragover");

    if (!state.dragPayload) {
      clearDropIndicators();
      return;
    }

    const node = event.target.closest(".route-node");
    let targetId = null;
    let placeAfter = true;

    if (node) {
      const rect = node.getBoundingClientRect();
      placeAfter = event.clientX > rect.left + rect.width / 2;
      targetId = node.dataset.id;
    }

    if (state.dragPayload.type === "new") {
      insertSection(state.dragPayload.kind, targetId, placeAfter);
    } else if (state.dragPayload.type === "existing") {
      moveSection(state.dragPayload.id, targetId, placeAfter);
    }

    cleanupDragState();
  }

  function insertSection(kind, targetId, placeAfter) {
    const insertIndex = resolveInsertIndex(targetId, placeAfter);
    const section = createSection(kind, insertIndex);
    state.sections.splice(insertIndex, 0, section);
    state.selectedId = section.id;
    renderAll({ schedulePreview: true, saveDraft: true });
  }

  function moveSection(sectionId, targetId, placeAfter) {
    const currentIndex = state.sections.findIndex((section) => section.id === sectionId);
    if (currentIndex === -1) {
      return;
    }

    const [section] = state.sections.splice(currentIndex, 1);
    let insertIndex = resolveInsertIndex(targetId, placeAfter);
    if (insertIndex > currentIndex) {
      insertIndex -= 1;
    }

    state.sections.splice(insertIndex, 0, section);
    state.selectedId = section.id;
    renderAll({ schedulePreview: true, saveDraft: true });
  }

  function removeSelectedSection() {
    if (!state.selectedId) {
      return;
    }

    state.sections = state.sections.filter((section) => section.id !== state.selectedId);
    state.selectedId = state.sections[0] ? state.sections[0].id : null;
    renderAll({ schedulePreview: true, saveDraft: true });
  }

  function resolveInsertIndex(targetId, placeAfter) {
    if (!targetId) {
      return state.sections.length;
    }

    const targetIndex = state.sections.findIndex((section) => section.id === targetId);
    if (targetIndex === -1) {
      return state.sections.length;
    }

    return placeAfter ? targetIndex + 1 : targetIndex;
  }

  function renderAll(options) {
    syncConicalCollectorOutlets();
    updateGlobalRoughnessSummary();
    renderCanvas();
    renderInspector();
    renderHiddenInputs();
    hydratePresetSelect();
    updateHeightSummary();

    if (options && options.schedulePreview) {
      schedulePreview();
    }

    if (options && options.saveDraft) {
      saveDraftSilently();
    }
  }

  function renderCanvas() {
    elements.routeCanvas.innerHTML = "";
    elements.routeCountBadge.textContent = `${state.sections.length} блоков`;

    if (state.sections.length === 0) {
      elements.routeCanvas.innerHTML = '<div class="route-empty-state">Перетащите блок из палитры на холст или нажмите на нужный тип элемента, чтобы начать построение трассы.</div>';
      return;
    }

    state.sections.forEach((section, index) => {
      const node = document.createElement("button");
      node.type = "button";
      node.className = `route-node${section.id === state.selectedId ? " is-selected" : ""}`;
      node.dataset.id = section.id;
      node.draggable = true;
      node.innerHTML = [
        `<span class="route-node__step">${index + 1}</span>`,
        `<span class="route-node__art">${kindMeta[section.kind].icon}</span>`,
        '<span class="route-node__content">',
        `<strong class="route-node__title">${escapeHtml(getSectionTitle(section, index + 1))}</strong>`,
        `<span class="route-node__kind">${kindMeta[section.kind].label}</span>`,
        `<span class="route-node__meta">${escapeHtml(describeNodeMeta(section))}</span>`,
        "</span>"
      ].join("");

      node.addEventListener("click", () => {
        state.selectedId = section.id;
        renderCanvas();
        renderInspector();
        saveDraftSilently();
      });

      node.addEventListener("dragstart", (event) => {
        state.dragPayload = { type: "existing", id: section.id };
        node.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "move";
      });

      node.addEventListener("dragend", cleanupDragState);
      elements.routeCanvas.appendChild(node);

      if (index < state.sections.length - 1) {
        const connector = document.createElement("div");
        connector.className = "route-connector";
        connector.setAttribute("aria-hidden", "true");
        connector.textContent = "→";
        elements.routeCanvas.appendChild(connector);
      }
    });
  }

  function renderInspector() {
    hideContextTooltipNow();
    const section = getSelectedSection();

    if (!section) {
      elements.inspectorTitle.textContent = "Блок не выбран";
      elements.removeSelectedBlockBtn.classList.add("d-none");
      elements.blockInspectorBody.className = "block-inspector-empty";
      elements.blockInspectorBody.textContent = "Выберите блок на холсте, чтобы задать его параметры.";
      return;
    }

    const sectionIndex = state.sections.findIndex((item) => item.id === section.id) + 1;
    const isConicalCollector = section.kind === "LocalResistance" && isConicalCollectorType(section.localResistanceType);
    const isPipeEntrance = section.kind === "LocalResistance" && isStraightPipeEntranceType(section.localResistanceType);
    const isRoundLockedLocalResistance = isRoundLockedLocalResistanceSection(section);
    const shape = isRoundLockedLocalResistance ? "Round" : normalizeShape(section.crossSectionShape);
    const outletShape = normalizeShape(section.outletCrossSectionShape || shape);
    const surfaceOptions = renderOptions(getSurfaceOptions(section.materialType), section.surfaceCondition);
    const shapeOptions = [
      { value: "Round", label: "Круглое сечение" },
      { value: "Rectangle", label: "Прямоугольное сечение" }
    ];
    const shapeHint = isConicalCollector
      ? "Форма фиксируется как круглое сечение для расчетного диаметра d₀."
      : isPipeEntrance
      ? "Форма фиксируется как круглое сечение: для расчета используется диаметр Dг прямой трубы."
      : isRoundLockedLocalResistance
      ? "Форма фиксируется как круглое сечение: для справочной таблицы используется диаметр Dг."
      : shape === "Rectangle"
      ? "Для прямоугольного канала программа автоматически вычисляет эквивалентный диаметр по формуле dэкв = 4S / П, где S = a·b, П = 2(a + b)."
      : "Для круглой трубы расчётный и эквивалентный диаметры совпадают.";
    const inletHint = `${shapeHint} Новый блок копирует параметры предыдущего только при добавлении; дальше этот участок можно менять вручную.`;
    const outletShapeHint = "Выходная форма нужна для переходов между круглыми и прямоугольными участками.";

    elements.inspectorTitle.textContent = getSectionTitle(section, sectionIndex);
    elements.removeSelectedBlockBtn.classList.remove("d-none");
    elements.blockInspectorBody.className = "";
    elements.blockInspectorBody.innerHTML = [
      '<div class="section-form">',
      '<div class="section-toggle-row">',
      renderToggle("useIndividualMaterial", section.useIndividualMaterial, "Индивидуальный материал блока"),
      renderToggle("useCustomRoughness", section.useCustomRoughness, "Собственная Δ"),
      "</div>",
      '<div class="section-form-grid">',
      renderTextField("Название блока", "blockTitle", section.blockTitle, "Например: участок после котла", true),
      isRoundLockedLocalResistance ? '<div class="section-form-subhead field-span-2">Основные параметры</div>' : "",
      renderNamedSelectField("Форма поперечного сечения", "crossSectionShape", shapeOptions, shape, isRoundLockedLocalResistance ? shapeHint : "Выберите геометрию входа этого конкретного участка.", isRoundLockedLocalResistance),
      renderNumberField(getEntrySizeLabel(section), "diameter", section.diameter, "0.001", "0.001", "", getEntrySizeHint(section, inletHint), getSectionUnitOptions(section, "diameter"), false, getEntrySizeNote(section)),
      shape === "Rectangle"
        ? renderNumberField(getEntrySizeBLabel(section), "diameterB", section.diameterB, "0.001", "0.001", "", inletHint, getSectionUnitOptions(section, "diameterB"), false)
        : "",
      requiresSectionLength(section)
        ? renderNumberField(getLengthLabel(section), "length", section.length, "0.001", "0.001", "", getLengthHint(section), getSectionUnitOptions(section, "length"))
        : "",
      requiresSectionLength(section)
        ? renderNumberField("Теплопотери блока", "temperatureLossPerMeter", section.temperatureLossPerMeter, "0.01", "0", "10", "Внутри расчёта хранится °C/м. Если выбрано «°C всего», значение делится на длину участка.", getSectionUnitOptions(section, "temperatureLossPerMeter"))
        : "",
      section.kind === "Bend"
        ? renderNumberField("Угол поворота", "turnAngle", section.turnAngle, "1", "1", "180", "Укажите угол фактического разворота потока.", getSectionUnitOptions(section, "turnAngle"))
        : "",
      section.kind === "Bend" && !section.useCustomLrc
        ? renderNumberField("Радиус отвода R₀", "localResistanceParamX", section.localResistanceParamX, "0.001", "0.001", "", "Радиус кривизны оси отвода. Для диаграммы 6-1 используется отношение R₀/D₀ для круглого сечения или R₀/b₀ для прямоугольного.", getSectionUnitOptions(section, "localResistanceParamX"))
        : "",
      section.kind === "Contraction" || section.kind === "Expansion"
        ? renderNamedSelectField("Форма выходного сечения", "outletCrossSectionShape", shapeOptions, outletShape, outletShapeHint, false)
        : "",
      section.kind === "Contraction" || section.kind === "Expansion"
        ? renderNumberField(getOutletSizeLabel({ kind: section.kind, crossSectionShape: outletShape, inletCrossSectionShape: shape }), "outletDiameter", section.outletDiameter, "0.001", "0.001", "", "Для сужения выходная площадь обычно меньше входной, для расширения — больше. При смене формы программа учитывает переход как адаптер.", getSectionUnitOptions(section, "outletDiameter"))
        : "",
      (section.kind === "Contraction" || section.kind === "Expansion") && outletShape === "Rectangle"
        ? renderNumberField(getOutletSizeBLabel({ crossSectionShape: outletShape }), "outletDiameterB", section.outletDiameterB, "0.001", "0.001", "", "Для прямоугольного выхода задайте вторую сторону b.", getSectionUnitOptions(section, "outletDiameterB"))
        : "",
        "",
        section.kind === "LocalResistance"
          ? renderLocalResistanceFields(section)
          : (isKmsAdjustableSection(section)
              ? renderElementKmsFields(section)
              : ""),
      "</div>",
      shape === "Rectangle"
        ? '<p class="inspector-note">Для прямоугольного канала используется формула <strong>dэкв = 4S / П</strong>, где <strong>S = a·b</strong>, <strong>П = 2(a + b)</strong>.</p>'
        : '<p class="inspector-note">Для круглого канала эквивалентный диаметр совпадает с введённым диаметром трубы.</p>',
      '<div class="inspector-panel mt-3">',
      renderMaterialRoughnessPanel(section, surfaceOptions),
      "</div>",
      "</div>"
    ].join("");
  }

  function renderMaterialRoughnessPanel(section, surfaceOptions) {
    if (!section.useIndividualMaterial && !section.useCustomRoughness) {
      return `<div data-role="section-roughness-summary">${buildRoughnessSummaryHtml(getRoughnessSelection(null, "section"))}</div>`;
    }

    const fields = [];
    if (section.useIndividualMaterial) {
      fields.push(renderSelectField("Материал блока", "materialType", Object.keys(materialCatalog), section.materialType, "Материал будет использоваться только для этого блока."));
      fields.push(renderRawField(
        "Состояние поверхности",
        `<select class="form-select" data-field="surfaceCondition">${surfaceOptions}</select>`,
        "Выберите состояние поверхности для расчёта табличной шероховатости."
      ));
    }

    if (section.useCustomRoughness) {
      fields.push(renderNumberField("Индивидуальная Δ", "customRoughness", section.customRoughness, "0.000001", "0.000001", "0.1", "Это значение используется в расчёте вместо справочной шероховатости материала.", getSectionUnitOptions(section, "customRoughness")));
    }

    fields.push(`<div class="field field-span-2" data-role="section-roughness-summary">${buildRoughnessSummaryHtml(getRoughnessSelection(section, "section"))}</div>`);

    return `<div class="section-form-grid">${fields.join("")}</div>`;
  }

  function renderHiddenInputs() {
    syncConicalCollectorOutlets();
    elements.sectionInputsHost.innerHTML = "";
    const routeHeightDelta = getRouteHeightDelta();

    addGlobalHiddenInputs();

    state.sections.forEach((section, index) => {
      updateDerivedLocalResistanceParams(section);
      const localResistanceParamY = getLocalResistanceParamYForSubmit(section);
      addHiddenInput(`Sections[${index}].SectionKind`, section.kind);
      addHiddenInput(`Sections[${index}].CrossSectionShape`, section.crossSectionShape);
      addHiddenInput(`Sections[${index}].OutletCrossSectionShape`, section.outletCrossSectionShape || section.crossSectionShape);
      addHiddenInput(`Sections[${index}].BlockTitle`, section.blockTitle);
      addHiddenInput(`Sections[${index}].Diameter`, getSectionBaseValue(section, "diameter"));
      addHiddenInput(`Sections[${index}].DiameterUnit`, getSectionUnit(section, "diameter"));
      addHiddenInput(`Sections[${index}].DiameterB`, getSectionBaseValue(section, "diameterB"));
      addHiddenInput(`Sections[${index}].DiameterBUnit`, getSectionUnit(section, "diameterB"));
      addHiddenInput(`Sections[${index}].OutletDiameter`, getSectionBaseValue(section, "outletDiameter"));
      addHiddenInput(`Sections[${index}].OutletDiameterUnit`, getSectionUnit(section, "outletDiameter"));
      addHiddenInput(`Sections[${index}].OutletDiameterB`, getSectionBaseValue(section, "outletDiameterB"));
      addHiddenInput(`Sections[${index}].OutletDiameterBUnit`, getSectionUnit(section, "outletDiameterB"));
      addHiddenInput(`Sections[${index}].Length`, getSectionBaseValue(section, "length"));
      addHiddenInput(`Sections[${index}].LengthUnit`, getSectionUnit(section, "length"));
      addHiddenInput(`Sections[${index}].TemperatureLossPerMeter`, getSectionBaseValue(section, "temperatureLossPerMeter"));
      addHiddenInput(`Sections[${index}].TemperatureLossUnit`, getSectionUnit(section, "temperatureLossPerMeter"));
      addHiddenInput(`Sections[${index}].TurnAngle`, getSectionBaseValue(section, "turnAngle"));
      addHiddenInput(`Sections[${index}].TurnAngleUnit`, getSectionUnit(section, "turnAngle"));
      addHiddenInput(`Sections[${index}].HeightDelta`, index === 0 ? formatNullable(routeHeightDelta) : "0");
      addHiddenInput(`Sections[${index}].HeightDeltaUnit`, "m");
      addHiddenInput(`Sections[${index}].LocalResistanceType`, section.localResistanceType);
      addHiddenInput(`Sections[${index}].LocalResistanceParamX`, getLocalResistanceParamXForSubmit(section));
      addHiddenInput(`Sections[${index}].LocalResistanceParamY`, localResistanceParamY);
      addHiddenInput(`Sections[${index}].CustomLRC`, section.customLrc);
      addHiddenInput(`Sections[${index}].UseCustomLRC`, section.useCustomLrc ? "true" : "false");
      addHiddenInput(`Sections[${index}].UseIndividualMaterial`, section.useIndividualMaterial ? "true" : "false");
      addHiddenInput(`Sections[${index}].MaterialType`, section.materialType);
      addHiddenInput(`Sections[${index}].SurfaceCondition`, section.surfaceCondition);
      addHiddenInput(`Sections[${index}].UseCustomRoughness`, section.useCustomRoughness ? "true" : "false");
      addHiddenInput(`Sections[${index}].CustomRoughness`, getSectionBaseValue(section, "customRoughness"));
      addHiddenInput(`Sections[${index}].CustomRoughnessUnit`, getSectionUnit(section, "customRoughness"));
    });
  }

  function addGlobalHiddenInputs() {
    const routeHeightDelta = getRouteHeightDelta();
    addHiddenInput("TgasInitialUnit", getFieldUnit("TgasInitial"));
    addHiddenInput("GasFlowUnit", getFieldUnit("GasFlow"));
    addHiddenInput("CustomRoughnessUnit", getFieldUnit("CustomRoughness"));
    addHiddenInput("UseGeometricPressure", state.useGeometricPressure ? "true" : "false");
    addHiddenInput("HeightDifference", Math.abs(routeHeightDelta).toString());
    addHiddenInput("HeightDirection", routeHeightDelta > 0 ? "up" : routeHeightDelta < 0 ? "down" : "none");
    addHiddenInput("CurrentCalculationId", getFieldValue("CurrentCalculationId"));
    addHiddenInput("CurrentCalculationName", getFieldValue("CurrentCalculationName"));
    addHiddenInput("AmbientAirTemperature", state.useGeometricPressure ? formatNullable(getBaseFieldValue("AmbientAirTemperature")) : "");
    addHiddenInput("AmbientAirTemperatureUnit", getFieldUnit("AmbientAirTemperature"));
    addHiddenInput("Y_N2Unit", getFieldUnit("Y_N2"));
    addHiddenInput("Y_O2Unit", getFieldUnit("Y_O2"));
    addHiddenInput("Y_CO2Unit", getFieldUnit("Y_CO2"));
    addHiddenInput("Y_H2OUnit", getFieldUnit("Y_H2O"));
  }

  function addHiddenInput(name, value) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value == null ? "" : value;
    elements.sectionInputsHost.appendChild(input);
  }

  function schedulePreview() {
    window.clearTimeout(state.previewTimer);
    state.previewTimer = window.setTimeout(runPreview, 280);
  }

  async function runPreview() {
    renderHiddenInputs();
    const blockingMessages = collectBlockingMessages();
    if (blockingMessages.length > 0) {
      showValidationMessages(blockingMessages);
      resetPreviewWidgets();
      renderNotices(blockingMessages);
      setPreviewStatus("Есть ошибки в данных", "is-error");
      return;
    }

    setPreviewStatus("Выполняется расчёт", "");

    if (state.previewAbortController) {
      state.previewAbortController.abort();
    }

    state.previewAbortController = new AbortController();

    try {
      const response = await fetch("/Home/Preview", {
        method: "POST",
        body: buildBaseFormData(),
        signal: state.previewAbortController.signal
      });

      const data = await response.json();
      if (!response.ok) {
        const messages = Array.isArray(data.errors) ? data.errors : ["Не удалось обновить расчёт."];
        showValidationMessages(messages);
        resetPreviewWidgets();
        renderNotices(messages);
        setPreviewStatus("Есть ошибки в данных", "is-error");
        return;
      }

      applyPreviewResponse(data);
      showValidationMessages([]);
      setPreviewStatus("Расчёт обновлён", "is-success");
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }

      resetPreviewWidgets();
      const messages = ["Во время предварительного расчёта возникла ошибка."];
      showValidationMessages(messages);
      renderNotices(messages);
      setPreviewStatus("Ошибка расчёта", "is-error");
    }
  }

  function applyPreviewResponse(response) {
    const summary = response.summary || response.Summary || {};
    const results = response.results || response.Results || [];
    const recommendations = response.recommendations || response.Recommendations || [];
    const notices = response.notices || response.Notices || [];

    elements.previewEmpty.classList.toggle("d-none", results.length > 0);
    elements.liveResultsWrapper.classList.toggle("d-none", results.length === 0);

    renderLiveResults(results);
    renderMetrics(summary);
    renderRecommendations(recommendations);
    renderNotices(notices);
    updateHeightSummary(summary.totalHeightChange ?? summary.TotalHeightChange);
    updateAutoKmsField();
  }

  function renderLiveResults(results) {
    const tbody = elements.liveResultsTable.querySelector("tbody");
    tbody.innerHTML = results.map((item) => {
      const shape = translateShape(readProp(item, "crossSectionShape", "CrossSectionShape"));
      const outletShape = translateShape(readProp(item, "outletCrossSectionShape", "OutletCrossSectionShape"));
      const equivalentDiameter = formatNumber(readProp(item, "equivalentDiameter", "EquivalentDiameter"), 3);
      const outletEquivalentDiameter = formatNumber(readProp(item, "outletEquivalentDiameter", "OutletEquivalentDiameter"), 3);
      const shapeText = shape === outletShape
        ? `${escapeHtml(shape)} / ${equivalentDiameter} м`
        : `${escapeHtml(shape)} → ${escapeHtml(outletShape)} / ${equivalentDiameter}→${outletEquivalentDiameter} м`;
      return [
        "<tr>",
        `<td>${escapeHtml(readProp(item, "sectionName", "SectionName") || "—")}</td>`,
        `<td>${escapeHtml(readProp(item, "sectionType", "SectionType") || "—")}</td>`,
        `<td>${shapeText}</td>`,
        `<td>${formatNumber(readProp(item, "flowVelocity", "FlowVelocity"), 2)} м/с</td>`,
        `<td>${formatNumber(readProp(item, "lambda", "Lambda"), 4)} / ${formatNumber(readProp(item, "zeta", "Zeta"), 3)}</td>`,
        `<td>${formatNumber(readProp(item, "pressureDropFriction", "PressureDropFriction"), 1)}</td>`,
        `<td>${formatNumber(readProp(item, "pressureDropLocal", "PressureDropLocal"), 1)}</td>`,
        `<td>${formatNumber(readProp(item, "geometricPressureDrop", "GeometricPressureDrop"), 1)}</td>`,
        `<td>${formatNumber(readProp(item, "totalPressureDrop", "TotalPressureDrop"), 1)}</td>`,
        `<td>${escapeHtml(readProp(item, "dominantLossType", "DominantLossType") || "—")}</td>`,
        "</tr>"
      ].join("");
    }).join("");
  }

  function renderMetrics(summary) {
    elements.metricTotal.textContent = `${formatNumber(readProp(summary, "totalPressureDrop", "TotalPressureDrop"), 1)} Па`;
    elements.metricFriction.textContent = `${formatNumber(readProp(summary, "frictionLoss", "FrictionLoss"), 1)} Па`;
    elements.metricLocal.textContent = `${formatNumber(readProp(summary, "localLoss", "LocalLoss"), 1)} Па`;
    elements.metricGeometric.textContent = `${formatNumber(readProp(summary, "geometricLoss", "GeometricLoss"), 1)} Па`;
    elements.metricLength.textContent = `${formatNumber(readProp(summary, "totalRouteLength", "TotalRouteLength"), 2)} м`;
    elements.metricVelocity.textContent = `${formatNumber(readProp(summary, "maxVelocity", "MaxVelocity"), 2)} м/с`;
    elements.metricCritical.textContent = readProp(summary, "criticalSectionName", "CriticalSectionName") || "—";
    elements.efficiencyLabel.textContent = readProp(summary, "efficiencyLabel", "EfficiencyLabel") || "Ожидается расчёт";
  }

  function renderRecommendations(recommendations) {
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      elements.recommendationsList.innerHTML = '<p class="muted-text">Рекомендации появятся после первого успешного расчёта.</p>';
      return;
    }

    elements.recommendationsList.innerHTML = recommendations.map((item) => {
      const title = escapeHtml(readProp(item, "title", "Title") || "Рекомендация");
      const priority = escapeHtml(readProp(item, "priority", "Priority") || "Средний");
      const description = escapeHtml(readProp(item, "description", "Description") || "");
      const impactText = escapeHtml(readProp(item, "impactText", "ImpactText") || "");
      return [
        '<article class="recommendation-card">',
        '<div class="recommendation-head">',
        `<strong>${title}</strong>`,
        `<span>${priority}</span>`,
        "</div>",
        `<p>${description}</p>`,
        impactText ? `<small>${impactText}</small>` : "",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderNotices(notices) {
    const serverNotices = Array.isArray(notices)
      ? notices
          .filter((notice) => !String(notice).startsWith("Между блоками"))
          .map((notice) => ({ text: notice }))
      : [];
    const connectionNotices = buildConnectionNotices();
    const allNotices = serverNotices.concat(connectionNotices);

    if (allNotices.length === 0) {
      elements.noticesList.innerHTML = '<li class="muted-text">Пока сообщений нет.</li>';
      return;
    }

    elements.noticesList.innerHTML = allNotices.map((notice) => {
      const action = notice.actionIndex == null
        ? ""
        : `<button type="button" class="btn btn-sm btn-outline-primary mt-2" data-insert-transition-after="${notice.actionIndex}">Вставить переход</button>`;
      return `<li>${escapeHtml(notice.text)}${action}</li>`;
    }).join("");
  }

  function buildConnectionNotices() {
    const notices = [];
    for (let index = 0; index < state.sections.length - 1; index += 1) {
      const previousOutlet = getEffectiveOutletConnection(state.sections[index]);
      const nextInlet = getEffectiveInletConnection(state.sections[index + 1]);
      if (!previousOutlet.sizeA || !nextInlet.sizeA) {
        continue;
      }

      const shapeMismatch = previousOutlet.shape !== nextInlet.shape;
      const sizeMismatch = Math.abs(previousOutlet.sizeA - nextInlet.sizeA) > 0.000001;
      const secondSizeMismatch = previousOutlet.shape === "Rectangle" &&
        nextInlet.shape === "Rectangle" &&
        previousOutlet.sizeB != null &&
        nextInlet.sizeB != null &&
        Math.abs(previousOutlet.sizeB - nextInlet.sizeB) > 0.000001;

      if (shapeMismatch || sizeMismatch || secondSizeMismatch) {
        notices.push({
          text: `Между блоками ${index + 1} и ${index + 2} меняется форма или размер сечения. Можно вставить переход-конфузор/диффузор, чтобы не считать скачок как прямое соединение.`,
          actionIndex: index
        });
      }
    }

    return notices;
  }

  function handleNoticeAction(event) {
    const button = event.target.closest("[data-insert-transition-after]");
    if (!button) {
      return;
    }

    const index = parseInt(button.dataset.insertTransitionAfter, 10);
    if (Number.isNaN(index)) {
      return;
    }

    insertTransitionBetween(index);
  }

  function resetPreviewWidgets() {
    elements.previewEmpty.classList.remove("d-none");
    elements.liveResultsWrapper.classList.add("d-none");
    elements.metricTotal.textContent = "0 Па";
    elements.metricFriction.textContent = "0 Па";
    elements.metricLocal.textContent = "0 Па";
    elements.metricGeometric.textContent = "0 Па";
    elements.metricLength.textContent = "0 м";
    elements.metricVelocity.textContent = "0 м/с";
    elements.metricCritical.textContent = "—";
    elements.efficiencyLabel.textContent = "Ожидается расчёт";
    renderRecommendations([]);
    renderNotices([]);
    updateHeightSummary();
  }

  function setPreviewStatus(text, toneClass) {
    elements.previewStatus.textContent = text;
    elements.previewStatus.className = "status-badge";
    if (toneClass) {
      elements.previewStatus.classList.add(toneClass);
    }
  }

  function updateHeightSummary(totalHeightFromSummary) {
    const totalHeight = typeof totalHeightFromSummary === "number"
      ? totalHeightFromSummary
      : getRouteHeightDelta();

    if (Math.abs(totalHeight) < 0.0001) {
      elements.heightSummary.textContent = "Суммарный перепад высоты по текущему маршруту: 0.00 м.";
      updateGeometryPressurePanel(totalHeight);
      return;
    }

    const direction = totalHeight > 0 ? "подъём" : "снижение";
    elements.heightSummary.textContent = `Суммарный перепад высоты по текущему маршруту: ${formatNumber(totalHeight, 2)} м (${direction}).`;
    updateGeometryPressurePanel(totalHeight);
  }

  function getRouteHeightDelta() {
    return parseNumber(getBaseFieldValue("RouteHeightDelta"), 0) || 0;
  }

  function updateGeometryPressurePanel(totalHeight) {
    if (!elements.geometryPressureSummary || !elements.geometryPressureSignHint) {
      return;
    }

    if (!state.useGeometricPressure) {
      elements.geometryPressureSummary.textContent = "Учет выключен: геометрическая составляющая не добавляется к общим потерям.";
      elements.geometryPressureSignHint.textContent = "Включите блок, если конечная отметка трассы выше или ниже начальной и это нужно учесть в расчете.";
      return;
    }

    if (Math.abs(totalHeight) < 0.0001) {
      elements.geometryPressureSummary.textContent = "H = 0: конечная и начальная отметки совпадают, геометрическое давление не учитывается.";
      elements.geometryPressureSignHint.textContent = "Подъемы и спуски на одинаковую высоту взаимно компенсируются.";
      return;
    }

    if (totalHeight > 0) {
      elements.geometryPressureSummary.textContent = `H = ${formatNumber(totalHeight, 2)} м: конечная точка трассы выше начальной.`;
      elements.geometryPressureSignHint.textContent = "Горячие газы движутся вверх естественно, поэтому ΔPгеом считается со знаком минус и уменьшает общее сопротивление.";
      return;
    }

    elements.geometryPressureSummary.textContent = `H = ${formatNumber(totalHeight, 2)} м: конечная точка трассы ниже начальной.`;
    elements.geometryPressureSignHint.textContent = "Горячие газы приходится вести вниз, поэтому ΔPгеом считается со знаком плюс и увеличивает общее сопротивление.";
  }

  function toggleGeometryPressureAnalysis() {
    hydrateGeometryPressureWidget(!state.useGeometricPressure);
    updateAmbientAirDensity();
    updateHeightSummary();
    renderHiddenInputs();
    saveDraftSilently();
    schedulePreview();
  }

  function hydrateGeometryPressureWidget(isEnabled) {
    state.useGeometricPressure = Boolean(isEnabled);
    if (elements.geometricPressureBody) {
      elements.geometricPressureBody.classList.toggle("d-none", !state.useGeometricPressure);
    }
    if (elements.toggleGeometryPressureBtn) {
      elements.toggleGeometryPressureBtn.classList.toggle("btn-primary", state.useGeometricPressure);
      elements.toggleGeometryPressureBtn.classList.toggle("btn-outline-primary", !state.useGeometricPressure);
      elements.toggleGeometryPressureBtn.textContent = state.useGeometricPressure
        ? "Учет геометрического давления включен"
        : "Учитывать в расчете";
    }
  }

  function updateAmbientAirDensity() {
    if (!elements.ambientAirDensityValue) {
      return;
    }

    const density = calculateAmbientAirDensity();
    elements.ambientAirDensityValue.textContent = density == null
      ? "—"
      : `${formatNumber(density, 3)} кг/м³`;
  }

  function calculateAmbientAirDensity() {
    const temperature = getBaseFieldValue("AmbientAirTemperature");
    if (temperature == null) {
      return null;
    }

    const absoluteTemperature = temperature + 273.15;
    if (absoluteTemperature <= 0) {
      return null;
    }

    return getAirDensityReference() * 273.15 / absoluteTemperature;
  }

  function getAirDensityReference() {
    const value = Number(config.airDensityAtNormalConditions ?? config.AirDensityAtNormalConditions);
    return Number.isFinite(value) && value > 0 ? value : 1.293;
  }

  function updateGasCompositionSummary() {
    if (!elements.gasCompositionSummary) {
      return;
    }

    const sum = getGasCompositionSum();
    const percent = sum * 100;
    const isValid = Math.abs(sum - 1) <= gasCompositionTolerance;
    elements.gasCompositionSummary.textContent = `Сумма: ${formatNumber(percent, 1)}%`;
    elements.gasCompositionSummary.classList.toggle("is-error", !isValid);

    gasComponentFieldIds.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.classList.toggle("is-invalid", !isValid);
      }
    });
  }

  function getGasCompositionSum() {
    return gasComponentFieldIds.reduce((total, fieldId) => total + (getBaseFieldValue(fieldId) || 0), 0);
  }

  function collectBlockingMessages() {
    syncConicalCollectorOutlets();
    const messages = [];
    const sum = getGasCompositionSum();
    if (sum > 1 + gasCompositionTolerance) {
      messages.push(`Сумма компонентов газа больше 100% (${formatNumber(sum * 100, 1)}%). Сформировать отчет невозможно.`);
    } else if (sum < 1 - gasCompositionTolerance) {
      messages.push(`Сумма компонентов газа меньше 100% (${formatNumber(sum * 100, 1)}%). Сформировать отчет невозможно.`);
    }

    if (state.useGeometricPressure && calculateAmbientAirDensity() == null) {
      messages.push("Учет геометрического давления включен, но температура наружного воздуха задана некорректно.");
    }

    state.sections.forEach((section, index) => {
      const title = getSectionTitle(section, index + 1);
      if (requiresSectionLength(section) && parseNumber(getSectionBaseValue(section, "length"), null) == null) {
        messages.push(`Поле «Длина элемента» в блоке «${title}» не заполнено. Без длины невозможно сформировать корректный отчет.`);
      }

      if (parseNumber(getSectionBaseValue(section, "diameter"), null) == null) {
        messages.push(`Поле «${getEntrySizeLabel(section)}» в блоке «${title}» не заполнено.`);
      }

      if (normalizeShape(section.crossSectionShape) === "Rectangle" &&
          parseNumber(getSectionBaseValue(section, "diameterB"), null) == null) {
        messages.push(`Поле «${getEntrySizeBLabel(section)}» в блоке «${title}» не заполнено.`);
      }

      if (section.kind === "Contraction" || section.kind === "Expansion") {
        const outletShape = normalizeShape(section.outletCrossSectionShape || section.crossSectionShape);
        if (parseNumber(getSectionBaseValue(section, "outletDiameter"), null) == null) {
          messages.push(`Поле «${getOutletSizeLabel({ kind: section.kind, crossSectionShape: outletShape })}» в блоке «${title}» не заполнено.`);
        }

        if (outletShape === "Rectangle" &&
            parseNumber(getSectionBaseValue(section, "outletDiameterB"), null) == null) {
          messages.push(`Поле «${getOutletSizeBLabel({ crossSectionShape: outletShape })}» в блоке «${title}» не заполнено.`);
        }
      }

      if (isKmsAdjustableSection(section)) {
        if (section.useCustomLrc && parseNumber(section.customLrc, null) == null) {
          messages.push(`В блоке «${title}» разблокирован КМС, но пользовательское значение не введено.`);
        }
      }

      if (!section.useCustomLrc && section.kind === "Bend" && calculateBendDiagram61Context(section).zeta == null) {
        messages.push(`В блоке «${title}» для поворота по диаграмме 6-1 укажите угол δ, радиус отвода R₀, размеры сечения, расход и температуру газа.`);
      }

      if (!section.useCustomLrc && isRoundContractionGeometry(section) && calculateRoundContractionDiagram523Context(section).zeta == null) {
        messages.push(`В блоке «${title}» для сужения по диаграмме 5-23 укажите D₁, D₀ и длину l₀; D₀ должен быть меньше D₁.`);
      }

      if (!section.useCustomLrc && isTransitionContractionGeometry(section) && calculateTransitionContractionDiagram527Context(section).zeta == null) {
        messages.push(`В блоке «${title}» для перехода прямоугольник → круг по диаграмме 5-27 укажите a₁, b₁, D₀ и длину l; площадь круглого выхода F₀ должна быть меньше площади прямоугольного входа F₁.`);
      }

      if (!section.useCustomLrc && isRoundDiffuserGeometry(section) && calculateRoundDiffuserDiagram52Context(section).zeta == null) {
        messages.push(`В блоке «${title}» для диффузора по диаграмме 5-2 укажите D₀, D₁ и длину l; D₁ должен быть больше D₀, также должны быть заданы расход и температура газа.`);
      }

      if (!section.useCustomLrc && isRectangularDiffuserGeometry(section) && calculateRectangularDiffuserDiagram54Context(section).zeta == null) {
        messages.push(`В блоке «${title}» для диффузора по диаграмме 5-4 укажите a₀, b₀, a₁, b₁ и длину l; выходное сечение должно быть больше входного, также должны быть заданы расход и температура газа.`);
      }

      if (!section.useCustomLrc && isTransitionDiffuserGeometry(section) && calculateTransitionDiffuserDiagram528Context(section).zeta == null) {
        messages.push(`В блоке «${title}» для переходного диффузора по диаграмме 5-28 укажите входное и выходное сечения, длину lд; выходная площадь F₁ должна быть больше входной F₀, также должны быть заданы расход и температура газа.`);
      }

      if (section.kind === "LocalResistance") {
        if (!section.useCustomLrc && !section.localResistanceType) {
          messages.push(`В блоке «${title}» не выбран тип местного сопротивления для автоматического расчета КМС.`);
        }

        if (!section.useCustomLrc && section.localResistanceType) {
          const resistanceItem = getLocalResistanceItem(section.localResistanceType);
          const isConical = isConicalCollectorType(section.localResistanceType);
          const isPipeEntrance = isStraightPipeEntranceType(section.localResistanceType);
          const isFlushWallEntrance = isFlushWallEntranceType(section.localResistanceType);
          const isPassingFlowEntrance = isPassingFlowEntranceType(section.localResistanceType);
          const isArcWithoutScreen = isArcCollectorWithoutScreenType(section.localResistanceType);
          const isArcWithScreen = isArcCollectorWithScreenType(section.localResistanceType);
          const isRostrum = isRostrumCollectorType(section.localResistanceType);
          const isSuddenExpansion = isSuddenExpansionType(section.localResistanceType);
          const resistanceContext = getResistanceParameterContext(section, resistanceItem);
          if (!resistanceItem) {
            messages.push(`В блоке «${title}» для типа «${section.localResistanceType}» не найдено значение КМС в таблице LRCs.`);
          } else if (isTabularResistance(resistanceItem) &&
              (resistanceContext.rawParamX == null || resistanceContext.rawParamY == null)) {
            messages.push(isConical
              ? `В блоке «${title}» для конического коллектора укажите выходной диаметр d₀, длину раструба l и угол α.`
              : isPipeEntrance
                ? `В блоке «${title}» для входа в прямую трубу укажите диаметр Dг, расстояние b и толщину кромки δ₁.`
                : isArcWithoutScreen
                  ? `В блоке «${title}» укажите диаметр Dг и радиус закругления r.`
                : isArcWithScreen
                  ? `В блоке «${title}» укажите диаметр Dг, расстояние h и радиус закругления r.`
                : isRostrum
                  ? `В блоке «${title}» укажите диаметр Dг, длину раструба l и угол α.`
                : isSuddenExpansion
                  ? `В блоке «${title}» укажите входной диаметр D₀ и выходной диаметр D₂.`
                : isFlushWallEntrance
                  ? `В блоке «${title}» укажите угол δ, длину входного участка l и характерный размер a.`
                : isPassingFlowEntrance
                  ? `В блоке «${title}» укажите скорость внешнего потока w∞ и угол δ.`
                  : `В блоке «${title}» для табличного сопротивления «${section.localResistanceType}» укажите угол α и отношение l/d₀.`);
          } else if (isSuddenExpansion && getLocalResistanceValue(section) == null) {
            messages.push(`В блоке «${title}» для внезапного расширения выходной диаметр D₂ должен быть больше входного D₀.`);
          } else if (getLocalResistanceValue(section) == null) {
            messages.push(`В блоке «${title}» параметры сопротивления «${section.localResistanceType}» не попадают в расчетную таблицу LRCs.`);
          }
        }
      }
    });

    return messages;
  }

  async function savePreset() {
    const name = (elements.presetName.value || "").trim();
    if (!name) {
      setPresetStatus("Укажите название заготовки перед сохранением.", true);
      return;
    }

    const payloadModel = buildApiModel();
    if (!payloadModel) {
      setPresetStatus("Для сохранения заготовки сначала заполните основные числовые параметры трассы.", true);
      return;
    }

    try {
      const response = await fetch("/Home/SavePreset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name,
          model: payloadModel
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        if (response.status === 401) {
          const preset = saveGuestPreset(name, payloadModel);
          hydratePresetSelect(preset.id);
          elements.presetName.value = "";
          setPresetStatus("Гостевая заготовка сохранена в браузере. После входа она перенесется в профиль.");
          return;
        }

        setPresetStatus(data.error || "Не удалось сохранить заготовку.", true);
        return;
      }

      state.presets = Array.isArray(data.presets) ? data.presets : state.presets.filter((preset) => !isGuestPresetId(readProp(preset, "id", "Id")));
      hydratePresetSelect(data.presetId);
      elements.presetName.value = "";
      setPresetStatus("Заготовка сохранена в базе данных пользователя.");
    } catch (_error) {
      const preset = saveGuestPreset(name, payloadModel);
      hydratePresetSelect(preset.id);
      elements.presetName.value = "";
      setPresetStatus("Сервер недоступен, поэтому заготовка сохранена как гостевая в браузере.");
    }
  }

  async function loadPreset() {
    const presetId = elements.presetSelect.value;
    if (!presetId) {
      setPresetStatus("Сначала выберите сохранённую заготовку.", true);
      return;
    }

    if (isGuestPresetId(presetId)) {
      const preset = state.presets.find((item) => String(readProp(item, "id", "Id")) === presetId);
      if (!preset || !preset.model) {
        setPresetStatus("Гостевая заготовка не найдена.", true);
        return;
      }

      applySnapshot({
        form: mapModelToDraftForm(preset.model),
        sections: readProp(preset.model, "sections", "Sections") || [],
        selectedId: null
      }, `Гостевая заготовка «${preset.name || "без названия"}» загружена в редактор.`);

      hydratePresetSelect(presetId);
      return;
    }

    try {
      const response = await fetch(`/Home/GetPreset?id=${encodeURIComponent(presetId)}`);
      const data = await response.json();
      if (!response.ok) {
        setPresetStatus(data.error || "Не удалось загрузить заготовку.", true);
        return;
      }

      applySnapshot({
        form: mapModelToDraftForm(data.model),
        sections: readProp(data.model, "sections", "Sections") || [],
        selectedId: null
      }, `Заготовка «${data.name || "без названия"}» загружена в редактор.`);

      hydratePresetSelect(presetId);
    } catch (_error) {
      setPresetStatus("Не удалось загрузить заготовку.", true);
    }
  }

  async function deletePreset() {
    const presetId = elements.presetSelect.value;
    if (!presetId) {
      setPresetStatus("Выберите заготовку, которую нужно удалить.", true);
      return;
    }

    if (isGuestPresetId(presetId)) {
      deleteGuestPreset(presetId);
      hydratePresetSelect("");
      setPresetStatus("Гостевая заготовка удалена из браузера.");
      return;
    }

    try {
      const response = await fetch(`/Home/DeletePreset?id=${encodeURIComponent(presetId)}`, {
        method: "POST"
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setPresetStatus(data.error || "Не удалось удалить заготовку.", true);
        return;
      }

      state.presets = Array.isArray(data.presets) ? data.presets : [];
      hydratePresetSelect("");
      setPresetStatus("Заготовка удалена из базы данных.");
    } catch (_error) {
      setPresetStatus("Не удалось удалить заготовку.", true);
    }
  }

  function clearDraft() {
    window.localStorage.removeItem(draftKey);
    window.location.href = "/Home/Calc";
  }

  function loadGuestPresets() {
    try {
      const raw = window.localStorage.getItem(guestPresetKey);
      const presets = raw ? JSON.parse(raw) : [];
      return Array.isArray(presets) ? presets : [];
    } catch (_error) {
      return [];
    }
  }

  function saveGuestPreset(name, model) {
    const presets = loadGuestPresets();
    const now = new Date().toISOString();
    const preset = {
      id: `guest:${Date.now()}`,
      name,
      model,
      updatedAtLocal: now
    };

    const existingIndex = presets.findIndex((item) => item && item.name === name);
    if (existingIndex >= 0) {
      preset.id = presets[existingIndex].id || preset.id;
      presets[existingIndex] = preset;
    } else {
      presets.unshift(preset);
    }

    window.localStorage.setItem(guestPresetKey, JSON.stringify(presets));
    state.presets = state.presets.filter((item) => !isGuestPresetId(readProp(item, "id", "Id"))).concat(presets);
    return preset;
  }

  function deleteGuestPreset(id) {
    const presets = loadGuestPresets().filter((item) => String(item.id) !== String(id));
    window.localStorage.setItem(guestPresetKey, JSON.stringify(presets));
    state.presets = state.presets.filter((item) => String(readProp(item, "id", "Id")) !== String(id));
  }

  function isGuestPresetId(id) {
    return String(id || "").startsWith("guest:");
  }

  function hydratePresetSelect(selectedId) {
    if (!elements.presetSelect) {
      return;
    }

    const currentValue = selectedId == null ? elements.presetSelect.value : String(selectedId);
    elements.presetSelect.innerHTML = ['<option value="">Выберите заготовку</option>']
      .concat(state.presets.map((preset) => {
        const id = readProp(preset, "id", "Id");
        const name = readProp(preset, "name", "Name") || "Без названия";
        const updatedAt = formatPresetDate(
          readProp(preset, "updatedAtUtc", "UpdatedAtUtc") ||
          readProp(preset, "updatedAtLocal", "UpdatedAtLocal")
        );
        return `<option value="${escapeAttr(String(id))}">${escapeHtml(updatedAt ? `${name} (${updatedAt})` : name)}</option>`;
      }))
      .join("");

    if (currentValue) {
      elements.presetSelect.value = String(currentValue);
    }
  }

  function setPresetStatus(message, isError) {
    elements.presetStatus.textContent = message;
    elements.presetStatus.style.color = isError ? "var(--danger)" : "var(--muted)";
  }

  function formatPresetDate(value) {
    if (!value) {
      return "";
    }

    const raw = String(value);
    if (/^\d{2}\.\d{2}\.\d{4}/.test(raw)) {
      return raw;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return raw;
    }

    if (typeof window.formatUserLocalDateTime === "function") {
      return window.formatUserLocalDateTime(parsed.toISOString());
    }

    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(parsed).replace(",", "");
  }

  function saveDraftSilently() {
    const snapshot = {
      form: collectDraftForm(),
      sections: state.sections,
      selectedId: state.selectedId
    };

    window.localStorage.setItem(draftKey, JSON.stringify(snapshot));
  }

  function loadDraft() {
    try {
      const raw = window.localStorage.getItem(draftKey);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function applySnapshot(snapshot, statusMessage) {
    if (!snapshot) {
      return;
    }

    applyDraftForm(snapshot.form || {});
    state.sections = normalizeSections(snapshot.sections);
    state.selectedId = state.sections.some((section) => section.id === snapshot.selectedId)
      ? snapshot.selectedId
      : (state.sections[0] ? state.sections[0].id : null);

    renderAll({ schedulePreview: true, saveDraft: true });
    setPresetStatus(statusMessage);
  }

  function collectDraftForm() {
    return {
      tgasInitial: getFieldValue("TgasInitial"),
      temperatureLossPerMeter: getFieldValue("TemperatureLossPerMeter"),
      gasFlow: getFieldValue("GasFlow"),
      optimizationGoal: getFieldValue("OptimizationGoal"),
      materialType: getFieldValue("MaterialType"),
      surfaceCondition: getFieldValue("SurfaceCondition"),
      useCustomRoughness: elements.useCustomRoughness.checked,
      customRoughness: getFieldValue("CustomRoughness"),
      useGeometricPressure: state.useGeometricPressure,
      routeHeightDelta: getFieldValue("RouteHeightDelta"),
      ambientAirTemperature: getFieldValue("AmbientAirTemperature"),
      yN2: getFieldValue("Y_N2"),
      yO2: getFieldValue("Y_O2"),
      yCO2: getFieldValue("Y_CO2"),
      yH2O: getFieldValue("Y_H2O"),
      units: collectGlobalUnits()
    };
  }

  function applyDraftForm(formValues) {
    applyGlobalUnits(formValues.units || {});
    setFieldValue("TgasInitial", formValues.tgasInitial);
    setFieldValue("TemperatureLossPerMeter", formValues.temperatureLossPerMeter);
    setFieldValue("GasFlow", formValues.gasFlow);
    setFieldValue("OptimizationGoal", formValues.optimizationGoal);
    setFieldValue("MaterialType", formValues.materialType || elements.globalMaterialType.value);
    syncGlobalSurfaceOptions(formValues.surfaceCondition);
    elements.useCustomRoughness.checked = Boolean(formValues.useCustomRoughness);
    toggleGlobalRoughnessField();
    setFieldValue("CustomRoughness", formValues.customRoughness);
    setFieldValue("Y_N2", formValues.yN2);
    setFieldValue("Y_O2", formValues.yO2);
    setFieldValue("Y_CO2", formValues.yCO2);
    setFieldValue("Y_H2O", formValues.yH2O);
    hydrateGeometryPressureWidget(Boolean(formValues.useGeometricPressure));
    setFieldValue("RouteHeightDelta", formValues.routeHeightDelta);
    setFieldValue("AmbientAirTemperature", formValues.ambientAirTemperature);
    updateAmbientAirDensity();
    updateHeightSummary();
    updateGasCompositionSummary();
    updateGlobalRoughnessSummary();
  }

  function resetStaticFormToDefaults() {
    form.reset();
    syncGlobalSurfaceOptions();
    toggleGlobalRoughnessField();
    initUnitSelectors();
    hydrateGeometryPressureWidget(false);
    updateAmbientAirDensity();
    updateGasCompositionSummary();
    updateGlobalRoughnessSummary();
    setPreviewStatus("Ожидание расчёта", "");
    showValidationMessages([]);
  }

  function buildApiModel() {
    syncConicalCollectorOutlets();
    const tgasInitial = getBaseFieldValue("TgasInitial");
    const temperatureLossPerMeter = getBaseFieldValue("TemperatureLossPerMeter");
    const gasFlow = getBaseFieldValue("GasFlow");

    if (tgasInitial == null || temperatureLossPerMeter == null || gasFlow == null) {
      return null;
    }

    const totalHeight = getRouteHeightDelta();

    return {
      CurrentCalculationId: parseNumber(getFieldValue("CurrentCalculationId"), null),
      CurrentCalculationName: getFieldValue("CurrentCalculationName") || null,
      TgasInitial: tgasInitial,
      TgasInitialUnit: getFieldUnit("TgasInitial"),
      TemperatureLossPerMeter: temperatureLossPerMeter,
      GasFlow: gasFlow,
      GasFlowUnit: getFieldUnit("GasFlow"),
      OptimizationGoal: getFieldValue("OptimizationGoal"),
      MaterialType: getGlobalMaterial(),
      SurfaceCondition: getGlobalSurfaceCondition(),
      UseCustomRoughness: elements.useCustomRoughness.checked,
      CustomRoughness: getBaseFieldValue("CustomRoughness"),
      CustomRoughnessUnit: getFieldUnit("CustomRoughness"),
      HeightDifference: Math.abs(totalHeight),
      HeightDirection: totalHeight > 0 ? "up" : totalHeight < 0 ? "down" : "none",
      UseGeometricPressure: state.useGeometricPressure,
      AmbientAirTemperature: getBaseFieldValue("AmbientAirTemperature"),
      AmbientAirTemperatureUnit: getFieldUnit("AmbientAirTemperature"),
      AmbientAirDensity: calculateAmbientAirDensity(),
      AirDensityAtNormalConditions: getAirDensityReference(),
      Y_N2: getBaseFieldValue("Y_N2"),
      Y_N2Unit: getFieldUnit("Y_N2"),
      Y_O2: getBaseFieldValue("Y_O2"),
      Y_O2Unit: getFieldUnit("Y_O2"),
      Y_CO2: getBaseFieldValue("Y_CO2"),
      Y_CO2Unit: getFieldUnit("Y_CO2"),
      Y_H2O: getBaseFieldValue("Y_H2O"),
      Y_H2OUnit: getFieldUnit("Y_H2O"),
      Sections: state.sections.map((section, index) => {
        updateDerivedLocalResistanceParams(section);
        return {
          SectionKind: section.kind,
          CrossSectionShape: section.crossSectionShape,
          OutletCrossSectionShape: section.outletCrossSectionShape || section.crossSectionShape,
          BlockTitle: section.blockTitle || null,
          Diameter: parseNumber(getSectionBaseValue(section, "diameter"), null),
          DiameterUnit: getSectionUnit(section, "diameter"),
          DiameterB: parseNumber(getSectionBaseValue(section, "diameterB"), null),
          DiameterBUnit: getSectionUnit(section, "diameterB"),
          OutletDiameter: parseNumber(getSectionBaseValue(section, "outletDiameter"), null),
          OutletDiameterUnit: getSectionUnit(section, "outletDiameter"),
          OutletDiameterB: parseNumber(getSectionBaseValue(section, "outletDiameterB"), null),
          OutletDiameterBUnit: getSectionUnit(section, "outletDiameterB"),
          Length: parseNumber(getSectionBaseValue(section, "length"), null),
          LengthUnit: getSectionUnit(section, "length"),
          TemperatureLossPerMeter: parseNumber(getSectionBaseValue(section, "temperatureLossPerMeter"), null),
          TemperatureLossUnit: getSectionUnit(section, "temperatureLossPerMeter"),
          TurnAngle: parseNumber(getSectionBaseValue(section, "turnAngle"), null),
          TurnAngleUnit: getSectionUnit(section, "turnAngle"),
          HeightDelta: index === 0 ? totalHeight : 0,
          HeightDeltaUnit: "m",
          LocalResistanceType: section.localResistanceType || null,
          LocalResistanceParamX: parseNumber(getLocalResistanceParamXForSubmit(section), null),
          LocalResistanceParamY: parseNumber(getLocalResistanceParamYForSubmit(section), null),
          CustomLRC: parseNumber(section.customLrc, null),
          UseCustomLRC: section.useCustomLrc,
          UseIndividualMaterial: section.useIndividualMaterial,
          MaterialType: section.materialType || null,
          SurfaceCondition: section.surfaceCondition || null,
          UseCustomRoughness: section.useCustomRoughness,
          CustomRoughness: parseNumber(getSectionBaseValue(section, "customRoughness"), null),
          CustomRoughnessUnit: getSectionUnit(section, "customRoughness")
        };
      })
    };
  }

  function mapModelToDraftForm(model) {
    const units = {
      TgasInitial: readProp(model, "tgasInitialUnit", "TgasInitialUnit") || "c",
      GasFlow: readProp(model, "gasFlowUnit", "GasFlowUnit") || "m3s",
      CustomRoughness: readProp(model, "customRoughnessUnit", "CustomRoughnessUnit") || "m",
      AmbientAirTemperature: readProp(model, "ambientAirTemperatureUnit", "AmbientAirTemperatureUnit") || "c",
      RouteHeightDelta: "m",
      Y_N2: readProp(model, "y_N2Unit", "Y_N2Unit") || "fraction",
      Y_O2: readProp(model, "y_O2Unit", "Y_O2Unit") || "fraction",
      Y_CO2: readProp(model, "y_CO2Unit", "Y_CO2Unit") || "fraction",
      Y_H2O: readProp(model, "y_H2OUnit", "Y_H2OUnit") || "fraction"
    };
    const heightDifference = parseNumber(readProp(model, "heightDifference", "HeightDifference"), 0) || 0;
    const heightDirection = readProp(model, "heightDirection", "HeightDirection");
    const sectionHeight = (readProp(model, "sections", "Sections") || [])
      .reduce((sum, section) => sum + (parseNumber(readProp(section, "heightDelta", "HeightDelta"), 0) || 0), 0);
    const routeHeightDelta = heightDirection === "down"
      ? -heightDifference
      : heightDirection === "up"
        ? heightDifference
        : sectionHeight;

    return {
      tgasInitial: formatDisplayFromBase(readProp(model, "tgasInitial", "TgasInitial"), "c", units.TgasInitial),
      temperatureLossPerMeter: readProp(model, "temperatureLossPerMeter", "TemperatureLossPerMeter"),
      gasFlow: formatDisplayFromBase(readProp(model, "gasFlow", "GasFlow"), "m3s", units.GasFlow),
      optimizationGoal: readProp(model, "optimizationGoal", "OptimizationGoal"),
      materialType: readProp(model, "materialType", "MaterialType"),
      surfaceCondition: readProp(model, "surfaceCondition", "SurfaceCondition"),
      useCustomRoughness: readProp(model, "useCustomRoughness", "UseCustomRoughness"),
      customRoughness: formatDisplayFromBase(readProp(model, "customRoughness", "CustomRoughness"), "m", units.CustomRoughness),
      useGeometricPressure: readProp(model, "useGeometricPressure", "UseGeometricPressure"),
      routeHeightDelta: formatDisplayFromBase(routeHeightDelta, "m", units.RouteHeightDelta),
      ambientAirTemperature: formatDisplayFromBase(readProp(model, "ambientAirTemperature", "AmbientAirTemperature"), "c", units.AmbientAirTemperature),
      yN2: formatDisplayFromBase(readProp(model, "y_N2", "Y_N2"), "fraction", units.Y_N2),
      yO2: formatDisplayFromBase(readProp(model, "y_O2", "Y_O2"), "fraction", units.Y_O2),
      yCO2: formatDisplayFromBase(readProp(model, "y_CO2", "Y_CO2"), "fraction", units.Y_CO2),
      yH2O: formatDisplayFromBase(readProp(model, "y_H2O", "Y_H2O"), "fraction", units.Y_H2O),
      units
    };
  }

  function normalizeSections(sourceSections) {
    const items = Array.isArray(sourceSections) ? sourceSections : [];

    return items.map((rawSection) => ensureSection(normalizeSection(rawSection)));
  }

  function normalizeSection(rawSection) {
    const kind = normalizeKind(readProp(rawSection, "kind", "Kind", "sectionKind", "SectionKind"));
    const hasModelUnitProps = !readProp(rawSection, "units", "Units") && Boolean(readProp(rawSection, "diameterUnit", "DiameterUnit"));
    const normalized = {
      id: readProp(rawSection, "id", "Id") || createId(),
      kind: kind,
      crossSectionShape: sanitizeTextValue(readProp(rawSection, "crossSectionShape", "CrossSectionShape")),
      outletCrossSectionShape: sanitizeTextValue(readProp(rawSection, "outletCrossSectionShape", "OutletCrossSectionShape")),
      blockTitle: sanitizeTextValue(readProp(rawSection, "blockTitle", "BlockTitle")),
      diameter: sanitizeValue(readProp(rawSection, "diameter", "Diameter")),
      diameterB: sanitizeValue(readProp(rawSection, "diameterB", "DiameterB")),
      outletDiameter: sanitizeValue(readProp(rawSection, "outletDiameter", "OutletDiameter")),
      outletDiameterB: sanitizeValue(readProp(rawSection, "outletDiameterB", "OutletDiameterB")),
      length: sanitizeValue(readProp(rawSection, "length", "Length")),
      temperatureLossPerMeter: sanitizeValue(readProp(rawSection, "temperatureLossPerMeter", "TemperatureLossPerMeter")),
      turnAngle: sanitizeValue(readProp(rawSection, "turnAngle", "TurnAngle")),
      heightDelta: sanitizeValue(readProp(rawSection, "heightDelta", "HeightDelta")),
      localResistanceType: sanitizeTextValue(readProp(rawSection, "localResistanceType", "LocalResistanceType")),
      localResistanceParamX: sanitizeValue(readProp(rawSection, "localResistanceParamX", "LocalResistanceParamX")),
      localResistanceParamY: sanitizeValue(readProp(rawSection, "localResistanceParamY", "LocalResistanceParamY")),
      customLrc: sanitizeValue(readProp(rawSection, "customLrc", "CustomLRC")),
      useCustomLrc: Boolean(readProp(rawSection, "useCustomLrc", "UseCustomLRC")),
      useIndividualMaterial: Boolean(readProp(rawSection, "useIndividualMaterial", "UseIndividualMaterial")),
      materialType: sanitizeTextValue(readProp(rawSection, "materialType", "MaterialType")),
      surfaceCondition: sanitizeTextValue(readProp(rawSection, "surfaceCondition", "SurfaceCondition")),
      useCustomRoughness: Boolean(readProp(rawSection, "useCustomRoughness", "UseCustomRoughness")),
      customRoughness: sanitizeValue(readProp(rawSection, "customRoughness", "CustomRoughness")),
      units: normalizeSectionUnits(readProp(rawSection, "units", "Units") || mapSectionUnitProps(rawSection))
    };

    return hasModelUnitProps ? applySectionDisplayUnitsFromBase(normalized) : normalized;
  }

  function ensureSection(section) {
    const defaults = kindMeta[section.kind].createDefaults();
    section.units = normalizeSectionUnits(section.units);
    section.localResistanceType = canonicalizeLocalResistanceType(section.localResistanceType || defaults.localResistanceType || "");
    section.crossSectionShape = normalizeShape(section.crossSectionShape);
    if (section.kind === "LocalResistance" &&
        (isConicalCollectorType(section.localResistanceType) || isStraightPipeEntranceType(section.localResistanceType))) {
      section.crossSectionShape = "Round";
    }
    section.outletCrossSectionShape = section.kind === "Contraction" || section.kind === "Expansion"
      ? normalizeShape(section.outletCrossSectionShape || section.crossSectionShape)
      : section.crossSectionShape;
    section.diameter = section.diameter || defaults.diameter || "";
    if (section.crossSectionShape === "Rectangle") {
      section.diameterB = section.diameterB || section.diameter || defaults.diameter || "";
    } else {
      section.diameterB = "";
    }
    section.length = section.length || defaults.length || "";
    section.temperatureLossPerMeter = section.temperatureLossPerMeter || getFieldValue("TemperatureLossPerMeter") || "0.18";
    section.turnAngle = section.turnAngle || defaults.turnAngle || "";
    section.outletDiameter = section.outletDiameter || defaults.outletDiameter || "";
    if (section.outletCrossSectionShape === "Rectangle") {
      section.outletDiameterB = section.outletDiameterB || section.outletDiameter || section.diameterB || "";
    } else {
      section.outletDiameterB = "";
    }
    section.heightDelta = section.heightDelta || defaults.heightDelta || "0";
    section.materialType = section.materialType || getGlobalMaterial();

    const availableConditions = getSurfaceOptions(section.materialType);
    if (!availableConditions.includes(section.surfaceCondition)) {
      section.surfaceCondition = availableConditions[0] || "";
    }

    updateDerivedLocalResistanceParams(section);
    return section;
  }

  function createSection(kind, insertIndex) {
    const defaults = kindMeta[kind].createDefaults();
    const materialType = getGlobalMaterial();
    const conditions = getSurfaceOptions(materialType);
    const previous = typeof insertIndex === "number" && insertIndex > 0
      ? state.sections[insertIndex - 1]
      : null;
    const previousOutlet = previous ? getEffectiveOutletConnection(previous) : null;
    const inheritedUnits = previous ? normalizeSectionUnits(previous.units) : normalizeSectionUnits();
    const inheritedShape = previousOutlet ? previousOutlet.shape : "Round";
    const inheritedDiameter = previousOutlet && previousOutlet.sizeA != null
      ? formatForInput(convertValue(previousOutlet.sizeA, "m", inheritedUnits.diameter))
      : (defaults.diameter || "");
    const inheritedDiameterB = previousOutlet && previousOutlet.shape === "Rectangle" && previousOutlet.sizeB != null
      ? formatForInput(convertValue(previousOutlet.sizeB, "m", inheritedUnits.diameterB))
      : "";

    const section = ensureSection({
      id: createId(),
      kind: kind,
      crossSectionShape: inheritedShape,
      outletCrossSectionShape: inheritedShape,
      blockTitle: "",
      diameter: inheritedDiameter,
      diameterB: inheritedDiameterB,
      outletDiameter: defaults.outletDiameter || "",
      outletDiameterB: "",
      length: defaults.length || "",
      temperatureLossPerMeter: previous ? previous.temperatureLossPerMeter : (getFieldValue("TemperatureLossPerMeter") || "0.18"),
      turnAngle: defaults.turnAngle || "",
      heightDelta: defaults.heightDelta || "0",
      localResistanceType: defaults.localResistanceType || "",
      localResistanceParamX: "",
      localResistanceParamY: "",
      customLrc: "",
      useCustomLrc: false,
      useIndividualMaterial: previous ? previous.useIndividualMaterial : false,
      materialType: previous ? previous.materialType : materialType,
      surfaceCondition: previous ? previous.surfaceCondition : (conditions[0] || ""),
      useCustomRoughness: previous ? previous.useCustomRoughness : false,
      customRoughness: previous ? previous.customRoughness : "",
      units: normalizeSectionUnits(previous ? previous.units : null)
    });
    applyTabularParameterDefaults(section);
    return section;
  }

  function insertTransitionBetween(index) {
    if (index < 0 || index >= state.sections.length - 1) {
      return;
    }

    const previousOutlet = getEffectiveOutletConnection(state.sections[index]);
    const nextInlet = getEffectiveInletConnection(state.sections[index + 1]);
    if (!previousOutlet.sizeA || !nextInlet.sizeA) {
      return;
    }

    const inletArea = calculateConnectionArea(previousOutlet);
    const outletArea = calculateConnectionArea(nextInlet);
    const kind = outletArea < inletArea ? "Contraction" : "Expansion";
    const transition = createSection(kind, index + 1);
    transition.blockTitle = previousOutlet.shape === nextInlet.shape
      ? (kind === "Contraction" ? "Переход-сужение" : "Переход-расширение")
      : "Переход формы";
    transition.crossSectionShape = previousOutlet.shape;
    transition.outletCrossSectionShape = nextInlet.shape;
    setSectionDisplayValueFromBase(transition, "diameter", previousOutlet.sizeA);
    transition.diameterB = "";
    if (previousOutlet.shape === "Rectangle" && previousOutlet.sizeB != null) {
      setSectionDisplayValueFromBase(transition, "diameterB", previousOutlet.sizeB);
    }
    setSectionDisplayValueFromBase(transition, "outletDiameter", nextInlet.sizeA);
    transition.outletDiameterB = "";
    if (nextInlet.shape === "Rectangle" && nextInlet.sizeB != null) {
      setSectionDisplayValueFromBase(transition, "outletDiameterB", nextInlet.sizeB);
    }

    state.sections.splice(index + 1, 0, ensureSection(transition));
    state.selectedId = transition.id;
    renderAll({ schedulePreview: true, saveDraft: true });
  }

  function createId() {
    sectionCounter += 1;
    return `section-${Date.now()}-${sectionCounter}`;
  }

  function normalizeKind(value) {
    if (value === "Bend" || value === "Contraction" || value === "Expansion" || value === "LocalResistance") {
      return value;
    }

    if (value === "МС") {
      return "LocalResistance";
    }

    return "Straight";
  }

  function normalizeShape(value) {
    const normalizedValue = String(value || "").trim().toLowerCase();
    return normalizedValue === "rectangle" ||
      normalizedValue === "rectangular" ||
      normalizedValue === "square" ||
      normalizedValue === "прямоугольное" ||
      normalizedValue === "прямоугольный" ||
      normalizedValue === "квадратное" ||
      normalizedValue === "квадратный"
      ? "Rectangle"
      : "Round";
  }

  function translateShape(value) {
    return normalizeShape(value) === "Rectangle" ? "Прямоугольное" : "Круглое";
  }

  function getSelectedSection() {
    return state.sections.find((section) => section.id === state.selectedId) || null;
  }

  function getSectionTitle(section, fallbackNumber) {
    return section.blockTitle || `${kindMeta[section.kind].label} ${fallbackNumber}`;
  }

  function getEntrySizeLabel(section) {
    if (section && section.kind === "Bend") {
      return normalizeShape(section.crossSectionShape) === "Rectangle"
        ? "Сторона a₀ входа"
        : "Диаметр D₀";
    }

    if (isRoundContractionGeometry(section)) {
      return "Входной диаметр D₁";
    }

    if (isRoundDiffuserGeometry(section)) {
      return "Входной диаметр D₀";
    }

    if (isConicalCollectorSection(section)) {
      return "Выходной диаметр d₀";
    }

    if (isFlushWallEntranceSection(section)) {
      return "Характерный размер a";
    }

    if (isStraightPipeEntranceSection(section)) {
      return "Диаметр Dг";
    }

    if (isSuddenExpansionSection(section)) {
      return "Входной диаметр D₀";
    }

    if (isArcCollectorSection(section) || isRostrumCollectorSection(section)) {
      return "Диаметр Dг";
    }

    return normalizeShape(section.crossSectionShape) === "Rectangle"
      ? "Сторона a входа"
      : "Входной диаметр";
  }

  function getEntrySizeHint(section, fallbackHint) {
    if (isConicalCollectorSection(section)) {
      return {
        title: "Параметры сечения",
        essence: "Элемент всегда имеет круглое сечение. Значение d₀ определяет диаметр всей последующей трассы.",
        logic: "При добавлении нового блока параметры копируются автоматически, но остаются доступными для ручного изменения в каждом отдельном узле."
      };
    }

    if (isStraightPipeEntranceSection(section)) {
      return {
        title: "Диаметр прямой трубы",
        essence: "Dг — диаметр трубы постоянного поперечного сечения, в которую входит поток.",
        logic: "По этому диаметру программа автоматически считает отношения b/Dг и δ₁/Dг для выбора КМС из таблицы."
      };
    }

    if (isFlushWallEntranceSection(section)) {
      return {
        title: "Характерный размер a",
        essence: "a — размер входного отверстия, с которым сравнивается длина входного участка l.",
        logic: "Для круглого сечения a принимается как диаметр отверстия, для прямоугольного — как основная сторона входного сечения. Программа автоматически считает l/a."
      };
    }

    if (isArcCollectorSection(section)) {
      return {
        title: "Диаметр Dг",
        essence: "Dг — расчетный диаметр входного сечения коллектора.",
        logic: "По этому диаметру программа автоматически считает отношения r/Dг и h/Dг для выбора КМС из таблицы."
      };
    }

    if (isRostrumCollectorSection(section)) {
      return {
        title: "Диаметр Dг",
        essence: "Dг — расчетный диаметр сечения на выходе раструба.",
        logic: "По нему программа считает отношение l/Dг, которое используется в табличном КМС."
      };
    }

    if (isSuddenExpansionSection(section)) {
      return {
        title: "Входной диаметр D₀",
        essence: "D₀ — диаметр узкого сечения перед внезапным расширением.",
        logic: "По D₀ и выходному диаметру D₂ программа считает площади F₀ и F₂, затем коэффициент ζ = (1 - F₀/F₂)²."
      };
    }

    return fallbackHint;
  }

  function getEntrySizeNote(section) {
    if (!isFlushWallEntranceSection(section)) {
      return "";
    }

    return "a — характерный размер входного отверстия: для круглого сечения это диаметр, для прямоугольного — сторона a.";
  }

  function getLengthLabel(section) {
    if (isRoundContractionGeometry(section)) {
      return "Длина конфузора l₀";
    }

    if (isTransitionContractionGeometry(section)) {
      return "Длина перехода l";
    }

    if (isRoundDiffuserGeometry(section)) {
      return "Длина диффузора l";
    }

    return isConicalCollectorSection(section) || isRostrumCollectorSection(section)
      ? "Длина раструба l"
      : "Длина элемента";
  }

  function getLengthHint(section) {
    return isRoundContractionGeometry(section)
      ? "Длина конфузора нужна для расчета угла сужения α по диаграмме 5-23."
      : section && section.kind === "Bend"
      ? "Длина используется для протяженности и теплопотерь блока. КМС по диаграмме 6-1 считает трение в отводе через R₀ и δ, поэтому отдельная потеря на трение по длине поворота не добавляется."
      : isTransitionContractionGeometry(section)
      ? "Длина перехода нужна для расчета l/D₀ и коэффициента c₁к по диаграмме 5-27."
      : isRoundDiffuserGeometry(section)
      ? "Длина диффузора нужна для расчета угла раскрытия α по диаграмме 5-2."
      : isConicalCollectorSection(section)
      ? "Длина раструба нужна для автоматического расчета отношения l/d₀ по таблице КМС."
      : isRostrumCollectorSection(section)
      ? "Длина раструба нужна для автоматического расчета отношения l/Dг по таблице КМС."
      : "Длина нужна для расчёта потерь на трение и итоговой протяжённости маршрута.";
  }

  function requiresSectionLength(section) {
    return !isEntranceWithoutRouteLengthSection(section);
  }

  function getEntrySizeBLabel(section) {
    if (section && section.kind === "Bend") {
      return "Сторона b₀ входа";
    }

    return normalizeShape(section.crossSectionShape) === "Rectangle"
      ? "Сторона b входа"
      : "Вторая сторона входа";
  }

  function getOutletSizeLabel(section) {
    if (section &&
        section.kind === "Contraction" &&
        normalizeShape(section.crossSectionShape) === "Round") {
      return "Выходной диаметр D₀";
    }

    if (section && section.kind === "Expansion" && normalizeShape(section.crossSectionShape) === "Round") {
      return "Выходной диаметр D₁";
    }

    return normalizeShape(section.crossSectionShape) === "Rectangle"
      ? "Сторона a выхода"
      : "Выходной диаметр";
  }

  function getOutletSizeBLabel(section) {
    return normalizeShape(section.crossSectionShape) === "Rectangle"
      ? "Сторона b выхода"
      : "Вторая сторона выхода";
  }

  function describeNodeMeta(section) {
    const parts = [];
    const shape = normalizeShape(section.crossSectionShape);
    parts.push(translateShape(shape));

    if (section.diameter) {
      if (shape === "Rectangle") {
        parts.push(`a×b ${section.diameter}×${section.diameterB || "?"} ${getUnitLabel(getSectionUnit(section, "diameter"))}`);
      } else if (isFlushWallEntranceSection(section)) {
        parts.push(`a ${section.diameter} ${getUnitLabel(getSectionUnit(section, "diameter"))}`);
      } else if (isConicalCollectorSection(section)) {
        parts.push(`d₀ ${section.diameter} ${getUnitLabel(getSectionUnit(section, "diameter"))}`);
      } else {
        parts.push(`D ${section.diameter} ${getUnitLabel(getSectionUnit(section, "diameter"))}`);
      }
    }
    if ((section.kind === "Straight" || isConicalCollectorSection(section)) && section.length) {
      parts.push(`L ${section.length} ${getUnitLabel(getSectionUnit(section, "length"))}`);
    }
    if ((section.kind === "Contraction" || section.kind === "Expansion") && section.outletDiameter) {
      const outletShape = normalizeShape(section.outletCrossSectionShape || shape);
      if (outletShape === "Rectangle") {
        parts.push(`a×b вых ${section.outletDiameter}×${section.outletDiameterB || "?"} ${getUnitLabel(getSectionUnit(section, "outletDiameter"))}`);
      } else {
        parts.push(`Dвых ${section.outletDiameter} ${getUnitLabel(getSectionUnit(section, "outletDiameter"))}`);
      }
    }
    if (section.temperatureLossPerMeter) {
      parts.push(`ΔT ${section.temperatureLossPerMeter} ${getUnitLabel(getSectionUnit(section, "temperatureLossPerMeter"))}`);
    }
    if (section.kind === "Bend" && section.turnAngle) {
      parts.push(`${section.turnAngle}${getUnitLabel(getSectionUnit(section, "turnAngle"))}`);
    }
    if (isKmsAdjustableSection(section) && section.kind !== "LocalResistance" && section.useCustomLrc && section.customLrc) {
      parts.push(`ζ ${section.customLrc}`);
    }
    if (section.kind === "LocalResistance") {
      parts.push(section.useCustomLrc && section.customLrc ? `ζ ${section.customLrc}` : (section.localResistanceType || "справочник"));
    }

    return parts.length ? parts.join(" · ") : "Нажмите на блок, чтобы задать параметры";
  }

  function renderToggle(field, checked, label) {
    return [
      '<label class="section-toggle-card">',
      `<input class="form-check-input" type="checkbox" data-field="${field}" ${checked ? "checked" : ""}>`,
      `<span>${escapeHtml(label)}</span>`,
      "</label>"
    ].join("");
  }

  function renderTextField(label, field, value, placeholder, fullWidth) {
    return renderRawField(
      label,
      `<input class="form-control" type="text" data-field="${field}" value="${escapeAttr(value || "")}" placeholder="${escapeAttr(placeholder || "")}" maxlength="120">`,
      "",
      fullWidth
    );
  }

  function renderNumberField(label, field, value, step, min, max, hint, unitOptions, readonly, note) {
    const attrs = [
      'class="form-control"',
      'type="text"',
      'inputmode="decimal"',
      `data-field="${field}"`,
      `value="${escapeAttr(value || "")}"`,
      step ? `step="${step}"` : "",
      min !== "" && min != null ? `min="${min}"` : "",
      max !== "" && max != null ? `max="${max}"` : "",
      readonly ? "readonly" : ""
    ].filter(Boolean).join(" ");
    const inputHtml = `<input ${attrs}>`;

    if (!unitOptions) {
      return renderRawField(label, inputHtml, hint, false, note);
    }

    return renderRawField(
      label,
      [
        '<div class="unit-input-row">',
        inputHtml,
        `<select class="form-select unit-select" data-unit-field="${field}" data-current-unit="${escapeAttr(unitOptions.current)}">${renderNamedOptions(unitOptions.options, unitOptions.current)}</select>`,
        "</div>"
      ].join(""),
      hint,
      false,
      note
    );
  }

  function renderElementKmsFields(section) {
    const isBendDiagram = isBendDiagram61Section(section);
    const isRoundContraction = isRoundContractionDiagram523Section(section);
    const isTransitionContraction = isTransitionContractionDiagram527Section(section);
    const isRoundDiffuser = isRoundDiffuserDiagram52Section(section);
    const isRectangularDiffuser = isRectangularDiffuserDiagram54Section(section);
    const isTransitionDiffuser = isTransitionDiffuserDiagram528Section(section);
    const hasGuide = !section.useCustomLrc && (isBendDiagram || isRoundContraction || isTransitionContraction || isRoundDiffuser || isRectangularDiffuser || isTransitionDiffuser);
    const guideButton = hasGuide
      ? [
          '<button type="button" class="kms-guide-button" data-open-resistance-table aria-haspopup="dialog" aria-label="Открыть таблицу КМС" title="Открыть таблицу КМС">',
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
          '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z"></path>',
          '<path d="M4 9h16M4 14h16M9 4v16M15 4v16"></path>',
          "</svg>",
          "</button>"
        ].join("")
      : "";
    const zetaHint = section.useCustomLrc
      ? "Ручное значение будет использовано вместо автоматического коэффициента этого элемента."
      : isBendDiagram
      ? "Автоматический КМС отвода определяется по диаграмме 6-1 с учетом угла δ, радиуса R₀, формы сечения, Re и шероховатости."
      : isRoundContraction
      ? "Автоматический КМС круглого сужения определяется по диаграмме 5-23 с учетом α и n₀ = F₀/F₁; область применения справочника: Re ≥ 10⁵."
      : isTransitionContraction
      ? "Автоматический КМС перехода прямоугольник → круг определяется по диаграмме 5-27 для конфузорного перехода F₀ < F₁."
      : isRoundDiffuser
      ? "Автоматический КМС круглого диффузора определяется по диаграмме 5-2 с учетом α, F₁/F₀ и Re·10⁻⁵."
      : isRectangularDiffuser
      ? "Автоматический КМС прямоугольного диффузора определяется по диаграмме 5-4 с учетом α, F₁/F₀, Re·10⁻⁵ и режима входного потока l₀/Dг."
      : isTransitionDiffuser
      ? "Автоматический КМС переходного диффузора круг ↔ прямоугольник определяется по диаграмме 5-28: программа считает эквивалентный угол α и берет ζ по таблицам диаграммы 5-4."
      : section.kind === "Expansion"
      ? "Для справочной таблицы расширение должно быть полностью круглым или полностью прямоугольным. При переходе между формами КМС рассчитывается по отношению площадей."
      : section.kind === "Contraction"
      ? "Справочные таблицы доступны для круглого сужения (5-23) и перехода прямоугольник → круг (5-27). Для остальных сужений КМС рассчитывается по геометрии без справочной таблицы."
      : "Автоматический КМС рассчитывается по геометрии выбранного блока.";

    return [
      !section.useCustomLrc && isBendDiagram
        ? renderDerivedBendDiagram61RatiosField(section)
        : "",
      !section.useCustomLrc && isRoundContraction
        ? renderDerivedRoundContractionRatiosField(section)
        : "",
      !section.useCustomLrc && isTransitionContraction
        ? renderDerivedTransitionContractionRatiosField(section)
        : "",
      !section.useCustomLrc && isRoundDiffuser
        ? renderDerivedRoundDiffuserRatiosField(section)
        : "",
      !section.useCustomLrc && isRectangularDiffuser
        ? renderRectangularDiffuserProfileField(section)
        : "",
      !section.useCustomLrc && isRectangularDiffuser
        ? renderDerivedRectangularDiffuserRatiosField(section)
        : "",
      !section.useCustomLrc && isTransitionDiffuser
        ? renderRectangularDiffuserProfileField(section)
        : "",
      !section.useCustomLrc && isTransitionDiffuser
        ? renderDerivedTransitionDiffuserRatiosField(section)
        : "",
      !section.useCustomLrc && section.kind === "Expansion" && !isRoundDiffuser && !isRectangularDiffuser && !isTransitionDiffuser
        ? '<p class="inspector-note field-span-2">Справочные таблицы диффузоров доступны для круглого расширения (5-2), прямоугольного расширения (5-4) и переходного диффузора круг ↔ прямоугольник (5-28).</p>'
        : "",
      !section.useCustomLrc && section.kind === "Contraction" && !isRoundContraction && !isTransitionContraction
        ? '<p class="inspector-note field-span-2">Справочные таблицы сужений доступны для круглого конфузора (5-23) и перехода прямоугольник → круг (5-27). Для выбранной геометрии оставлен автоматический расчет по площадям.</p>'
        : "",
      renderKmsValueField(section, guideButton, zetaHint)
    ].join("");
  }

  function renderLocalResistanceFields(section) {
    const resistanceItem = getLocalResistanceItem(section.localResistanceType);
    const isTabular = isTabularResistance(resistanceItem);
    const isConical = isConicalCollectorType(section.localResistanceType);
    const isPipeEntrance = isStraightPipeEntranceType(section.localResistanceType);
    const isFlushWallEntrance = isFlushWallEntranceType(section.localResistanceType);
    const isPassingFlowEntrance = isPassingFlowEntranceType(section.localResistanceType);
    const isArcWithoutScreen = isArcCollectorWithoutScreenType(section.localResistanceType);
    const isArcWithScreen = isArcCollectorWithScreenType(section.localResistanceType);
    const isArcCollector = isArcCollectorType(section.localResistanceType);
    const isSuddenExpansion = isSuddenExpansionType(section.localResistanceType);
    const hasGuide = !section.useCustomLrc && (isTabular || isSuddenExpansion);
    const xConfig = getResistanceAxisConfig(section.localResistanceType, "x");
    const yConfig = getResistanceAxisConfig(section.localResistanceType, "y");
    const guideButton = hasGuide
      ? [
          '<button type="button" class="kms-guide-button" data-open-resistance-table aria-haspopup="dialog" aria-label="Открыть таблицу КМС" title="Открыть таблицу КМС">',
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
          '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z"></path>',
          '<path d="M4 9h16M4 14h16M9 4v16M15 4v16"></path>',
          "</svg>",
          "</button>"
        ].join("")
      : "";
    const zetaHint = section.useCustomLrc
      ? "Замок открыт: пользовательское значение будет использовано вместо справочного."
      : (isSuddenExpansion
          ? "Автоматический КМС рассчитывается по формуле внезапного расширения ζ = (1 - F₀/F₂)²."
      : isTabular
          ? "Автоматический КМС интерполируется по табличным параметрам выбранного сопротивления."
          : "Замок закрыт: значение рассчитывается автоматически по выбранному типу местного сопротивления.");
    const xUnitOptions = isPipeEntrance || isArcCollector || isSuddenExpansion ? getSectionUnitOptions(section, "localResistanceParamX") : null;
    const yUnitOptions = isPipeEntrance || isFlushWallEntrance || isArcWithScreen ? getSectionUnitOptions(section, "localResistanceParamY") : null;
    const yNote = isFlushWallEntrance
      ? "l — длина входного участка в направлении движения газа. Программа делит l на размер a и получает отношение l/a."
      : isArcWithScreen
      ? "r — радиус очертания коллектора. Программа делит r на Dг и получает отношение r/Dг."
      : "";
    const shouldRenderY = !isConical && !isRostrumCollectorType(section.localResistanceType) && !isArcWithoutScreen;

    return [
      renderRawField(
        "Тип местного сопротивления",
        `<select class="form-select" data-field="localResistanceType" ${section.useCustomLrc ? "disabled" : ""}>${renderOptions(localResistanceTypes, section.localResistanceType)}</select>`,
        section.useCustomLrc ? "При ручном вводе КМС выбор справочного сопротивления заблокирован." : "Выберите тип элемента из справочника.",
        false
      ),
      !section.useCustomLrc && isTabular
        ? renderNumberField(xConfig.label, "localResistanceParamX", section.localResistanceParamX, xConfig.step, xConfig.min, xConfig.max, `${xConfig.hint} ${describeTabularRange(resistanceItem, "x", section.localResistanceType)}`, xUnitOptions, false)
        : "",
      !section.useCustomLrc && isSuddenExpansion
        ? renderNumberField(xConfig.label, "localResistanceParamX", section.localResistanceParamX, xConfig.step, xConfig.min, xConfig.max, xConfig.hint, xUnitOptions, false)
        : "",
      !section.useCustomLrc && isSuddenExpansion
        ? renderDerivedSuddenExpansionRatioField(section)
        : "",
      !section.useCustomLrc && isTabular && isConical
        ? renderDerivedConicalRatioField(section, resistanceItem)
        : "",
      !section.useCustomLrc && isTabular && isRostrumCollectorType(section.localResistanceType)
        ? renderDerivedLengthRatioField(section, resistanceItem)
        : "",
      !section.useCustomLrc && isTabular && shouldRenderY
        ? renderNumberField(yConfig.label, "localResistanceParamY", section.localResistanceParamY, yConfig.step, yConfig.min, yConfig.max, `${yConfig.hint} ${describeTabularRange(resistanceItem, "y", section.localResistanceType)}`, yUnitOptions, false, yNote)
        : "",
      !section.useCustomLrc && isTabular && isPipeEntrance
        ? renderDerivedPipeEntranceRatiosField(section, resistanceItem)
        : "",
      !section.useCustomLrc && isTabular && isFlushWallEntrance
        ? renderDerivedFlushWallRatioField(section, resistanceItem)
        : "",
      !section.useCustomLrc && isTabular && isPassingFlowEntrance
        ? renderDerivedPassingFlowRatioField(section, resistanceItem)
        : "",
      !section.useCustomLrc && isTabular && isArcWithoutScreen
        ? renderDerivedArcCollectorRatioField(section, resistanceItem)
        : "",
      !section.useCustomLrc && isTabular && isArcWithScreen
        ? renderDerivedArcCollectorRatiosField(section, resistanceItem)
        : "",
      renderKmsValueField(section, guideButton, zetaHint)
      ].join("");
  }

  function renderDerivedBendDiagram61RatiosField(section) {
    const context = calculateBendDiagram61Context(section);
    const invalidRe = context.reynolds != null && context.reynolds < 3000
      ? `Re ниже нижней расчетной области диаграммы 6-1; сейчас Re = ${formatCompactNumber(context.reynolds, 0)}.`
      : "";

    return renderRawField(
      "Расчетные параметры диаграммы 6-1",
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-bend61-ratios" value="${escapeAttr(formatBendDiagram61DerivedText(context))}">`,
      [
        "Диаграмма 6-1 применяется для отводов при 0 < δ ≤ 180°, R₀/D₀ или R₀/b₀ от 0,5 по табличной сетке, и l₀/Dг ≥ 10.",
        "КМС считается как сумма местной составляющей и трения в отводе; отдельная потеря на трение по длине блока для этого элемента не добавляется.",
        invalidRe
      ].filter(Boolean).join(" "),
      true
    );
  }

  function renderDerivedConicalRatioField(section, resistanceItem) {
    const context = getResistanceParameterContext(section, resistanceItem);
    const value = context.rawParamY == null ? "" : formatCompactNumber(context.rawParamY, 3);
    const hint = context.yClamped
      ? `l/d₀ выше диапазона таблицы; для КМС будет использована последняя строка l/d₀ = ${formatCompactNumber(context.paramY, 3)}.`
      : `Программа считает l/d₀ = l / d₀ автоматически. ${describeTabularRange(resistanceItem, "y", section.localResistanceType)}`;

    return renderRawField(
      "Расчетное отношение l/d₀",
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-conical-ratio" value="${escapeAttr(value || "—")}">`,
      hint,
      false
    );
  }

  function renderDerivedLengthRatioField(section, resistanceItem) {
    const context = getResistanceParameterContext(section, resistanceItem);
    const yConfig = getResistanceAxisConfig(section.localResistanceType, "y");
    const value = context.rawParamY == null ? "—" : formatCompactNumber(context.rawParamY, 3);

    return renderRawField(
      `Расчетное отношение ${stripHtml(yConfig.summaryLabel)}`,
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-length-ratio" value="${escapeAttr(`${stripHtml(yConfig.summaryLabel)} = ${value}`)}">`,
      `Программа считает ${stripHtml(yConfig.summaryLabel)} автоматически по введенным длине l и диаметру Dг. ${describeTabularRange(resistanceItem, "y", section.localResistanceType)}`,
      true
    );
  }

  function renderDerivedPipeEntranceRatiosField(section, resistanceItem) {
    const context = getResistanceParameterContext(section, resistanceItem);
    const ratioX = context.rawParamX == null ? "—" : formatCompactNumber(context.rawParamX, 3);
    const ratioY = context.rawParamY == null ? "—" : formatCompactNumber(context.rawParamY, 3);
    const hintParts = [
      "Программа считает b/Dг = b / Dг и δ₁/Dг = δ₁ / Dг автоматически."
    ];

    if (context.xClamped) {
      hintParts.push(`b/Dг выше диапазона таблицы; используется последняя колонка ${formatResistanceAxisValue(section.localResistanceType, "x", context.paramX)}.`);
    }

    if (context.yClamped) {
      hintParts.push(`δ₁/Dг выше диапазона таблицы; используется последняя строка ${formatResistanceAxisValue(section.localResistanceType, "y", context.paramY)}.`);
    }

    return renderRawField(
      "Расчетные отношения",
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-pipe-entrance-ratios" value="${escapeAttr(`b/Dг = ${ratioX}; δ₁/Dг = ${ratioY}`)}">`,
      hintParts.join(" "),
      true
    );
  }

  function renderDerivedFlushWallRatioField(section, resistanceItem) {
    const context = getResistanceParameterContext(section, resistanceItem);
    const ratio = context.rawParamY == null ? "—" : formatCompactNumber(context.rawParamY, 3);
    const hintParts = [
      "Программа считает l/a = l / a автоматически по введенным размерам."
    ];

    return renderRawField(
      "Расчетное отношение l/a",
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-flush-wall-ratio" value="${escapeAttr(`l/a = ${ratio}`)}">`,
      hintParts.join(" "),
      true
    );
  }

  function renderDerivedPassingFlowRatioField(section, resistanceItem) {
    const context = getResistanceParameterContext(section, resistanceItem);
    const ratio = context.rawParamX == null ? "—" : formatCompactNumber(context.rawParamX, 3);
    const flowVelocity = context.flowVelocity == null ? "—" : formatCompactNumber(context.flowVelocity, 3);
    const hint = `w₀ = Q/F = ${flowVelocity} м/с. Программа считает w∞/w₀ автоматически и использует это отношение в таблице. ${describeTabularRange(resistanceItem, "x", section.localResistanceType)}`;

    return renderRawField(
      "Расчетное отношение w∞/w₀",
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-passing-flow-ratio" value="${escapeAttr(`w∞/w₀ = ${ratio}`)}">`,
      hint,
      true
    );
  }

  function renderDerivedArcCollectorRatioField(section, resistanceItem) {
    const context = getResistanceParameterContext(section, resistanceItem);
    const ratio = context.rawParamX == null ? "—" : formatCompactNumber(context.rawParamX, 3);
    const hintParts = [
      "Программа считает r/Dг = r / Dг автоматически."
    ];

    if (context.xClamped) {
      hintParts.push(`r/Dг выше диапазона таблицы; используется последняя колонка ${formatResistanceAxisValue(section.localResistanceType, "x", context.paramX)}.`);
    }

    return renderRawField(
      "Расчетное отношение r/Dг",
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-arc-ratio" value="${escapeAttr(`r/Dг = ${ratio}`)}">`,
      `${hintParts.join(" ")} ${describeTabularRange(resistanceItem, "x", section.localResistanceType)}`,
      true
    );
  }

  function renderDerivedArcCollectorRatiosField(section, resistanceItem) {
    const context = getResistanceParameterContext(section, resistanceItem);
    const ratioX = context.rawParamX == null ? "—" : formatCompactNumber(context.rawParamX, 3);
    const ratioY = context.rawParamY == null ? "—" : formatCompactNumber(context.rawParamY, 3);

    return renderRawField(
      "Расчетные отношения",
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-arc-ratios" value="${escapeAttr(`h/Dг = ${ratioX}; r/Dг = ${ratioY}`)}">`,
      "Программа считает h/Dг и r/Dг автоматически по введенным размерам h, r и диаметру Dг.",
      true
    );
  }

  function renderDerivedSuddenExpansionRatioField(section) {
    const ratio = calculateSuddenExpansionAreaRatio(section);
    const ratioText = ratio == null ? "—" : formatCompactNumber(ratio, 3);

    return renderRawField(
      "Расчетное отношение F₀/F₂",
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-sudden-expansion-ratio" value="${escapeAttr(`F₀/F₂ = ${ratioText}`)}">`,
      "Программа считает площади по диаметрам D₀ и D₂, затем применяет формулу ζ = (1 - F₀/F₂)².",
      true
    );
  }

  function renderDerivedRoundContractionRatiosField(section) {
    const context = calculateRoundContractionDiagram523Context(section);
    const notes = getRoundContractionClampNotes(context);
    const reynoldsNote = context.reynolds != null && context.reynolds < 100000
      ? `Re ниже области применения диаграммы 5-23; сейчас Re = ${formatCompactNumber(context.reynolds, 0)}.`
      : "";
    const hint = [
      "Программа считает угол сужения α по D₁, D₀ и длине l₀, отношение n₀ = F₀/F₁ по площадям, а Re = w₀D₀/ν по скорости в выходном сечении.",
      "Диапазоны таблицы диаграммы 5-23: α = 3...180°, n₀ = 0,10...0,64. Условия справочника: круглое сечение, l₀/D₀ > 0, Re ≥ 10⁵.",
      notes.length ? notes.join(" ") : "",
      reynoldsNote
    ].filter(Boolean).join(" ");

    return renderRawField(
      "Расчетные параметры диаграммы 5-23",
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-round-contraction-ratios" value="${escapeAttr(formatRoundContractionDerivedText(context))}">`,
      hint,
      true
    );
  }

  function renderDerivedTransitionContractionRatiosField(section) {
    const context = calculateTransitionContractionDiagram527Context(section);
    const notes = getTransitionContractionClampNotes(context);
    const reynoldsNote = context.reynolds != null && context.reynolds < 10000
      ? `Re ниже области применения диаграммы 5-27; сейчас Re = ${formatCompactNumber(context.reynolds, 0)}.`
      : "";
    const hint = [
      "Программа считает F₀/F₁ по площадям, l/D₀ по длине перехода и круглому выходу, Re = w₀D₀/ν по скорости в выходном круглом сечении.",
      "Диаграмма 5-27 применяется для перехода прямоугольник → круг при l₀/D₀ > 0 и Re > 10⁴; для блока «Сужение» используется конфузорный случай F₀ < F₁.",
      notes.length ? notes.join(" ") : "",
      reynoldsNote
    ].filter(Boolean).join(" ");

    return renderRawField(
      "Расчетные параметры диаграммы 5-27",
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-transition-contraction-ratios" value="${escapeAttr(formatTransitionContractionDerivedText(context))}">`,
      hint,
      true
    );
  }

  function renderDerivedRoundDiffuserRatiosField(section) {
    const context = calculateRoundDiffuserDiagram52Context(section);
    const notes = getRoundDiffuserClampNotes(context);
    const hint = [
      "Программа считает угол раскрытия α по D₀, D₁ и длине l, отношение F₁/F₀ по площадям, а Re·10⁻⁵ по расходу, диаметру D₀ и табличной кинематической вязкости.",
      "Диапазоны диаграммы 5-2: α = 3...180°, F₁/F₀ = 2...16, Re·10⁻⁵ = 0,5...6.",
      notes.length ? notes.join(" ") : ""
    ].filter(Boolean).join(" ");

    return renderRawField(
      "Расчетные параметры диаграммы 5-2",
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-round-diffuser-ratios" value="${escapeAttr(formatRoundDiffuserDerivedText(context))}">`,
      hint,
      true
    );
  }

  function renderRectangularDiffuserProfileField(section) {
    const profile = getRectangularDiffuserProfile(section);
    const options = [
      { value: "0", label: "l₀/Dг = 0" },
      { value: "10", label: "l₀/Dг ≥ 10" }
    ];

    return renderRawField(
      "Режим входного потока",
      `<select class="form-select" data-field="localResistanceParamX">${renderNamedOptions(options, String(profile))}</select>`,
      "Выберите таблицу для диффузора: l₀/Dг = 0 для равномерного входного потока или l₀/Dг ≥ 10, если перед диффузором есть достаточно длинный прямой участок.",
      true
    );
  }

  function renderDerivedRectangularDiffuserRatiosField(section) {
    const context = calculateRectangularDiffuserDiagram54Context(section);
    const notes = getRectangularDiffuserClampNotes(context);
    const hint = [
      "Программа считает Dг = 4F₀/П₀ по входному прямоугольному сечению, α как больший угол раскрытия по сторонам a и b, F₁/F₀ по площадям, а Re·10⁻⁵ по расходу, Dг и табличной кинематической вязкости.",
      "Диапазоны диаграммы 5-4: α = 4...180°, F₁/F₀ = 2...10, Re·10⁻⁵ = 0,5...4.",
      notes.length ? notes.join(" ") : ""
    ].filter(Boolean).join(" ");

    return renderRawField(
      "Расчетные параметры диаграммы 5-4",
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-rectangular-diffuser-ratios" value="${escapeAttr(formatRectangularDiffuserDerivedText(context))}">`,
      hint,
      true
    );
  }

  function renderDerivedTransitionDiffuserRatiosField(section) {
    const context = calculateTransitionDiffuserDiagram528Context(section);
    const notes = getRectangularDiffuserClampNotes(context);
    const hint = [
      "Программа определяет направление перехода по формам сечений, считает эквивалентный угол α по формулам диаграммы 5-28, затем использует таблицы диаграммы 5-4.",
      "Для перехода с круга на прямоугольник: tg(α/2) = (2√(a₁b₁/π) - D₀) / (2lд). Для перехода с прямоугольника на круг: tg(α/2) = (D₁ - 2√(a₀b₀/π)) / (2lд).",
      "Диапазоны таблиц: α = 4...180°, F₁/F₀ = 2...10, Re·10⁻⁵ = 0,5...4.",
      notes.length ? notes.join(" ") : ""
    ].filter(Boolean).join(" ");

    return renderRawField(
      "Расчетные параметры диаграммы 5-28",
      `<input class="form-control kms-input is-locked" type="text" readonly data-role="derived-transition-diffuser-ratios" value="${escapeAttr(formatTransitionDiffuserDerivedText(context))}">`,
      hint,
      true
    );
  }

  function updateDerivedLocalResistanceDisplays(section) {
    const item = getLocalResistanceItem(section && section.localResistanceType);
    const bendRatiosInput = document.querySelector('[data-role="derived-bend61-ratios"]');
    if (bendRatiosInput && isBendDiagram61Section(section)) {
      bendRatiosInput.value = formatBendDiagram61DerivedText(calculateBendDiagram61Context(section));
    }

    const conicalRatioInput = document.querySelector('[data-role="derived-conical-ratio"]');
    if (conicalRatioInput && isConicalCollectorSection(section)) {
      const context = getResistanceParameterContext(section, item);
      conicalRatioInput.value = context.rawParamY == null
        ? "—"
        : formatCompactNumber(context.rawParamY, 3);
    }

    const pipeRatiosInput = document.querySelector('[data-role="derived-pipe-entrance-ratios"]');
    if (pipeRatiosInput && isStraightPipeEntranceSection(section)) {
      const context = getResistanceParameterContext(section, item);
      const ratioX = context.rawParamX == null ? "—" : formatCompactNumber(context.rawParamX, 3);
      const ratioY = context.rawParamY == null ? "—" : formatCompactNumber(context.rawParamY, 3);
      pipeRatiosInput.value = `b/Dг = ${ratioX}; δ₁/Dг = ${ratioY}`;
    }

    const flushWallRatioInput = document.querySelector('[data-role="derived-flush-wall-ratio"]');
    if (flushWallRatioInput && isFlushWallEntranceSection(section)) {
      const context = getResistanceParameterContext(section, item);
      const ratio = context.rawParamY == null ? "—" : formatCompactNumber(context.rawParamY, 3);
      flushWallRatioInput.value = `l/a = ${ratio}`;
    }

    const lengthRatioInput = document.querySelector('[data-role="derived-length-ratio"]');
    if (lengthRatioInput && isRostrumCollectorSection(section)) {
      const context = getResistanceParameterContext(section, item);
      const ratio = context.rawParamY == null ? "—" : formatCompactNumber(context.rawParamY, 3);
      lengthRatioInput.value = `l/Dг = ${ratio}`;
    }

    const passingFlowRatioInput = document.querySelector('[data-role="derived-passing-flow-ratio"]');
    if (passingFlowRatioInput && isPassingFlowEntranceSection(section)) {
      const context = getResistanceParameterContext(section, item);
      const ratio = context.rawParamX == null ? "—" : formatCompactNumber(context.rawParamX, 3);
      passingFlowRatioInput.value = `w∞/w₀ = ${ratio}`;
    }

    const arcRatioInput = document.querySelector('[data-role="derived-arc-ratio"]');
    if (arcRatioInput && isArcCollectorWithoutScreenSection(section)) {
      const context = getResistanceParameterContext(section, item);
      const ratio = context.rawParamX == null ? "—" : formatCompactNumber(context.rawParamX, 3);
      arcRatioInput.value = `r/Dг = ${ratio}`;
    }

    const arcRatiosInput = document.querySelector('[data-role="derived-arc-ratios"]');
    if (arcRatiosInput && isArcCollectorWithScreenSection(section)) {
      const context = getResistanceParameterContext(section, item);
      const ratioX = context.rawParamX == null ? "—" : formatCompactNumber(context.rawParamX, 3);
      const ratioY = context.rawParamY == null ? "—" : formatCompactNumber(context.rawParamY, 3);
      arcRatiosInput.value = `h/Dг = ${ratioX}; r/Dг = ${ratioY}`;
    }

    const suddenExpansionRatioInput = document.querySelector('[data-role="derived-sudden-expansion-ratio"]');
    if (suddenExpansionRatioInput && isSuddenExpansionSection(section)) {
      const ratio = calculateSuddenExpansionAreaRatio(section);
      suddenExpansionRatioInput.value = `F₀/F₂ = ${ratio == null ? "—" : formatCompactNumber(ratio, 3)}`;
    }

    const roundContractionRatiosInput = document.querySelector('[data-role="derived-round-contraction-ratios"]');
    if (roundContractionRatiosInput && isRoundContractionGeometry(section)) {
      roundContractionRatiosInput.value = formatRoundContractionDerivedText(calculateRoundContractionDiagram523Context(section));
    }

    const transitionContractionRatiosInput = document.querySelector('[data-role="derived-transition-contraction-ratios"]');
    if (transitionContractionRatiosInput && isTransitionContractionGeometry(section)) {
      transitionContractionRatiosInput.value = formatTransitionContractionDerivedText(calculateTransitionContractionDiagram527Context(section));
    }

    const roundDiffuserRatiosInput = document.querySelector('[data-role="derived-round-diffuser-ratios"]');
    if (roundDiffuserRatiosInput && isRoundDiffuserGeometry(section)) {
      roundDiffuserRatiosInput.value = formatRoundDiffuserDerivedText(calculateRoundDiffuserDiagram52Context(section));
    }

    const rectangularDiffuserRatiosInput = document.querySelector('[data-role="derived-rectangular-diffuser-ratios"]');
    if (rectangularDiffuserRatiosInput && isRectangularDiffuserGeometry(section)) {
      rectangularDiffuserRatiosInput.value = formatRectangularDiffuserDerivedText(calculateRectangularDiffuserDiagram54Context(section));
    }

    const transitionDiffuserRatiosInput = document.querySelector('[data-role="derived-transition-diffuser-ratios"]');
    if (transitionDiffuserRatiosInput && isTransitionDiffuserGeometry(section)) {
      transitionDiffuserRatiosInput.value = formatTransitionDiffuserDerivedText(calculateTransitionDiffuserDiagram528Context(section));
    }
  }

  function renderKmsValueField(section, guideButton, zetaHint) {
    const zetaValue = section.useCustomLrc
      ? section.customLrc
      : getAutoKmsValue(section);
    const zetaInputAttrs = section.useCustomLrc
      ? 'type="number" step="0.001" min="0" inputmode="decimal"'
      : 'type="text" readonly';

    return renderRawField(
      "КМС ζ",
      [
        `<div class="kms-control${guideButton ? " has-guide" : ""}">`,
        '<div class="kms-value-wrap">',
        `<input class="form-control kms-input${section.useCustomLrc ? "" : " is-locked"}" ${zetaInputAttrs} data-field="customLrc" data-role="kms-value" value="${escapeAttr(zetaValue)}">`,
        guideButton,
        "</div>",
        '<label class="section-toggle-card kms-lock">',
        `<input class="form-check-input" type="checkbox" data-field="useCustomLrc" ${section.useCustomLrc ? "checked" : ""}>`,
        `<span>${section.useCustomLrc ? "Ручной ввод" : "Автоматически"}</span>`,
        "</label>",
        "</div>"
      ].join(""),
      zetaHint,
      true
    );
  }

  function getLocalResistanceItem(typeName) {
    const normalizedName = String(typeName || "").trim();
    if (!normalizedName) {
      return null;
    }

    if (Object.prototype.hasOwnProperty.call(localResistanceCatalog, normalizedName)) {
      return localResistanceCatalog[normalizedName];
    }

    const lowerName = normalizeResistanceLookupName(normalizedName).toLowerCase();
    const matchedKey = Object.keys(localResistanceCatalog)
      .find((key) => normalizeResistanceLookupName(key).toLowerCase() === lowerName);

    return matchedKey ? localResistanceCatalog[matchedKey] : null;
  }

  function normalizeResistanceLookupName(typeName) {
    return String(typeName || "")
      .trim()
      .replace(/\s*\(диаграмма 3-[1-7]\)\s*$/i, "")
      .replace(/\s*\(диаграмма 4-1\)\s*$/i, "")
      .trim();
  }

  function canonicalizeLocalResistanceType(typeName) {
    const normalizedName = normalizeResistanceLookupName(typeName);
    if (!normalizedName) {
      return "";
    }

    const matched = localResistanceTypes.find((item) =>
      normalizeResistanceLookupName(item).toLowerCase() === normalizedName.toLowerCase());

    return matched || typeName;
  }

  function isTabularResistance(item) {
    return Boolean(item && typeof item === "object" && (item.isTabular || item.IsTabular));
  }

  function getResistanceDefaultValue(item) {
    if (item == null) {
      return null;
    }

    if (typeof item === "number" || typeof item === "string") {
      const value = Number(item);
      return Number.isFinite(value) ? value : null;
    }

    const raw = readProp(item, "defaultValue", "DefaultValue");
    if (raw == null) {
      return null;
    }

    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  function getResistancePoints(item) {
    const points = readProp(item, "points", "Points");
    return Array.isArray(points) ? points : [];
  }

  function getResistanceAxisConfig(typeName, axis) {
    const isConical = isConicalCollectorType(typeName);
    const isPipeEntrance = isStraightPipeEntranceType(typeName);
    const isDiagram32Entrance = isFlushWallEntranceType(typeName);
    const isDiagram33Entrance = isPassingFlowEntranceType(typeName);
    const isArcWithoutScreen = isArcCollectorWithoutScreenType(typeName);
    const isArcWithScreen = isArcCollectorWithScreenType(typeName);
    const isRostrum = isRostrumCollectorType(typeName);
    const isSuddenExpansion = isSuddenExpansionType(typeName);

    if (isPipeEntrance) {
      return axis === "x"
        ? {
            label: "Расстояние b",
            step: "0.001",
            min: "0",
            max: "",
            hint: "b — расстояние от стенки до входного сечения. Введите размер; отношение b/Dг программа считает автоматически. При b/Dг ≥ 0,5 используется последняя колонка таблицы.",
            digits: 3,
            summaryLabel: "b/D<sub>г</sub>",
            tableLabel: "b/D<sub>г</sub>",
            clampLabel: "b/Dг"
          }
        : {
            label: "Толщина кромки δ₁",
            step: "0.001",
            min: "0",
            max: "",
            hint: "δ₁ — толщина входной кромки. Введите размер; отношение δ₁/Dг программа считает автоматически. При δ₁/Dг ≥ 0,05 используется последняя строка таблицы.",
            digits: 3,
            summaryLabel: "δ<sub>1</sub>/D<sub>г</sub>",
            tableLabel: "δ<sub>1</sub>/D<sub>г</sub>",
            clampLabel: "δ₁/Dг"
          };
    }

    if (isDiagram32Entrance) {
      return axis === "x"
        ? {
            label: "Угол входа δ",
            step: "1",
            min: "20",
            max: "90",
            hint: "δ — угол входа потока в трубу, градусы. Диаграмма 3-2 применима при δ от 20 до 90°.",
            digits: 0,
            summaryLabel: "δ",
            tableLabel: "δ, град",
            clampLabel: "δ",
            suffix: "град"
          }
        : {
            label: "Длина входного участка l",
            step: "0.001",
            min: "0",
            max: "",
            hint: "l — длина входного участка. Отношение l/a программа считает автоматически по введенному размеру a. Табличный диапазон расчетного отношения l/a: 0,2...5; для области 0,2...0,5 используется одна строка значений.",
            digits: 3,
            summaryLabel: "l/a",
            tableLabel: "l/a",
            clampLabel: "l/a"
          };
    }

    if (isDiagram33Entrance) {
      return axis === "x"
        ? {
            label: "Скорость внешнего потока w∞",
            step: "0.001",
            min: "0",
            max: "",
            hint: "w∞ — скорость проходящего внешнего потока около входа, м/с. w₀ программа считает сама по расходу газа и площади входного сечения, затем получает отношение w∞/w₀. Если внешнего потока нет, введите 0.",
            digits: 3,
            summaryLabel: "w<sub>∞</sub>/w<sub>0</sub>",
            tableLabel: "w<sub>∞</sub>/w<sub>0</sub>",
            clampLabel: "w∞/w₀"
          }
        : {
            label: "Угол входа δ",
            step: "1",
            min: "30",
            max: "150",
            hint: "δ — угол между направлением проходящего потока и входом в трубу, градусы. Диаграмма 3-3 применима при δ от 30 до 150°.",
            digits: 0,
            summaryLabel: "δ",
            tableLabel: "δ, град",
            clampLabel: "δ",
            suffix: "град"
          };
    }

    if (isArcWithoutScreen) {
      return axis === "x"
        ? {
            label: "Радиус закругления r",
            step: "0.001",
            min: "0",
            max: "",
            hint: "r — радиус очертания входного коллектора по дуге круга. Программа делит r на Dг и выбирает КМС из таблицы; при r/Dг ≥ 0,20 используется последняя колонка.",
            digits: 3,
            summaryLabel: "r/D<sub>г</sub>",
            tableLabel: "r/D<sub>г</sub>",
            clampLabel: "r/Dг"
          }
        : {
            label: "Служебный параметр",
            step: "1",
            min: "0",
            max: "0",
            hint: "",
            digits: 0,
            summaryLabel: "",
            tableLabel: "",
            clampLabel: ""
          };
    }

    if (isArcWithScreen) {
      return axis === "x"
        ? {
            label: "Расстояние до экрана h",
            step: "0.001",
            min: "0",
            max: "",
            hint: "h — расстояние от входного сечения до экрана. Программа считает отношение h/Dг автоматически.",
            digits: 3,
            summaryLabel: "h/D<sub>г</sub>",
            tableLabel: "h/D<sub>г</sub>",
            clampLabel: "h/Dг"
          }
        : {
            label: "Радиус закругления r",
            step: "0.001",
            min: "0",
            max: "",
            hint: "r — радиус очертания коллектора по дуге круга. Программа считает отношение r/Dг автоматически.",
            digits: 3,
            summaryLabel: "r/D<sub>г</sub>",
            tableLabel: "r/D<sub>г</sub>",
            clampLabel: "r/Dг"
          };
    }

    if (isSuddenExpansion) {
      return axis === "x"
        ? {
            label: "Выходной диаметр D₂",
            step: "0.001",
            min: "0.001",
            max: "",
            hint: "D₂ — диаметр широкого сечения после внезапного расширения. Он должен быть больше входного D₀; программа считает F₀/F₂ и ζ = (1 - F₀/F₂)².",
            digits: 3,
            summaryLabel: "F<sub>0</sub>/F<sub>2</sub>",
            tableLabel: "F<sub>0</sub>/F<sub>2</sub>",
            clampLabel: "F₀/F₂"
          }
        : {
            label: "",
            step: "1",
            min: "",
            max: "",
            hint: "",
            digits: 3,
            summaryLabel: "",
            tableLabel: "",
            clampLabel: ""
          };
    }

    if (axis === "x") {
      return {
        label: isConical ? "Угол раскрытия α" : "Угол α",
        step: "1",
        min: "0",
        max: "180",
        hint: isRostrum
          ? "α — угол раскрытия раструба, градусы. Табличный диапазон: 0...180°."
          : "Угол α, градусы.",
        digits: 0,
        summaryLabel: "α",
        tableLabel: "α, град",
        clampLabel: "α",
        suffix: "град"
      };
    }

    return {
      label: isRostrum ? "Отношение l/Dг" : "Отношение l/d₀",
      step: "0.001",
      min: "0",
      max: "",
      hint: isRostrum ? "Безразмерное отношение l/Dг." : "Безразмерное отношение l/d₀.",
      digits: 3,
      summaryLabel: isRostrum ? "l/D<sub>г</sub>" : "l/d<sub>0</sub>",
      tableLabel: isRostrum ? "l/D<sub>г</sub>" : "l/d<sub>0</sub>",
      clampLabel: isRostrum ? "l/Dг" : "l/d₀"
    };
  }

  function interpolateResistanceValue(points, paramX, paramY) {
    if (!Array.isArray(points) || points.length === 0 || paramX == null || paramY == null) {
      return null;
    }

    const xs = uniqueSorted(points.map((point) => readPointNumber(point, "paramX", "ParamX")));
    const ys = uniqueSorted(points.map((point) => readPointNumber(point, "paramY", "ParamY")));
    const xBounds = findNumericBounds(xs, paramX);
    const yBounds = findNumericBounds(ys, paramY);
    if (!xBounds || !yBounds) {
      return null;
    }

    const q11 = findPointZeta(points, xBounds.lower, yBounds.lower);
    const q21 = findPointZeta(points, xBounds.upper, yBounds.lower);
    const q12 = findPointZeta(points, xBounds.lower, yBounds.upper);
    const q22 = findPointZeta(points, xBounds.upper, yBounds.upper);
    if ([q11, q21, q12, q22].some((value) => value == null)) {
      return null;
    }

    return interpolate2D(paramX, paramY, xBounds.lower, xBounds.upper, yBounds.lower, yBounds.upper, q11, q21, q12, q22);
  }

  function uniqueSorted(values) {
    return Array.from(new Set(values.filter((value) => Number.isFinite(value))))
      .sort((left, right) => left - right);
  }

  function findNumericBounds(values, value) {
    const tolerance = 0.000001;
    if (!values.length || value < values[0] - tolerance || value > values[values.length - 1] + tolerance) {
      return null;
    }

    const exact = values.find((point) => Math.abs(point - value) <= tolerance);
    if (exact != null) {
      return { lower: exact, upper: exact };
    }

    for (let index = 0; index < values.length - 1; index += 1) {
      if (values[index] <= value && value <= values[index + 1]) {
        return { lower: values[index], upper: values[index + 1] };
      }
    }

    return null;
  }

  function findPointZeta(points, x, y) {
    const point = points.find((item) =>
      Math.abs(readPointNumber(item, "paramX", "ParamX") - x) < 0.000001 &&
      Math.abs(readPointNumber(item, "paramY", "ParamY") - y) < 0.000001);

    return point ? readPointNumber(point, "zetaValue", "ZetaValue") : null;
  }

  function interpolate2D(x, y, x1, x2, y1, y2, q11, q21, q12, q22) {
    if (Math.abs(x2 - x1) < 0.000001 && Math.abs(y2 - y1) < 0.000001) {
      return q11;
    }

    if (Math.abs(x2 - x1) < 0.000001) {
      return linearInterpolate(y, y1, y2, q11, q12);
    }

    if (Math.abs(y2 - y1) < 0.000001) {
      return linearInterpolate(x, x1, x2, q11, q21);
    }

    const r1 = linearInterpolate(x, x1, x2, q11, q21);
    const r2 = linearInterpolate(x, x1, x2, q12, q22);
    return linearInterpolate(y, y1, y2, r1, r2);
  }

  function linearInterpolate(value, lower, upper, lowerValue, upperValue) {
    if (Math.abs(upper - lower) < 0.000001) {
      return lowerValue;
    }

    const ratio = (value - lower) / (upper - lower);
    return lowerValue + ratio * (upperValue - lowerValue);
  }

  function readPointNumber(point) {
    const raw = readProp.apply(null, [point].concat(Array.prototype.slice.call(arguments, 1)));
    if (raw == null) {
      return NaN;
    }

    const value = Number(raw);
    return Number.isFinite(value) ? value : NaN;
  }

  function describeTabularRange(item, axis, typeName) {
    const key = axis === "x" ? ["paramX", "ParamX"] : ["paramY", "ParamY"];
    const values = uniqueSorted(getResistancePoints(item).map((point) => readPointNumber(point, key[0], key[1])));
    if (!values.length) {
      return "";
    }

    const config = getResistanceAxisConfig(typeName, axis);
    const isPipeEntrance = isStraightPipeEntranceType(typeName);
    const isArcWithoutScreen = isArcCollectorWithoutScreenType(typeName);
    const isArcWithScreen = isArcCollectorWithScreenType(typeName);
    const isDerivedRatioAxis = isPipeEntrance ||
      isArcWithScreen ||
      (isArcWithoutScreen && axis === "x") ||
      (isFlushWallEntranceType(typeName) && axis === "y") ||
      (isPassingFlowEntranceType(typeName) && axis === "x") ||
      (isRostrumCollectorType(typeName) && axis === "y");
    const rangeSubject = isDerivedRatioAxis
      ? `расчетного отношения ${config.clampLabel}: `
      : "";
    const clampHint = isPipeEntrance || isArcWithoutScreen
      ? ` Значения выше ${formatNumber(values[values.length - 1], config.digits)} считаются как ${formatNumber(values[values.length - 1], config.digits)}.`
      : "";

    return `Диапазон ${rangeSubject}${formatNumber(values[0], config.digits)}...${formatNumber(values[values.length - 1], config.digits)}.${clampHint}`;
  }

  function applyTabularParameterDefaults(section, resetExisting) {
    const item = getLocalResistanceItem(section.localResistanceType);
    if (isSuddenExpansionType(section.localResistanceType)) {
      if (resetExisting) {
        section.localResistanceParamX = "";
        section.localResistanceParamY = "";
      }

      if (!section.localResistanceParamX) {
        const inletDiameter = parseNumber(getSectionBaseValue(section, "diameter"), null);
        if (inletDiameter != null && inletDiameter > 0) {
          setSectionDisplayValueFromBase(section, "localResistanceParamX", inletDiameter * 1.5);
        }
      }

      updateDerivedLocalResistanceParams(section);
      return;
    }

    if (!isTabularResistance(item)) {
      return;
    }

    if (resetExisting) {
      section.localResistanceParamX = "";
      section.localResistanceParamY = "";
    }

    if (isStraightPipeEntranceType(section.localResistanceType)) {
      section.localResistanceParamX = "";
      section.localResistanceParamY = "";
      updateDerivedLocalResistanceParams(section);
      return;
    }

    const points = getResistancePoints(item);
    const xs = uniqueSorted(points.map((point) => readPointNumber(point, "paramX", "ParamX")));
    const ys = uniqueSorted(points.map((point) => readPointNumber(point, "paramY", "ParamY")));
    if (!section.localResistanceParamX && xs.length) {
      const defaultX = isPassingFlowEntranceType(section.localResistanceType) && xs.includes(1)
        ? 1
        : xs.includes(60) ? 60 : xs[Math.floor(xs.length / 2)];
      if (isPassingFlowEntranceType(section.localResistanceType)) {
        const flowVelocity = calculateLocalFlowVelocity(section);
        section.localResistanceParamX = formatForInput(flowVelocity != null && flowVelocity > 0
          ? flowVelocity * defaultX
          : defaultX);
      } else if (isArcCollectorType(section.localResistanceType)) {
        const diameter = parseNumber(getSectionBaseValue(section, "diameter"), null);
        if (diameter != null && diameter > 0) {
          setSectionDisplayValueFromBase(section, "localResistanceParamX", diameter * defaultX);
        } else {
          section.localResistanceParamX = formatForInput(defaultX);
        }
      } else {
        section.localResistanceParamX = formatForInput(defaultX);
      }
    }
    if (!isLengthRatioCollectorSection(section) &&
        !isArcCollectorWithoutScreenSection(section) &&
        !section.localResistanceParamY &&
        ys.length) {
      const defaultY = ys.includes(0.25) ? 0.25 : ys[Math.floor(ys.length / 2)];
      if (isFlushWallEntranceSection(section)) {
        const sizeA = parseNumber(getSectionBaseValue(section, "diameter"), null);
        if (sizeA != null && sizeA > 0) {
          setSectionDisplayValueFromBase(section, "localResistanceParamY", sizeA * defaultY);
        } else {
          section.localResistanceParamY = formatForInput(defaultY);
        }
      } else if (isArcCollectorWithScreenSection(section)) {
        const diameter = parseNumber(getSectionBaseValue(section, "diameter"), null);
        if (diameter != null && diameter > 0) {
          setSectionDisplayValueFromBase(section, "localResistanceParamY", diameter * defaultY);
        } else {
          section.localResistanceParamY = formatForInput(defaultY);
        }
      } else {
        section.localResistanceParamY = formatForInput(defaultY);
      }
    }
    updateDerivedLocalResistanceParams(section);
  }

  function showResistanceGuide(section) {
    const item = getLocalResistanceItem(section.localResistanceType);
    const isBendDiagram = isBendDiagram61Section(section);
    const isRoundContraction = isRoundContractionDiagram523Section(section);
    const isTransitionContraction = isTransitionContractionDiagram527Section(section);
    const isRoundDiffuser = isRoundDiffuserDiagram52Section(section);
    const isRectangularDiffuser = isRectangularDiffuserDiagram54Section(section);
    const isTransitionDiffuser = isTransitionDiffuserDiagram528Section(section);
    if (!isBendDiagram && !isRoundContraction && !isTransitionContraction && !isRoundDiffuser && !isRectangularDiffuser && !isTransitionDiffuser && !isTabularResistance(item) && !isSuddenExpansionSection(section)) {
      return;
    }

    const modal = getResistanceGuideModal();
    const title = modal.querySelector('[data-role="resistance-guide-title"]');
    const body = modal.querySelector('[data-role="resistance-guide-body"]');
    if (title) {
      title.textContent = isBendDiagram
        ? "Отвод по диаграмме 6-1"
        : isRoundContraction
        ? "Конфузор круглого сечения"
        : isTransitionContraction
        ? "Переход прямоугольник → круг"
        : isRoundDiffuser
        ? "Диффузор круглого сечения"
        : isRectangularDiffuser
        ? "Диффузор прямоугольного сечения"
        : isTransitionDiffuser
        ? "Переходный диффузор"
        : (section.localResistanceType || "Таблица КМС");
    }
    if (body) {
      body.innerHTML = buildResistanceGuideHtml(section, item);
    }

    if (window.bootstrap && window.bootstrap.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(modal).show();
      return;
    }

    modal.classList.add("show");
    modal.style.display = "block";
    modal.removeAttribute("aria-hidden");
  }

  function getResistanceGuideModal() {
    let modal = document.getElementById("resistanceGuideModal");
    if (modal) {
      return modal;
    }

    modal = document.createElement("div");
    modal.id = "resistanceGuideModal";
    modal.className = "modal fade resistance-guide-modal";
    modal.tabIndex = -1;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = [
      '<div class="modal-dialog modal-dialog-centered modal-lg resistance-guide-dialog">',
      '<div class="modal-content">',
      '<div class="modal-header">',
      '<h3 class="modal-title" data-role="resistance-guide-title">Таблица КМС</h3>',
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>',
      "</div>",
      '<div class="modal-body" data-role="resistance-guide-body"></div>',
      "</div>",
      "</div>"
    ].join("");
    document.body.appendChild(modal);
    return modal;
  }

  function buildResistanceGuideHtml(section, item) {
    if (isBendDiagram61Section(section)) {
      return buildBendDiagram61GuideHtml(section);
    }

    if (isRoundContractionDiagram523Section(section)) {
      return buildRoundContractionDiagram523GuideHtml(section);
    }

    if (isTransitionContractionDiagram527Section(section)) {
      return buildTransitionContractionDiagram527GuideHtml(section);
    }

    if (isRoundDiffuserDiagram52Section(section)) {
      return buildRoundDiffuserDiagram52GuideHtml(section);
    }

    if (isRectangularDiffuserDiagram54Section(section)) {
      return buildRectangularDiffuserDiagram54GuideHtml(section);
    }

    if (isTransitionDiffuserDiagram528Section(section)) {
      return buildTransitionDiffuserDiagram528GuideHtml(section);
    }

    if (isSuddenExpansionSection(section)) {
      return buildSuddenExpansionGuideHtml(section);
    }

    const context = getResistanceParameterContext(section, item);
    const paramX = context.rawParamX;
    const paramY = context.rawParamY;
    const zeta = getLocalResistanceValue(section);
    const image = getResistanceGuideImage(section.localResistanceType);
    const xConfig = getResistanceAxisConfig(section.localResistanceType, "x");
    const yConfig = getResistanceAxisConfig(section.localResistanceType, "y");
    const isPipeEntrance = isStraightPipeEntranceSection(section);
    const isPassingFlowEntrance = isPassingFlowEntranceSection(section);
    const isArcWithoutScreen = isArcCollectorWithoutScreenSection(section);
    const isArcWithScreen = isArcCollectorWithScreenSection(section);
    return [
      '<div class="resistance-guide-layout">',
      image
        ? `<figure class="resistance-guide-figure"><img src="${escapeAttr(image)}" alt="Схема выбранного местного сопротивления"></figure>`
        : "",
      '<div class="resistance-guide-summary">',
      isPipeEntrance
        ? buildPipeEntranceSummaryParams(context, xConfig, yConfig)
        : isPassingFlowEntrance
        ? buildPassingFlowSummaryParams(context, xConfig, yConfig)
        : isArcWithoutScreen
        ? buildArcWithoutScreenSummaryParams(context, xConfig)
        : isArcWithScreen
        ? buildArcWithScreenSummaryParams(context, xConfig, yConfig)
        : [
            buildResistanceSummaryParam(xConfig, paramX),
            buildResistanceSummaryParam(yConfig, paramY)
          ].join(""),
      `<span class="resistance-guide-param"><span>ζ =</span><strong>${zeta == null ? "—" : formatCompactNumber(zeta, 3)}</strong></span>`,
      context.xClamped
        ? `<span class="resistance-guide-note">${escapeHtml(xConfig.clampLabel)} выше таблицы, поэтому использована последняя колонка ${formatResistanceAxisValue(section.localResistanceType, "x", context.paramX)}.</span>`
        : "",
      context.yClamped
        ? `<span class="resistance-guide-note">${escapeHtml(yConfig.clampLabel)} выше таблицы, поэтому использована последняя строка ${formatResistanceAxisValue(section.localResistanceType, "y", context.paramY)}.</span>`
        : "",
      "</div>",
      "</div>",
      buildResistanceGuideTableHtml(section, item)
    ].join("");
  }

  function buildSuddenExpansionGuideHtml(section) {
    const zeta = calculateSuddenExpansionKms(section);
    const ratio = calculateSuddenExpansionAreaRatio(section);
    const inletDiameter = parseNumber(getSectionBaseValue(section, "diameter"), null);
    const outletDiameter = parseNumber(getSectionBaseValue(section, "localResistanceParamX"), null);
    const image = getResistanceGuideImage(section.localResistanceType);

    return [
      '<div class="resistance-guide-layout">',
      image
        ? `<figure class="resistance-guide-figure"><img src="${escapeAttr(image)}" alt="Схема внезапного расширения сечения"></figure>`
        : "",
      '<div class="resistance-guide-summary">',
      `<span class="resistance-guide-param"><span>D<sub>0</sub> =</span><strong>${formatCompactNumber(inletDiameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>D<sub>2</sub> =</span><strong>${formatCompactNumber(outletDiameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>F<sub>0</sub>/F<sub>2</sub> =</span><strong>${formatCompactNumber(ratio, 3)}</strong></span>`,
      `<span class="resistance-guide-param"><span>ζ =</span><strong>${zeta == null ? "—" : formatCompactNumber(zeta, 3)}</strong></span>`,
      "</div>",
      "</div>",
      '<div class="resistance-guide-formula">',
      '<strong>Расчет:</strong> ζ = (1 - F<sub>0</sub>/F<sub>2</sub>)². Площадь круглого сечения считается по диаметру.',
      '<br><span>Условие применения: Re &gt; 10<sup>4</sup>, равномерный профиль скорости перед расширением. Потери трения после расширения учитываются отдельным прямым участком трассы.</span>',
      "</div>"
    ].join("");
  }

  function buildBendDiagram61GuideHtml(section) {
    const context = calculateBendDiagram61Context(section);
    const notes = getBendDiagram61ClampNotes(context);
    if (context.reynolds != null && context.reynolds < 3000) {
      notes.push(`Re = ${formatCompactNumber(context.reynolds, 0)} ниже нижней расчетной области диаграммы 6-1; результат следует считать ориентировочным.`);
    }

    return [
      '<div class="resistance-guide-layout">',
      '<figure class="resistance-guide-figure"><img src="/img/6-1.png" alt="Схема отвода по диаграмме 6-1"></figure>',
      '<div class="resistance-guide-summary">',
      `<span class="resistance-guide-param"><span>δ =</span><strong>${context.angle == null ? "—" : formatCompactNumber(context.angle, 1)}</strong><span>°</span></span>`,
      `<span class="resistance-guide-param"><span>R<sub>0</sub> =</span><strong>${context.radius == null ? "—" : formatCompactNumber(context.radius, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>D<sub>г</sub> =</span><strong>${context.hydraulicDiameter == null ? "—" : formatCompactNumber(context.hydraulicDiameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>${context.radiusRatioLabel} =</span><strong>${context.radiusRatio == null ? "—" : formatCompactNumber(context.radiusRatio, 3)}</strong></span>`,
      `<span class="resistance-guide-param"><span>Re =</span><strong>${context.reynolds == null ? "—" : formatCompactNumber(context.reynolds, 0)}</strong></span>`,
      `<span class="resistance-guide-param"><span>ζ =</span><strong>${context.zeta == null ? "—" : formatCompactNumber(context.zeta, 3)}</strong></span>`,
      notes.length
        ? `<span class="resistance-guide-note">${escapeHtml(notes.join(" "))}</span>`
        : "",
      "</div>",
      "</div>",
      '<div class="resistance-guide-formula">',
      '<strong>Расчет по диаграмме 6-1:</strong> ζ = ζ<sub>м</sub> + ζ<sub>тр</sub>, где ζ<sub>м</sub> = A<sub>1</sub>B<sub>1</sub>C<sub>1</sub>, а ζ<sub>тр</sub> = 0,0175·δ·λ·R<sub>0</sub>/D<sub>г</sub>. Для шероховатых стенок применяется поправка ζ = k<sub>Δ</sub>k<sub>Re</sub>ζ<sub>м</sub> + ζ<sub>тр</sub>.',
      '<br><span>Ограничения справочника: 0 &lt; δ ≤ 180°, основное условие диаграммы R<sub>0</sub>/D<sub>0</sub> или R<sub>0</sub>/b<sub>0</sub> &lt; 3; для установившегося входного профиля требуется l<sub>0</sub>/D<sub>г</sub> ≥ 10. Коэффициент B<sub>1</sub> выбирается по табличной сетке от 0,5 до &gt;40; при выходе за табличную сетку программа использует ближайшую границу и показывает предупреждение.</span>',
      "</div>",
      buildBendDiagram61TableHtml(context)
    ].join("");
  }

  function buildRoundContractionDiagram523GuideHtml(section) {
    const context = calculateRoundContractionDiagram523Context(section);
    const notes = getRoundContractionClampNotes(context);
    if (context.reynolds != null && context.reynolds < 100000) {
      notes.push(`Re = ${formatCompactNumber(context.reynolds, 0)} ниже области применения Re ≥ 10⁵; результат следует считать ориентировочным.`);
    }

    return [
      '<div class="resistance-guide-layout">',
      '<div class="resistance-guide-figures">',
      '<figure class="resistance-guide-figure"><img src="/img/5-23-1.png" alt="Схема круглого конфузора с прямолинейными образующими"></figure>',
      '<figure class="resistance-guide-figure"><img src="/img/5-23-2.png" alt="Схема круглого конфузора с криволинейными образующими"></figure>',
      "</div>",
      '<div class="resistance-guide-summary">',
      `<span class="resistance-guide-param"><span>D<sub>1</sub> =</span><strong>${formatCompactNumber(context.inletDiameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>D<sub>0</sub> =</span><strong>${formatCompactNumber(context.outletDiameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>l<sub>0</sub> =</span><strong>${formatCompactNumber(context.length, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>α =</span><strong>${context.alpha == null ? "—" : formatCompactNumber(context.alpha, 2)}</strong><span>°</span></span>`,
      `<span class="resistance-guide-param"><span>n<sub>0</sub> = F<sub>0</sub>/F<sub>1</sub> =</span><strong>${context.areaRatio == null ? "—" : formatCompactNumber(context.areaRatio, 3)}</strong></span>`,
      `<span class="resistance-guide-param"><span>Re =</span><strong>${context.reynolds == null ? "—" : formatCompactNumber(context.reynolds, 0)}</strong></span>`,
      `<span class="resistance-guide-param"><span>ζ =</span><strong>${context.zeta == null ? "—" : formatCompactNumber(context.zeta, 3)}</strong></span>`,
      notes.length
        ? `<span class="resistance-guide-note">${escapeHtml(notes.join(" "))}</span>`
        : "",
      "</div>",
      "</div>",
      '<div class="resistance-guide-formula">',
      '<strong>Расчет по диаграмме 5-23:</strong> таблица применяется для круглого конфузора в сети при l<sub>0</sub>/D<sub>0</sub> &gt; 0 и Re = w<sub>0</sub>D<sub>0</sub>/ν ≥ 10<sup>5</sup>. Коэффициент ζ задан относительно динамического давления в малом выходном сечении w<sub>0</sub>.',
      '<br><span>В автоматическом расчете используется схема а, 1 — прямолинейные образующие. Для криволинейных образующих и скругления на выходе нужны дополнительные параметры R<sub>0</sub>/D<sub>0</sub> или r/D<sub>0</sub>, поэтому эти варианты показаны только как справочные ограничения.</span>',
      "</div>",
      buildRoundContractionDiagram523TableHtml(context)
    ].join("");
  }

  function buildTransitionContractionDiagram527GuideHtml(section) {
    const context = calculateTransitionContractionDiagram527Context(section);
    const notes = getTransitionContractionClampNotes(context);
    if (context.reynolds != null && context.reynolds < 10000) {
      notes.push(`Re = ${formatCompactNumber(context.reynolds, 0)} ниже области применения Re > 10⁴; результат следует считать ориентировочным.`);
    }

    return [
      '<div class="resistance-guide-layout">',
      '<figure class="resistance-guide-figure"><img src="/img/5-27.png" alt="Схема переходного участка от прямоугольного сечения к круглому"></figure>',
      '<div class="resistance-guide-summary">',
      `<span class="resistance-guide-param"><span>a<sub>1</sub> =</span><strong>${formatCompactNumber(context.inletA, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>b<sub>1</sub> =</span><strong>${formatCompactNumber(context.inletB, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>D<sub>0</sub> =</span><strong>${formatCompactNumber(context.outletDiameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>l =</span><strong>${formatCompactNumber(context.length, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>F<sub>0</sub>/F<sub>1</sub> =</span><strong>${context.areaRatio == null ? "—" : formatCompactNumber(context.areaRatio, 3)}</strong></span>`,
      `<span class="resistance-guide-param"><span>l/D<sub>0</sub> =</span><strong>${context.lengthRatio == null ? "—" : formatCompactNumber(context.lengthRatio, 3)}</strong></span>`,
      `<span class="resistance-guide-param"><span>Re·10<sup>-4</sup> =</span><strong>${context.reScale == null ? "—" : formatCompactNumber(context.reScale, 3)}</strong></span>`,
      `<span class="resistance-guide-param"><span>ζ =</span><strong>${context.zeta == null ? "—" : formatCompactNumber(context.zeta, 3)}</strong></span>`,
      notes.length
        ? `<span class="resistance-guide-note">${escapeHtml(notes.join(" "))}</span>`
        : "",
      "</div>",
      "</div>",
      '<div class="resistance-guide-formula">',
      '<strong>Расчет по диаграмме 5-27:</strong> для блока «Сужение» применяется конфузорный переход прямоугольник → круг при F<sub>0</sub> &lt; F<sub>1</sub>: ζ<sub>к</sub> = ζ<sub>э</sub> + Δζ<sub>к</sub>. Коэффициент задан относительно динамического давления в круглом сечении w<sub>0</sub>.',
      '<br><span>Ограничения справочника: l<sub>0</sub>/D<sub>0</sub> &gt; 0, Re = w<sub>0</sub>D<sub>0</sub>/ν &gt; 10<sup>4</sup>. Табличные диапазоны для выбора: Re·10<sup>-4</sup> = 1...50 и l/D<sub>0</sub> = 1...5; значения вне диапазона ограничиваются ближайшей границей.</span>',
      "</div>",
      buildTransitionContractionDiagram527TableHtml(context)
    ].join("");
  }

  function buildRoundDiffuserDiagram52GuideHtml(section) {
    const context = calculateRoundDiffuserDiagram52Context(section);
    const zeta = context.zeta;
    const notes = getRoundDiffuserClampNotes(context);

    return [
      '<div class="resistance-guide-layout">',
      '<figure class="resistance-guide-figure"><img src="/img/5-2.png" alt="Схема диффузора круглого сечения"></figure>',
      '<div class="resistance-guide-summary">',
      `<span class="resistance-guide-param"><span>D<sub>0</sub> =</span><strong>${formatCompactNumber(context.inletDiameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>D<sub>1</sub> =</span><strong>${formatCompactNumber(context.outletDiameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>l =</span><strong>${formatCompactNumber(context.length, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>α =</span><strong>${context.alpha == null ? "—" : formatCompactNumber(context.alpha, 2)}</strong><span>°</span></span>`,
      `<span class="resistance-guide-param"><span>F<sub>1</sub>/F<sub>0</sub> =</span><strong>${context.expansionRatio == null ? "—" : formatCompactNumber(context.expansionRatio, 3)}</strong></span>`,
      `<span class="resistance-guide-param"><span>Re·10<sup>-5</sup> =</span><strong>${context.reScale == null ? "—" : formatCompactNumber(context.reScale, 3)}</strong></span>`,
      `<span class="resistance-guide-param"><span>ζ =</span><strong>${zeta == null ? "—" : formatCompactNumber(zeta, 3)}</strong></span>`,
      notes.length
        ? `<span class="resistance-guide-note">${escapeHtml(notes.join(" "))}</span>`
        : "",
      "</div>",
      "</div>",
      '<div class="resistance-guide-formula">',
      '<strong>Условия применения:</strong> диаграмма 5-2 используется только для расширения круглого сечения. В расчете применяются диапазоны α = 3...180°, F<sub>1</sub>/F<sub>0</sub> = 2...16 и Re·10<sup>-5</sup> = 0,5...6; значения вне диапазона ограничиваются ближайшей границей таблицы.',
      "</div>",
      buildRoundDiffuserDiagram52TableHtml(context)
    ].join("");
  }

  function buildRectangularDiffuserDiagram54GuideHtml(section) {
    const context = calculateRectangularDiffuserDiagram54Context(section);
    const zeta = context.zeta;
    const notes = getRectangularDiffuserClampNotes(context);
    const profileLabel = context.profile >= 10 ? "l₀/Dг ≥ 10" : "l₀/Dг = 0";

    return [
      '<div class="resistance-guide-layout">',
      '<figure class="resistance-guide-figure"><img src="/img/5-4.png" alt="Схема диффузора прямоугольного сечения"></figure>',
      '<div class="resistance-guide-summary">',
      `<span class="resistance-guide-param"><span>a₀ =</span><strong>${formatCompactNumber(context.inletA, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>b₀ =</span><strong>${formatCompactNumber(context.inletB, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>a₁ =</span><strong>${formatCompactNumber(context.outletA, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>b₁ =</span><strong>${formatCompactNumber(context.outletB, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>D<sub>г</sub> =</span><strong>${context.hydraulicDiameter == null ? "—" : formatCompactNumber(context.hydraulicDiameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>α =</span><strong>${context.alpha == null ? "—" : formatCompactNumber(context.alpha, 2)}</strong><span>°</span></span>`,
      `<span class="resistance-guide-param"><span>F<sub>1</sub>/F<sub>0</sub> =</span><strong>${context.expansionRatio == null ? "—" : formatCompactNumber(context.expansionRatio, 3)}</strong></span>`,
      `<span class="resistance-guide-param"><span>Re·10<sup>-5</sup> =</span><strong>${context.reScale == null ? "—" : formatCompactNumber(context.reScale, 3)}</strong></span>`,
      `<span class="resistance-guide-param"><span>${profileLabel}</span><strong> </strong></span>`,
      `<span class="resistance-guide-param"><span>ζ =</span><strong>${zeta == null ? "—" : formatCompactNumber(zeta, 3)}</strong></span>`,
      notes.length
        ? `<span class="resistance-guide-note">${escapeHtml(notes.join(" "))}</span>`
        : "",
      "</div>",
      "</div>",
      '<div class="resistance-guide-formula">',
      '<strong>Условия применения:</strong> диаграмма 5-4 используется только для расширения прямоугольного сечения в сети при l₁/D₁г &gt; 0 и α = 4...180°. В расчете применяются диапазоны F<sub>1</sub>/F<sub>0</sub> = 2...10 и Re·10<sup>-5</sup> = 0,5...4; значения вне диапазона ограничиваются ближайшей границей таблицы.',
      "</div>",
      buildRectangularDiffuserDiagram54TableHtml(context)
    ].join("");
  }

  function buildTransitionDiffuserDiagram528GuideHtml(section) {
    const context = calculateTransitionDiffuserDiagram528Context(section);
    const zeta = context.zeta;
    const notes = getRectangularDiffuserClampNotes(context);
    const profileLabel = context.profile >= 10 ? "l₀/Dг ≥ 10" : "l₀/Dг = 0";
    const directionLabel = context.direction === "round-to-rectangle"
      ? "круг → прямоугольник"
      : "прямоугольник → круг";
    const sizeParams = context.direction === "round-to-rectangle"
      ? [
          `<span class="resistance-guide-param"><span>D<sub>0</sub> =</span><strong>${formatCompactNumber(context.inletDiameter, 3)}</strong><span>м</span></span>`,
          `<span class="resistance-guide-param"><span>a<sub>1</sub> =</span><strong>${formatCompactNumber(context.outletA, 3)}</strong><span>м</span></span>`,
          `<span class="resistance-guide-param"><span>b<sub>1</sub> =</span><strong>${formatCompactNumber(context.outletB, 3)}</strong><span>м</span></span>`
        ].join("")
      : [
          `<span class="resistance-guide-param"><span>a<sub>0</sub> =</span><strong>${formatCompactNumber(context.inletA, 3)}</strong><span>м</span></span>`,
          `<span class="resistance-guide-param"><span>b<sub>0</sub> =</span><strong>${formatCompactNumber(context.inletB, 3)}</strong><span>м</span></span>`,
          `<span class="resistance-guide-param"><span>D<sub>1</sub> =</span><strong>${formatCompactNumber(context.outletDiameter, 3)}</strong><span>м</span></span>`
        ].join("");

    return [
      '<div class="resistance-guide-layout">',
      `<figure class="resistance-guide-figure"><img src="${escapeAttr(context.image)}" alt="Схема переходного диффузора"></figure>`,
      '<div class="resistance-guide-summary">',
      `<span class="resistance-guide-param"><span>Переход:</span><strong>${directionLabel}</strong></span>`,
      sizeParams,
      `<span class="resistance-guide-param"><span>l<sub>д</sub> =</span><strong>${formatCompactNumber(context.length, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>D<sub>г</sub> =</span><strong>${context.hydraulicDiameter == null ? "—" : formatCompactNumber(context.hydraulicDiameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>α =</span><strong>${context.alpha == null ? "—" : formatCompactNumber(context.alpha, 2)}</strong><span>°</span></span>`,
      `<span class="resistance-guide-param"><span>F<sub>1</sub>/F<sub>0</sub> =</span><strong>${context.expansionRatio == null ? "—" : formatCompactNumber(context.expansionRatio, 3)}</strong></span>`,
      `<span class="resistance-guide-param"><span>Re·10<sup>-5</sup> =</span><strong>${context.reScale == null ? "—" : formatCompactNumber(context.reScale, 3)}</strong></span>`,
      `<span class="resistance-guide-param"><span>${profileLabel}</span><strong> </strong></span>`,
      `<span class="resistance-guide-param"><span>ζ =</span><strong>${zeta == null ? "—" : formatCompactNumber(zeta, 3)}</strong></span>`,
      notes.length
        ? `<span class="resistance-guide-note">${escapeHtml(notes.join(" "))}</span>`
        : "",
      "</div>",
      "</div>",
      '<div class="resistance-guide-formula">',
      '<strong>Расчет по диаграмме 5-28:</strong> сначала определяется эквивалентный угол раскрытия α для перехода круг ↔ прямоугольник, затем коэффициент ζ берется по таблицам диаграммы 5-4 для пирамидального диффузора. Условие справочника: l<sub>1</sub>/D<sub>1</sub> &gt; 0.',
      "</div>",
      buildRectangularDiffuserDiagram54TableHtml(context)
    ].join("");
  }

  function buildPassingFlowSummaryParams(context, xConfig, yConfig) {
    return [
      `<span class="resistance-guide-param"><span>w<sub>0</sub> =</span><strong>${formatCompactNumber(context.flowVelocity, 3)}</strong><span>м/с</span></span>`,
      `<span class="resistance-guide-param"><span>w<sub>∞</sub> =</span><strong>${formatCompactNumber(context.inputParamX, 3)}</strong><span>м/с</span></span>`,
      buildResistanceSummaryParam(xConfig, context.rawParamX),
      buildResistanceSummaryParam(yConfig, context.rawParamY)
    ].join("");
  }

  function buildPipeEntranceSummaryParams(context, xConfig, yConfig) {
    return [
      `<span class="resistance-guide-param"><span>D<sub>г</sub> =</span><strong>${formatCompactNumber(context.diameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>b =</span><strong>${formatCompactNumber(context.inputParamX, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>δ<sub>1</sub> =</span><strong>${formatCompactNumber(context.inputParamY, 3)}</strong><span>м</span></span>`,
      buildResistanceSummaryParam(xConfig, context.rawParamX),
      buildResistanceSummaryParam(yConfig, context.rawParamY)
    ].join("");
  }

  function buildArcWithoutScreenSummaryParams(context, xConfig) {
    return [
      `<span class="resistance-guide-param"><span>D<sub>г</sub> =</span><strong>${formatCompactNumber(context.diameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>r =</span><strong>${formatCompactNumber(context.inputParamX, 3)}</strong><span>м</span></span>`,
      buildResistanceSummaryParam(xConfig, context.rawParamX)
    ].join("");
  }

  function buildArcWithScreenSummaryParams(context, xConfig, yConfig) {
    return [
      `<span class="resistance-guide-param"><span>D<sub>г</sub> =</span><strong>${formatCompactNumber(context.diameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>h =</span><strong>${formatCompactNumber(context.inputParamX, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>r =</span><strong>${formatCompactNumber(context.inputParamY, 3)}</strong><span>м</span></span>`,
      buildResistanceSummaryParam(xConfig, context.rawParamX),
      buildResistanceSummaryParam(yConfig, context.rawParamY)
    ].join("");
  }


  function buildResistanceSummaryParam(config, value) {
    const suffix = config.suffix ? `<span>${escapeHtml(config.suffix)}</span>` : "";
    return `<span class="resistance-guide-param"><span>${config.summaryLabel} =</span><strong>${formatCompactNumber(value, config.digits)}</strong>${suffix}</span>`;
  }

  function buildResistanceGuideTableHtml(section, item) {
    const points = getResistancePoints(item);
    const xs = uniqueSorted(points.map((point) => readPointNumber(point, "paramX", "ParamX")));
    const ys = uniqueSorted(points.map((point) => readPointNumber(point, "paramY", "ParamY")));
    if (!xs.length || !ys.length) {
      return '<p class="inspector-note">Для выбранного сопротивления нет табличных данных.</p>';
    }

    const selection = getResistanceTableSelection(section, item);
    const xConfig = getResistanceAxisConfig(section.localResistanceType, "x");
    const yConfig = getResistanceAxisConfig(section.localResistanceType, "y");
    const zetaHeader = isConicalCollectorType(section.localResistanceType)
      ? "ζ<sub>0</sub>"
      : "ζ";
    if (isArcCollectorWithoutScreenType(section.localResistanceType)) {
      const bodyCells = xs.map((x) => {
        const zeta = findPointZeta(points, x, 0);
        const isSource = selection && isValueWithinBounds(x, selection.xBounds);
        const exact = isSource && selection.isExact;
        const className = isSource ? ` class="${exact ? "is-source is-exact" : "is-source"}"` : "";
        return `<td${className}>${zeta == null ? "—" : formatCompactNumber(zeta, 3)}</td>`;
      }).join("");
      const headerCells = xs
        .map((x) => {
          const sourceClass = selection && isValueWithinBounds(x, selection.xBounds) ? " class=\"is-source-axis\"" : "";
          return `<th scope="col"${sourceClass}>${formatResistanceAxisValue(section.localResistanceType, "x", x)}</th>`;
        })
        .join("");

      return [
        '<div class="resistance-table-wrap">',
        '<table class="resistance-guide-table">',
        "<thead>",
        `<tr><th class="resistance-guide-title-cell" scope="col" colspan="${xs.length}">Значение ${zetaHeader} при ${xConfig.tableLabel}</th></tr>`,
        `<tr>${headerCells}</tr>`,
        "</thead>",
        `<tbody><tr>${bodyCells}</tr></tbody>`,
        "</table>",
        "</div>"
      ].join("");
    }

    const headerCells = xs
      .map((x) => {
        const sourceClass = selection && isValueWithinBounds(x, selection.xBounds) ? " class=\"is-source-axis\"" : "";
        return `<th scope="col"${sourceClass}>${formatResistanceAxisValue(section.localResistanceType, "x", x)}</th>`;
      })
      .join("");
    const bodyRows = ys
      .map((y) => {
        const rowClass = selection && isValueWithinBounds(y, selection.yBounds) ? " class=\"is-source-axis\"" : "";
        const cells = xs.map((x) => {
          const zeta = findPointZeta(points, x, y);
          const isSource = selection && isValueWithinBounds(x, selection.xBounds) && isValueWithinBounds(y, selection.yBounds);
          const exact = isSource && selection.isExact;
          const className = isSource ? ` class="${exact ? "is-source is-exact" : "is-source"}"` : "";
          return `<td${className}>${zeta == null ? "—" : formatCompactNumber(zeta, 3)}</td>`;
        }).join("");
        return `<tr><th scope="row"${rowClass}>${formatResistanceAxisValue(section.localResistanceType, "y", y)}</th>${cells}</tr>`;
      })
      .join("");

    return [
      '<div class="resistance-table-wrap">',
      '<table class="resistance-guide-table">',
      "<thead>",
      `<tr><th class="resistance-guide-axis" scope="col" rowspan="2">${yConfig.tableLabel}</th><th class="resistance-guide-title-cell" scope="col" colspan="${xs.length}">Значение ${zetaHeader} при ${xConfig.tableLabel}</th></tr>`,
      "<tr>",
      headerCells,
      "</tr>",
      "</thead>",
      `<tbody>${bodyRows}</tbody>`,
      "</table>",
      "</div>"
    ].join("");
  }

  function buildRoundContractionDiagram523TableHtml(context) {
    const alphaBounds = context.effectiveAlpha == null ? null : findNumericBounds(contractionDiagram523Alphas, context.effectiveAlpha);
    const ratioBounds = context.effectiveAreaRatio == null ? null : findNumericBounds(contractionDiagram523AreaRatios, context.effectiveAreaRatio);
    const hasSelection = Boolean(alphaBounds && ratioBounds);
    const headerCells = contractionDiagram523DisplayAlphas
      .map((alphaColumn) => {
        const sourceClass = hasSelection && isRangeWithinBounds(alphaColumn.min, alphaColumn.max, alphaBounds) ? ' class="is-source-axis"' : "";
        return `<th scope="col"${sourceClass}>${escapeHtml(alphaColumn.label)}</th>`;
      })
      .join("");
    const rows = contractionDiagram523DisplayAreaRatios
      .map((areaRatio) => {
        const rowClass = hasSelection && isValueWithinBounds(areaRatio, ratioBounds) ? ' class="is-source-axis"' : "";
        const sourceValues = contractionDiagram523Values[areaRatio] || [];
        const cells = contractionDiagram523DisplayAlphas.map((alphaColumn) => {
          const zeta = getRoundContractionDiagram523DisplayValue(sourceValues, alphaColumn);
          const isSource = hasSelection &&
            isValueWithinBounds(areaRatio, ratioBounds) &&
            isRangeWithinBounds(alphaColumn.min, alphaColumn.max, alphaBounds);
          const exact = isSource &&
            Math.abs(ratioBounds.lower - ratioBounds.upper) < 0.000001 &&
            Math.abs(alphaBounds.lower - alphaBounds.upper) < 0.000001 &&
            alphaColumn.min === alphaColumn.max;
          const className = isSource ? ` class="${exact ? "is-source is-exact" : "is-source"}"` : "";
          return `<td${className}>${zeta == null ? "—" : formatCompactNumber(zeta, 3)}</td>`;
        }).join("");
        return `<tr><th scope="row"${rowClass}>${formatCompactNumber(areaRatio, 2)}</th>${cells}</tr>`;
      })
      .join("");

    return [
      '<div class="diffuser-guide-tables">',
      !hasSelection
        ? '<p class="inspector-note">Чтобы подсветить ячейку диаграммы, укажите входной диаметр D₁, выходной диаметр D₀ и длину l₀.</p>'
        : "",
      '<div class="resistance-table-wrap diffuser-table-wrap">',
      '<table class="resistance-guide-table diffuser-guide-table contraction523-table">',
      "<thead>",
      `<tr><th class="resistance-guide-axis" scope="col" rowspan="2">n<sub>0</sub></th><th class="resistance-guide-title-cell" scope="col" colspan="${contractionDiagram523DisplayAlphas.length}">Значение ζ при α, град</th></tr>`,
      `<tr>${headerCells}</tr>`,
      "</thead>",
      `<tbody>${rows}</tbody>`,
      "</table>",
      "</div>",
      "</div>"
    ].join("");
  }

  function getRoundContractionDiagram523DisplayValue(sourceValues, alphaColumn) {
    const lowerIndex = contractionDiagram523Alphas.findIndex((alpha) => Math.abs(alpha - alphaColumn.min) < 0.000001);
    if (lowerIndex < 0) {
      return null;
    }

    return sourceValues[lowerIndex];
  }

  function buildBendDiagram61TableHtml(context) {
    const angleBounds = context.effectiveAngle == null ? null : findNumericBounds(bendDiagram61Angles, context.effectiveAngle);
    const radiusBounds = context.effectiveRadiusRatio == null ? null : findNumericBounds(bendDiagram61RadiusRatios, context.effectiveRadiusRatio);
    const aspectBounds = context.effectiveAspectRatio == null ? null : findNumericBounds(bendDiagram61AspectRatios, context.effectiveAspectRatio);
    const reBounds = context.effectiveReScale == null ? null : findNumericBounds(bendDiagram61KReScales, context.effectiveReScale);
    const angleHeaderCells = bendDiagram61Angles
      .map((angle) => {
        const sourceClass = angleBounds && isValueWithinBounds(angle, angleBounds) ? ' class="is-source-axis"' : "";
        return `<th scope="col"${sourceClass}>${formatCompactNumber(angle, 0)}</th>`;
      })
      .join("");
    const angleCells = bendDiagram61A1Values
      .map((value, index) => {
        const angle = bendDiagram61Angles[index];
        const isSource = angleBounds && isValueWithinBounds(angle, angleBounds);
        const exact = isSource && Math.abs(angleBounds.lower - angleBounds.upper) < 0.000001;
        const className = isSource ? ` class="${exact ? "is-source is-exact" : "is-source"}"` : "";
        return `<td${className}>${formatCompactNumber(value, 2)}</td>`;
      })
      .join("");
    const radiusHeaderCells = bendDiagram61RadiusRatios
      .map((ratio) => {
        const sourceClass = radiusBounds && isValueWithinBounds(ratio, radiusBounds) ? ' class="is-source-axis"' : "";
        return `<th scope="col"${sourceClass}>${formatCompactNumber(ratio, ratio < 1 ? 2 : 1)}</th>`;
      })
      .join("");
    const radiusCells = bendDiagram61B1Values
      .map((value, index) => {
        const ratio = bendDiagram61RadiusRatios[index];
        const isSource = radiusBounds && isValueWithinBounds(ratio, radiusBounds);
        const exact = isSource && Math.abs(radiusBounds.lower - radiusBounds.upper) < 0.000001;
        const className = isSource ? ` class="${exact ? "is-source is-exact" : "is-source"}"` : "";
        return `<td${className}>${formatCompactNumber(value, 2)}</td>`;
      })
      .join("");
    const aspectHeaderCells = bendDiagram61AspectRatios
      .map((ratio) => {
        const sourceClass = aspectBounds && isValueWithinBounds(ratio, aspectBounds) ? ' class="is-source-axis"' : "";
        return `<th scope="col"${sourceClass}>${formatCompactNumber(ratio, ratio < 1 ? 2 : 1)}</th>`;
      })
      .join("");
    const aspectCells = bendDiagram61C1Values
      .map((value, index) => {
        const ratio = bendDiagram61AspectRatios[index];
        const isSource = aspectBounds && isValueWithinBounds(ratio, aspectBounds);
        const exact = isSource && Math.abs(aspectBounds.lower - aspectBounds.upper) < 0.000001;
        const className = isSource ? ` class="${exact ? "is-source is-exact" : "is-source"}"` : "";
        return `<td${className}>${formatCompactNumber(value, 2)}</td>`;
      })
      .join("");
    const kReRowIndex = getBendDiagram61KReRowIndex(context.effectiveRadiusRatio);
    const reHeaderCells = bendDiagram61KReScales
      .map((scale) => {
        const sourceClass = reBounds && isValueWithinBounds(scale, reBounds) ? ' class="is-source-axis"' : "";
        return `<th scope="col"${sourceClass}>${formatCompactNumber(scale, 2)}</th>`;
      })
      .join("");
    const reCells = bendDiagram61KReValues[kReRowIndex]
      .map((value, index) => {
        const scale = bendDiagram61KReScales[index];
        const isSource = reBounds && isValueWithinBounds(scale, reBounds);
        const exact = isSource && Math.abs(reBounds.lower - reBounds.upper) < 0.000001;
        const className = isSource ? ` class="${exact ? "is-source is-exact" : "is-source"}"` : "";
        return `<td${className}>${formatCompactNumber(value, 2)}</td>`;
      })
      .join("");

    return [
      '<div class="diffuser-guide-tables">',
      context.zeta == null
        ? '<p class="inspector-note">Чтобы подсветить таблицы диаграммы, укажите угол δ, радиус R₀, размеры сечения, расход газа и температуру газа.</p>'
        : "",
      buildBendDiagram61OneLineTable("A<sub>1</sub> по углу поворота", "δ, град", angleHeaderCells, "A<sub>1</sub>", angleCells),
      buildBendDiagram61OneLineTable(`B<sub>1</sub> по ${context.radiusRatioLabel}`, context.radiusRatioLabel, radiusHeaderCells, "B<sub>1</sub>", radiusCells),
      context.shape === "Rectangle"
        ? buildBendDiagram61OneLineTable("C<sub>1</sub> по вытянутости прямоугольного сечения", "a<sub>0</sub>/b<sub>0</sub>", aspectHeaderCells, "C<sub>1</sub>", aspectCells)
        : '<p class="inspector-note">Для круглого и квадратного сечения C<sub>1</sub> = 1,0.</p>',
      buildBendDiagram61OneLineTable(`k<sub>Re</sub> для ${getBendDiagram61KReRowLabel(kReRowIndex)}`, "Re·10<sup>-5</sup>", reHeaderCells, "k<sub>Re</sub>", reCells),
      "</div>"
    ].join("");
  }

  function buildBendDiagram61OneLineTable(caption, headerLabel, headerCells, rowLabel, bodyCells) {
    return [
      '<div class="resistance-table-wrap bend61-table-wrap">',
      '<table class="resistance-guide-table diffuser-guide-table bend61-table">',
      `<caption>${caption}</caption>`,
      "<tbody>",
      `<tr><th class="resistance-guide-axis" scope="row">${headerLabel}</th>${headerCells}</tr>`,
      `<tr><th class="resistance-guide-axis" scope="row">${rowLabel}</th>${bodyCells}</tr>`,
      "</tbody>",
      "</table>",
      "</div>"
    ].join("");
  }

  function buildTransitionContractionDiagram527TableHtml(context) {
    const reBounds = context.effectiveReScale == null ? null : findNumericBounds(transitionContractionDiagram527ReScales, context.effectiveReScale);
    const lengthBounds = context.effectiveLengthRatio == null ? null : findNumericBounds(transitionContractionDiagram527LengthRatios, context.effectiveLengthRatio);
    const hasSelection = Boolean(reBounds && lengthBounds);
    const reHeaderCells = transitionContractionDiagram527ReScales
      .map((reScale) => {
        const sourceClass = hasSelection && isValueWithinBounds(reScale, reBounds) ? ' class="is-source-axis"' : "";
        return `<th scope="col"${sourceClass}>${formatCompactNumber(reScale, 1)}</th>`;
      })
      .join("");
    const reCells = transitionContractionDiagram527DeltaValues
      .map((delta, index) => {
        const reScale = transitionContractionDiagram527ReScales[index];
        const isSource = hasSelection && isValueWithinBounds(reScale, reBounds);
        const exact = isSource && Math.abs(reBounds.lower - reBounds.upper) < 0.000001;
        const className = isSource ? ` class="${exact ? "is-source is-exact" : "is-source"}"` : "";
        return `<td${className}>${formatCompactNumber(delta, 3)}</td>`;
      })
      .join("");
    const lengthHeaderCells = transitionContractionDiagram527LengthRatios
      .map((ratio) => {
        const sourceClass = hasSelection && isValueWithinBounds(ratio, lengthBounds) ? ' class="is-source-axis"' : "";
        return `<th scope="col"${sourceClass}>${formatCompactNumber(ratio, 1)}</th>`;
      })
      .join("");
    const c1Cells = transitionContractionDiagram527C1Values
      .map((c1, index) => {
        const ratio = transitionContractionDiagram527LengthRatios[index];
        const isSource = hasSelection && isValueWithinBounds(ratio, lengthBounds);
        const exact = isSource && Math.abs(lengthBounds.lower - lengthBounds.upper) < 0.000001;
        const className = isSource ? ` class="${exact ? "is-source is-exact" : "is-source"}"` : "";
        return `<td${className}>${formatCompactNumber(c1, 4)}</td>`;
      })
      .join("");

    return [
      '<div class="diffuser-guide-tables">',
      !hasSelection
        ? '<p class="inspector-note">Чтобы подсветить таблицы диаграммы, укажите стороны прямоугольного входа a₁ и b₁, выходной диаметр D₀, длину перехода, расход газа и температуру газа.</p>'
        : "",
      '<div class="resistance-table-wrap contraction527-table-wrap">',
      '<table class="resistance-guide-table diffuser-guide-table contraction527-table">',
      '<caption>Поправка Δζ<sub>к</sub> по числу Рейнольдса</caption>',
      "<tbody>",
      `<tr><th class="resistance-guide-axis" scope="row">Re·10<sup>-4</sup></th>${reHeaderCells}</tr>`,
      `<tr><th class="resistance-guide-axis" scope="row">Δζ<sub>к</sub></th>${reCells}</tr>`,
      "</tbody>",
      "</table>",
      "</div>",
      '<div class="resistance-table-wrap contraction527-table-wrap">',
      '<table class="resistance-guide-table diffuser-guide-table contraction527-table">',
      '<caption>Коэффициент c<sub>1к</sub> по относительной длине</caption>',
      "<tbody>",
      `<tr><th class="resistance-guide-axis" scope="row">l/D<sub>0</sub></th>${lengthHeaderCells}</tr>`,
      `<tr><th class="resistance-guide-axis" scope="row">c<sub>1к</sub></th>${c1Cells}</tr>`,
      "</tbody>",
      "</table>",
      "</div>",
      "</div>"
    ].join("");
  }

  function buildRoundDiffuserDiagram52TableHtml(context) {
    const alphaBounds = context.effectiveAlpha == null ? null : findNumericBounds(diffuserDiagram52Alphas, context.effectiveAlpha);
    const reBounds = context.effectiveReScale == null ? null : findNumericBounds(diffuserDiagram52ReScales, context.effectiveReScale);
    const ratioBounds = context.effectiveExpansionRatio == null ? null : findNumericBounds(diffuserDiagram52Ratios, context.effectiveExpansionRatio);
    const hasSelection = Boolean(alphaBounds && reBounds && ratioBounds);
    const tables = diffuserDiagram52Ratios.map((ratio) => {
      const values = diffuserDiagram52Values[ratio] || [];
      const ratioSelected = hasSelection && isValueWithinBounds(ratio, ratioBounds);
      const headerCells = diffuserDiagram52Alphas
        .map((alpha) => {
          const sourceClass = ratioSelected && isValueWithinBounds(alpha, alphaBounds) ? ' class="is-source-axis"' : "";
          return `<th scope="col"${sourceClass}>${formatNumber(alpha, alpha % 1 === 0 ? 0 : 1)}</th>`;
        })
        .join("");
      const rows = diffuserDiagram52ReScales
        .map((reScale, rowIndex) => {
          const rowClass = ratioSelected && isValueWithinBounds(reScale, reBounds) ? ' class="is-source-axis"' : "";
          const cells = diffuserDiagram52Alphas.map((alpha, columnIndex) => {
            const zeta = values[rowIndex] ? values[rowIndex][columnIndex] : null;
            const isSource = ratioSelected &&
              isValueWithinBounds(reScale, reBounds) &&
              isValueWithinBounds(alpha, alphaBounds);
            const exact = isSource &&
              Math.abs(ratioBounds.lower - ratioBounds.upper) < 0.000001 &&
              Math.abs(reBounds.lower - reBounds.upper) < 0.000001 &&
              Math.abs(alphaBounds.lower - alphaBounds.upper) < 0.000001;
            const className = isSource ? ` class="${exact ? "is-source is-exact" : "is-source"}"` : "";
            return `<td${className}>${zeta == null ? "—" : formatCompactNumber(zeta, 3)}</td>`;
          }).join("");
          return `<tr><th scope="row"${rowClass}>${formatCompactNumber(reScale, 2)}</th>${cells}</tr>`;
        })
        .join("");

      return [
        '<div class="resistance-table-wrap diffuser-table-wrap">',
        '<table class="resistance-guide-table diffuser-guide-table">',
        "<thead>",
        `<tr><th class="resistance-guide-axis" scope="col" rowspan="2">Re·10<sup>-5</sup></th><th class="resistance-guide-title-cell" scope="col" colspan="${diffuserDiagram52Alphas.length}">Значение ζ<sub>д</sub> при F<sub>1</sub>/F<sub>0</sub> = ${formatCompactNumber(ratio, 0)} и α, град</th></tr>`,
        `<tr>${headerCells}</tr>`,
        "</thead>",
        `<tbody>${rows}</tbody>`,
        "</table>",
        "</div>"
      ].join("");
    }).join("");

    return [
      '<div class="diffuser-guide-tables">',
      !hasSelection
        ? '<p class="inspector-note">Чтобы подсветить ячейку диаграммы, укажите входной диаметр D₀, выходной диаметр D₁, длину l, расход газа и температуру газа.</p>'
        : "",
      tables,
      "</div>"
    ].join("");
  }

  function buildRectangularDiffuserDiagram54TableHtml(context) {
    const alphaBounds = context.effectiveAlpha == null ? null : findNumericBounds(diffuserDiagram54Alphas, context.effectiveAlpha);
    const reBounds = context.effectiveReScale == null ? null : findNumericBounds(diffuserDiagram54ReScales, context.effectiveReScale);
    const ratioBounds = context.effectiveExpansionRatio == null ? null : findNumericBounds(diffuserDiagram54Ratios, context.effectiveExpansionRatio);
    const hasSelection = Boolean(alphaBounds && reBounds && ratioBounds);
    const profileValues = diffuserDiagram54Values[context.profile] || {};
    const profileLabel = context.profile >= 10 ? "l₀/Dг ≥ 10" : "l₀/Dг = 0";
    const tables = diffuserDiagram54Ratios.map((ratio) => {
      const values = profileValues[ratio] || [];
      const ratioSelected = hasSelection && isValueWithinBounds(ratio, ratioBounds);
      const headerCells = diffuserDiagram54Alphas
        .map((alpha) => {
          const sourceClass = ratioSelected && isValueWithinBounds(alpha, alphaBounds) ? ' class="is-source-axis"' : "";
          return `<th scope="col"${sourceClass}>${formatNumber(alpha, alpha % 1 === 0 ? 0 : 1)}</th>`;
        })
        .join("");
      const rows = diffuserDiagram54ReScales
        .map((reScale, rowIndex) => {
          const rowClass = ratioSelected && isValueWithinBounds(reScale, reBounds) ? ' class="is-source-axis"' : "";
          const cells = diffuserDiagram54Alphas.map((alpha, columnIndex) => {
            const zeta = values[rowIndex] ? values[rowIndex][columnIndex] : null;
            const isSource = ratioSelected &&
              isValueWithinBounds(reScale, reBounds) &&
              isValueWithinBounds(alpha, alphaBounds);
            const exact = isSource &&
              Math.abs(ratioBounds.lower - ratioBounds.upper) < 0.000001 &&
              Math.abs(reBounds.lower - reBounds.upper) < 0.000001 &&
              Math.abs(alphaBounds.lower - alphaBounds.upper) < 0.000001;
            const className = isSource ? ` class="${exact ? "is-source is-exact" : "is-source"}"` : "";
            return `<td${className}>${zeta == null ? "—" : formatCompactNumber(zeta, 3)}</td>`;
          }).join("");
          return `<tr><th scope="row"${rowClass}>${formatCompactNumber(reScale, 2)}</th>${cells}</tr>`;
        })
        .join("");

      return [
        '<div class="resistance-table-wrap diffuser-table-wrap">',
        '<table class="resistance-guide-table diffuser-guide-table diffuser54-table">',
        "<thead>",
        `<tr><th class="resistance-guide-axis" scope="col" rowspan="2">Re·10<sup>-5</sup></th><th class="resistance-guide-title-cell" scope="col" colspan="${diffuserDiagram54Alphas.length}">Значение ζ<sub>д</sub> при F<sub>1</sub>/F<sub>0</sub> = ${formatCompactNumber(ratio, 0)} и α, град</th></tr>`,
        `<tr>${headerCells}</tr>`,
        "</thead>",
        `<tbody>${rows}</tbody>`,
        "</table>",
        "</div>"
      ].join("");
    }).join("");

    return [
      '<div class="diffuser-guide-tables">',
      `<p class="inspector-note">Показана таблица для режима ${profileLabel}. Чтобы подсветить ячейку диаграммы, укажите стороны входного и выходного прямоугольного сечения, длину диффузора, расход газа и температуру газа.</p>`,
      !hasSelection
        ? '<p class="inspector-note">Сейчас расчетные параметры неполные, поэтому ячейка таблицы не подсвечена.</p>'
        : "",
      tables,
      "</div>"
    ].join("");
  }

  function formatResistanceAxisValue(typeName, axis, value) {
    const config = getResistanceAxisConfig(typeName, axis);
    const parsed = parseNumber(value, null);
    if (!Number.isFinite(parsed)) {
      return "—";
    }

    if (isStraightPipeEntranceType(typeName)) {
      if (axis === "x" && parsed >= 0.5 - 0.000001) {
        return `≥${formatNumber(0.5, config.digits)}`;
      }

      if (axis === "y" && parsed >= 0.05 - 0.000001) {
        return `≥${formatNumber(0.05, config.digits)}`;
      }
    }

    if (isArcCollectorWithoutScreenType(typeName) && axis === "x" && parsed >= 0.2 - 0.000001) {
      return `≥${formatNumber(0.2, config.digits)}`;
    }

    return formatNumber(parsed, config.digits);
  }

  function getResistanceTableSelection(section, item) {
    const points = getResistancePoints(item);
    const context = getResistanceParameterContext(section, item);
    const paramX = context.paramX;
    const paramY = context.paramY;
    if (paramX == null || paramY == null) {
      return null;
    }

    const xs = uniqueSorted(points.map((point) => readPointNumber(point, "paramX", "ParamX")));
    const ys = uniqueSorted(points.map((point) => readPointNumber(point, "paramY", "ParamY")));
    const xBounds = findNumericBounds(xs, paramX);
    const yBounds = findNumericBounds(ys, paramY);
    if (!xBounds || !yBounds) {
      return null;
    }

    return {
      xBounds,
      yBounds,
      isExact: Math.abs(xBounds.lower - xBounds.upper) < 0.000001 && Math.abs(yBounds.lower - yBounds.upper) < 0.000001
    };
  }

  function isValueWithinBounds(value, bounds) {
    return bounds && value >= bounds.lower - 0.000001 && value <= bounds.upper + 0.000001;
  }

  function isRangeWithinBounds(min, max, bounds) {
    return bounds && max >= bounds.lower - 0.000001 && min <= bounds.upper + 0.000001;
  }

  function getResistanceGuideImage(typeName) {
    if (isArcCollectorWithoutScreenNoEndWallType(typeName)) {
      return "/img/3-4-1.png";
    }

    if (isArcCollectorWithoutScreenWithEndWallType(typeName)) {
      return "/img/3-4-2.png";
    }

    if (isSuddenExpansionType(typeName)) {
      return "/img/4-1.png";
    }

    if (isArcCollectorWithScreenType(typeName)) {
      return "/img/3-5.png";
    }

    if (isRostrumWithoutEndWallType(typeName)) {
      return "/img/3-6.png";
    }

    if (isRostrumWithEndWallType(typeName)) {
      return "/img/3-7.png";
    }

    if (isConicalCollectorType(typeName)) {
      return "/img/conical-collector.svg";
    }

    if (isStraightPipeEntranceType(typeName)) {
      return "/img/3-1.png";
    }

    if (isFlushWallEntranceType(typeName)) {
      return "/img/3-2.png";
    }

    if (isPassingFlowEntranceType(typeName)) {
      return "/img/3-3.png";
    }

    return "";
  }

  function isConicalCollectorType(typeName) {
    return String(typeName || "").trim().toLowerCase().includes("\u043a\u043e\u043d\u0438\u0447\u0435\u0441");
  }

  function isArcCollectorWithoutScreenType(typeName) {
    const normalized = String(typeName || "").trim().toLowerCase();
    return normalized.includes("по дуге круга") && normalized.includes("без экрана");
  }

  function isArcCollectorWithoutScreenNoEndWallType(typeName) {
    const normalized = String(typeName || "").trim().toLowerCase();
    return isArcCollectorWithoutScreenType(typeName) && normalized.includes("без торцов");
  }

  function isArcCollectorWithoutScreenWithEndWallType(typeName) {
    const normalized = String(typeName || "").trim().toLowerCase();
    return isArcCollectorWithoutScreenType(typeName) && !normalized.includes("без торцов") && normalized.includes("с торцов");
  }

  function isArcCollectorWithScreenType(typeName) {
    const normalized = String(typeName || "").trim().toLowerCase();
    return normalized.includes("по дуге круга") &&
      !normalized.includes("без экрана") &&
      normalized.includes("экран");
  }

  function isArcCollectorType(typeName) {
    return isArcCollectorWithoutScreenType(typeName) || isArcCollectorWithScreenType(typeName);
  }

  function isRostrumCollectorType(typeName) {
    const normalized = String(typeName || "").trim().toLowerCase();
    return normalized.includes("раструб") && normalized.includes("торцов");
  }

  function isRostrumWithoutEndWallType(typeName) {
    const normalized = String(typeName || "").trim().toLowerCase();
    return isRostrumCollectorType(typeName) && normalized.includes("без торцов");
  }

  function isRostrumWithEndWallType(typeName) {
    const normalized = String(typeName || "").trim().toLowerCase();
    return isRostrumCollectorType(typeName) && !normalized.includes("без торцов") && normalized.includes("с торцов");
  }

  function isLengthRatioCollectorType(typeName) {
    return isConicalCollectorType(typeName) || isRostrumCollectorType(typeName);
  }

  function isSuddenExpansionType(typeName) {
    const normalized = String(typeName || "").trim().toLowerCase();
    return normalized.includes("внезапн") && normalized.includes("расширен");
  }

  function isStraightPipeEntranceType(typeName) {
    const normalized = String(typeName || "").trim().toLowerCase();
    return normalized.includes("вход") &&
      normalized.includes("труб") &&
      (normalized.includes("диаграмма 3-1") || normalized.includes("постоянного поперечного сечения"));
  }

  function isFlushWallEntranceType(typeName) {
    const normalized = String(typeName || "").trim().toLowerCase();
    return normalized.includes("диаграмма 3-2") ||
      (normalized.includes("заподлицо") && normalized.includes("стенк"));
  }

  function isPassingFlowEntranceType(typeName) {
    const normalized = String(typeName || "").trim().toLowerCase();
    return normalized.includes("диаграмма 3-3") ||
      (normalized.includes("проходящ") && normalized.includes("поток"));
  }

  function isConicalCollectorSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && isConicalCollectorType(section.localResistanceType));
  }

  function isArcCollectorWithoutScreenSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && isArcCollectorWithoutScreenType(section.localResistanceType));
  }

  function isArcCollectorWithScreenSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && isArcCollectorWithScreenType(section.localResistanceType));
  }

  function isArcCollectorSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && isArcCollectorType(section.localResistanceType));
  }

  function isRostrumCollectorSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && isRostrumCollectorType(section.localResistanceType));
  }

  function isLengthRatioCollectorSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && isLengthRatioCollectorType(section.localResistanceType));
  }

  function isSuddenExpansionSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && isSuddenExpansionType(section.localResistanceType));
  }

  function isBendDiagram61Section(section) {
    return Boolean(section && section.kind === "Bend" && !section.useCustomLrc);
  }

  function isRoundContractionGeometry(section) {
    if (!section || section.kind !== "Contraction") {
      return false;
    }

    const inletShape = normalizeShape(section.crossSectionShape);
    const outletShape = normalizeShape(section.outletCrossSectionShape || inletShape);
    return inletShape === "Round" && outletShape === "Round";
  }

  function isRoundContractionDiagram523Section(section) {
    return Boolean(isRoundContractionGeometry(section) && !section.useCustomLrc);
  }

  function isTransitionContractionGeometry(section) {
    if (!section || section.kind !== "Contraction") {
      return false;
    }

    const inletShape = normalizeShape(section.crossSectionShape);
    const outletShape = normalizeShape(section.outletCrossSectionShape || inletShape);
    return inletShape === "Rectangle" && outletShape === "Round";
  }

  function isTransitionContractionDiagram527Section(section) {
    return Boolean(isTransitionContractionGeometry(section) && !section.useCustomLrc);
  }

  function isRoundDiffuserGeometry(section) {
    if (!section || section.kind !== "Expansion") {
      return false;
    }

    const inletShape = normalizeShape(section.crossSectionShape);
    const outletShape = normalizeShape(section.outletCrossSectionShape || inletShape);
    return inletShape === "Round" && outletShape === "Round";
  }

  function isRoundDiffuserDiagram52Section(section) {
    return Boolean(isRoundDiffuserGeometry(section) && !section.useCustomLrc);
  }

  function isRectangularDiffuserGeometry(section) {
    if (!section || section.kind !== "Expansion") {
      return false;
    }

    const inletShape = normalizeShape(section.crossSectionShape);
    const outletShape = normalizeShape(section.outletCrossSectionShape || inletShape);
    return inletShape === "Rectangle" && outletShape === "Rectangle";
  }

  function isRectangularDiffuserDiagram54Section(section) {
    return Boolean(isRectangularDiffuserGeometry(section) && !section.useCustomLrc);
  }

  function isTransitionDiffuserGeometry(section) {
    if (!section || section.kind !== "Expansion") {
      return false;
    }

    const inletShape = normalizeShape(section.crossSectionShape);
    const outletShape = normalizeShape(section.outletCrossSectionShape || inletShape);
    return (inletShape === "Round" && outletShape === "Rectangle") ||
      (inletShape === "Rectangle" && outletShape === "Round");
  }

  function isTransitionDiffuserDiagram528Section(section) {
    return Boolean(isTransitionDiffuserGeometry(section) && !section.useCustomLrc);
  }

  function isStraightPipeEntranceSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && isStraightPipeEntranceType(section.localResistanceType));
  }

  function isFlushWallEntranceSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && isFlushWallEntranceType(section.localResistanceType));
  }

  function isPassingFlowEntranceSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && isPassingFlowEntranceType(section.localResistanceType));
  }

  function isRoundLockedLocalResistanceSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && (
      isConicalCollectorType(section.localResistanceType) ||
      isStraightPipeEntranceType(section.localResistanceType) ||
      isArcCollectorType(section.localResistanceType) ||
      isRostrumCollectorType(section.localResistanceType) ||
      isSuddenExpansionType(section.localResistanceType)
    ));
  }

  function isEntranceWithoutRouteLengthSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && (
      isStraightPipeEntranceType(section.localResistanceType) ||
      isFlushWallEntranceType(section.localResistanceType) ||
      isPassingFlowEntranceType(section.localResistanceType) ||
      isArcCollectorType(section.localResistanceType) ||
      isSuddenExpansionType(section.localResistanceType)
    ));
  }

  function calculateLengthToDiameterRatio(section) {
    const length = parseNumber(getSectionBaseValue(section, "length"), null);
    const diameter = parseNumber(getSectionBaseValue(section, "diameter"), null);
    if (length == null || diameter == null || diameter <= 0) {
      return null;
    }

    return length / diameter;
  }

  function calculateLocalFlowVelocity(section) {
    const gasFlow = getBaseFieldValue("GasFlow");
    const inlet = getEffectiveInletConnection(section);
    const area = calculateConnectionArea(inlet);
    if (gasFlow == null || area <= 0) {
      return null;
    }

    return gasFlow / area;
  }

  function calculateSuddenExpansionAreaRatio(section) {
    const inletDiameter = parseNumber(getSectionBaseValue(section, "diameter"), null);
    const outletDiameter = parseNumber(getSectionBaseValue(section, "localResistanceParamX"), null);
    if (inletDiameter == null || outletDiameter == null || inletDiameter <= 0 || outletDiameter <= 0 || outletDiameter <= inletDiameter) {
      return null;
    }

    return Math.pow(inletDiameter / outletDiameter, 2);
  }

  function calculateSuddenExpansionKms(section) {
    const ratio = calculateSuddenExpansionAreaRatio(section);
    return ratio == null ? null : Math.pow(1 - ratio, 2);
  }

  function updateDerivedLocalResistanceParams(section) {
    if (!isLengthRatioCollectorSection(section) && !isEntranceWithoutRouteLengthSection(section)) {
      return;
    }

    if (isRoundLockedLocalResistanceSection(section)) {
      section.crossSectionShape = "Round";
      section.outletCrossSectionShape = "Round";
      section.diameterB = "";
      section.outletDiameterB = "";
    }

    if (!isLengthRatioCollectorSection(section)) {
      section.length = "";
      if (isArcCollectorWithoutScreenSection(section)) {
        section.localResistanceParamY = "0";
      }
      return;
    }

    const ratio = calculateLengthToDiameterRatio(section);
    section.localResistanceParamY = ratio == null ? "" : formatForInput(ratio);
  }

  function getLocalResistanceParamYForSubmit(section) {
    if (!isLengthRatioCollectorSection(section)) {
      if (isArcCollectorWithoutScreenSection(section)) {
        return "0";
      }

      return (isStraightPipeEntranceSection(section) || isFlushWallEntranceSection(section) || isArcCollectorWithScreenSection(section))
        ? getSectionBaseValue(section, "localResistanceParamY")
        : section.localResistanceParamY;
    }

    const ratio = calculateLengthToDiameterRatio(section);
    return ratio == null ? "" : formatForInput(ratio);
  }

  function getLocalResistanceParamXForSubmit(section) {
    return (section && section.kind === "Bend") || isStraightPipeEntranceSection(section) || isArcCollectorWithoutScreenSection(section) || isArcCollectorWithScreenSection(section) || isSuddenExpansionSection(section)
      ? getSectionBaseValue(section, "localResistanceParamX")
      : section.localResistanceParamX;
  }

  function syncConicalCollectorOutletToNext(section) {
    if (!isConicalCollectorSection(section) && !isStraightPipeEntranceSection(section) && !isRostrumCollectorSection(section) && !isSuddenExpansionSection(section)) {
      return;
    }

    const index = state.sections.findIndex((item) => item.id === section.id);
    const next = index >= 0 ? state.sections[index + 1] : null;
    const diameter = isSuddenExpansionSection(section)
      ? parseNumber(getSectionBaseValue(section, "localResistanceParamX"), null)
      : parseNumber(getSectionBaseValue(section, "diameter"), null);
    if (!next || diameter == null || diameter <= 0) {
      return;
    }

    next.crossSectionShape = "Round";
    next.diameterB = "";
    setSectionDisplayValueFromBase(next, "diameter", diameter);
    if (next.kind !== "Contraction" && next.kind !== "Expansion") {
      next.outletCrossSectionShape = "Round";
    }
    ensureSection(next);
  }

  function syncConicalCollectorOutlets() {
    state.sections.forEach((section) => {
      updateDerivedLocalResistanceParams(section);
      syncConicalCollectorOutletToNext(section);
    });
  }

  function decorateStaticTooltips() {
    Object.entries(staticTooltips).forEach(([fieldId, tooltip]) => {
      const label = form.querySelector(`label[for="${fieldId}"]`);
      if (!label || label.querySelector("[data-context-tooltip-trigger]")) {
        return;
      }

      label.classList.add("field-label");
      label.appendChild(createContextTooltipButton(label.textContent || fieldId, tooltip));
    });
  }

  function getResistanceParameterContext(section, item) {
    const needsBaseParamX = isStraightPipeEntranceSection(section) ||
      isArcCollectorWithoutScreenSection(section) ||
      isArcCollectorWithScreenSection(section);
    const inputParamX = needsBaseParamX
      ? parseNumber(getSectionBaseValue(section, "localResistanceParamX"), null)
      : parseNumber(section && section.localResistanceParamX, null);
    const needsBaseParamY = isStraightPipeEntranceSection(section) ||
      isFlushWallEntranceSection(section) ||
      isArcCollectorWithScreenSection(section);
    const inputParamY = needsBaseParamY
      ? parseNumber(getSectionBaseValue(section, "localResistanceParamY"), null)
      : parseNumber(section && section.localResistanceParamY, null);
    const diameter = parseNumber(section ? getSectionBaseValue(section, "diameter") : null, null);
    const flowVelocity = calculateLocalFlowVelocity(section);
    let rawParamX = inputParamX;
    let paramX = rawParamX;
    const isLengthRatio = isLengthRatioCollectorSection(section);
    const isPipeEntrance = isStraightPipeEntranceSection(section);
    const isFlushWallEntrance = isFlushWallEntranceSection(section);
    const isPassingFlowEntrance = isPassingFlowEntranceSection(section);
    const isArcWithoutScreen = isArcCollectorWithoutScreenSection(section);
    const isArcWithScreen = isArcCollectorWithScreenSection(section);
    let rawParamY = isLengthRatio
      ? calculateLengthToDiameterRatio(section)
      : inputParamY;
    let paramY = rawParamY;
    let xClamped = false;
    let yClamped = false;

    if (isPipeEntrance) {
      rawParamX = inputParamX != null && diameter != null && diameter > 0
        ? inputParamX / diameter
        : null;
      rawParamY = inputParamY != null && diameter != null && diameter > 0
        ? inputParamY / diameter
        : null;
      paramX = rawParamX;
      paramY = rawParamY;
    }

    if (isFlushWallEntrance) {
      rawParamY = inputParamY != null && diameter != null && diameter > 0
        ? inputParamY / diameter
        : null;
      paramY = rawParamY;
    }

    if (isPassingFlowEntrance) {
      rawParamX = inputParamX != null && flowVelocity != null && flowVelocity > 0
        ? inputParamX / flowVelocity
        : null;
      paramX = rawParamX;
    }

    if (isArcWithoutScreen || isArcWithScreen) {
      rawParamX = inputParamX != null && diameter != null && diameter > 0
        ? inputParamX / diameter
        : null;
      paramX = rawParamX;
    }

    if (isArcWithoutScreen) {
      rawParamY = 0;
      paramY = 0;
    }

    if (isArcWithScreen) {
      rawParamY = inputParamY != null && diameter != null && diameter > 0
        ? inputParamY / diameter
        : null;
      paramY = rawParamY;
    }

    if (isPipeEntrance && item && rawParamX != null) {
      const xs = uniqueSorted(getResistancePoints(item).map((point) => readPointNumber(point, "paramX", "ParamX")));
      const maxX = xs.length ? xs[xs.length - 1] : null;
      if (maxX != null && rawParamX > maxX + 0.000001) {
        paramX = maxX;
        xClamped = true;
      }
    }

    if (isArcWithoutScreen && item && rawParamX != null) {
      const xs = uniqueSorted(getResistancePoints(item).map((point) => readPointNumber(point, "paramX", "ParamX")));
      const maxX = xs.length ? xs[xs.length - 1] : null;
      if (maxX != null && rawParamX > maxX + 0.000001) {
        paramX = maxX;
        xClamped = true;
      }
    }

    if ((isLengthRatio && isConicalCollectorSection(section) || isPipeEntrance) && item && rawParamY != null) {
      const ys = uniqueSorted(getResistancePoints(item).map((point) => readPointNumber(point, "paramY", "ParamY")));
      const maxY = ys.length ? ys[ys.length - 1] : null;
      if (maxY != null && rawParamY > maxY + 0.000001) {
        paramY = maxY;
        yClamped = true;
      }
    }

    return {
      paramX,
      paramY,
      rawParamX,
      rawParamY,
      inputParamX,
      inputParamY,
      diameter,
      flowVelocity,
      xClamped,
      yClamped
    };
  }

  function getLocalResistanceValue(sectionOrTypeName) {
    const section = typeof sectionOrTypeName === "object" ? sectionOrTypeName : null;
    const typeName = section ? section.localResistanceType : sectionOrTypeName;
    if (isSuddenExpansionType(typeName)) {
      return section ? calculateSuddenExpansionKms(section) : null;
    }

    const item = getLocalResistanceItem(typeName);
    if (!item) {
      return null;
    }

    if (!isTabularResistance(item)) {
      return getResistanceDefaultValue(item);
    }

    if (!section) {
      return null;
    }

    const context = getResistanceParameterContext(section, item);
    return interpolateResistanceValue(getResistancePoints(item), context.paramX, context.paramY);
  }

  function getAutoKmsValue(sectionOrIndex) {
    const section = typeof sectionOrIndex === "number"
      ? state.sections[sectionOrIndex - 1]
      : sectionOrIndex;
    const zeta = getCalculatedKmsValue(section);
    return zeta == null ? "" : formatForInput(zeta);
  }

  function updateAutoKmsField() {
    const section = getSelectedSection();
    if (!section || !isKmsAdjustableSection(section) || section.useCustomLrc) {
      return;
    }

    const field = elements.blockInspectorBody.querySelector('[data-role="kms-value"]');
    if (field) {
      field.value = getAutoKmsValue(section);
    }
  }

  function isKmsAdjustableSection(section) {
    return Boolean(section && ["Bend", "Contraction", "Expansion", "LocalResistance"].includes(section.kind));
  }

  function getCalculatedKmsValue(section) {
    if (!section) {
      return null;
    }

    switch (section.kind) {
      case "Bend":
        return calculateBendKms(section);
      case "Contraction":
        return calculateContractionKms(section);
      case "Expansion":
        return calculateExpansionKms(section);
      case "LocalResistance":
        return getLocalResistanceValue(section);
      default:
        return null;
    }
  }

  function calculateBendKms(section) {
    return calculateBendDiagram61Context(section).zeta;
  }

  function calculateBendDiagram61Context(section) {
    const angle = parseNumber(getSectionBaseValue(section, "turnAngle"), null);
    const radius = parseNumber(getSectionBaseValue(section, "localResistanceParamX"), null);
    const shape = normalizeShape(section && section.crossSectionShape);
    const sizeA = parseNumber(getSectionBaseValue(section, "diameter"), null);
    const sizeB = shape === "Rectangle"
      ? parseNumber(getSectionBaseValue(section, "diameterB"), null)
      : null;
    const gasFlow = getBaseFieldValue("GasFlow");
    const gasTemperature = getBaseFieldValue("TgasInitial");
    const viscosity = interpolateKinematicViscosity(gasTemperature);
    const area = shape === "Rectangle" && sizeA != null && sizeB != null && sizeA > 0 && sizeB > 0
      ? sizeA * sizeB
      : shape === "Round" && sizeA != null && sizeA > 0
      ? Math.PI * sizeA * sizeA / 4
      : null;
    const hydraulicDiameter = shape === "Rectangle" && sizeA != null && sizeB != null && sizeA > 0 && sizeB > 0
      ? 2 * sizeA * sizeB / (sizeA + sizeB)
      : shape === "Round" && sizeA != null && sizeA > 0
      ? sizeA
      : null;
    const referenceSize = shape === "Rectangle" ? sizeB : sizeA;
    const radiusRatio = radius != null && referenceSize != null && referenceSize > 0
      ? radius / referenceSize
      : null;
    const aspectRatio = shape === "Rectangle" && sizeA != null && sizeB != null && sizeB > 0
      ? sizeA / sizeB
      : 1;
    const velocity = gasFlow != null && area != null && area > 0
      ? gasFlow / area
      : null;
    const reynolds = velocity != null && hydraulicDiameter != null && viscosity != null && viscosity > 0
      ? velocity * hydraulicDiameter / viscosity
      : null;
    const roughness = getRoughnessSelection(section, "section").effectiveValue;
    const lambda = reynolds != null && hydraulicDiameter != null && roughness != null
      ? calculateDarcyLambda(reynolds, hydraulicDiameter, roughness)
      : null;
    const relativeRoughness = roughness != null && hydraulicDiameter != null && hydraulicDiameter > 0
      ? roughness / hydraulicDiameter
      : null;
    const angleClamp = clampDiffuserDiagram52Value(angle, bendDiagram61Angles);
    const radiusClamp = clampDiffuserDiagram52Value(radiusRatio, bendDiagram61RadiusRatios);
    const aspectClamp = clampDiffuserDiagram52Value(aspectRatio, bendDiagram61AspectRatios);
    const reScale = reynolds != null ? reynolds / 100000 : null;
    const reClamp = clampDiffuserDiagram52Value(reScale, bendDiagram61KReScales);
    const a1 = angleClamp.value != null ? interpolateBendDiagram61A1(angleClamp.value) : null;
    const b1 = radiusClamp.value != null ? interpolateBendDiagram61B1(radiusClamp.value) : null;
    const c1 = shape === "Rectangle"
      ? (aspectClamp.value != null ? interpolateBendDiagram61C1(aspectClamp.value) : null)
      : 1;
    const zetaLocal = a1 != null && b1 != null && c1 != null
      ? a1 * b1 * c1
      : null;
    const zetaFriction = angle != null && lambda != null && radiusRatio != null
      ? 0.0175 * angle * lambda * radiusRatio
      : null;
    const kRe = reClamp.value != null && radiusClamp.value != null
      ? interpolateBendDiagram61KRe(reClamp.value, radiusClamp.value)
      : null;
    const lambdaSmooth = reynolds != null ? calculateSmoothDarcyLambda(reynolds) : null;
    const kDelta = calculateBendDiagram61KDelta(relativeRoughness, reynolds, radiusClamp.value, lambda, lambdaSmooth);
    const zeta = zetaLocal != null && zetaFriction != null
      ? (relativeRoughness != null && relativeRoughness > 0 && reynolds != null && reynolds >= 10000 && kRe != null && kDelta != null
        ? kDelta * kRe * zetaLocal + zetaFriction
        : reynolds != null && reynolds > 3000 && reynolds < 10000
        ? calculateBendDiagram61A2(radiusClamp.value) / reynolds + zetaLocal + zetaFriction
        : zetaLocal + zetaFriction)
      : null;

    return {
      angle,
      radius,
      shape,
      sizeA,
      sizeB,
      gasTemperature,
      viscosity,
      area,
      hydraulicDiameter,
      referenceSize,
      radiusRatio,
      radiusRatioLabel: shape === "Rectangle" ? "R₀/b₀" : "R₀/D₀",
      aspectRatio,
      velocity,
      reynolds,
      roughness,
      relativeRoughness,
      lambda,
      lambdaSmooth,
      reScale,
      effectiveAngle: angleClamp.value,
      effectiveRadiusRatio: radiusClamp.value,
      effectiveAspectRatio: aspectClamp.value,
      effectiveReScale: reClamp.value,
      angleClamped: angleClamp.clamped,
      radiusClamped: radiusClamp.clamped,
      aspectClamped: aspectClamp.clamped,
      reClamped: reClamp.clamped,
      angleClampDirection: angleClamp.direction,
      radiusClampDirection: radiusClamp.direction,
      aspectClampDirection: aspectClamp.direction,
      reClampDirection: reClamp.direction,
      a1,
      b1,
      c1,
      kRe,
      kDelta,
      zetaLocal,
      zetaFriction,
      zeta
    };
  }

  function calculateContractionKms(section) {
    if (isRoundContractionGeometry(section)) {
      return calculateRoundContractionDiagram523Context(section).zeta;
    }

    if (isTransitionContractionGeometry(section)) {
      return calculateTransitionContractionDiagram527Context(section).zeta;
    }

    const inlet = getEffectiveInletConnection(section);
    const outlet = getEffectiveOutletConnection(section);
    const inletArea = calculateConnectionArea(inlet);
    const outletArea = calculateConnectionArea(outlet);
    if (inletArea <= 0 || outletArea <= 0) {
      return null;
    }

    const isShapeTransition = inlet.shape !== outlet.shape;
    if (outletArea >= inletArea) {
      return isShapeTransition ? 0.18 : null;
    }

    const beta = Math.sqrt(outletArea / inletArea);
    return 0.5 * (1 / Math.pow(beta, 2) - 1);
  }

  function calculateExpansionKms(section) {
    if (isRoundDiffuserGeometry(section)) {
      return calculateRoundDiffuserDiagram52Context(section).zeta;
    }

    if (isRectangularDiffuserGeometry(section)) {
      return calculateRectangularDiffuserDiagram54Context(section).zeta;
    }

    if (isTransitionDiffuserGeometry(section)) {
      return calculateTransitionDiffuserDiagram528Context(section).zeta;
    }

    const inlet = getEffectiveInletConnection(section);
    const outlet = getEffectiveOutletConnection(section);
    const inletArea = calculateConnectionArea(inlet);
    const outletArea = calculateConnectionArea(outlet);
    if (inletArea <= 0 || outletArea <= 0) {
      return null;
    }

    const isShapeTransition = inlet.shape !== outlet.shape;
    if (outletArea <= inletArea) {
      return isShapeTransition ? 0.18 : null;
    }

    const areaRatio = inletArea / outletArea;
    return Math.pow(1 - areaRatio, 2);
  }

  function calculateRoundContractionDiagram523Context(section) {
    const inletDiameter = parseNumber(getSectionBaseValue(section, "diameter"), null);
    const outletDiameter = parseNumber(getSectionBaseValue(section, "outletDiameter"), null);
    const length = parseNumber(getSectionBaseValue(section, "length"), null);
    const gasFlow = getBaseFieldValue("GasFlow");
    const gasTemperature = getBaseFieldValue("TgasInitial");
    const viscosity = interpolateKinematicViscosity(gasTemperature);
    const inletArea = inletDiameter != null && inletDiameter > 0
      ? Math.PI * inletDiameter * inletDiameter / 4
      : null;
    const outletArea = outletDiameter != null && outletDiameter > 0
      ? Math.PI * outletDiameter * outletDiameter / 4
      : null;
    const flowVelocity = gasFlow != null && outletArea != null && outletArea > 0
      ? gasFlow / outletArea
      : null;
    const reynolds = flowVelocity != null && outletDiameter != null && viscosity != null && viscosity > 0
      ? flowVelocity * outletDiameter / viscosity
      : null;
    const alpha = inletDiameter != null && outletDiameter != null && length != null && length > 0 && outletDiameter < inletDiameter
      ? 2 * Math.atan((inletDiameter - outletDiameter) / (2 * length)) * 180 / Math.PI
      : null;
    const areaRatio = inletArea != null && outletArea != null && outletArea < inletArea
      ? outletArea / inletArea
      : null;
    const alphaClamp = clampDiffuserDiagram52Value(alpha, contractionDiagram523Alphas);
    const ratioClamp = clampDiffuserDiagram52Value(areaRatio, contractionDiagram523AreaRatios);
    const zeta = alphaClamp.value != null && ratioClamp.value != null
      ? interpolateRoundContractionDiagram523(ratioClamp.value, alphaClamp.value)
      : null;

    return {
      inletDiameter,
      outletDiameter,
      length,
      gasTemperature,
      viscosity,
      inletArea,
      outletArea,
      flowVelocity,
      reynolds,
      alpha,
      areaRatio,
      effectiveAlpha: alphaClamp.value,
      effectiveAreaRatio: ratioClamp.value,
      alphaClamped: alphaClamp.clamped,
      ratioClamped: ratioClamp.clamped,
      alphaClampDirection: alphaClamp.direction,
      ratioClampDirection: ratioClamp.direction,
      zeta
    };
  }

  function calculateTransitionContractionDiagram527Context(section) {
    const inletA = parseNumber(getSectionBaseValue(section, "diameter"), null);
    const inletB = parseNumber(getSectionBaseValue(section, "diameterB"), null);
    const outletDiameter = parseNumber(getSectionBaseValue(section, "outletDiameter"), null);
    const length = parseNumber(getSectionBaseValue(section, "length"), null);
    const gasFlow = getBaseFieldValue("GasFlow");
    const gasTemperature = getBaseFieldValue("TgasInitial");
    const viscosity = interpolateKinematicViscosity(gasTemperature);
    const inletArea = inletA != null && inletB != null && inletA > 0 && inletB > 0
      ? inletA * inletB
      : null;
    const outletArea = outletDiameter != null && outletDiameter > 0
      ? Math.PI * outletDiameter * outletDiameter / 4
      : null;
    const outletVelocity = gasFlow != null && outletArea != null && outletArea > 0
      ? gasFlow / outletArea
      : null;
    const reynolds = outletVelocity != null && outletDiameter != null && viscosity != null && viscosity > 0
      ? outletVelocity * outletDiameter / viscosity
      : null;
    const areaRatio = inletArea != null && outletArea != null && outletArea < inletArea
      ? outletArea / inletArea
      : null;
    const lengthRatio = length != null && outletDiameter != null && outletDiameter > 0 && length > 0
      ? length / outletDiameter
      : null;
    const transitionDiameter = inletA != null && inletB != null && outletDiameter != null && inletA > 0 && inletB > 0 && outletDiameter > 0
      ? inletA * inletB / (inletA + inletB) + 0.5 * outletDiameter
      : null;
    const roughness = getRoughnessSelection(section, "section").effectiveValue;
    const transitionReynolds = reynolds != null && transitionDiameter != null && outletDiameter != null && outletDiameter > 0
      ? reynolds * transitionDiameter / outletDiameter
      : null;
    const lambda = transitionReynolds != null && transitionDiameter != null && roughness != null
      ? calculateDarcyLambda(transitionReynolds, transitionDiameter, roughness)
      : null;
    const c0 = lambda != null && length != null && transitionDiameter != null && transitionDiameter > 0
      ? lambda * length / transitionDiameter
      : null;
    const aspectRatio = inletA != null && inletB != null && inletA > 0 && inletB > 0
      ? Math.max(inletA, inletB) / Math.min(inletA, inletB)
      : null;
    const reScale = reynolds != null ? reynolds / 10000 : null;
    const reClamp = clampDiffuserDiagram52Value(reScale, transitionContractionDiagram527ReScales);
    const lengthClamp = clampDiffuserDiagram52Value(lengthRatio, transitionContractionDiagram527LengthRatios);
    const deltaZeta = reClamp.value != null
      ? interpolateTransitionContractionDiagram527Delta(reClamp.value)
      : null;
    const c1 = lengthClamp.value != null
      ? interpolateTransitionContractionDiagram527C1(lengthClamp.value)
      : null;
    const zetaEquivalent = c0 != null && c1 != null && aspectRatio != null && areaRatio != null
      ? (c0 + c1 * aspectRatio) * Math.pow(areaRatio, 2)
      : null;
    const zeta = zetaEquivalent != null && deltaZeta != null
      ? zetaEquivalent + deltaZeta
      : null;

    return {
      inletA,
      inletB,
      outletDiameter,
      length,
      gasTemperature,
      viscosity,
      inletArea,
      outletArea,
      outletVelocity,
      reynolds,
      areaRatio,
      lengthRatio,
      transitionDiameter,
      roughness,
      transitionReynolds,
      lambda,
      c0,
      aspectRatio,
      reScale,
      effectiveReScale: reClamp.value,
      effectiveLengthRatio: lengthClamp.value,
      reClamped: reClamp.clamped,
      lengthClamped: lengthClamp.clamped,
      reClampDirection: reClamp.direction,
      lengthClampDirection: lengthClamp.direction,
      deltaZeta,
      c1,
      zetaEquivalent,
      zeta
    };
  }

  function calculateRectangularDiffuserDiagram54Context(section) {
    const inletA = parseNumber(getSectionBaseValue(section, "diameter"), null);
    const inletB = parseNumber(getSectionBaseValue(section, "diameterB"), null);
    const outletA = parseNumber(getSectionBaseValue(section, "outletDiameter"), null);
    const outletB = parseNumber(getSectionBaseValue(section, "outletDiameterB"), null);
    const length = parseNumber(getSectionBaseValue(section, "length"), null);
    const gasFlow = getBaseFieldValue("GasFlow");
    const gasTemperature = getBaseFieldValue("TgasInitial");
    const viscosity = interpolateKinematicViscosity(gasTemperature);
    const inletArea = inletA != null && inletB != null && inletA > 0 && inletB > 0
      ? inletA * inletB
      : null;
    const outletArea = outletA != null && outletB != null && outletA > 0 && outletB > 0
      ? outletA * outletB
      : null;
    const hydraulicDiameter = inletA != null && inletB != null && inletA > 0 && inletB > 0
      ? 2 * inletA * inletB / (inletA + inletB)
      : null;
    const flowVelocity = gasFlow != null && inletArea != null && inletArea > 0
      ? gasFlow / inletArea
      : null;
    const reynolds = flowVelocity != null && hydraulicDiameter != null && viscosity != null && viscosity > 0
      ? flowVelocity * hydraulicDiameter / viscosity
      : null;
    const alphaA = inletA != null && outletA != null && length != null && length > 0 && outletA >= inletA
      ? 2 * Math.atan((outletA - inletA) / (2 * length)) * 180 / Math.PI
      : null;
    const alphaB = inletB != null && outletB != null && length != null && length > 0 && outletB >= inletB
      ? 2 * Math.atan((outletB - inletB) / (2 * length)) * 180 / Math.PI
      : null;
    const alpha = alphaA != null && alphaB != null
      ? Math.max(alphaA, alphaB)
      : null;
    const expansionRatio = inletArea != null && outletArea != null && outletArea > inletArea && outletA >= inletA && outletB >= inletB
      ? outletArea / inletArea
      : null;
    const reScale = reynolds != null ? reynolds / 100000 : null;
    const profile = getRectangularDiffuserProfile(section);
    const alphaClamp = clampDiffuserDiagram52Value(alpha, diffuserDiagram54Alphas);
    const ratioClamp = clampDiffuserDiagram52Value(expansionRatio, diffuserDiagram54Ratios);
    const reClamp = clampDiffuserDiagram52Value(reScale, diffuserDiagram54ReScales);
    const zeta = alphaClamp.value != null && ratioClamp.value != null && reClamp.value != null
      ? interpolateDiffuserDiagram54(profile, ratioClamp.value, reClamp.value, alphaClamp.value)
      : null;

    return {
      inletA,
      inletB,
      outletA,
      outletB,
      length,
      gasTemperature,
      viscosity,
      inletArea,
      outletArea,
      hydraulicDiameter,
      flowVelocity,
      reynolds,
      alphaA,
      alphaB,
      alpha,
      expansionRatio,
      reScale,
      profile,
      effectiveAlpha: alphaClamp.value,
      effectiveExpansionRatio: ratioClamp.value,
      effectiveReScale: reClamp.value,
      alphaClamped: alphaClamp.clamped,
      ratioClamped: ratioClamp.clamped,
      reClamped: reClamp.clamped,
      alphaClampDirection: alphaClamp.direction,
      ratioClampDirection: ratioClamp.direction,
      reClampDirection: reClamp.direction,
      zeta
    };
  }

  function calculateTransitionDiffuserDiagram528Context(section) {
    const inletShape = normalizeShape(section && section.crossSectionShape);
    const outletShape = normalizeShape(section && (section.outletCrossSectionShape || section.crossSectionShape));
    const inletDiameter = parseNumber(getSectionBaseValue(section, "diameter"), null);
    const inletB = parseNumber(getSectionBaseValue(section, "diameterB"), null);
    const outletDiameter = parseNumber(getSectionBaseValue(section, "outletDiameter"), null);
    const outletB = parseNumber(getSectionBaseValue(section, "outletDiameterB"), null);
    const length = parseNumber(getSectionBaseValue(section, "length"), null);
    const gasFlow = getBaseFieldValue("GasFlow");
    const gasTemperature = getBaseFieldValue("TgasInitial");
    const viscosity = interpolateKinematicViscosity(gasTemperature);
    const inlet = getEffectiveInletConnection(section);
    const outlet = getEffectiveOutletConnection(section);
    const inletArea = calculateConnectionArea(inlet);
    const outletArea = calculateConnectionArea(outlet);
    const hydraulicDiameter = inletShape === "Rectangle" && inletDiameter != null && inletB != null && inletDiameter > 0 && inletB > 0
      ? 2 * inletDiameter * inletB / (inletDiameter + inletB)
      : inletDiameter;
    const flowVelocity = gasFlow != null && inletArea > 0
      ? gasFlow / inletArea
      : null;
    const reynolds = flowVelocity != null && hydraulicDiameter != null && viscosity != null && viscosity > 0
      ? flowVelocity * hydraulicDiameter / viscosity
      : null;
    const direction = inletShape === "Round" && outletShape === "Rectangle"
      ? "round-to-rectangle"
      : inletShape === "Rectangle" && outletShape === "Round"
      ? "rectangle-to-round"
      : "";
    const image = direction === "round-to-rectangle"
      ? "/img/5-28-1.png"
      : "/img/5-28-2.png";

    let alpha = null;
    if (direction === "round-to-rectangle" &&
        inletDiameter != null && inletDiameter > 0 &&
        outletDiameter != null && outletDiameter > 0 &&
        outletB != null && outletB > 0 &&
        length != null && length > 0) {
      const outletEquivalentAreaDiameter = 2 * Math.sqrt(outletDiameter * outletB / Math.PI);
      alpha = outletEquivalentAreaDiameter > inletDiameter
        ? 2 * Math.atan((outletEquivalentAreaDiameter - inletDiameter) / (2 * length)) * 180 / Math.PI
        : null;
    } else if (direction === "rectangle-to-round" &&
        inletDiameter != null && inletDiameter > 0 &&
        inletB != null && inletB > 0 &&
        outletDiameter != null && outletDiameter > 0 &&
        length != null && length > 0) {
      const inletEquivalentAreaDiameter = 2 * Math.sqrt(inletDiameter * inletB / Math.PI);
      alpha = outletDiameter > inletEquivalentAreaDiameter
        ? 2 * Math.atan((outletDiameter - inletEquivalentAreaDiameter) / (2 * length)) * 180 / Math.PI
        : null;
    }

    const expansionRatio = inletArea > 0 && outletArea > inletArea
      ? outletArea / inletArea
      : null;
    const reScale = reynolds != null ? reynolds / 100000 : null;
    const profile = getRectangularDiffuserProfile(section);
    const alphaClamp = clampDiffuserDiagram52Value(alpha, diffuserDiagram54Alphas);
    const ratioClamp = clampDiffuserDiagram52Value(expansionRatio, diffuserDiagram54Ratios);
    const reClamp = clampDiffuserDiagram52Value(reScale, diffuserDiagram54ReScales);
    const zeta = alphaClamp.value != null && ratioClamp.value != null && reClamp.value != null
      ? interpolateDiffuserDiagram54(profile, ratioClamp.value, reClamp.value, alphaClamp.value)
      : null;

    return {
      inletShape,
      outletShape,
      direction,
      image,
      inletDiameter,
      inletA: inletDiameter,
      inletB,
      outletDiameter,
      outletA: outletDiameter,
      outletB,
      length,
      gasTemperature,
      viscosity,
      inletArea,
      outletArea,
      hydraulicDiameter,
      flowVelocity,
      reynolds,
      alpha,
      expansionRatio,
      reScale,
      profile,
      effectiveAlpha: alphaClamp.value,
      effectiveExpansionRatio: ratioClamp.value,
      effectiveReScale: reClamp.value,
      alphaClamped: alphaClamp.clamped,
      ratioClamped: ratioClamp.clamped,
      reClamped: reClamp.clamped,
      alphaClampDirection: alphaClamp.direction,
      ratioClampDirection: ratioClamp.direction,
      reClampDirection: reClamp.direction,
      zeta
    };
  }

  function calculateRoundDiffuserDiagram52Context(section) {
    const inletDiameter = parseNumber(getSectionBaseValue(section, "diameter"), null);
    const outletDiameter = parseNumber(getSectionBaseValue(section, "outletDiameter"), null);
    const length = parseNumber(getSectionBaseValue(section, "length"), null);
    const gasFlow = getBaseFieldValue("GasFlow");
    const gasTemperature = getBaseFieldValue("TgasInitial");
    const viscosity = interpolateKinematicViscosity(gasTemperature);
    const inletArea = inletDiameter != null && inletDiameter > 0
      ? Math.PI * inletDiameter * inletDiameter / 4
      : null;
    const outletArea = outletDiameter != null && outletDiameter > 0
      ? Math.PI * outletDiameter * outletDiameter / 4
      : null;
    const flowVelocity = gasFlow != null && inletArea != null && inletArea > 0
      ? gasFlow / inletArea
      : null;
    const reynolds = flowVelocity != null && inletDiameter != null && viscosity != null && viscosity > 0
      ? flowVelocity * inletDiameter / viscosity
      : null;
    const alpha = inletDiameter != null && outletDiameter != null && length != null && length > 0 && outletDiameter > inletDiameter
      ? 2 * Math.atan((outletDiameter - inletDiameter) / (2 * length)) * 180 / Math.PI
      : null;
    const expansionRatio = inletArea != null && outletArea != null && outletArea > inletArea
      ? outletArea / inletArea
      : null;
    const reScale = reynolds != null ? reynolds / 100000 : null;
    const alphaClamp = clampDiffuserDiagram52Value(alpha, diffuserDiagram52Alphas);
    const ratioClamp = clampDiffuserDiagram52Value(expansionRatio, diffuserDiagram52Ratios);
    const reClamp = clampDiffuserDiagram52Value(reScale, diffuserDiagram52ReScales);
    const zeta = alphaClamp.value != null && ratioClamp.value != null && reClamp.value != null
      ? interpolateDiffuserDiagram52(ratioClamp.value, reClamp.value, alphaClamp.value)
      : null;

    return {
      inletDiameter,
      outletDiameter,
      length,
      gasTemperature,
      viscosity,
      flowVelocity,
      reynolds,
      alpha,
      expansionRatio,
      reScale,
      effectiveAlpha: alphaClamp.value,
      effectiveExpansionRatio: ratioClamp.value,
      effectiveReScale: reClamp.value,
      alphaClamped: alphaClamp.clamped,
      ratioClamped: ratioClamp.clamped,
      reClamped: reClamp.clamped,
      alphaClampDirection: alphaClamp.direction,
      ratioClampDirection: ratioClamp.direction,
      reClampDirection: reClamp.direction,
      zeta
    };
  }

  function interpolateKinematicViscosity(temperature) {
    const parsedTemperature = parseNumber(temperature, null);
    const points = uniqueSorted(kinematicViscosityCatalog
      .map((item) => readPointNumber(item, "gasTemperature", "GasTemperature")));
    if (parsedTemperature == null || !points.length) {
      return null;
    }

    const minTemperature = points[0];
    const maxTemperature = points[points.length - 1];
    const effectiveTemperature = Math.min(maxTemperature, Math.max(minTemperature, parsedTemperature));
    const bounds = findNumericBounds(points, effectiveTemperature);
    if (!bounds) {
      return null;
    }

    const lowerValue = findKinematicViscosity(points, bounds.lower);
    const upperValue = findKinematicViscosity(points, bounds.upper);
    if (lowerValue == null || upperValue == null) {
      return null;
    }

    return linearInterpolate(effectiveTemperature, bounds.lower, bounds.upper, lowerValue, upperValue);
  }

  function findKinematicViscosity(_temperatures, temperature) {
    const item = kinematicViscosityCatalog.find((entry) =>
      Math.abs(readPointNumber(entry, "gasTemperature", "GasTemperature") - temperature) < 0.000001);
    if (!item) {
      return null;
    }

    const value = readPointNumber(item, "kinematicViscosity", "KinematicViscosity");
    return Number.isFinite(value) ? value : null;
  }

  function clampDiffuserDiagram52Value(value, scale) {
    if (value == null || !Number.isFinite(value) || !scale.length) {
      return { value: null, clamped: false, direction: "" };
    }

    const min = scale[0];
    const max = scale[scale.length - 1];
    if (value < min) {
      return { value: min, clamped: true, direction: "low" };
    }

    if (value > max) {
      return { value: max, clamped: true, direction: "high" };
    }

    return { value, clamped: false, direction: "" };
  }

  function calculateDarcyLambda(reynolds, diameter, roughness) {
    if (reynolds == null || diameter == null || roughness == null || reynolds <= 0 || diameter <= 0 || roughness <= 0) {
      return null;
    }

    if (reynolds < 2300) {
      return 64 / reynolds;
    }

    if (reynolds < 4000) {
      const lambdaLaminar = 64 / 2300;
      const lambdaTurbulent = 0.3164 / Math.pow(4000, 0.25);
      return lambdaLaminar + (lambdaTurbulent - lambdaLaminar) * (reynolds - 2300) / (4000 - 2300);
    }

    const relativeRoughness = roughness / diameter;
    const reBoundary1 = 10 * diameter / roughness;
    const reBoundary2 = 560 * diameter / roughness;
    if (reynolds < reBoundary1) {
      return 0.3164 / Math.pow(reynolds, 0.25);
    }

    if (reynolds < reBoundary2) {
      return 0.11 * Math.pow(relativeRoughness + 68 / reynolds, 0.25);
    }

    return 0.11 * Math.pow(relativeRoughness, 0.25);
  }

  function calculateSmoothDarcyLambda(reynolds) {
    if (reynolds == null || reynolds <= 0) {
      return null;
    }

    if (reynolds < 2300) {
      return 64 / reynolds;
    }

    if (reynolds < 4000) {
      const lambdaLaminar = 64 / 2300;
      const lambdaTurbulent = 0.3164 / Math.pow(4000, 0.25);
      return lambdaLaminar + (lambdaTurbulent - lambdaLaminar) * (reynolds - 2300) / (4000 - 2300);
    }

    return 0.3164 / Math.pow(reynolds, 0.25);
  }

  function interpolateBendDiagram61A1(angle) {
    return interpolateOneDimensional(bendDiagram61Angles, bendDiagram61A1Values, angle);
  }

  function interpolateBendDiagram61B1(radiusRatio) {
    return interpolateOneDimensional(bendDiagram61RadiusRatios, bendDiagram61B1Values, radiusRatio);
  }

  function interpolateBendDiagram61C1(aspectRatio) {
    return interpolateOneDimensional(bendDiagram61AspectRatios, bendDiagram61C1Values, aspectRatio);
  }

  function interpolateBendDiagram61KRe(reScale, radiusRatio) {
    return interpolateOneDimensional(
      bendDiagram61KReScales,
      bendDiagram61KReValues[getBendDiagram61KReRowIndex(radiusRatio)],
      reScale
    );
  }

  function interpolateOneDimensional(points, values, value) {
    const bounds = findNumericBounds(points, value);
    if (!bounds) {
      return null;
    }

    const lowerIndex = points.findIndex((point) => Math.abs(point - bounds.lower) < 0.000001);
    const upperIndex = points.findIndex((point) => Math.abs(point - bounds.upper) < 0.000001);
    if (lowerIndex < 0 || upperIndex < 0) {
      return null;
    }

    return linearInterpolate(value, bounds.lower, bounds.upper, values[lowerIndex], values[upperIndex]);
  }

  function getBendDiagram61KReRowIndex(radiusRatio) {
    if (radiusRatio == null || radiusRatio <= 0.55) {
      return 0;
    }

    if (radiusRatio <= 0.7) {
      return 1;
    }

    return 2;
  }

  function getBendDiagram61KReRowLabel(rowIndex) {
    return rowIndex === 0
      ? "R₀/D₀(R₀/b₀) = 0,50...0,55"
      : rowIndex === 1
      ? "R₀/D₀(R₀/b₀) > 0,55...0,70"
      : "R₀/D₀(R₀/b₀) > 0,70";
  }

  function calculateBendDiagram61KDelta(relativeRoughness, reynolds, radiusRatio, lambda, lambdaSmooth) {
    if (relativeRoughness == null || reynolds == null || radiusRatio == null || relativeRoughness <= 0) {
      return 1;
    }

    if (radiusRatio <= 0.55) {
      return reynolds > 40000 && relativeRoughness > 0.001 ? 1.5 : 1;
    }

    if (reynolds <= 40000) {
      return 1;
    }

    if (relativeRoughness > 0.001) {
      return 2;
    }

    if (reynolds <= 200000) {
      return lambda != null && lambdaSmooth != null && lambdaSmooth > 0
        ? lambda / lambdaSmooth
        : 1;
    }

    return 1 + relativeRoughness * 1000;
  }

  function calculateBendDiagram61A2(radiusRatio) {
    if (radiusRatio == null) {
      return 0;
    }

    if (radiusRatio <= 0.55) {
      return 4000;
    }

    if (radiusRatio <= 0.7) {
      return 6000;
    }

    if (radiusRatio <= 1) {
      return linearInterpolate(radiusRatio, 0.7, 1, 4000, 2000);
    }

    if (radiusRatio <= 2) {
      return 1000;
    }

    return 600;
  }

  function interpolateRoundContractionDiagram523(areaRatio, alpha) {
    const ratioBounds = findNumericBounds(contractionDiagram523AreaRatios, areaRatio);
    const alphaBounds = findNumericBounds(contractionDiagram523Alphas, alpha);
    if (!ratioBounds || !alphaBounds) {
      return null;
    }

    const q11 = getRoundContractionDiagram523Value(ratioBounds.lower, alphaBounds.lower);
    const q21 = getRoundContractionDiagram523Value(ratioBounds.upper, alphaBounds.lower);
    const q12 = getRoundContractionDiagram523Value(ratioBounds.lower, alphaBounds.upper);
    const q22 = getRoundContractionDiagram523Value(ratioBounds.upper, alphaBounds.upper);
    if ([q11, q21, q12, q22].some((value) => value == null)) {
      return null;
    }

    return interpolate2D(areaRatio, alpha, ratioBounds.lower, ratioBounds.upper, alphaBounds.lower, alphaBounds.upper, q11, q21, q12, q22);
  }

  function getRoundContractionDiagram523Value(areaRatio, alpha) {
    const ratioKey = contractionDiagram523AreaRatios.find((value) => Math.abs(value - areaRatio) < 0.000001);
    const alphaIndex = contractionDiagram523Alphas.findIndex((value) => Math.abs(value - alpha) < 0.000001);
    if (ratioKey == null || alphaIndex < 0) {
      return null;
    }

    const values = contractionDiagram523Values[ratioKey];
    return values ? values[alphaIndex] : null;
  }

  function interpolateTransitionContractionDiagram527Delta(reScale) {
    const bounds = findNumericBounds(transitionContractionDiagram527ReScales, reScale);
    if (!bounds) {
      return null;
    }

    const lower = getTransitionContractionDiagram527Delta(bounds.lower);
    const upper = getTransitionContractionDiagram527Delta(bounds.upper);
    if (lower == null || upper == null) {
      return null;
    }

    return linearInterpolate(reScale, bounds.lower, bounds.upper, lower, upper);
  }

  function getTransitionContractionDiagram527Delta(reScale) {
    const index = transitionContractionDiagram527ReScales.findIndex((value) => Math.abs(value - reScale) < 0.000001);
    return index < 0 ? null : transitionContractionDiagram527DeltaValues[index];
  }

  function interpolateTransitionContractionDiagram527C1(lengthRatio) {
    const bounds = findNumericBounds(transitionContractionDiagram527LengthRatios, lengthRatio);
    if (!bounds) {
      return null;
    }

    const lower = getTransitionContractionDiagram527C1(bounds.lower);
    const upper = getTransitionContractionDiagram527C1(bounds.upper);
    if (lower == null || upper == null) {
      return null;
    }

    return linearInterpolate(lengthRatio, bounds.lower, bounds.upper, lower, upper);
  }

  function getTransitionContractionDiagram527C1(lengthRatio) {
    const index = transitionContractionDiagram527LengthRatios.findIndex((value) => Math.abs(value - lengthRatio) < 0.000001);
    return index < 0 ? null : transitionContractionDiagram527C1Values[index];
  }

  function interpolateDiffuserDiagram52(ratio, reScale, alpha) {
    const ratioBounds = findNumericBounds(diffuserDiagram52Ratios, ratio);
    const reBounds = findNumericBounds(diffuserDiagram52ReScales, reScale);
    const alphaBounds = findNumericBounds(diffuserDiagram52Alphas, alpha);
    if (!ratioBounds || !reBounds || !alphaBounds) {
      return null;
    }

    const lowerRatioValue = interpolateDiffuserDiagram52ForRatio(ratioBounds.lower, reScale, alpha, reBounds, alphaBounds);
    const upperRatioValue = interpolateDiffuserDiagram52ForRatio(ratioBounds.upper, reScale, alpha, reBounds, alphaBounds);
    if (lowerRatioValue == null || upperRatioValue == null) {
      return null;
    }

    return linearInterpolate(ratio, ratioBounds.lower, ratioBounds.upper, lowerRatioValue, upperRatioValue);
  }

  function interpolateDiffuserDiagram52ForRatio(ratio, reScale, alpha, reBounds, alphaBounds) {
    const q11 = getDiffuserDiagram52Value(ratio, reBounds.lower, alphaBounds.lower);
    const q21 = getDiffuserDiagram52Value(ratio, reBounds.upper, alphaBounds.lower);
    const q12 = getDiffuserDiagram52Value(ratio, reBounds.lower, alphaBounds.upper);
    const q22 = getDiffuserDiagram52Value(ratio, reBounds.upper, alphaBounds.upper);
    if ([q11, q21, q12, q22].some((value) => value == null)) {
      return null;
    }

    return interpolate2D(reScale, alpha, reBounds.lower, reBounds.upper, alphaBounds.lower, alphaBounds.upper, q11, q21, q12, q22);
  }

  function getDiffuserDiagram52Value(ratio, reScale, alpha) {
    const values = diffuserDiagram52Values[ratio];
    const reIndex = diffuserDiagram52ReScales.findIndex((value) => Math.abs(value - reScale) < 0.000001);
    const alphaIndex = diffuserDiagram52Alphas.findIndex((value) => Math.abs(value - alpha) < 0.000001);
    if (!values || reIndex < 0 || alphaIndex < 0) {
      return null;
    }

    return values[reIndex][alphaIndex];
  }

  function getRectangularDiffuserProfile(section) {
    const raw = parseNumber(section && section.localResistanceParamX, 0);
    return raw >= 10 ? 10 : 0;
  }

  function interpolateDiffuserDiagram54(profile, ratio, reScale, alpha) {
    const ratioBounds = findNumericBounds(diffuserDiagram54Ratios, ratio);
    const reBounds = findNumericBounds(diffuserDiagram54ReScales, reScale);
    const alphaBounds = findNumericBounds(diffuserDiagram54Alphas, alpha);
    if (!ratioBounds || !reBounds || !alphaBounds) {
      return null;
    }

    const lowerRatioValue = interpolateDiffuserDiagram54ForRatio(profile, ratioBounds.lower, reScale, alpha, reBounds, alphaBounds);
    const upperRatioValue = interpolateDiffuserDiagram54ForRatio(profile, ratioBounds.upper, reScale, alpha, reBounds, alphaBounds);
    if (lowerRatioValue == null || upperRatioValue == null) {
      return null;
    }

    return linearInterpolate(ratio, ratioBounds.lower, ratioBounds.upper, lowerRatioValue, upperRatioValue);
  }

  function interpolateDiffuserDiagram54ForRatio(profile, ratio, reScale, alpha, reBounds, alphaBounds) {
    const q11 = getDiffuserDiagram54Value(profile, ratio, reBounds.lower, alphaBounds.lower);
    const q21 = getDiffuserDiagram54Value(profile, ratio, reBounds.upper, alphaBounds.lower);
    const q12 = getDiffuserDiagram54Value(profile, ratio, reBounds.lower, alphaBounds.upper);
    const q22 = getDiffuserDiagram54Value(profile, ratio, reBounds.upper, alphaBounds.upper);
    if ([q11, q21, q12, q22].some((value) => value == null)) {
      return null;
    }

    return interpolate2D(reScale, alpha, reBounds.lower, reBounds.upper, alphaBounds.lower, alphaBounds.upper, q11, q21, q12, q22);
  }

  function getDiffuserDiagram54Value(profile, ratio, reScale, alpha) {
    const profileValues = diffuserDiagram54Values[profile];
    const values = profileValues ? profileValues[ratio] : null;
    const reIndex = diffuserDiagram54ReScales.findIndex((value) => Math.abs(value - reScale) < 0.000001);
    const alphaIndex = diffuserDiagram54Alphas.findIndex((value) => Math.abs(value - alpha) < 0.000001);
    if (!values || reIndex < 0 || alphaIndex < 0) {
      return null;
    }

    return values[reIndex][alphaIndex];
  }

  function formatBendDiagram61DerivedText(context) {
    return [
      `δ = ${context.angle == null ? "—" : formatCompactNumber(context.angle, 1)}°`,
      `${context.radiusRatioLabel} = ${context.radiusRatio == null ? "—" : formatCompactNumber(context.radiusRatio, 3)}`,
      `Re·10⁻⁵ = ${context.reScale == null ? "—" : formatCompactNumber(context.reScale, 3)}`,
      `A₁B₁C₁ = ${context.zetaLocal == null ? "—" : formatCompactNumber(context.zetaLocal, 3)}`
    ].join("; ");
  }

  function getBendDiagram61ClampNotes(context) {
    const notes = [];
    if (context.angleClamped) {
      notes.push(`δ ${context.angleClampDirection === "low" ? "ниже" : "выше"} диапазона; используется ${formatCompactNumber(context.effectiveAngle, 1)}°.`);
    }
    if (context.radiusClamped) {
      notes.push(`${context.radiusRatioLabel} ${context.radiusClampDirection === "low" ? "ниже" : "выше"} табличной сетки; используется ${formatCompactNumber(context.effectiveRadiusRatio, 3)}.`);
    }
    if (context.radiusRatio != null && context.radiusRatio >= 3) {
      notes.push(`${context.radiusRatioLabel} ≥ 3; это выше основного условия заголовка диаграммы 6-1, расчет следует считать справочным.`);
    }
    if (context.shape === "Rectangle" && context.aspectClamped) {
      notes.push(`a₀/b₀ ${context.aspectClampDirection === "low" ? "ниже" : "выше"} табличной сетки; используется ${formatCompactNumber(context.effectiveAspectRatio, 3)}.`);
    }
    if (context.reClamped) {
      notes.push(`Re·10⁻⁵ ${context.reClampDirection === "low" ? "ниже" : "выше"} таблицы kRe; используется ${formatCompactNumber(context.effectiveReScale, 3)}.`);
    }

    return notes;
  }

  function formatRoundContractionDerivedText(context) {
    return [
      `α = ${context.alpha == null ? "—" : formatCompactNumber(context.alpha, 2)}°`,
      `n₀ = F₀/F₁ = ${context.areaRatio == null ? "—" : formatCompactNumber(context.areaRatio, 3)}`,
      `Re = ${context.reynolds == null ? "—" : formatCompactNumber(context.reynolds, 0)}`
    ].join("; ");
  }

  function getRoundContractionClampNotes(context) {
    const notes = [];
    if (context.alphaClamped) {
      notes.push(`α ${context.alphaClampDirection === "low" ? "ниже" : "выше"} диапазона; используется ${formatCompactNumber(context.effectiveAlpha, 2)}°.`);
    }
    if (context.ratioClamped) {
      notes.push(`n₀ = F₀/F₁ ${context.ratioClampDirection === "low" ? "ниже" : "выше"} диапазона; используется ${formatCompactNumber(context.effectiveAreaRatio, 3)}.`);
    }

    return notes;
  }

  function formatTransitionContractionDerivedText(context) {
    return [
      `F₀/F₁ = ${context.areaRatio == null ? "—" : formatCompactNumber(context.areaRatio, 3)}`,
      `l/D₀ = ${context.lengthRatio == null ? "—" : formatCompactNumber(context.lengthRatio, 3)}`,
      `Re·10⁻⁴ = ${context.reScale == null ? "—" : formatCompactNumber(context.reScale, 3)}`
    ].join("; ");
  }

  function getTransitionContractionClampNotes(context) {
    const notes = [];
    if (context.reClamped) {
      notes.push(`Re·10⁻⁴ ${context.reClampDirection === "low" ? "ниже" : "выше"} диапазона; используется ${formatCompactNumber(context.effectiveReScale, 3)}.`);
    }
    if (context.lengthClamped) {
      notes.push(`l/D₀ ${context.lengthClampDirection === "low" ? "ниже" : "выше"} диапазона; используется ${formatCompactNumber(context.effectiveLengthRatio, 3)}.`);
    }

    return notes;
  }

  function formatRoundDiffuserDerivedText(context) {
    return [
      `α = ${context.alpha == null ? "—" : formatCompactNumber(context.alpha, 2)}°`,
      `F₁/F₀ = ${context.expansionRatio == null ? "—" : formatCompactNumber(context.expansionRatio, 3)}`,
      `Re·10⁻⁵ = ${context.reScale == null ? "—" : formatCompactNumber(context.reScale, 3)}`
    ].join("; ");
  }

  function getRoundDiffuserClampNotes(context) {
    const notes = [];
    if (context.alphaClamped) {
      notes.push(`α ${context.alphaClampDirection === "low" ? "ниже" : "выше"} диапазона; используется ${formatCompactNumber(context.effectiveAlpha, 2)}°.`);
    }
    if (context.ratioClamped) {
      notes.push(`F₁/F₀ ${context.ratioClampDirection === "low" ? "ниже" : "выше"} диапазона; используется ${formatCompactNumber(context.effectiveExpansionRatio, 3)}.`);
    }
    if (context.reClamped) {
      notes.push(`Re·10⁻⁵ ${context.reClampDirection === "low" ? "ниже" : "выше"} диапазона; используется ${formatCompactNumber(context.effectiveReScale, 3)}.`);
    }

    return notes;
  }

  function formatRectangularDiffuserDerivedText(context) {
    const profileLabel = context.profile >= 10 ? "l₀/Dг ≥ 10" : "l₀/Dг = 0";
    return [
      `α = ${context.alpha == null ? "—" : formatCompactNumber(context.alpha, 2)}°`,
      `F₁/F₀ = ${context.expansionRatio == null ? "—" : formatCompactNumber(context.expansionRatio, 3)}`,
      `Re·10⁻⁵ = ${context.reScale == null ? "—" : formatCompactNumber(context.reScale, 3)}`,
      profileLabel
    ].join("; ");
  }

  function formatTransitionDiffuserDerivedText(context) {
    const profileLabel = context.profile >= 10 ? "l₀/Dг ≥ 10" : "l₀/Dг = 0";
    const directionLabel = context.direction === "round-to-rectangle"
      ? "круг → прямоугольник"
      : context.direction === "rectangle-to-round"
      ? "прямоугольник → круг"
      : "—";
    return [
      directionLabel,
      `α = ${context.alpha == null ? "—" : formatCompactNumber(context.alpha, 2)}°`,
      `F₁/F₀ = ${context.expansionRatio == null ? "—" : formatCompactNumber(context.expansionRatio, 3)}`,
      `Re·10⁻⁵ = ${context.reScale == null ? "—" : formatCompactNumber(context.reScale, 3)}`,
      profileLabel
    ].join("; ");
  }

  function getRectangularDiffuserClampNotes(context) {
    const notes = [];
    if (context.alphaClamped) {
      notes.push(`α ${context.alphaClampDirection === "low" ? "ниже" : "выше"} диапазона; используется ${formatCompactNumber(context.effectiveAlpha, 2)}°.`);
    }
    if (context.ratioClamped) {
      notes.push(`F₁/F₀ ${context.ratioClampDirection === "low" ? "ниже" : "выше"} диапазона; используется ${formatCompactNumber(context.effectiveExpansionRatio, 3)}.`);
    }
    if (context.reClamped) {
      notes.push(`Re·10⁻⁵ ${context.reClampDirection === "low" ? "ниже" : "выше"} диапазона; используется ${formatCompactNumber(context.effectiveReScale, 3)}.`);
    }

    return notes;
  }

  function updateGlobalRoughnessSummary() {
    if (!elements.globalRoughnessSummary) {
      return;
    }

    elements.globalRoughnessSummary.innerHTML = buildRoughnessSummaryHtml(getRoughnessSelection(null, "global"));
  }

  function updateSectionRoughnessSummary(section) {
    const host = elements.blockInspectorBody.querySelector('[data-role="section-roughness-summary"]');
    if (!host) {
      return;
    }

    const selection = section && (section.useIndividualMaterial || section.useCustomRoughness)
      ? getRoughnessSelection(section, "section")
      : getRoughnessSelection(null, "section");
    host.innerHTML = buildRoughnessSummaryHtml(selection);
  }

  function getRoughnessSelection(section, context) {
    const hasSection = Boolean(section);
    const useCustom = hasSection ? section.useCustomRoughness : Boolean(elements.useCustomRoughness && elements.useCustomRoughness.checked);
    const material = hasSection && section.useIndividualMaterial
      ? section.materialType
      : getGlobalMaterial();
    const condition = hasSection && section.useIndividualMaterial
      ? section.surfaceCondition
      : getGlobalSurfaceCondition();
    const customValue = hasSection
      ? parseNumber(getSectionBaseValue(section, "customRoughness"), null)
      : getBaseFieldValue("CustomRoughness");
    const tableValue = getRoughnessValue(material, condition);

    return {
      context,
      material: material || "",
      condition: condition || "",
      useCustom,
      customValue,
      tableValue,
      effectiveValue: useCustom ? customValue : tableValue,
      isSection: hasSection
    };
  }

  function buildRoughnessSummaryHtml(selection) {
    const sourceText = selection.useCustom
      ? (selection.isSection ? "Собственная Δ блока" : "Собственная Δ трассы")
      : `${selection.material || "материал не выбран"} / ${selection.condition || "состояние не выбрано"}`;
    const valueText = selection.effectiveValue == null
      ? "—"
      : `${formatRoughnessMm(selection.effectiveValue)} мм`;

    return [
      '<div class="roughness-reference-card">',
      '<div class="roughness-reference-content">',
      `<span class="roughness-reference-title">${escapeHtml(sourceText)}</span>`,
      `<span class="roughness-reference-value">Δ = <strong>${escapeHtml(valueText)}</strong></span>`,
      selection.useCustom && selection.tableValue != null
        ? `<small>Справочно для выбранного материала: ${escapeHtml(formatRoughnessMm(selection.tableValue))} мм</small>`
        : "",
      "</div>",
      buildRoughnessGuideButton(selection.context),
      "</div>"
    ].join("");
  }

  function buildRoughnessGuideButton(context) {
    return [
      `<button type="button" class="kms-guide-button roughness-guide-button" data-open-roughness-table data-roughness-context="${escapeAttr(context || "global")}" aria-haspopup="dialog" aria-label="Открыть таблицу шероховатости" title="Открыть таблицу шероховатости">`,
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
      '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z"></path>',
      '<path d="M4 9h16M4 14h16M9 4v16M15 4v16"></path>',
      "</svg>",
      "</button>"
    ].join("");
  }

  function getRoughnessValue(material, condition) {
    const entry = findRoughnessEntry(material, condition);
    if (!entry) {
      return null;
    }

    const value = Number(readProp(entry, "equivalentRoughness", "EquivalentRoughness"));
    return Number.isFinite(value) ? value : null;
  }

  function findRoughnessEntry(material, condition) {
    const materialName = String(material || "").trim().toLowerCase();
    const conditionName = String(condition || "").trim().toLowerCase();
    if (!materialName || !conditionName) {
      return null;
    }

    return roughnessCatalog.find((entry) =>
      String(readProp(entry, "type", "Type") || "").trim().toLowerCase() === materialName &&
      String(readProp(entry, "condition", "Condition") || "").trim().toLowerCase() === conditionName) || null;
  }

  function showRoughnessGuide(section) {
    const selection = getRoughnessSelection(section, section ? "section" : "global");
    const modal = getRoughnessGuideModal();
    const title = modal.querySelector('[data-role="roughness-guide-title"]');
    const body = modal.querySelector('[data-role="roughness-guide-body"]');
    if (title) {
      title.textContent = "Таблица Δ";
    }
    if (body) {
      body.innerHTML = buildRoughnessGuideHtml(selection);
    }

    if (window.bootstrap && window.bootstrap.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(modal).show();
      return;
    }

    modal.classList.add("show");
    modal.style.display = "block";
    modal.removeAttribute("aria-hidden");
  }

  function getRoughnessGuideModal() {
    let modal = document.getElementById("roughnessGuideModal");
    if (modal) {
      return modal;
    }

    modal = document.createElement("div");
    modal.id = "roughnessGuideModal";
    modal.className = "modal fade resistance-guide-modal material-guide-modal";
    modal.tabIndex = -1;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = [
      '<div class="modal-dialog modal-dialog-centered modal-lg">',
      '<div class="modal-content">',
      '<div class="modal-header">',
      '<h3 class="modal-title" data-role="roughness-guide-title">Таблица Δ</h3>',
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>',
      "</div>",
      '<div class="modal-body" data-role="roughness-guide-body"></div>',
      "</div>",
      "</div>"
    ].join("");
    document.body.appendChild(modal);
    return modal;
  }

  function buildRoughnessGuideHtml(selection) {
    const valueText = selection.effectiveValue == null
      ? "—"
      : `${formatRoughnessMm(selection.effectiveValue)} мм`;
    const sourceText = selection.useCustom
      ? "введено вручную"
      : `${selection.material || "—"} / ${selection.condition || "—"}`;

    return [
      '<div class="resistance-guide-summary material-guide-summary">',
      `<span class="resistance-guide-param"><span>Источник:</span><strong>${escapeHtml(sourceText)}</strong></span>`,
      `<span class="resistance-guide-param"><span>Δ =</span><strong>${escapeHtml(valueText)}</strong></span>`,
      "</div>",
      buildRoughnessGuideTableHtml(selection)
    ].join("");
  }

  function buildRoughnessGuideTableHtml(selection) {
    const rows = roughnessCatalog.map((entry) => {
      const material = readProp(entry, "type", "Type") || "";
      const condition = readProp(entry, "condition", "Condition") || "";
      const referenceValue = String(readProp(entry, "referenceValue", "ReferenceValue") || "").trim();
      const value = Number(readProp(entry, "equivalentRoughness", "EquivalentRoughness"));
      const displayValue = referenceValue || (Number.isFinite(value) ? formatRoughnessMm(value) : "-");
      const isSource = String(material).trim().toLowerCase() === String(selection.material || "").trim().toLowerCase() &&
        String(condition).trim().toLowerCase() === String(selection.condition || "").trim().toLowerCase();
      return [
        `<tr${isSource ? ' class="is-source"' : ""}>`,
        `<td>${escapeHtml(material)}</td>`,
        `<td>${escapeHtml(condition)}</td>`,
        `<td>${escapeHtml(displayValue)}</td>`,
        "</tr>"
      ].join("");
    }).join("");

    return [
      '<div class="resistance-table-wrap material-table-wrap">',
      '<table class="material-guide-table">',
      "<thead>",
      "<tr><th>Материал стенки</th><th>Состояние поверхности</th><th>Δ, мм</th></tr>",
      "</thead>",
      `<tbody>${rows}</tbody>`,
      "</table>",
      "</div>"
    ].join("");
  }

  function formatRoughnessMm(value) {
    const parsed = parseNumber(value, null);
    if (!Number.isFinite(parsed)) {
      return "—";
    }

    return formatCompactNumber(parsed * 1000, 4);
  }

  function renderSelectField(label, field, options, value, hint) {
    return renderRawField(
      label,
      `<select class="form-select" data-field="${field}">${renderOptions(options, value)}</select>`,
      hint,
      false
    );
  }

  function renderNamedSelectField(label, field, options, value, hint, disabled) {
    return renderRawField(
      label,
      `<select class="form-select" data-field="${field}" ${disabled ? "disabled" : ""}>${renderNamedOptions(options, value)}</select>`,
      hint,
      false
    );
  }

  function renderRawField(label, controlHtml, hint, fullWidth, note) {
    return [
      `<div class="field${fullWidth ? " field-span-2" : ""}">`,
      `<label class="field-label"><span>${escapeHtml(label)}</span>${renderContextTooltipTrigger(label, hint)}</label>`,
      controlHtml,
      note ? `<small class="field-hint">${escapeHtml(note)}</small>` : "",
      "</div>"
    ].join("");
  }

  function renderContextTooltipTrigger(label, hint) {
    const tooltip = normalizeTooltipContent(label, hint);
    if (!tooltip) {
      return "";
    }

    return [
      '<button type="button" class="context-tooltip-trigger" data-context-tooltip-trigger',
      ` aria-label="Подсказка: ${escapeAttr(tooltip.title)}"`,
      ` data-tooltip-title="${escapeAttr(tooltip.title)}"`,
      ` data-tooltip-essence="${escapeAttr(tooltip.essence)}"`,
      ` data-tooltip-logic="${escapeAttr(tooltip.logic)}">?</button>`
    ].join("");
  }

  function createContextTooltipButton(label, hint) {
    const tooltip = normalizeTooltipContent(label, hint);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "context-tooltip-trigger";
    button.dataset.contextTooltipTrigger = "true";
    button.setAttribute("aria-label", `Подсказка: ${tooltip ? tooltip.title : label}`);
    if (tooltip) {
      button.dataset.tooltipTitle = tooltip.title;
      button.dataset.tooltipEssence = tooltip.essence;
      button.dataset.tooltipLogic = tooltip.logic;
    }
    button.textContent = "?";
    return button;
  }

  function normalizeTooltipContent(label, hint) {
    if (!hint) {
      return null;
    }

    if (typeof hint === "object") {
      const title = String(hint.title || label || "").trim();
      const essence = String(hint.essence || getDefaultTooltipEssence(label)).trim();
      const logic = String(hint.logic || hint.text || "").trim();
      if (!title || (!essence && !logic)) {
        return null;
      }

      return { title, essence, logic };
    }

    const logic = String(hint || "").trim();
    if (!logic) {
      return null;
    }

    return {
      title: String(label || "Параметр").trim(),
      essence: getDefaultTooltipEssence(label),
      logic
    };
  }

  function getDefaultTooltipEssence(label) {
    const text = String(label || "").toLowerCase();
    if (text.includes("температур")) {
      return "Температурный параметр, который влияет на свойства газа и промежуточные результаты расчета.";
    }
    if (text.includes("расход")) {
      return "Количество газа, проходящее через сечение за единицу времени.";
    }
    if (text.includes("диаметр") || text.includes("сторона") || text.includes("сечение")) {
      return "Геометрический параметр сечения, по которому считаются площадь, скорость и динамическое давление.";
    }
    if (text.includes("длина")) {
      return "Протяженность выбранного элемента трассы.";
    }
    if (text.includes("угол")) {
      return "Угол геометрического элемента, влияющий на коэффициент местного сопротивления.";
    }
    if (text.includes("кмс") || text.includes("ζ")) {
      return "Коэффициент местного сопротивления выбранного элемента.";
    }
    if (text.includes("шероховат")) {
      return "Параметр неровности внутренней поверхности канала.";
    }
    if (text.includes("материал")) {
      return "Материал стенки, по которому выбирается справочное значение шероховатости.";
    }
    if (text.includes("высот")) {
      return "Изменение отметки трассы на выбранном элементе.";
    }

    return "Параметр исходных данных для расчета дымовой трассы.";
  }

  function handleContextTooltipMouseOver(event) {
    const trigger = event.target.closest("[data-context-tooltip-trigger]");
    const tooltip = event.target.closest(".context-tooltip");
    if (trigger) {
      scheduleContextTooltipShow(trigger);
      return;
    }

    if (tooltip && tooltip === tooltipState.tooltip) {
      clearContextTooltipHideTimer();
    }
  }

  function handleContextTooltipMouseOut(event) {
    const trigger = event.target.closest("[data-context-tooltip-trigger]");
    const tooltip = event.target.closest(".context-tooltip");
    const nextTarget = event.relatedTarget;

    if (trigger && isTooltipSafeTarget(nextTarget)) {
      return;
    }

    if (tooltip && isTooltipSafeTarget(nextTarget)) {
      return;
    }

    if (trigger || tooltip) {
      scheduleContextTooltipHide();
    }
  }

  function handleContextTooltipFocusIn(event) {
    const trigger = event.target.closest("[data-context-tooltip-trigger]");
    if (trigger) {
      scheduleContextTooltipShow(trigger);
    }
  }

  function handleContextTooltipFocusOut(event) {
    const trigger = event.target.closest("[data-context-tooltip-trigger]");
    if (trigger) {
      scheduleContextTooltipHide();
    }
  }

  function handleContextTooltipClick(event) {
    const trigger = event.target.closest("[data-context-tooltip-trigger]");
    if (!trigger) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    showContextTooltip(trigger);
  }

  function scheduleContextTooltipShow(trigger) {
    clearContextTooltipHideTimer();
    window.clearTimeout(tooltipState.showTimer);
    tooltipState.showTimer = window.setTimeout(() => showContextTooltip(trigger), 500);
  }

  function scheduleContextTooltipHide() {
    window.clearTimeout(tooltipState.showTimer);
    clearContextTooltipHideTimer();
    tooltipState.hideTimer = window.setTimeout(hideContextTooltipNow, 200);
  }

  function clearContextTooltipHideTimer() {
    window.clearTimeout(tooltipState.hideTimer);
    tooltipState.hideTimer = null;
  }

  function showContextTooltip(trigger) {
    window.clearTimeout(tooltipState.showTimer);
    clearContextTooltipHideTimer();

    const title = trigger.dataset.tooltipTitle || "Подсказка";
    const essence = trigger.dataset.tooltipEssence || "";
    const logic = trigger.dataset.tooltipLogic || "";
    if (!essence && !logic) {
      return;
    }

    const tooltip = getContextTooltip();
    tooltipState.trigger = trigger;
    tooltip.innerHTML = [
      `<div class="context-tooltip__title">${escapeHtml(title)}</div>`,
      essence
        ? `<div class="context-tooltip__section"><strong>Что это?</strong><p>${escapeHtml(essence)}</p></div>`
        : "",
      logic
        ? `<div class="context-tooltip__section"><strong>Как работает?</strong><p>${escapeHtml(logic)}</p></div>`
        : ""
    ].join("");
    tooltip.classList.add("is-visible");
    tooltip.style.visibility = "hidden";
    tooltip.style.left = "0px";
    tooltip.style.top = "0px";
    positionContextTooltip(trigger, tooltip);
    tooltip.style.visibility = "visible";
  }

  function hideContextTooltipNow() {
    window.clearTimeout(tooltipState.showTimer);
    clearContextTooltipHideTimer();
    if (tooltipState.tooltip) {
      tooltipState.tooltip.classList.remove("is-visible");
      tooltipState.tooltip.style.visibility = "";
    }
    tooltipState.trigger = null;
  }

  function getContextTooltip() {
    if (tooltipState.tooltip) {
      return tooltipState.tooltip;
    }

    const tooltip = document.createElement("div");
    tooltip.className = "context-tooltip";
    tooltip.setAttribute("role", "tooltip");
    document.body.appendChild(tooltip);
    tooltipState.tooltip = tooltip;
    return tooltip;
  }

  function positionContextTooltip(trigger, tooltip) {
    const gap = 10;
    const margin = 8;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const width = tooltipRect.width;
    const height = tooltipRect.height;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const placements = [
      {
        name: "right",
        left: rect.right + gap,
        top: rect.top + rect.height / 2 - height / 2
      },
      {
        name: "left",
        left: rect.left - width - gap,
        top: rect.top + rect.height / 2 - height / 2
      },
      {
        name: "bottom",
        left: rect.left + rect.width / 2 - width / 2,
        top: rect.bottom + gap
      },
      {
        name: "top",
        left: rect.left + rect.width / 2 - width / 2,
        top: rect.top - height - gap
      }
    ];

    const selected = placements.find((placement) =>
      placement.left >= margin &&
      placement.top >= margin &&
      placement.left + width <= viewportWidth - margin &&
      placement.top + height <= viewportHeight - margin) || placements[0];

    const left = Math.min(Math.max(selected.left, margin), Math.max(margin, viewportWidth - width - margin));
    const top = Math.min(Math.max(selected.top, margin), Math.max(margin, viewportHeight - height - margin));
    tooltip.dataset.placement = selected.name;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function isTooltipSafeTarget(target) {
    if (!target) {
      return false;
    }

    return Boolean(
      target.closest &&
      (target.closest("[data-context-tooltip-trigger]") ||
        (tooltipState.tooltip && target.closest(".context-tooltip") === tooltipState.tooltip))
    );
  }

  function renderOptions(options, selectedValue) {
    return (options || [])
      .map((option) => {
        const value = option == null ? "" : String(option);
        const selected = value === String(selectedValue || "") ? " selected" : "";
        return `<option value="${escapeAttr(value)}"${selected}>${escapeHtml(value)}</option>`;
      })
      .join("");
  }

  function renderNamedOptions(options, selectedValue) {
    return (options || [])
      .map((option) => {
        const value = option && option.value != null ? String(option.value) : "";
        const label = option && option.label != null ? String(option.label) : value;
        const selected = value === String(selectedValue || "") ? " selected" : "";
        return `<option value="${escapeAttr(value)}"${selected}>${escapeHtml(label)}</option>`;
      })
      .join("");
  }

  function initUnitSelectors() {
    form.querySelectorAll("[data-unit-for]").forEach((select) => {
      if (!select.dataset.currentUnit) {
        select.dataset.currentUnit = select.value;
      }
    });
  }

  function handleGlobalUnitChange(select) {
    const fieldId = select.dataset.unitFor;
    const field = document.getElementById(fieldId);
    if (!field) {
      select.dataset.currentUnit = select.value;
      return;
    }

    const oldUnit = select.dataset.currentUnit || baseUnitsByField[fieldId] || select.value;
    const newUnit = select.value;
    const baseUnit = baseUnitsByField[fieldId] || newUnit;
    const rawValue = parseNumber(field.value, null);

    if (rawValue != null) {
      const baseValue = convertValue(rawValue, oldUnit, baseUnit);
      field.value = formatForInput(convertValue(baseValue, baseUnit, newUnit));
    }

    select.dataset.currentUnit = newUnit;
  }

  function handleSectionUnitChange(select) {
    const section = getSelectedSection();
    if (!section) {
      return;
    }

    const field = select.dataset.unitField;
    const oldUnit = section.units[field] || select.dataset.currentUnit || sectionBaseUnits[field];
    const newUnit = select.value;
    const baseUnit = sectionBaseUnits[field] || newUnit;
    const rawValue = parseNumber(section[field], null);

    if (rawValue != null) {
      if (field === "temperatureLossPerMeter") {
        const baseValue = convertTemperatureLossToBase(section, rawValue, oldUnit);
        section[field] = formatForInput(convertTemperatureLossFromBase(section, baseValue, newUnit));
      } else {
        const baseValue = convertValue(rawValue, oldUnit, baseUnit);
        section[field] = formatForInput(convertValue(baseValue, baseUnit, newUnit));
      }
    }

    section.units[field] = newUnit;
    if (isConicalCollectorSection(section) || isStraightPipeEntranceSection(section)) {
      updateDerivedLocalResistanceParams(section);
      if (isConicalCollectorSection(section) && field === "diameter") {
        syncConicalCollectorOutletToNext(section);
      }
    }
    renderCanvas();
    renderInspector();
    renderHiddenInputs();
    schedulePreview();
    saveDraftSilently();
  }

  function convertValue(value, fromUnit, toUnit) {
    const from = unitDefinitions[fromUnit];
    const to = unitDefinitions[toUnit];
    if (!from || !to) {
      return value;
    }

    return to.fromBase(from.toBase(value));
  }

  function formatDisplayFromBase(value, baseUnit, displayUnit) {
    const parsed = parseNumber(value, null);
    if (parsed == null) {
      return "";
    }

    return formatForInput(convertValue(parsed, baseUnit, displayUnit || baseUnit));
  }

  function getFieldUnit(fieldId) {
    const select = form.querySelector(`[data-unit-for="${fieldId}"]`);
    return select ? select.value : (baseUnitsByField[fieldId] || "");
  }

  function getBaseFieldValue(fieldId) {
    const value = parseNumber(getFieldValue(fieldId), null);
    if (value == null) {
      return null;
    }

    const currentUnit = getFieldUnit(fieldId);
    const baseUnit = baseUnitsByField[fieldId] || currentUnit;
    return convertValue(value, currentUnit, baseUnit);
  }

  function collectGlobalUnits() {
    return form.querySelectorAll("[data-unit-for]")
      ? Array.from(form.querySelectorAll("[data-unit-for]")).reduce((units, select) => {
          units[select.dataset.unitFor] = select.value;
          return units;
        }, {})
      : {};
  }

  function applyGlobalUnits(units) {
    form.querySelectorAll("[data-unit-for]").forEach((select) => {
      const preferred = units[select.dataset.unitFor] || baseUnitsByField[select.dataset.unitFor];
      if (preferred && Array.from(select.options).some((option) => option.value === preferred)) {
        select.value = preferred;
      }
      select.dataset.currentUnit = select.value;
    });
  }

  function buildBaseFormData() {
    renderHiddenInputs();
    const formData = new FormData(form);
    fieldUnitIds.forEach((fieldId) => {
      const baseValue = getBaseFieldValue(fieldId);
      if (baseValue != null) {
        formData.set(fieldId, formatForInput(baseValue));
      }
    });

    return formData;
  }

  function applyBaseValuesToStaticFields() {
    fieldUnitIds.forEach((fieldId) => {
      const baseValue = getBaseFieldValue(fieldId);
      if (baseValue == null) {
        return;
      }

      const field = document.getElementById(fieldId);
      const select = form.querySelector(`[data-unit-for="${fieldId}"]`);
      field.value = formatForInput(baseValue);
      if (select && baseUnitsByField[fieldId]) {
        select.value = baseUnitsByField[fieldId];
        select.dataset.currentUnit = select.value;
      }
    });
  }

  function getSectionUnitOptions(section, field) {
    const current = getSectionUnit(section, field);
    const lengthOptions = [
      { value: "m", label: "м" },
      { value: "mm", label: "мм" }
    ];

    if (field === "temperatureLossPerMeter") {
      return {
        current,
        options: [
          { value: "cPerM", label: "°C/м" },
          { value: "cTotal", label: "°C всего" }
        ]
      };
    }

    if (field === "turnAngle") {
      return {
        current,
        options: [
          { value: "deg", label: "°" },
          { value: "rad", label: "рад" }
        ]
      };
    }

    if (sectionBaseUnits[field]) {
      return {
        current,
        options: lengthOptions
      };
    }

    return null;
  }

  function normalizeSectionUnits(sourceUnits) {
    const units = {
      diameter: "m",
      diameterB: "m",
      outletDiameter: "m",
      outletDiameterB: "m",
      localResistanceParamX: "m",
      localResistanceParamY: "m",
      length: "m",
      heightDelta: "m",
      customRoughness: "m",
      turnAngle: "deg",
      temperatureLossPerMeter: "cPerM"
    };

    if (sourceUnits && typeof sourceUnits === "object") {
      Object.keys(units).forEach((key) => {
        if (sourceUnits[key] && unitDefinitions[sourceUnits[key]]) {
          units[key] = sourceUnits[key];
        }
      });
    }

    return units;
  }

  function mapSectionUnitProps(section) {
    if (!section) {
      return null;
    }

    return {
      diameter: readProp(section, "diameterUnit", "DiameterUnit"),
      diameterB: readProp(section, "diameterBUnit", "DiameterBUnit"),
      outletDiameter: readProp(section, "outletDiameterUnit", "OutletDiameterUnit"),
      outletDiameterB: readProp(section, "outletDiameterBUnit", "OutletDiameterBUnit"),
      length: readProp(section, "lengthUnit", "LengthUnit"),
      temperatureLossPerMeter: readProp(section, "temperatureLossUnit", "TemperatureLossUnit"),
      heightDelta: readProp(section, "heightDeltaUnit", "HeightDeltaUnit"),
      customRoughness: readProp(section, "customRoughnessUnit", "CustomRoughnessUnit"),
      turnAngle: readProp(section, "turnAngleUnit", "TurnAngleUnit")
    };
  }

  function applySectionDisplayUnitsFromBase(section) {
    section.diameter = formatDisplayFromBase(section.diameter, "m", section.units.diameter);
    section.diameterB = formatDisplayFromBase(section.diameterB, "m", section.units.diameterB);
    section.outletDiameter = formatDisplayFromBase(section.outletDiameter, "m", section.units.outletDiameter);
    section.outletDiameterB = formatDisplayFromBase(section.outletDiameterB, "m", section.units.outletDiameterB);
    section.localResistanceParamX = formatDisplayFromBase(section.localResistanceParamX, "m", section.units.localResistanceParamX);
    section.localResistanceParamY = formatDisplayFromBase(section.localResistanceParamY, "m", section.units.localResistanceParamY);
    section.length = formatDisplayFromBase(section.length, "m", section.units.length);
    section.heightDelta = formatDisplayFromBase(section.heightDelta, "m", section.units.heightDelta);
    section.customRoughness = formatDisplayFromBase(section.customRoughness, "m", section.units.customRoughness);
    section.turnAngle = formatDisplayFromBase(section.turnAngle, "deg", section.units.turnAngle);
    if (section.units.temperatureLossPerMeter === "cTotal") {
      const perMeter = parseNumber(section.temperatureLossPerMeter, null);
      const length = parseNumber(convertValue(parseNumber(section.length, 0), section.units.length, "m"), 0);
      section.temperatureLossPerMeter = perMeter == null ? "" : formatForInput(perMeter * length);
    }

    return section;
  }

  function getSectionUnit(section, field) {
    section.units = normalizeSectionUnits(section.units);
    return section.units[field] || sectionBaseUnits[field] || "";
  }

  function getSectionBaseValue(section, field) {
    const value = parseNumber(section[field], null);
    if (value == null) {
      return "";
    }

    const currentUnit = getSectionUnit(section, field);
    const baseUnit = sectionBaseUnits[field] || currentUnit;
    if (field === "temperatureLossPerMeter") {
      return formatForInput(convertTemperatureLossToBase(section, value, currentUnit));
    }

    return formatForInput(convertValue(value, currentUnit, baseUnit));
  }

  function setSectionDisplayValueFromBase(section, field, baseValue) {
    const baseUnit = sectionBaseUnits[field];
    const currentUnit = getSectionUnit(section, field);
    if (field === "temperatureLossPerMeter") {
      section[field] = formatForInput(convertTemperatureLossFromBase(section, baseValue, currentUnit));
      return;
    }

    section[field] = formatForInput(convertValue(baseValue, baseUnit, currentUnit));
  }

  function convertTemperatureLossToBase(section, value, unit) {
    if (unit !== "cTotal") {
      return value;
    }

    const length = parseNumber(getSectionBaseValue(section, "length"), 0);
    return length > 0 ? value / length : value;
  }

  function convertTemperatureLossFromBase(section, value, unit) {
    if (unit !== "cTotal") {
      return value;
    }

    const length = parseNumber(getSectionBaseValue(section, "length"), 0);
    return length > 0 ? value * length : value;
  }

  function getEffectiveOutletConnection(section) {
    const isRoundLocked = isRoundLockedLocalResistanceSection(section);
    const inletShape = isRoundLocked ? "Round" : normalizeShape(section.crossSectionShape);
    const shape = section.kind === "Contraction" || section.kind === "Expansion"
      ? normalizeShape(section.outletCrossSectionShape || inletShape)
      : inletShape;
    const fieldA = section.kind === "Contraction" || section.kind === "Expansion"
      ? "outletDiameter"
      : "diameter";
    const fieldB = section.kind === "Contraction" || section.kind === "Expansion"
      ? "outletDiameterB"
      : "diameterB";

    return {
      shape,
      sizeA: parseNumber(getSectionBaseValue(section, fieldA), null),
      sizeB: shape === "Rectangle" ? parseNumber(getSectionBaseValue(section, fieldB), null) : null
    };
  }

  function getEffectiveInletConnection(section) {
    const shape = isRoundLockedLocalResistanceSection(section) ? "Round" : normalizeShape(section.crossSectionShape);
    return {
      shape,
      sizeA: parseNumber(getSectionBaseValue(section, "diameter"), null),
      sizeB: shape === "Rectangle" ? parseNumber(getSectionBaseValue(section, "diameterB"), null) : null
    };
  }

  function calculateConnectionArea(connection) {
    if (!connection || !connection.sizeA) {
      return 0;
    }

    return connection.shape === "Rectangle"
      ? connection.sizeA * (connection.sizeB || connection.sizeA)
      : Math.PI * Math.pow(connection.sizeA, 2) / 4;
  }

  function syncGlobalSurfaceOptions(preferredValue) {
    const options = getSurfaceOptions(getGlobalMaterial());
    const currentValue = preferredValue || elements.globalSurfaceCondition.value;
    elements.globalSurfaceCondition.innerHTML = renderOptions(options, currentValue);
  }

  function toggleGlobalRoughnessField() {
    elements.globalCustomRoughnessField.classList.toggle("d-none", !elements.useCustomRoughness.checked);
  }

  function getSurfaceOptions(material) {
    return materialCatalog[material] || [];
  }

  function getGlobalMaterial() {
    return elements.globalMaterialType.value || Object.keys(materialCatalog)[0] || "";
  }

  function getGlobalSurfaceCondition() {
    return elements.globalSurfaceCondition.value || "";
  }

  function getFieldValue(id) {
    const field = document.getElementById(id);
    return field ? field.value : "";
  }

  function setFieldValue(id, value) {
    const field = document.getElementById(id);
    if (field && value != null) {
      field.value = value;
    }
  }

  function showValidationMessages(messages) {
    if (!elements.validationPanel) {
      return;
    }

    if (!messages || messages.length === 0) {
      elements.validationPanel.classList.add("d-none");
      elements.validationPanel.innerHTML = "";
      return;
    }

    elements.validationPanel.classList.remove("d-none");
    elements.validationPanel.innerHTML = `<ul class="mb-0">${messages.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul>`;
  }

  function cleanupDragState() {
    clearDropIndicators();
    elements.routeCanvas.classList.remove("is-dragover");
    state.dragPayload = null;
    elements.routeCanvas.querySelectorAll(".route-node.is-dragging").forEach((node) => {
      node.classList.remove("is-dragging");
    });
  }

  function clearDropIndicators() {
    elements.routeCanvas.querySelectorAll(".drop-before, .drop-after").forEach((node) => {
      node.classList.remove("drop-before", "drop-after");
    });
  }

  function readProp(source) {
    const keys = Array.prototype.slice.call(arguments, 1);
    for (let i = 0; i < keys.length; i += 1) {
      if (source && source[keys[i]] !== undefined && source[keys[i]] !== null) {
        return source[keys[i]];
      }
    }
    return null;
  }

  function sanitizeValue(value) {
    if (value == null) {
      return "";
    }
    return String(value).replace(",", ".").trim();
  }

  function sanitizeTextValue(value) {
    if (value == null) {
      return "";
    }
    return String(value).trim();
  }

  function normalizeSectionFieldValue(field, value) {
    return numericSectionFields.has(field)
      ? sanitizeValue(value)
      : sanitizeTextValue(value);
  }

  function parseNumber(value, fallback) {
    if (value === "" || value == null) {
      return fallback;
    }
    const parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatNumber(value, digits) {
    const parsed = parseNumber(value, 0);
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(parsed);
  }

  function formatCompactNumber(value, maxDigits) {
    const parsed = parseNumber(value, null);
    if (!Number.isFinite(parsed)) {
      return "—";
    }

    return new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: maxDigits
    }).format(parsed);
  }

  function formatForInput(value) {
    if (value === "" || value == null || !Number.isFinite(Number(value))) {
      return "";
    }

    return Number(value).toFixed(6).replace(/\.?0+$/, "");
  }

  function formatNullable(value) {
    return value == null ? "" : formatForInput(value);
  }

  function getUnitLabel(unit) {
    return {
      m: "м",
      mm: "мм",
      deg: "°",
      rad: "рад",
      cPerM: "°C/м",
      cTotal: "°C всего"
    }[unit] || "";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function stripHtml(value) {
    return String(value || "").replace(/<[^>]*>/g, "");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
