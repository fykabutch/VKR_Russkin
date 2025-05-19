using System.Collections.Generic;
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
        public double GasFlow { get; set; }

        [Required(ErrorMessage = "Выберите материал")]
        public string MaterialType { get; set; }

        [Required(ErrorMessage = "Выберите состояние поверхности")]
        public string SurfaceCondition { get; set; }

        [Required(ErrorMessage = "Укажите перепад высот")]
        [Range(-1000, 1000, ErrorMessage = "Допустимый диапазон: -1000 до 1000 м")]
        public double HeightDifference { get; set; }

        public string HeightDirection { get; set; } // "up" или "down"

        public double Y_N2 { get; set; }
        public double Y_O2 { get; set; }
        public double Y_CO2 { get; set; }
        public double Y_H2O { get; set; }

        public List<string> Materials { get; set; } = new List<string>();
        public List<string> SurfaceConditions { get; set; } = new List<string>();
        public List<string> LocalResistanceTypes { get; set; } = new List<string>();
        public List<SectionInput> Sections { get; set; } = new List<SectionInput>();
    }
}