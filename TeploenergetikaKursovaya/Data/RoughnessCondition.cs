using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Data;

public class RoughnessCondition
{
    [Key]
    public int Id { get; set; }

    [MaxLength(600)]
    public string Name { get; set; } = string.Empty;

    public List<Roughness> Roughnesses { get; set; } = [];
}
