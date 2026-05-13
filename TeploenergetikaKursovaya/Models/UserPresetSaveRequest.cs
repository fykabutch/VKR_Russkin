namespace TeploenergetikaKursovaya.Models;

public class UserPresetSaveRequest
{
    public string Name { get; set; } = string.Empty;

    public CalcViewModel Model { get; set; } = new();
}
