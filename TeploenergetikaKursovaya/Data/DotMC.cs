using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Data
{
    public class DotMC
    {
        [Key]
        public int Id { get; set; }
        public string? ComponentName { get; set; }
        public double ComponentDensity { get; set; }

    }
}
