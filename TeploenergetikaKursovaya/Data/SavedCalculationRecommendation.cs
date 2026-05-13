using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Data;

public class SavedCalculationRecommendation
{
    [Key]
    public int Id { get; set; }

    public int SavedCalculationId { get; set; }

    public int SortOrder { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Priority { get; set; } = string.Empty;

    public string ImpactText { get; set; } = string.Empty;

    public double EstimatedSavingPa { get; set; }

    public SavedCalculation? SavedCalculation { get; set; }
}
