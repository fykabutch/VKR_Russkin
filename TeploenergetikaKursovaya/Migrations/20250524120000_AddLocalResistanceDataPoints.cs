using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeploenergetikaKursovaya.Migrations
{
    /// <inheritdoc />
    public partial class AddLocalResistanceDataPoints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<double>(
                name: "ValueofLR",
                table: "LRCs",
                type: "REAL",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "REAL");

            migrationBuilder.AddColumn<bool>(
                name: "IsTabular",
                table: "LRCs",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "ResistanceDataPoints",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ResistanceId = table.Column<int>(type: "INTEGER", nullable: false),
                    ParamX = table.Column<double>(type: "REAL", nullable: false),
                    ParamY = table.Column<double>(type: "REAL", nullable: false),
                    ZetaValue = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResistanceDataPoints", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ResistanceDataPoints_LRCs_ResistanceId",
                        column: x => x.ResistanceId,
                        principalTable: "LRCs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserPresets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 160, nullable: false),
                    PayloadJson = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPresets", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ResistanceDataPoints_ResistanceId_ParamX_ParamY",
                table: "ResistanceDataPoints",
                columns: new[] { "ResistanceId", "ParamX", "ParamY" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ResistanceDataPoints");

            migrationBuilder.DropTable(
                name: "UserPresets");

            migrationBuilder.DropColumn(
                name: "IsTabular",
                table: "LRCs");

            migrationBuilder.AlterColumn<double>(
                name: "ValueofLR",
                table: "LRCs",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(double),
                oldType: "REAL",
                oldNullable: true);
        }
    }
}
