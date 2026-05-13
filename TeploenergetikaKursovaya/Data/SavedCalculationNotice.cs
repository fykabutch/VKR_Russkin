using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Data;

public class SavedCalculationNotice
{
    [Key]
    public int Id { get; set; }

    public int SavedCalculationId { get; set; }

    public int SortOrder { get; set; }

    public string Text { get; set; } = string.Empty;

    public SavedCalculation? SavedCalculation { get; set; }
}
