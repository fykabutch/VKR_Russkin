namespace TeploenergetikaKursovaya.Models;

public class OptimizationRecommendationViewModel
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "Средний";
    public string ImpactText { get; set; } = string.Empty;
    public double EstimatedSavingPa { get; set; }
}
