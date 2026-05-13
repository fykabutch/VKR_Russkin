using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeploenergetikaKursovaya.Migrations
{
    /// <inheritdoc />
    public partial class AddHeightDirectionDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HeightDirection",
                table: "Variants",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HeightDirection",
                table: "Variants");
        }
    }
}
