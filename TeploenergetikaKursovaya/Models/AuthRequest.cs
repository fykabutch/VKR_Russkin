namespace TeploenergetikaKursovaya.Models;

public class AuthRequest
{
    public string Login { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public List<GuestPresetSyncItem> GuestPresets { get; set; } = [];
}

public class GuestPresetSyncItem
{
    public string Name { get; set; } = string.Empty;

    public CalcViewModel Model { get; set; } = new();
}
