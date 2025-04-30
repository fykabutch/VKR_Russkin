using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Models
{
    public class CalcViewModel
    {
        [Required(ErrorMessage = "Обязательное поле")]
        [Range(0, 1500, ErrorMessage = "Допустимый диапазон: 0-1500°C")]
        public double TgasInitial { get; set; }

        [Required(ErrorMessage = "Обязательное поле")]
        [Range(0.1, 10, ErrorMessage = "Допустимый диапазон: 0.1-10°C/м")]
        public double TemperatureLossPerMeter { get; set; }

        [Required(ErrorMessage = "Обязательное поле")]
        [Range(0.1, 1000, ErrorMessage = "Допустимый диапазон: 0.1-1000 м³/с")]
        public double GasFlowRate { get; set; }

        [Required(ErrorMessage = "Обязательное поле")]
        [Range(0.1, 1000, ErrorMessage = "Допустимый диапазон: 0.1-1000 м")]
        public double SectionLength { get; set; }
    }
}