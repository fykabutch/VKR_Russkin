using System.ComponentModel.DataAnnotations;

namespace VKR_Russkin.Data
{
    public class LRC
    {
        [Key]
        public int Id { get; set; }
        public string TypeofLR { get; set; } = string.Empty;
        public double? ValueofLR { get; set; }
        public bool IsTabular { get; set; }
        public ICollection<ResistanceDataPoint> DataPoints { get; set; } = [];
    }
}
