using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Globalization;
using System.Text.RegularExpressions;

namespace TeploenergetikaKursovaya.Data
{
    public class Roughness
    {
        [Key]
        public int Id { get; set; }

        public int MaterialId { get; set; }

        public int SurfaceConditionId { get; set; }

        public string ReferenceValue { get; set; } = string.Empty;

        public RoughnessMaterial? Material { get; set; }

        public RoughnessCondition? SurfaceCondition { get; set; }

        [NotMapped]
        public string Type => Material?.Name ?? string.Empty;

        [NotMapped]
        public string Condition => SurfaceCondition?.Name ?? string.Empty;

        [NotMapped]
        public double EquivalentRoughness => RoughnessReferenceValueParser.ToMeters(ReferenceValue);
    }

    public static partial class RoughnessReferenceValueParser
    {
        public static double ToMeters(string? referenceValue)
        {
            var values = NumberPattern()
                .Matches(referenceValue ?? string.Empty)
                .Select(match => double.Parse(match.Value.Replace(',', '.'), CultureInfo.InvariantCulture))
                .ToList();

            if (values.Count == 0)
            {
                return 0;
            }

            var hasRangeDelimiter = referenceValue?.Contains('\u2014') == true ||
                                    referenceValue?.Contains('\u2013') == true ||
                                    referenceValue?.Contains('-') == true;
            var valueMm = hasRangeDelimiter && values.Count >= 2
                ? (values[0] + values[1]) / 2
                : values[0];

            return valueMm / 1000;
        }

        [GeneratedRegex(@"\d+(?:[,.]\d+)?")]
        private static partial Regex NumberPattern();
    }
}
