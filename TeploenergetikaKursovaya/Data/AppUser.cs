using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Data;

public class AppUser
{
    [Key]
    public int Id { get; set; }

    [MaxLength(80)]
    public string Login { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public string PasswordSalt { get; set; } = string.Empty;

    public DateTime RegisteredAtUtc { get; set; }

    public DateTime? LastLoginAtUtc { get; set; }

    public List<UserPreset> Presets { get; set; } = [];

    public List<SavedCalculation> Calculations { get; set; } = [];
}
