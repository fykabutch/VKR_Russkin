using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeploenergetikaKursovaya.Migrations
{
    /// <inheritdoc />
    public partial class AddNewTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "GasFlowRate",
                table: "Variants",
                newName: "GasFlow");

            migrationBuilder.CreateTable(
                name: "DotMCs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ComponentName = table.Column<string>(type: "TEXT", nullable: false),
                    ComponentDensity = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DotMCs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KVoAs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    GasTemperature = table.Column<int>(type: "INTEGER", nullable: false),
                    KinematicViscosity = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KVoAs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LRCs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TypeofLR = table.Column<string>(type: "TEXT", nullable: false),
                    ValueofLR = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LRCs", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DotMCs");

            migrationBuilder.DropTable(
                name: "KVoAs");

            migrationBuilder.DropTable(
                name: "LRCs");

            migrationBuilder.RenameColumn(
                name: "GasFlow",
                table: "Variants",
                newName: "GasFlowRate");
        }
    }
}
