namespace TeploenergetikaKursovaya.Models;

public class MyCalculationsViewModel
{
    public string UserLogin { get; set; } = string.Empty;

    public string Search { get; set; } = string.Empty;

    public string TemplateFilter { get; set; } = "all";

    public string Sort { get; set; } = "updated_desc";

    public bool HasActiveFilters =>
        !string.IsNullOrWhiteSpace(Search) ||
        !string.Equals(TemplateFilter, "all", StringComparison.OrdinalIgnoreCase);

    public List<SavedCalculationListItemViewModel> Calculations { get; set; } = [];
}
