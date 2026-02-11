using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BallisticsCalculator.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "ballistics");

            migrationBuilder.CreateTable(
                name: "cartridges",
                schema: "ballistics",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    bullet_weight_grains = table.Column<double>(type: "double precision", nullable: false),
                    bullet_weight_grams = table.Column<double>(type: "double precision", nullable: false),
                    bullet_diameter_inches = table.Column<double>(type: "double precision", nullable: false),
                    muzzle_velocity_fps = table.Column<double>(type: "double precision", nullable: false),
                    ballistic_coefficient_g1 = table.Column<double>(type: "double precision", nullable: false),
                    bullet_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cartridges", x => x.id);
                });

            migrationBuilder.InsertData(
                schema: "ballistics",
                table: "cartridges",
                columns: new[] { "id", "ballistic_coefficient_g1", "bullet_diameter_inches", "bullet_type", "bullet_weight_grains", "bullet_weight_grams", "category", "muzzle_velocity_fps", "name" },
                values: new object[,]
                {
                    { 1, 0.11899999999999999, 0.35499999999999998, "FMJ", 95.0, 6.1600000000000001, "Handgun", 955.0, ".380 ACP 95gr FMJ" },
                    { 2, 0.13, 0.35499999999999998, "FMJ", 115.0, 7.4500000000000002, "Handgun", 1180.0, "9mm Luger 115gr FMJ" },
                    { 3, 0.14299999999999999, 0.35499999999999998, "JHP", 124.0, 8.0399999999999991, "Handgun", 1150.0, "9mm Luger 124gr JHP" },
                    { 4, 0.16700000000000001, 0.35499999999999998, "JHP", 147.0, 9.5299999999999994, "Handgun", 990.0, "9mm Luger 147gr JHP" },
                    { 5, 0.14000000000000001, 0.40000000000000002, "FMJ", 165.0, 10.69, "Handgun", 1060.0, ".40 S&W 165gr FMJ" },
                    { 6, 0.155, 0.40000000000000002, "JHP", 180.0, 11.66, "Handgun", 1000.0, ".40 S&W 180gr JHP" },
                    { 7, 0.14499999999999999, 0.45200000000000001, "JHP", 185.0, 11.99, "Handgun", 1050.0, ".45 ACP 185gr JHP" },
                    { 8, 0.19500000000000001, 0.45200000000000001, "FMJ", 230.0, 14.9, "Handgun", 830.0, ".45 ACP 230gr FMJ" },
                    { 9, 0.14799999999999999, 0.35699999999999998, "JHP", 125.0, 8.0999999999999996, "Handgun", 1450.0, ".357 Magnum 125gr JHP" },
                    { 10, 0.16400000000000001, 0.35699999999999998, "JSP", 158.0, 10.24, "Handgun", 1235.0, ".357 Magnum 158gr JSP" },
                    { 11, 0.20499999999999999, 0.42999999999999999, "JSP", 240.0, 15.550000000000001, "Handgun", 1350.0, ".44 Magnum 240gr JSP" },
                    { 12, 0.16400000000000001, 0.40000000000000002, "FMJ", 180.0, 11.66, "Handgun", 1200.0, "10mm Auto 180gr FMJ" },
                    { 13, 0.24299999999999999, 0.224, "FMJ", 55.0, 3.5600000000000001, "Intermediate", 3240.0, "5.56 NATO 55gr FMJ (M193)" },
                    { 14, 0.30399999999999999, 0.224, "FMJ", 62.0, 4.0199999999999996, "Intermediate", 3110.0, "5.56 NATO 62gr FMJ (M855)" },
                    { 15, 0.255, 0.224, "Polymer Tip", 55.0, 3.5600000000000001, "Intermediate", 3240.0, ".223 Rem 55gr V-MAX" },
                    { 16, 0.372, 0.224, "BTHP", 77.0, 4.9900000000000002, "Intermediate", 2750.0, ".223 Rem 77gr BTHP" },
                    { 17, 0.31900000000000001, 0.308, "OTM", 125.0, 8.0999999999999996, "Intermediate", 2215.0, ".300 BLK 125gr OTM" },
                    { 18, 0.60799999999999998, 0.308, "SMK", 220.0, 14.26, "Intermediate", 1010.0, ".300 BLK 220gr SMK Subsonic" },
                    { 19, 0.29999999999999999, 0.312, "FMJ", 123.0, 7.9699999999999998, "Intermediate", 2350.0, "7.62x39mm 123gr FMJ" },
                    { 20, 0.40500000000000003, 0.24299999999999999, "SP", 100.0, 6.4800000000000004, "Standard Rifle", 2960.0, ".243 Win 100gr SP" },
                    { 21, 0.58499999999999996, 0.26400000000000001, "ELD Match", 140.0, 9.0700000000000003, "Standard Rifle", 2710.0, "6.5 Creedmoor 140gr ELD Match" },
                    { 22, 0.48599999999999999, 0.26400000000000001, "ELD Match", 120.0, 7.7800000000000002, "Standard Rifle", 2910.0, "6.5 Creedmoor 120gr ELD Match" },
                    { 23, 0.50600000000000001, 0.26400000000000001, "ELD Match", 123.0, 7.9699999999999998, "Standard Rifle", 2580.0, "6.5 Grendel 123gr ELD Match" },
                    { 24, 0.40799999999999997, 0.27700000000000002, "SP", 130.0, 8.4199999999999999, "Standard Rifle", 3060.0, ".270 Win 130gr SP" },
                    { 25, 0.46500000000000002, 0.27700000000000002, "Partition", 150.0, 9.7200000000000006, "Standard Rifle", 2850.0, ".270 Win 150gr Partition" },
                    { 26, 0.61299999999999999, 0.28399999999999997, "ELD-X", 162.0, 10.5, "Standard Rifle", 2940.0, "7mm Rem Mag 162gr ELD-X" },
                    { 27, 0.48499999999999999, 0.28399999999999997, "AccuBond", 140.0, 9.0700000000000003, "Standard Rifle", 3150.0, "7mm Rem Mag 140gr AccuBond" },
                    { 28, 0.22600000000000001, 0.308, "Flat Nose", 150.0, 9.7200000000000006, "Standard Rifle", 2390.0, ".30-30 Win 150gr FN" },
                    { 29, 0.46200000000000002, 0.308, "BTHP", 168.0, 10.890000000000001, "Standard Rifle", 2680.0, ".308 Win 168gr BTHP Match" },
                    { 30, 0.505, 0.308, "SMK", 175.0, 11.34, "Standard Rifle", 2610.0, ".308 Win 175gr SMK" },
                    { 31, 0.38700000000000001, 0.308, "SP", 150.0, 9.7200000000000006, "Standard Rifle", 2820.0, ".308 Win 150gr SP" },
                    { 32, 0.42799999999999999, 0.308, "SP", 165.0, 10.69, "Standard Rifle", 2800.0, ".30-06 Springfield 165gr SP" },
                    { 33, 0.47399999999999998, 0.308, "Partition", 180.0, 11.66, "Standard Rifle", 2700.0, ".30-06 Springfield 180gr Partition" },
                    { 34, 0.39300000000000002, 0.308, "FMJ", 147.0, 9.5299999999999994, "Standard Rifle", 2800.0, "7.62 NATO 147gr FMJ (M80)" },
                    { 35, 0.53300000000000003, 0.308, "BTHP", 190.0, 12.31, "Magnum", 2900.0, ".300 Win Mag 190gr BTHP Match" },
                    { 36, 0.50700000000000001, 0.308, "AccuBond", 180.0, 11.66, "Magnum", 2960.0, ".300 Win Mag 180gr AccuBond" },
                    { 37, 0.629, 0.308, "SMK", 220.0, 14.26, "Magnum", 2680.0, ".300 Win Mag 220gr SMK" },
                    { 38, 0.67500000000000004, 0.33800000000000002, "Scenar", 250.0, 16.199999999999999, "Magnum", 2950.0, ".338 Lapua Mag 250gr Scenar" },
                    { 39, 0.71999999999999997, 0.33800000000000002, "BTHP", 300.0, 19.440000000000001, "Magnum", 2750.0, ".338 Lapua Mag 300gr BTHP" },
                    { 40, 0.55000000000000004, 0.33800000000000002, "AccuBond", 225.0, 14.58, "Magnum", 2785.0, ".338 Win Mag 225gr AccuBond" },
                    { 41, 0.47999999999999998, 0.375, "DGX", 300.0, 19.440000000000001, "Magnum", 2530.0, ".375 H&H Mag 300gr DGX" },
                    { 42, 0.67000000000000004, 0.51000000000000001, "FMJ", 660.0, 42.770000000000003, "Magnum", 2910.0, ".50 BMG 660gr FMJ (M33)" },
                    { 43, 1.05, 0.51000000000000001, "A-MAX", 750.0, 48.600000000000001, "Magnum", 2820.0, ".50 BMG 750gr A-MAX" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cartridges",
                schema: "ballistics");
        }
    }
}
