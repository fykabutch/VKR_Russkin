using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Data
{
    public class Roughness
    {
        [Key]
        public int Id { get; set; }
        public string Type { get; set; }
        public string Condition { get; set; }
        public double EquivalentRoughness { get; set; }
    }
}
