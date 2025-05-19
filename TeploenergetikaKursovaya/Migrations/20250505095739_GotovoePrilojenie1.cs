using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeploenergetikaKursovaya.Migrations
{
    /// <inheritdoc />
    public partial class GotovoePrilojenie1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Variants");

            migrationBuilder.DropColumn(
                name: "Diameter",
                table: "Variants");

            migrationBuilder.DropColumn(
                name: "GeometricPressureDrop",
                table: "Variants");

            migrationBuilder.DropColumn(
                name: "Height",
                table: "Variants");

            migrationBuilder.DropColumn(
                name: "PressureDropFriction",
                table: "Variants");

            migrationBuilder.DropColumn(
                name: "PressureDropLocal",
                table: "Variants");

            migrationBuilder.DropColumn(
                name: "SectionLength",
                table: "Variants");

            migrationBuilder.DropColumn(
                name: "TotalPressureDrop",
                table: "Variants");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "Variants");

            migrationBuilder.RenameColumn(
                name: "SectionType",
                table: "Variants",
                newName: "SectionsData");

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "Roughnesses",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Condition",
                table: "Roughnesses",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TypeofLR",
                table: "LRCs",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SectionsData",
                table: "Variants",
                newName: "SectionType");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Variants",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<double>(
                name: "Diameter",
                table: "Variants",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "GeometricPressureDrop",
                table: "Variants",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "Height",
                table: "Variants",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "PressureDropFriction",
                table: "Variants",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "PressureDropLocal",
                table: "Variants",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "SectionLength",
                table: "Variants",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "TotalPressureDrop",
                table: "Variants",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "Width",
                table: "Variants",
                type: "REAL",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "Roughnesses",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AlterColumn<string>(
                name: "Condition",
                table: "Roughnesses",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AlterColumn<string>(
                name: "TypeofLR",
                table: "LRCs",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");
        }
    }
}
