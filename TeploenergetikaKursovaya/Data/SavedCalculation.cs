using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Data;

public class SavedCalculation
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    [MaxLength(160)]
    public string Name { get; set; } = string.Empty;

    public bool IsTemplate { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public AppUser? User { get; set; }

    public SavedCalculationInput? Input { get; set; }

    public SavedCalculationSummary? Summary { get; set; }

    public List<SavedCalculationSection> Sections { get; set; } = [];

    public List<SavedCalculationResult> Results { get; set; } = [];

    public List<SavedCalculationRecommendation> Recommendations { get; set; } = [];

    public List<SavedCalculationNotice> Notices { get; set; } = [];
}
