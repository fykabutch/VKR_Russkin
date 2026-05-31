namespace VKR_Russkin.Models;

public class CalcPageViewModel
{
    public CalcViewModel Input { get; set; } = new();
    public CalculationSummaryViewModel Summary { get; set; } = new();
    public List<CalcResultsViewModel> Results { get; set; } = [];
    public List<OptimizationRecommendationViewModel> Recommendations { get; set; } = [];
    public List<string> Notices { get; set; } = [];
    public bool IsAuthenticated { get; set; }
    public string? UserLogin { get; set; }
    public int? SavedCalculationId { get; set; }
    public string CalculationName { get; set; } = "Расчет дымовой трассы";
}
