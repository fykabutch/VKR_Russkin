using System.Collections.Generic;

namespace TeploenergetikaKursovaya.Models
{
    public class CalcResultsViewModel
    {
        public double AverageTemperature { get; set; }
        public double? EquivalentDiameter { get; set; }
        public double? Re { get; set; }
        public double Lambda { get; set; }
        public double? RelativeRoughness { get; set; }
        public double GasDensity { get; set; }
        public double? FlowVelocity { get; set; }
        public double PressureDropFriction { get; set; }
        public double PressureDropLocal { get; set; }
        public double GeometricPressureDrop { get; set; }
        public double TotalPressureDrop { get; set; }
        public double InletDensity { get; set; }
        public double OutletDensity { get; set; }

    }
}