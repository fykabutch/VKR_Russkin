using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using TeploenergetikaKursovaya.Data;
using TeploenergetikaKursovaya.Models;


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
        public IActionResult Index()
        {
            return View(new CalcViewModel());
        }

        [HttpPost]
        public IActionResult Index(CalcViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            double averageTemperature = model.TgasInitial - (model.TemperatureLossPerMeter * model.SectionLength) / 2;

            var result = new CalcResultsViewModel
            {
                averageTemperature = averageTemperature
            };

            _context.Variants.Add(new Variant
            {
                TgasInitial = model.TgasInitial,
                TemperatureLossPerMeter = model.TemperatureLossPerMeter,
                GasFlowRate = model.GasFlowRate,
                SectionLength = model.SectionLength
            });
            _context.SaveChanges();

            return View("Results", result); // Переходим на отдельную страницу результатов
        }

        [HttpGet]
        public IActionResult Results(CalcResultsViewModel model)
        {
            return View(model);
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
