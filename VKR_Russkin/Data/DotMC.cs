using System.ComponentModel.DataAnnotations;

namespace VKR_Russkin.Data
{
    public class DotMC
    {
        [Key]
        public int Id { get; set; }
        public string? ComponentName { get; set; }
        public double ComponentDensity { get; set; }

    }
}
