namespace TeploenergetikaKursovaya.Models;

public class LocalResistanceCatalogItemViewModel
{
    public double? DefaultValue { get; set; }

    public bool IsTabular { get; set; }

    public List<LocalResistanceDataPointViewModel> Points { get; set; } = [];
}

public class LocalResistanceDataPointViewModel
{
    public double ParamX { get; set; }

    public double ParamY { get; set; }

    public double ZetaValue { get; set; }
}
