using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using TeploenergetikaKursovaya.Data;
using TeploenergetikaKursovaya.Models;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace TeploenergetikaKursovaya.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly TeploDBContext _context;

        public HomeController(ILogger<HomeController> logger, TeploDBContext context)
        {
            _logger = logger;
            _context = context;
        }

        [HttpGet]
        public IActionResult Calc()
        {
            var materials = _context.Roughnesses.Select(r => r.Type).Distinct().ToList();
            var conditions = _context.Roughnesses.Select(r => r.Condition).Distinct().ToList();
            var lrTypes = _context.LRCs.Select(l => l.TypeofLR).Distinct().ToList();

            var viewModel = new CalcViewModel
            {
                Materials = materials,
                SurfaceConditions = conditions,
                LocalResistanceTypes = lrTypes,
                HeightDirection = "down" // Устанавливаем значение по умолчанию
            };
            return View(viewModel);
        }

        [HttpPost]
        public IActionResult Calc(CalcViewModel model)
        {
            if (!ModelState.IsValid)
            {
                // Repopulate dropdowns if validation fails
                model.Materials = _context.Roughnesses.Select(r => r.Type).Distinct().ToList();
                model.SurfaceConditions = _context.Roughnesses.Select(r => r.Condition).Distinct().ToList();
                model.LocalResistanceTypes = _context.LRCs.Select(l => l.TypeofLR).Distinct().ToList();
                return View(model);
            }

            var results = new List<CalcResultsViewModel>();

            foreach (var section in model.Sections)
            {
                // Process each section
                double sectionLength = section.Length;
                double diameter = section.Diameter ?? 0;

                double Tavg = model.TgasInitial - (model.TemperatureLossPerMeter * sectionLength) / 2.0;
                double t_avg = Tavg;

                const double beta = 1.0 / 273.0;
                double gasDensity = 0.0;

                gasDensity += model.Y_N2 * (_context.DotMCs.First(c => c.ComponentName == "N2").ComponentDensity / (1 + beta * t_avg));
                gasDensity += model.Y_O2 * (_context.DotMCs.First(c => c.ComponentName == "O2").ComponentDensity / (1 + beta * t_avg));
                gasDensity += model.Y_CO2 * (_context.DotMCs.First(c => c.ComponentName == "CO2").ComponentDensity / (1 + beta * t_avg));
                gasDensity += model.Y_H2O * (_context.DotMCs.First(c => c.ComponentName == "H2O").ComponentDensity / (1 + beta * t_avg));

                double eqD = diameter;
                double w = model.GasFlow / ((Math.PI / 4) * Math.Pow(eqD, 2));

                double T = Tavg;
                var lower = _context.KVoAs.Where(x => x.GasTemperature <= T).OrderByDescending(x => x.GasTemperature).FirstOrDefault();
                var upper = _context.KVoAs.Where(x => x.GasTemperature >= T).OrderBy(x => x.GasTemperature).FirstOrDefault();

                if (lower == null || upper == null)
                    throw new Exception("Недостаточно данных для интерполяции вязкости.");

                double T1 = lower.GasTemperature;
                double T2 = upper.GasTemperature;
                double v1 = lower.KinematicViscosity;
                double v2 = upper.KinematicViscosity;
                double v = (T1 == T2) ? v1 : v1 + (T - T1) / (T2 - T1) * (v2 - v1);

                double re = (w * eqD) / v;

                var roughnessEntry = _context.Roughnesses.FirstOrDefault(r =>
                    r.Type == model.MaterialType && r.Condition == model.SurfaceCondition);

                if (roughnessEntry == null)
                    throw new Exception("Не найдена эквивалентная шероховатость для заданных условий.");

                double deltaE = roughnessEntry.EquivalentRoughness;
                double relativeRoughness = deltaE / eqD;

                double lambda;
                if (re < 2300)
                {
                    lambda = 64 / re;
                }
                else if (re >= 2300 && re < 4000)
                {
                    double lambdaLaminar = 64 / 2300;
                    double lambdaTurbulent = 0.3164 / Math.Pow(4000, 0.25);
                    lambda = lambdaLaminar + (lambdaTurbulent - lambdaLaminar) * (re - 2300) / (4000 - 2300);
                }
                else
                {
                    double reBoundary1 = 10 * eqD / deltaE;
                    double reBoundary2 = 560 * eqD / deltaE;

                    if (re < reBoundary1)
                        lambda = 0.3164 / Math.Pow(re, 0.25);
                    else if (re < reBoundary2)
                        lambda = 0.11 * Math.Pow(relativeRoughness + 68 / re, 0.25);
                    else
                        lambda = 0.11 * Math.Pow(relativeRoughness, 0.25);
                }

                double pressureDropFriction = lambda * sectionLength / eqD * (Math.Pow(w, 2) / 2.0) * gasDensity;

                double pressureDropLocal = 0.0;
                if (section.SectionKind == "МС" && !string.IsNullOrEmpty(section.LocalResistanceType))
                {
                    var localResistance = _context.LRCs.FirstOrDefault(lr => lr.TypeofLR == section.LocalResistanceType);
                    if (localResistance == null)
                        throw new Exception("Не найден коэффициент местного сопротивления для выбранного типа.");

                    double zeta = localResistance.ValueofLR;
                    pressureDropLocal = zeta * (Math.Pow(w, 2) / 2.0) * gasDensity;
                }

                const double g = 9.81;
                double inletDensity = gasDensity;
                double outletDensity = gasDensity - model.TemperatureLossPerMeter * sectionLength * 0.001;

                // Учитываем направление перепада высот
                double heightDiff = model.HeightDifference;
                double geometricPressureDrop = 0;

                if (heightDiff != 0)
                {
                    if (model.HeightDirection == "up")
                    {
                        geometricPressureDrop = -g * Math.Abs(heightDiff) * (inletDensity - outletDensity);
                    }
                    else if (model.HeightDirection == "down")
                    {
                        geometricPressureDrop = g * Math.Abs(heightDiff) * (inletDensity - outletDensity);
                    }
                }

                double totalPressureDrop = pressureDropFriction + pressureDropLocal + geometricPressureDrop;

                results.Add(new CalcResultsViewModel
                {
                    AverageTemperature = Tavg,
                    EquivalentDiameter = eqD,
                    Re = re,
                    Lambda = lambda,
                    RelativeRoughness = relativeRoughness,
                    GasDensity = gasDensity,
                    FlowVelocity = w,
                    PressureDropFriction = pressureDropFriction,
                    PressureDropLocal = pressureDropLocal,
                    GeometricPressureDrop = geometricPressureDrop,
                    TotalPressureDrop = totalPressureDrop,
                    InletDensity = inletDensity,
                    OutletDensity = outletDensity
                });
            }

            // Save variant to database
            _context.Variants.Add(new Variant
            {
                TgasInitial = model.TgasInitial,
                TemperatureLossPerMeter = model.TemperatureLossPerMeter,
                GasFlow = model.GasFlow,
                MaterialType = model.MaterialType,
                SurfaceCondition = model.SurfaceCondition,
                HeightDifference = model.HeightDifference,
                HeightDirection = model.HeightDirection,
                SectionsData = JsonConvert.SerializeObject(model.Sections)
            });
            _context.SaveChanges();

            return View("Results", new CalcPageViewModel { Results = results });
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}