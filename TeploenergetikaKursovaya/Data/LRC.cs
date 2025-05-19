using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Data
{
    public class LRC
    {
        [Key]
        public int Id { get; set; }
        public string TypeofLR { get; set; }
        public double ValueofLR { get; set; }
    }
}
