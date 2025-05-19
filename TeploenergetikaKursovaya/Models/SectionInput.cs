using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Models
{
    public class SectionInput
    {
        [Required(ErrorMessage = "Выберите тип участка")]
        public string SectionKind { get; set; } // "Прямой" или "МС" (местное сопротивление)

        [Required(ErrorMessage = "Укажите длину участка")]
        [Range(0.1, 1000, ErrorMessage = "Длина должна быть от 0.1 до 1000 м")]
        public double Length { get; set; }

        [Range(0.01, 10, ErrorMessage = "Диаметр должен быть от 0.01 до 10 м")]
        public double? Diameter { get; set; } // только для "Прямой" участков

        public string LocalResistanceType { get; set; } // только для "МС" участков
    }
}