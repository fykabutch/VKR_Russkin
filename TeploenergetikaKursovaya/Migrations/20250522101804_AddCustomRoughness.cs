using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeploenergetikaKursovaya.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomRoughness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "CustomRoughness",
                table: "Variants",
                type: "REAL",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomRoughness",
                table: "Variants");
        }
    }
}
