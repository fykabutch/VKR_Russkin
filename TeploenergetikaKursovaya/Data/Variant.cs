using System.ComponentModel.DataAnnotations;
namespace TeploenergetikaKursovaya.Data
{
    public class Variant
    {
        [Key]
        public int Id { get; set; }

        public double TgasInitial { get; set; } // Начальная температура газа, °C
        public double TemperatureLossPerMeter { get; set; } // Потери температуры на 1 м, °C/м
        public double GasFlowRate { get; set; } // Объемный расход газа, м³/с
        public double SectionLength { get; set; } // Длина участка, м
    }
}
