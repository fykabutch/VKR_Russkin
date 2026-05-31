using System.ComponentModel.DataAnnotations;

namespace VKR_Russkin.Data
{
    public class KVoA
    {
        [Key]
        public int Id { get; set; }
        public int GasTemperature { get; set; }
        public double KinematicViscosity { get; set; }
    }
}
