using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeploenergetikaKursovaya.Migrations
{
    /// <inheritdoc />
    public partial class AddRoughnessReferenceMaterials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
INSERT INTO ""Roughnesses"" (""Type"", ""Condition"", ""EquivalentRoughness"")
SELECT source.""Type"", source.""Condition"", source.""EquivalentRoughness""
FROM (
    SELECT 'Листовая сталь' AS ""Type"", 'Справочное значение' AS ""Condition"", 0.00010 AS ""EquivalentRoughness""
    UNION ALL SELECT 'Винипласт', 'Справочное значение', 0.00010
    UNION ALL SELECT 'Асбестоцементные трубы', 'Справочное значение', 0.00011
    UNION ALL SELECT 'Фанера', 'Справочное значение', 0.00012
    UNION ALL SELECT 'Шлакоалебастровые трубы', 'Справочное значение', 0.00100
    UNION ALL SELECT 'Шлакобетонные трубы', 'Справочное значение', 0.00150
    UNION ALL SELECT 'Кирпичная кладка', 'Справочное значение', 0.00400
    UNION ALL SELECT 'Штукатурка по металлической сетке', 'Справочное значение', 0.01000
) AS source
WHERE NOT EXISTS (
    SELECT 1
    FROM ""Roughnesses"" existing
    WHERE existing.""Type"" = source.""Type""
      AND existing.""Condition"" = source.""Condition""
);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DELETE FROM ""Roughnesses""
WHERE ""Condition"" = 'Справочное значение'
  AND ""Type"" IN (
      'Листовая сталь',
      'Винипласт',
      'Асбестоцементные трубы',
      'Фанера',
      'Шлакоалебастровые трубы',
      'Шлакобетонные трубы',
      'Кирпичная кладка',
      'Штукатурка по металлической сетке'
  );");
        }
    }
}
