using System.ComponentModel.DataAnnotations;

namespace TeploenergetikaKursovaya.Data;

public class ResistanceDataPoint
{
    [Key]
    public int Id { get; set; }

    public int ResistanceId { get; set; }

    public double ParamX { get; set; }

    public double ParamY { get; set; }

    public double ZetaValue { get; set; }

    public LRC? Resistance { get; set; }
}
