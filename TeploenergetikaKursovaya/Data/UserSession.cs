using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Data;

public class UserSession
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    [MaxLength(88)]
    public string TokenHash { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }

    public DateTime ExpiresAtUtc { get; set; }

    public AppUser? User { get; set; }
}
