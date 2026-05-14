using Microsoft.AspNetCore.Localization;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;
using System.Globalization;
using TeploenergetikaKursovaya.Data;
using TeploenergetikaKursovaya.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Add services to the container.
builder.Services.AddControllersWithViews();
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=TeploenergetikaKursovaya.db";
var databaseProvider = builder.Configuration["DatabaseProvider"] ?? "Sqlite";
builder.Services.AddDbContext<TeploDBContext>(o =>
{
    if (databaseProvider.Equals("MySql", StringComparison.OrdinalIgnoreCase)
        || databaseProvider.Equals("MariaDb", StringComparison.OrdinalIgnoreCase))
    {
        o.UseMySql(connectionString, new MariaDbServerVersion(new Version(11, 4, 0)));
        return;
    }

    o.UseSqlite(connectionString);
});
builder.Services.AddScoped<IPressureCalculationService, PressureCalculationService>();

var app = builder.Build();

var culture = new CultureInfo("ru-RU")
{
    NumberFormat = { NumberDecimalSeparator = "." }
};

CultureInfo.DefaultThreadCurrentCulture = culture;
CultureInfo.DefaultThreadCurrentUICulture = culture;
app.UseRequestLocalization(new RequestLocalizationOptions
{
    DefaultRequestCulture = new RequestCulture(culture),
    SupportedCultures = new[] { culture },
    SupportedUICultures = new[] { culture }
});
// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Calc}/{id?}");

EnsureApplicationSchema(app);
EnsureGasReferenceData(app);

app.Run();

static void EnsureGasReferenceData(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<TeploDBContext>();

    if (!context.DotMCs.Any(component =>
            component.ComponentName == "Air" || component.ComponentName == "Воздух"))
    {
        context.DotMCs.Add(new DotMC
        {
            ComponentName = "Air",
            ComponentDensity = 1.293
        });
        context.SaveChanges();
    }
}

static void EnsureApplicationSchema(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<TeploDBContext>();
    if (context.Database.ProviderName?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true)
    {
        context.Database.EnsureCreated();
        SeedReferenceDataFromSqlite(app, context);
        return;
    }

    context.Database.ExecuteSqlRaw("DROP TABLE IF EXISTS Variants;");

    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS RoughnessMaterials (
            Id INTEGER NOT NULL CONSTRAINT PK_RoughnessMaterials PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL
        );
        """);
    context.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_RoughnessMaterials_Name ON RoughnessMaterials (Name);");

    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS RoughnessConditions (
            Id INTEGER NOT NULL CONSTRAINT PK_RoughnessConditions PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL
        );
        """);
    context.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_RoughnessConditions_Name ON RoughnessConditions (Name);");

    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS Roughnesses (
            Id INTEGER NOT NULL CONSTRAINT PK_Roughnesses PRIMARY KEY AUTOINCREMENT,
            MaterialId INTEGER NOT NULL,
            SurfaceConditionId INTEGER NOT NULL,
            ReferenceValue TEXT NOT NULL,
            CONSTRAINT FK_Roughnesses_RoughnessMaterials_MaterialId FOREIGN KEY (MaterialId) REFERENCES RoughnessMaterials (Id) ON DELETE RESTRICT,
            CONSTRAINT FK_Roughnesses_RoughnessConditions_SurfaceConditionId FOREIGN KEY (SurfaceConditionId) REFERENCES RoughnessConditions (Id) ON DELETE RESTRICT
        );
        """);
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_Roughnesses_MaterialId ON Roughnesses (MaterialId);");
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_Roughnesses_SurfaceConditionId ON Roughnesses (SurfaceConditionId);");
    context.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_Roughnesses_MaterialId_SurfaceConditionId ON Roughnesses (MaterialId, SurfaceConditionId);");

    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS AppUsers (
            Id INTEGER NOT NULL CONSTRAINT PK_AppUsers PRIMARY KEY AUTOINCREMENT,
            Login TEXT NOT NULL,
            PasswordHash TEXT NOT NULL,
            PasswordSalt TEXT NOT NULL,
            RegisteredAtUtc TEXT NOT NULL,
            LastLoginAtUtc TEXT NULL
        );
        """);
    context.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_AppUsers_Login ON AppUsers (Login);");

    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS UserSessions (
            Id INTEGER NOT NULL CONSTRAINT PK_UserSessions PRIMARY KEY AUTOINCREMENT,
            UserId INTEGER NOT NULL,
            TokenHash TEXT NOT NULL,
            CreatedAtUtc TEXT NOT NULL,
            ExpiresAtUtc TEXT NOT NULL,
            CONSTRAINT FK_UserSessions_AppUsers_UserId FOREIGN KEY (UserId) REFERENCES AppUsers (Id) ON DELETE CASCADE
        );
        """);
    context.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_UserSessions_TokenHash ON UserSessions (TokenHash);");
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_UserSessions_UserId ON UserSessions (UserId);");

    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS UserPresets (
            Id INTEGER NOT NULL CONSTRAINT PK_UserPresets PRIMARY KEY AUTOINCREMENT,
            UserId INTEGER NOT NULL,
            SavedCalculationId INTEGER NULL,
            Name TEXT NOT NULL,
            IsTemplate INTEGER NOT NULL DEFAULT 1,
            CreatedAtUtc TEXT NOT NULL,
            UpdatedAtUtc TEXT NOT NULL,
            CONSTRAINT FK_UserPresets_AppUsers_UserId FOREIGN KEY (UserId) REFERENCES AppUsers (Id) ON DELETE CASCADE,
            CONSTRAINT FK_UserPresets_SavedCalculations_SavedCalculationId FOREIGN KEY (SavedCalculationId) REFERENCES SavedCalculations (Id) ON DELETE CASCADE
        );
        """);
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_UserPresets_UserId ON UserPresets (UserId);");
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_UserPresets_SavedCalculationId ON UserPresets (SavedCalculationId);");
    context.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_UserPresets_UserId_Name ON UserPresets (UserId, Name);");

    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS SavedCalculations (
            Id INTEGER NOT NULL CONSTRAINT PK_SavedCalculations PRIMARY KEY AUTOINCREMENT,
            UserId INTEGER NOT NULL,
            Name TEXT NOT NULL,
            IsTemplate INTEGER NOT NULL,
            CreatedAtUtc TEXT NOT NULL,
            UpdatedAtUtc TEXT NOT NULL,
            CONSTRAINT FK_SavedCalculations_AppUsers_UserId FOREIGN KEY (UserId) REFERENCES AppUsers (Id) ON DELETE CASCADE
        );
        """);
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_SavedCalculations_UserId ON SavedCalculations (UserId);");

    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS SavedCalculationInputs (
            Id INTEGER NOT NULL CONSTRAINT PK_SavedCalculationInputs PRIMARY KEY AUTOINCREMENT,
            SavedCalculationId INTEGER NOT NULL,
            TgasInitial REAL NOT NULL,
            TgasInitialUnit TEXT NOT NULL,
            TemperatureLossPerMeter REAL NOT NULL,
            GasFlow REAL NOT NULL,
            GasFlowUnit TEXT NOT NULL,
            RoughnessId INTEGER NULL,
            UseCustomRoughness INTEGER NOT NULL,
            CustomRoughness REAL NULL,
            CustomRoughnessUnit TEXT NOT NULL,
            UseGeometricPressure INTEGER NOT NULL,
            AmbientAirTemperature REAL NULL,
            AmbientAirTemperatureUnit TEXT NOT NULL,
            AirDensityAtNormalConditions REAL NOT NULL,
            Y_N2 REAL NULL,
            Y_N2Unit TEXT NOT NULL,
            Y_O2 REAL NULL,
            Y_O2Unit TEXT NOT NULL,
            Y_CO2 REAL NULL,
            Y_CO2Unit TEXT NOT NULL,
            Y_H2O REAL NULL,
            Y_H2OUnit TEXT NOT NULL,
            CONSTRAINT FK_SavedCalculationInputs_SavedCalculations_SavedCalculationId FOREIGN KEY (SavedCalculationId) REFERENCES SavedCalculations (Id) ON DELETE CASCADE,
            CONSTRAINT FK_SavedCalculationInputs_Roughnesses_RoughnessId FOREIGN KEY (RoughnessId) REFERENCES Roughnesses (Id) ON DELETE RESTRICT
        );
        """);
    context.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_SavedCalculationInputs_SavedCalculationId ON SavedCalculationInputs (SavedCalculationId);");
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_SavedCalculationInputs_RoughnessId ON SavedCalculationInputs (RoughnessId);");

    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS SavedCalculationSummaries (
            Id INTEGER NOT NULL CONSTRAINT PK_SavedCalculationSummaries PRIMARY KEY AUTOINCREMENT,
            SavedCalculationId INTEGER NOT NULL,
            TotalPressureDrop REAL NOT NULL,
            FrictionLoss REAL NOT NULL,
            LocalLoss REAL NOT NULL,
            GeometricLoss REAL NOT NULL,
            TotalRouteLength REAL NOT NULL,
            TotalHeightChange REAL NOT NULL,
            AverageVelocity REAL NOT NULL,
            MaxVelocity REAL NOT NULL,
            AmbientAirDensity REAL NOT NULL,
            CriticalSectionName TEXT NOT NULL,
            CriticalSectionLoss REAL NOT NULL,
            EfficiencyLabel TEXT NOT NULL,
            CONSTRAINT FK_SavedCalculationSummaries_SavedCalculations_SavedCalculationId FOREIGN KEY (SavedCalculationId) REFERENCES SavedCalculations (Id) ON DELETE CASCADE
        );
        """);
    context.Database.ExecuteSqlRaw("CREATE UNIQUE INDEX IF NOT EXISTS IX_SavedCalculationSummaries_SavedCalculationId ON SavedCalculationSummaries (SavedCalculationId);");

    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS SavedCalculationSections (
            Id INTEGER NOT NULL CONSTRAINT PK_SavedCalculationSections PRIMARY KEY AUTOINCREMENT,
            SavedCalculationId INTEGER NOT NULL,
            SortOrder INTEGER NOT NULL,
            SectionKind TEXT NOT NULL,
            CrossSectionShape TEXT NOT NULL,
            OutletCrossSectionShape TEXT NOT NULL,
            BlockTitle TEXT NULL,
            Diameter REAL NULL,
            DiameterUnit TEXT NOT NULL,
            DiameterB REAL NULL,
            DiameterBUnit TEXT NOT NULL,
            OutletDiameter REAL NULL,
            OutletDiameterUnit TEXT NOT NULL,
            OutletDiameterB REAL NULL,
            OutletDiameterBUnit TEXT NOT NULL,
            Length REAL NULL,
            LengthUnit TEXT NOT NULL,
            TemperatureLossPerMeter REAL NULL,
            TemperatureLossUnit TEXT NOT NULL,
            TurnAngle REAL NULL,
            TurnAngleUnit TEXT NOT NULL,
            HeightDelta REAL NOT NULL,
            HeightDeltaUnit TEXT NOT NULL,
            LocalResistanceId INTEGER NULL,
            LocalResistanceParamX REAL NULL,
            LocalResistanceParamY REAL NULL,
            CustomLRC REAL NULL,
            UseCustomLRC INTEGER NOT NULL,
            UseIndividualMaterial INTEGER NOT NULL,
            RoughnessId INTEGER NULL,
            UseCustomRoughness INTEGER NOT NULL,
            CustomRoughness REAL NULL,
            CustomRoughnessUnit TEXT NOT NULL,
            CONSTRAINT FK_SavedCalculationSections_SavedCalculations_SavedCalculationId FOREIGN KEY (SavedCalculationId) REFERENCES SavedCalculations (Id) ON DELETE CASCADE,
            CONSTRAINT FK_SavedCalculationSections_LRCs_LocalResistanceId FOREIGN KEY (LocalResistanceId) REFERENCES LRCs (Id) ON DELETE RESTRICT,
            CONSTRAINT FK_SavedCalculationSections_Roughnesses_RoughnessId FOREIGN KEY (RoughnessId) REFERENCES Roughnesses (Id) ON DELETE RESTRICT
        );
        """);
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_SavedCalculationSections_SavedCalculationId ON SavedCalculationSections (SavedCalculationId);");
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_SavedCalculationSections_LocalResistanceId ON SavedCalculationSections (LocalResistanceId);");
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_SavedCalculationSections_RoughnessId ON SavedCalculationSections (RoughnessId);");

    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS SavedCalculationResults (
            Id INTEGER NOT NULL CONSTRAINT PK_SavedCalculationResults PRIMARY KEY AUTOINCREMENT,
            SavedCalculationId INTEGER NOT NULL,
            SectionNumber INTEGER NOT NULL,
            SectionName TEXT NOT NULL,
            SectionType TEXT NOT NULL,
            CrossSectionShape TEXT NOT NULL,
            OutletCrossSectionShape TEXT NOT NULL,
            RoughnessId INTEGER NULL,
            Length REAL NOT NULL,
            Diameter REAL NOT NULL,
            DiameterB REAL NOT NULL,
            OutletDiameter REAL NOT NULL,
            OutletDiameterB REAL NOT NULL,
            EquivalentDiameter REAL NOT NULL,
            OutletEquivalentDiameter REAL NOT NULL,
            CrossSectionArea REAL NOT NULL,
            HeightDelta REAL NOT NULL,
            Roughness REAL NOT NULL,
            AverageTemperature REAL NOT NULL,
            InletTemperature REAL NOT NULL,
            OutletTemperature REAL NOT NULL,
            GasDensity REAL NOT NULL,
            AmbientAirDensity REAL NOT NULL,
            FlowVelocity REAL NOT NULL,
            Re REAL NOT NULL,
            Lambda REAL NOT NULL,
            Zeta REAL NOT NULL,
            PressureDropFriction REAL NOT NULL,
            PressureDropLocal REAL NOT NULL,
            GeometricPressureDrop REAL NOT NULL,
            TotalPressureDrop REAL NOT NULL,
            DominantLossType TEXT NOT NULL,
            CONSTRAINT FK_SavedCalculationResults_SavedCalculations_SavedCalculationId FOREIGN KEY (SavedCalculationId) REFERENCES SavedCalculations (Id) ON DELETE CASCADE,
            CONSTRAINT FK_SavedCalculationResults_Roughnesses_RoughnessId FOREIGN KEY (RoughnessId) REFERENCES Roughnesses (Id) ON DELETE RESTRICT
        );
        """);
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_SavedCalculationResults_SavedCalculationId ON SavedCalculationResults (SavedCalculationId);");
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_SavedCalculationResults_RoughnessId ON SavedCalculationResults (RoughnessId);");

    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS SavedCalculationRecommendations (
            Id INTEGER NOT NULL CONSTRAINT PK_SavedCalculationRecommendations PRIMARY KEY AUTOINCREMENT,
            SavedCalculationId INTEGER NOT NULL,
            SortOrder INTEGER NOT NULL,
            Title TEXT NOT NULL,
            Description TEXT NOT NULL,
            Priority TEXT NOT NULL,
            ImpactText TEXT NOT NULL,
            EstimatedSavingPa REAL NOT NULL,
            CONSTRAINT FK_SavedCalculationRecommendations_SavedCalculations_SavedCalculationId FOREIGN KEY (SavedCalculationId) REFERENCES SavedCalculations (Id) ON DELETE CASCADE
        );
        """);
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_SavedCalculationRecommendations_SavedCalculationId ON SavedCalculationRecommendations (SavedCalculationId);");

    context.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS SavedCalculationNotices (
            Id INTEGER NOT NULL CONSTRAINT PK_SavedCalculationNotices PRIMARY KEY AUTOINCREMENT,
            SavedCalculationId INTEGER NOT NULL,
            SortOrder INTEGER NOT NULL,
            Text TEXT NOT NULL,
            CONSTRAINT FK_SavedCalculationNotices_SavedCalculations_SavedCalculationId FOREIGN KEY (SavedCalculationId) REFERENCES SavedCalculations (Id) ON DELETE CASCADE
        );
        """);
    context.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_SavedCalculationNotices_SavedCalculationId ON SavedCalculationNotices (SavedCalculationId);");
}

static void SeedReferenceDataFromSqlite(WebApplication app, TeploDBContext targetContext)
{
    if (targetContext.LRCs.Any()
        && targetContext.KVoAs.Any()
        && targetContext.DotMCs.Any()
        && targetContext.RoughnessMaterials.Any()
        && targetContext.RoughnessConditions.Any()
        && targetContext.Roughnesses.Any())
    {
        return;
    }

    var seedPath = app.Configuration["DatabaseSeed:SqlitePath"]
        ?? Path.Combine(app.Environment.ContentRootPath, "seed", "TeploenergetikaKursovaya.db");

    if (!File.Exists(seedPath))
    {
        app.Logger.LogWarning("SQLite seed database was not found at {SeedPath}. MariaDB reference tables were created empty.", seedPath);
        return;
    }

    using var sourceConnection = new SqliteConnection($"Data Source={seedPath}");
    sourceConnection.Open();

    using var transaction = targetContext.Database.BeginTransaction();
    if (!targetContext.LRCs.Any())
    {
        targetContext.LRCs.AddRange(ReadLrcs(sourceConnection));
    }

    if (!targetContext.KVoAs.Any())
    {
        targetContext.KVoAs.AddRange(ReadKvoas(sourceConnection));
    }

    if (!targetContext.DotMCs.Any())
    {
        targetContext.DotMCs.AddRange(ReadDotMcs(sourceConnection));
    }

    if (!targetContext.RoughnessMaterials.Any())
    {
        targetContext.RoughnessMaterials.AddRange(ReadRoughnessMaterials(sourceConnection));
    }

    if (!targetContext.RoughnessConditions.Any())
    {
        targetContext.RoughnessConditions.AddRange(ReadRoughnessConditions(sourceConnection));
    }

    targetContext.SaveChanges();

    if (!targetContext.ResistanceDataPoints.Any() && targetContext.LRCs.Any())
    {
        targetContext.ResistanceDataPoints.AddRange(ReadResistanceDataPoints(sourceConnection));
    }

    if (!targetContext.Roughnesses.Any()
        && targetContext.RoughnessMaterials.Any()
        && targetContext.RoughnessConditions.Any())
    {
        targetContext.Roughnesses.AddRange(ReadRoughnesses(sourceConnection));
    }

    targetContext.SaveChanges();
    transaction.Commit();
}

static List<LRC> ReadLrcs(SqliteConnection connection)
{
    using var command = connection.CreateCommand();
    command.CommandText = "SELECT Id, TypeofLR, ValueofLR, IsTabular FROM LRCs ORDER BY Id;";
    using var reader = command.ExecuteReader();
    var items = new List<LRC>();

    while (reader.Read())
    {
        items.Add(new LRC
        {
            Id = reader.GetInt32(0),
            TypeofLR = reader.GetString(1),
            ValueofLR = ReadNullableDouble(reader, 2),
            IsTabular = ReadBool(reader, 3)
        });
    }

    return items;
}

static List<ResistanceDataPoint> ReadResistanceDataPoints(SqliteConnection connection)
{
    using var command = connection.CreateCommand();
    command.CommandText = "SELECT Id, ResistanceId, ParamX, ParamY, ZetaValue FROM ResistanceDataPoints ORDER BY Id;";
    using var reader = command.ExecuteReader();
    var items = new List<ResistanceDataPoint>();

    while (reader.Read())
    {
        items.Add(new ResistanceDataPoint
        {
            Id = reader.GetInt32(0),
            ResistanceId = reader.GetInt32(1),
            ParamX = ReadDouble(reader, 2),
            ParamY = ReadDouble(reader, 3),
            ZetaValue = ReadDouble(reader, 4)
        });
    }

    return items;
}

static List<KVoA> ReadKvoas(SqliteConnection connection)
{
    using var command = connection.CreateCommand();
    command.CommandText = "SELECT Id, GasTemperature, KinematicViscosity FROM KVoAs ORDER BY Id;";
    using var reader = command.ExecuteReader();
    var items = new List<KVoA>();

    while (reader.Read())
    {
        items.Add(new KVoA
        {
            Id = reader.GetInt32(0),
            GasTemperature = Convert.ToInt32(reader.GetValue(1), CultureInfo.InvariantCulture),
            KinematicViscosity = ReadDouble(reader, 2)
        });
    }

    return items;
}

static List<DotMC> ReadDotMcs(SqliteConnection connection)
{
    using var command = connection.CreateCommand();
    command.CommandText = "SELECT Id, ComponentName, ComponentDensity FROM DotMCs ORDER BY Id;";
    using var reader = command.ExecuteReader();
    var items = new List<DotMC>();

    while (reader.Read())
    {
        items.Add(new DotMC
        {
            Id = reader.GetInt32(0),
            ComponentName = reader.IsDBNull(1) ? null : reader.GetString(1),
            ComponentDensity = ReadDouble(reader, 2)
        });
    }

    return items;
}

static List<RoughnessMaterial> ReadRoughnessMaterials(SqliteConnection connection)
{
    using var command = connection.CreateCommand();
    command.CommandText = "SELECT Id, Name FROM RoughnessMaterials ORDER BY Id;";
    using var reader = command.ExecuteReader();
    var items = new List<RoughnessMaterial>();

    while (reader.Read())
    {
        items.Add(new RoughnessMaterial
        {
            Id = reader.GetInt32(0),
            Name = reader.GetString(1)
        });
    }

    return items;
}

static List<RoughnessCondition> ReadRoughnessConditions(SqliteConnection connection)
{
    using var command = connection.CreateCommand();
    command.CommandText = "SELECT Id, Name FROM RoughnessConditions ORDER BY Id;";
    using var reader = command.ExecuteReader();
    var items = new List<RoughnessCondition>();

    while (reader.Read())
    {
        items.Add(new RoughnessCondition
        {
            Id = reader.GetInt32(0),
            Name = reader.GetString(1)
        });
    }

    return items;
}

static List<Roughness> ReadRoughnesses(SqliteConnection connection)
{
    using var command = connection.CreateCommand();
    command.CommandText = "SELECT Id, MaterialId, SurfaceConditionId, ReferenceValue FROM Roughnesses ORDER BY Id;";
    using var reader = command.ExecuteReader();
    var items = new List<Roughness>();

    while (reader.Read())
    {
        items.Add(new Roughness
        {
            Id = reader.GetInt32(0),
            MaterialId = reader.GetInt32(1),
            SurfaceConditionId = reader.GetInt32(2),
            ReferenceValue = reader.GetString(3)
        });
    }

    return items;
}

static double ReadDouble(SqliteDataReader reader, int ordinal)
{
    return Convert.ToDouble(reader.GetValue(ordinal), CultureInfo.InvariantCulture);
}

static double? ReadNullableDouble(SqliteDataReader reader, int ordinal)
{
    return reader.IsDBNull(ordinal)
        ? null
        : Convert.ToDouble(reader.GetValue(ordinal), CultureInfo.InvariantCulture);
}

static bool ReadBool(SqliteDataReader reader, int ordinal)
{
    return !reader.IsDBNull(ordinal) && Convert.ToBoolean(reader.GetValue(ordinal), CultureInfo.InvariantCulture);
}
