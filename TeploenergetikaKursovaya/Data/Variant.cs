public class Variant
{
    public int Id { get; set; }
    public double TgasInitial { get; set; }
    public double TemperatureLossPerMeter { get; set; }
    public double GasFlow { get; set; }
    public string MaterialType { get; set; }
    public string SurfaceCondition { get; set; }
    public double HeightDifference { get; set; }
    public string SectionsData { get; set; } // Add this
    public string HeightDirection { get; set; }
}