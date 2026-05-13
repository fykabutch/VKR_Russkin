namespace TeploenergetikaKursovaya.Models;

public class PressureCalculationResponse
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public CalculationSummaryViewModel Summary { get; set; } = new();
    public List<CalcResultsViewModel> Results { get; set; } = [];
    public List<OptimizationRecommendationViewModel> Recommendations { get; set; } = [];
    public List<string> Notices { get; set; } = [];
}
