using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TeploenergetikaKursovaya.Data;

public class UserPreset
{
    [Key]
    public int Id { get; set; }

    public int? UserId { get; set; }

    public int? SavedCalculationId { get; set; }

    [MaxLength(160)]
    public string Name { get; set; } = string.Empty;

    [NotMapped]
    public string PayloadJson { get; set; } = string.Empty;

    public bool IsTemplate { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public AppUser? User { get; set; }

    public SavedCalculation? SavedCalculation { get; set; }
}
