using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using TeploenergetikaKursovaya.Data;
using TeploenergetikaKursovaya.Models;
using TeploenergetikaKursovaya.Services;

namespace TeploenergetikaKursovaya.Controllers;

public class HomeController : Controller
{
    private const string AuthCookieName = "teplo_auth";

    private readonly ILogger<HomeController> _logger;
    private readonly TeploDBContext _context;
    private readonly IPressureCalculationService _calculationService;

    public HomeController(
        ILogger<HomeController> logger,
        TeploDBContext context,
        IPressureCalculationService calculationService)
    {
        _logger = logger;
        _context = context;
        _calculationService = calculationService;
    }

    [HttpGet]
    public JsonResult GetConditionsForMaterial(string material)
    {
        var conditions = RoughnessCatalogQuery()
            .Where(r => r.Material != null && r.Material.Name == material)
            .Select(r => r.SurfaceCondition!.Name)
            .Distinct()
            .OrderBy(x => x)
            .ToList();

        return Json(conditions);
    }

    [HttpGet]
    public JsonResult GetMaterialsForCondition(string condition)
    {
        var materials = RoughnessCatalogQuery()
            .Where(r => r.SurfaceCondition != null && r.SurfaceCondition.Name == condition)
            .Select(r => r.Material!.Name)
            .Distinct()
            .OrderBy(x => x)
            .ToList();

        return Json(materials);
    }

    [HttpGet]
    public IActionResult AuthState()
    {
        var user = GetCurrentUser();
        return Json(new
        {
            isAuthenticated = user is not null,
            login = user?.Login,
            presets = BuildPresetList(user?.Id),
            calculations = user is null ? new List<SavedCalculationListItemViewModel>() : BuildCalculationList(user.Id)
        });
    }

    [HttpPost]
    public IActionResult Register([FromBody] AuthRequest request)
    {
        var validation = ValidateAuthRequest(request);
        if (validation is not null)
        {
            return BadRequest(new { error = validation });
        }

        var login = request.Login.Trim();
        if (_context.AppUsers.Any(user => user.Login == login))
        {
            return BadRequest(new { error = "Пользователь с таким логином уже существует." });
        }

        CreatePasswordHash(request.Password, out var hash, out var salt);
        var now = DateTime.UtcNow;
        var user = new AppUser
        {
            Login = login,
            PasswordHash = hash,
            PasswordSalt = salt,
            RegisteredAtUtc = now,
            LastLoginAtUtc = now
        };

        _context.AppUsers.Add(user);
        _context.SaveChanges();
        SignIn(user);
        SyncGuestPresetsInternal(user.Id, request.GuestPresets);

        return Json(new
        {
            success = true,
            login = user.Login,
            presets = BuildPresetList(user.Id),
            calculations = BuildCalculationList(user.Id)
        });
    }

    [HttpPost]
    public IActionResult Login([FromBody] AuthRequest request)
    {
        var validation = ValidateAuthRequest(request);
        if (validation is not null)
        {
            return BadRequest(new { error = validation });
        }

        var login = request.Login.Trim();
        var user = _context.AppUsers.FirstOrDefault(item => item.Login == login);
        if (user is null || !VerifyPassword(request.Password, user.PasswordSalt, user.PasswordHash))
        {
            return BadRequest(new { error = "Неверный логин или пароль." });
        }

        user.LastLoginAtUtc = DateTime.UtcNow;
        _context.SaveChanges();
        SignIn(user);
        SyncGuestPresetsInternal(user.Id, request.GuestPresets);

        return Json(new
        {
            success = true,
            login = user.Login,
            presets = BuildPresetList(user.Id),
            calculations = BuildCalculationList(user.Id)
        });
    }

    [HttpPost]
    public IActionResult Logout()
    {
        var token = Request.Cookies[AuthCookieName];
        if (!string.IsNullOrWhiteSpace(token))
        {
            var tokenHash = HashToken(token);
            var session = _context.UserSessions.FirstOrDefault(item => item.TokenHash == tokenHash);
            if (session is not null)
            {
                _context.UserSessions.Remove(session);
                _context.SaveChanges();
            }
        }

        Response.Cookies.Delete(AuthCookieName);
        return Json(new { success = true });
    }

    [HttpGet]
    public IActionResult GetPresets()
    {
        return Json(BuildPresetList(GetCurrentUser()?.Id));
    }

    [HttpGet]
    public IActionResult GetPreset(int id)
    {
        var user = GetCurrentUser();
        if (user is null)
        {
            return Unauthorized(new { error = "Для доступа к серверным заготовкам войдите в аккаунт." });
        }

        var preset = _context.UserPresets.FirstOrDefault(x => x.Id == id && x.UserId == user.Id);
        if (preset is null)
        {
            return NotFound(new { error = "Заготовка не найдена." });
        }

        if (!preset.SavedCalculationId.HasValue)
        {
            return NotFound(new { error = "РЈ Р·Р°РіРѕС‚РѕРІРєРё РЅРµС‚ СЃРІСЏР·Р°РЅРЅРѕРіРѕ СЂР°СЃС‡РµС‚Р°." });
        }

        var model = LoadCalculationInput(user.Id, preset.SavedCalculationId.Value);
        if (model is null)
        {
            return NotFound(new { error = "Р Р°СЃС‡РµС‚ РґР»СЏ Р·Р°РіРѕС‚РѕРІРєРё РЅРµ РЅР°Р№РґРµРЅ." });
        }

        PopulateCatalogs(model);
        EnsureEditorDefaults(model, ensureDefaultSection: false);

        return Json(new
        {
            id = preset.Id,
            name = preset.Name,
            model
        });
    }

    [HttpPost]
    public IActionResult SavePreset([FromBody] UserPresetSaveRequest request)
    {
        var user = GetCurrentUser();
        if (user is null)
        {
            return Unauthorized(new { error = "Гостевые заготовки сохраняются в браузере. Войдите, чтобы сохранить их в базе данных." });
        }

        if (request is null || string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { error = "Укажите название заготовки." });
        }

        var model = request.Model ?? new CalcViewModel();
        PopulateCatalogs(model);
        NormalizeEditorModel(model);
        UpdateHeightSummary(model);

        var existing = _context.UserPresets.FirstOrDefault(x => x.UserId == user.Id && x.Name == request.Name.Trim());
        var response = _calculationService.Calculate(model);
        if (!response.Success)
        {
            return BadRequest(new { error = response.ErrorMessage ?? "Не удалось сохранить заготовку: расчет не выполнен." });
        }

        var calculationId = SaveCalculationForUser(
            user.Id,
            request.Name.Trim(),
            model,
            response,
            existing?.SavedCalculationId,
            isTemplate: true);

        existing = _context.UserPresets.FirstOrDefault(x => x.UserId == user.Id && x.SavedCalculationId == calculationId);

        return Json(new
        {
            success = true,
            presetId = existing?.Id,
            presets = BuildPresetList(user.Id)
        });
    }

    [HttpPost]
    public IActionResult DeletePreset(int id)
    {
        var user = GetCurrentUser();
        if (user is null)
        {
            return Unauthorized(new { error = "Для удаления серверных заготовок войдите в аккаунт." });
        }

        var preset = _context.UserPresets.FirstOrDefault(x => x.Id == id && x.UserId == user.Id);
        if (preset is null)
        {
            return NotFound(new { error = "Заготовка не найдена." });
        }

        if (preset.SavedCalculationId.HasValue)
        {
            var calculation = _context.SavedCalculations.FirstOrDefault(item =>
                item.Id == preset.SavedCalculationId.Value &&
                item.UserId == user.Id);
            if (calculation is not null)
            {
                calculation.IsTemplate = false;
                calculation.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        _context.UserPresets.Remove(preset);
        _context.SaveChanges();

        return Json(new
        {
            success = true,
            presets = BuildPresetList(user.Id)
        });
    }

    [HttpGet]
    public IActionResult Calc(int? calculationId, int? repeatCalculationId)
    {
        var user = GetCurrentUser();
        var sourceId = calculationId ?? repeatCalculationId;
        var model = sourceId.HasValue && user is not null
            ? LoadCalculationInput(user.Id, sourceId.Value) ?? new CalcViewModel()
            : new CalcViewModel();

        if (calculationId.HasValue && user is not null && model.CurrentCalculationId.HasValue)
        {
            model.CurrentCalculationId = calculationId.Value;
        }
        else
        {
            model.CurrentCalculationId = null;
        }

        if (repeatCalculationId.HasValue)
        {
            model.CurrentCalculationName = null;
        }

        PopulateCatalogs(model);
        EnsureEditorDefaults(model);
        model.SavedPresets = BuildPresetList(user?.Id);
        return View(model);
    }

    [HttpPost]
    public IActionResult Preview(CalcViewModel model)
    {
        PopulateCatalogs(model);
        NormalizeEditorModel(model);

        if (!ModelState.IsValid)
        {
            return BadRequest(new { errors = CollectErrors() });
        }

        UpdateHeightSummary(model);
        var response = _calculationService.Calculate(model);

        if (!response.Success)
        {
            return BadRequest(new { errors = new[] { response.ErrorMessage } });
        }

        return Json(response);
    }

    [HttpPost]
    public IActionResult Calc(CalcViewModel model)
    {
        var user = GetCurrentUser();
        PopulateCatalogs(model);
        NormalizeEditorModel(model);
        model.SavedPresets = BuildPresetList(user?.Id);

        if (!ModelState.IsValid)
        {
            return View(model);
        }

        UpdateHeightSummary(model);
        var response = _calculationService.Calculate(model);

        if (!response.Success)
        {
            ModelState.AddModelError(string.Empty, response.ErrorMessage ?? "Не удалось выполнить расчёт.");
            return View(model);
        }

        var calculationName = ResolveCalculationName(user?.Id, model);
        int? savedCalculationId = null;
        if (user is not null)
        {
            savedCalculationId = SaveCalculationForUser(
                user.Id,
                calculationName,
                model,
                response,
                model.CurrentCalculationId,
                isTemplate: false);
        }

        return View("Results", new CalcPageViewModel
        {
            Input = CreateStorageCopy(model),
            Summary = response.Summary,
            Results = response.Results,
            Recommendations = response.Recommendations,
            Notices = response.Notices,
            IsAuthenticated = user is not null,
            UserLogin = user?.Login,
            SavedCalculationId = savedCalculationId,
            CalculationName = calculationName
        });
    }

    [HttpPost]
    public IActionResult SaveCalculation([FromBody] CalculationSaveRequest request)
    {
        var user = GetCurrentUser();
        if (user is null)
        {
            return Unauthorized(new { error = "Для сохранения расчета войдите или зарегистрируйтесь." });
        }

        if (request is null)
        {
            return BadRequest(new { error = "Нет данных расчета." });
        }

        var model = request.Model ?? new CalcViewModel();
        PopulateCatalogs(model);
        NormalizeEditorModel(model);
        if (request.Repeat)
        {
            model.CurrentCalculationId = null;
            model.CurrentCalculationName = null;
        }

        UpdateHeightSummary(model);

        if (!TryValidateModel(model))
        {
            return BadRequest(new { error = CollectErrors().FirstOrDefault() ?? "Проверьте исходные данные." });
        }

        var response = _calculationService.Calculate(model);
        if (!response.Success)
        {
            return BadRequest(new { error = response.ErrorMessage ?? "Не удалось выполнить расчет." });
        }

        var name = request.Repeat || string.IsNullOrWhiteSpace(request.Name)
            ? ResolveCalculationName(user.Id, model)
            : request.Name.Trim();
        var id = SaveCalculationForUser(
            user.Id,
            name,
            model,
            response,
            request.Repeat ? null : request.CalculationId,
            request.IsTemplate);

        return Json(new
        {
            success = true,
            calculationId = id,
            calculations = BuildCalculationList(user.Id),
            presets = BuildPresetList(user.Id)
        });
    }

    [HttpGet]
    public IActionResult MyCalculations(string? search, string? templateFilter, string? sort)
    {
        var user = GetCurrentUser();
        if (user is null)
        {
            return RedirectToAction(nameof(Calc));
        }

        var normalizedTemplateFilter = NormalizeTemplateFilter(templateFilter);
        var normalizedSort = NormalizeCalculationSort(sort);

        return View(new MyCalculationsViewModel
        {
            UserLogin = user.Login,
            Search = search?.Trim() ?? string.Empty,
            TemplateFilter = normalizedTemplateFilter,
            Sort = normalizedSort,
            Calculations = BuildCalculationList(user.Id, search, normalizedTemplateFilter, normalizedSort)
        });
    }

    [HttpPost]
    public IActionResult RenameCalculation(int id, string name, string? search, string? templateFilter, string? sort)
    {
        var user = GetCurrentUser();
        if (user is null)
        {
            return RedirectToAction(nameof(Calc));
        }

        var calculation = _context.SavedCalculations.FirstOrDefault(item => item.Id == id && item.UserId == user.Id);
        if (calculation is null)
        {
            return NotFound("Расчет не найден.");
        }

        var normalizedName = BuildUniqueCalculationName(user.Id, name, calculation.Id);
        calculation.Name = normalizedName;
        calculation.UpdatedAtUtc = DateTime.UtcNow;

        if (calculation.IsTemplate)
        {
            UpsertPresetFromCalculation(calculation);
        }

        _context.SaveChanges();

        return RedirectToAction(nameof(MyCalculations), new
        {
            search,
            templateFilter = NormalizeTemplateFilter(templateFilter),
            sort = NormalizeCalculationSort(sort)
        });
    }

    [HttpGet]
    public IActionResult CalculationResult(int id)
    {
        var user = GetCurrentUser();
        if (user is null)
        {
            return RedirectToAction(nameof(Calc));
        }

        var calculation = LoadSavedCalculation(user.Id, id);
        if (calculation is null)
        {
            return NotFound("Расчет не найден.");
        }

        return View("Results", BuildResultPage(calculation, user));
    }

    [HttpPost]
    public IActionResult ToggleCalculationTemplate(int id, string? search, string? templateFilter, string? sort)
    {
        var user = GetCurrentUser();
        if (user is null)
        {
            return Unauthorized(new { error = "Войдите в аккаунт." });
        }

        var calculation = _context.SavedCalculations.FirstOrDefault(item => item.Id == id && item.UserId == user.Id);
        if (calculation is null)
        {
            return NotFound(new { error = "Расчет не найден." });
        }

        calculation.IsTemplate = !calculation.IsTemplate;
        calculation.UpdatedAtUtc = DateTime.UtcNow;
        UpsertPresetFromCalculation(calculation);
        _context.SaveChanges();

        if (Request.Headers.Accept.Any(value => value?.Contains("text/html", StringComparison.OrdinalIgnoreCase) == true))
        {
            return RedirectToAction(nameof(MyCalculations), new
            {
                search,
                templateFilter = NormalizeTemplateFilter(templateFilter),
                sort = NormalizeCalculationSort(sort)
            });
        }

        return Json(new
        {
            success = true,
            isTemplate = calculation.IsTemplate,
            presets = BuildPresetList(user.Id),
            calculations = BuildCalculationList(user.Id)
        });
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }

    private IQueryable<Roughness> RoughnessCatalogQuery() =>
        _context.Roughnesses
            .Include(r => r.Material)
            .Include(r => r.SurfaceCondition);

    private void PopulateCatalogs(CalcViewModel model)
    {
        var roughnessEntries = RoughnessCatalogQuery().ToList();
        model.AirDensityAtNormalConditions = _context.DotMCs
            .Where(component => component.ComponentName == "Air" || component.ComponentName == "Воздух")
            .Select(component => component.ComponentDensity)
            .FirstOrDefault();
        if (model.AirDensityAtNormalConditions <= 0)
        {
            model.AirDensityAtNormalConditions = 1.293;
        }
        model.AmbientAirDensity = CalculateAmbientAirDensity(
            model.AmbientAirTemperature ?? 20,
            model.AirDensityAtNormalConditions);

        model.Materials = roughnessEntries
            .Select(r => r.Type)
            .Distinct()
            .OrderBy(x => x)
            .ToList();

        model.MaterialCatalog = roughnessEntries
            .GroupBy(r => r.Type)
            .ToDictionary(
                group => group.Key,
                group => group
                    .Select(x => x.Condition)
                    .Distinct()
                    .OrderBy(x => x)
                    .ToList(),
                StringComparer.OrdinalIgnoreCase);

        model.RoughnessCatalog = roughnessEntries
            .OrderBy(r => r.Id)
            .Select(r => new MaterialRoughnessCatalogItemViewModel
            {
                Type = r.Type,
                Condition = r.Condition,
                ReferenceValue = r.ReferenceValue,
                EquivalentRoughness = r.EquivalentRoughness
            })
            .ToList();

        model.SurfaceConditions = string.IsNullOrWhiteSpace(model.MaterialType)
            ? roughnessEntries
                .Select(r => r.Condition)
                .Distinct()
                .OrderBy(x => x)
                .ToList()
            : GetConditionsForMaterialInternal(model.MaterialType);

        var localResistanceEntries = _context.LRCs
            .Include(l => l.DataPoints)
            .Where(l => !string.IsNullOrWhiteSpace(l.TypeofLR))
            .ToList();

        model.LocalResistanceTypes = localResistanceEntries
            .Select(l => l.TypeofLR.Trim())
            .Distinct()
            .OrderBy(x => x)
            .ToList();

        model.LocalResistanceCatalog = localResistanceEntries
            .GroupBy(l => l.TypeofLR.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group =>
                {
                    var item = group.First();
                    return new LocalResistanceCatalogItemViewModel
                    {
                        DefaultValue = item.ValueofLR,
                        IsTabular = item.IsTabular,
                        Points = item.DataPoints
                            .OrderBy(point => point.ParamY)
                            .ThenBy(point => point.ParamX)
                            .Select(point => new LocalResistanceDataPointViewModel
                            {
                                ParamX = point.ParamX,
                                ParamY = point.ParamY,
                                ZetaValue = point.ZetaValue
                            })
                            .ToList()
                    };
                },
                StringComparer.OrdinalIgnoreCase);
    }

    private void EnsureEditorDefaults(CalcViewModel model, bool ensureDefaultSection = true)
    {
        if (string.IsNullOrWhiteSpace(model.MaterialType))
        {
            model.MaterialType = model.Materials.FirstOrDefault() ?? string.Empty;
        }

        var availableConditions = GetConditionsForMaterialInternal(model.MaterialType);
        model.SurfaceConditions = availableConditions;

        if (string.IsNullOrWhiteSpace(model.SurfaceCondition) || !availableConditions.Contains(model.SurfaceCondition))
        {
            model.SurfaceCondition = availableConditions.FirstOrDefault() ?? string.Empty;
        }

        if (ensureDefaultSection && model.Sections.Count == 0)
        {
            model.Sections.Add(new SectionInput
            {
                BlockTitle = "Входной участок",
                SectionKind = SectionKinds.Straight,
                CrossSectionShape = SectionShapeKinds.Round,
                Length = 12,
                Diameter = 0.9,
                TemperatureLossPerMeter = model.TemperatureLossPerMeter
            });
        }

        foreach (var section in model.Sections)
        {
            section.SectionKind = SectionKinds.Normalize(section.SectionKind);
            section.CrossSectionShape = SectionShapeKinds.Normalize(section.CrossSectionShape);
            section.OutletCrossSectionShape = section.SectionKind is SectionKinds.Contraction or SectionKinds.Expansion
                ? (string.IsNullOrWhiteSpace(section.OutletCrossSectionShape)
                    ? section.CrossSectionShape
                    : SectionShapeKinds.Normalize(section.OutletCrossSectionShape))
                : section.CrossSectionShape;
            NormalizeRoundLocalResistanceGeometry(section);

            section.TemperatureLossPerMeter ??= model.TemperatureLossPerMeter;

            if (section.UseIndividualMaterial)
            {
                section.MaterialType ??= model.MaterialType;
                var sectionConditions = GetConditionsForMaterialInternal(section.MaterialType);
                if (!sectionConditions.Contains(section.SurfaceCondition ?? string.Empty))
                {
                    section.SurfaceCondition = sectionConditions.FirstOrDefault();
                }
            }
        }
    }

    private void NormalizeEditorModel(CalcViewModel model)
    {
        model.Sections = model.Sections
            .Where(section => section is not null)
            .Select(section =>
            {
                section.SectionKind = SectionKinds.Normalize(section.SectionKind);
                section.CrossSectionShape = SectionShapeKinds.Normalize(section.CrossSectionShape);
                section.OutletCrossSectionShape = string.IsNullOrWhiteSpace(section.OutletCrossSectionShape)
                    ? section.CrossSectionShape
                    : SectionShapeKinds.Normalize(section.OutletCrossSectionShape);
                NormalizeRoundLocalResistanceGeometry(section);
                return section;
            })
            .ToList();

        EnsureEditorDefaults(model, ensureDefaultSection: false);
    }

    private List<string> GetConditionsForMaterialInternal(string material) =>
        RoughnessCatalogQuery()
            .Where(r => r.Material != null && r.Material.Name == material)
            .Select(r => r.SurfaceCondition!.Name)
            .Distinct()
            .OrderBy(x => x)
            .ToList();

    private static void NormalizeRoundLocalResistanceGeometry(SectionInput section)
    {
        if (section.SectionKind != SectionKinds.LocalResistance ||
            (!SectionInput.IsConicalCollector(section.LocalResistanceType) &&
             !SectionInput.IsStraightPipeEntrance(section.LocalResistanceType)))
        {
            return;
        }

        section.CrossSectionShape = SectionShapeKinds.Round;
        section.OutletCrossSectionShape = SectionShapeKinds.Round;
        section.DiameterB = null;
        section.OutletDiameterB = null;
    }

    private List<UserPresetListItemViewModel> BuildPresetList(int? userId)
    {
        if (!userId.HasValue)
        {
            return [];
        }

        return _context.UserPresets
            .Where(x => x.UserId == userId.Value && x.IsTemplate)
            .OrderByDescending(x => x.UpdatedAtUtc)
            .ToList()
            .Select(x => new UserPresetListItemViewModel
            {
                Id = x.Id,
                Name = x.Name,
                UpdatedAtUtc = NormalizeUtc(x.UpdatedAtUtc)
            })
            .ToList();
    }

    private AppUser? GetCurrentUser()
    {
        var token = Request.Cookies[AuthCookieName];
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var tokenHash = HashToken(token);
        var now = DateTime.UtcNow;
        var session = _context.UserSessions
            .Include(item => item.User)
            .FirstOrDefault(item => item.TokenHash == tokenHash && item.ExpiresAtUtc > now);

        return session?.User;
    }

    private void SignIn(AppUser user)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var now = DateTime.UtcNow;

        _context.UserSessions.Add(new UserSession
        {
            UserId = user.Id,
            TokenHash = HashToken(token),
            CreatedAtUtc = now,
            ExpiresAtUtc = now.AddDays(30)
        });
        _context.SaveChanges();

        Response.Cookies.Append(AuthCookieName, token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = Request.IsHttps,
            Expires = now.AddDays(30)
        });
    }

    private static string HashToken(string token) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    private static string? ValidateAuthRequest(AuthRequest? request)
    {
        if (request is null)
        {
            return "Нет данных для входа.";
        }

        if (string.IsNullOrWhiteSpace(request.Login) || request.Login.Trim().Length < 3)
        {
            return "Логин должен содержать не менее 3 символов.";
        }

        if (request.Login.Trim().Length > 80)
        {
            return "Логин должен быть не длиннее 80 символов.";
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
        {
            return "Пароль должен содержать не менее 6 символов.";
        }

        return null;
    }

    private static void CreatePasswordHash(string password, out string hash, out string salt)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(16);
        var hashBytes = Rfc2898DeriveBytes.Pbkdf2(
            password,
            saltBytes,
            100_000,
            HashAlgorithmName.SHA256,
            32);

        salt = Convert.ToBase64String(saltBytes);
        hash = Convert.ToBase64String(hashBytes);
    }

    private static bool VerifyPassword(string password, string salt, string hash)
    {
        try
        {
            var saltBytes = Convert.FromBase64String(salt);
            var expectedHash = Convert.FromBase64String(hash);
            var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                saltBytes,
                100_000,
                HashAlgorithmName.SHA256,
                expectedHash.Length);

            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private List<SavedCalculationListItemViewModel> BuildCalculationList(
        int userId,
        string? search = null,
        string? templateFilter = null,
        string? sort = null)
    {
        var query = _context.SavedCalculations
            .Include(item => item.Summary)
            .Where(item => item.UserId == userId);

        var searchTerm = search?.Trim();
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(item => item.Name.Contains(searchTerm));
        }

        switch (NormalizeTemplateFilter(templateFilter))
        {
            case "templates":
                query = query.Where(item => item.IsTemplate);
                break;
            case "regular":
                query = query.Where(item => !item.IsTemplate);
                break;
        }

        query = NormalizeCalculationSort(sort) switch
        {
            "updated_asc" => query.OrderBy(item => item.UpdatedAtUtc),
            "created_desc" => query.OrderByDescending(item => item.CreatedAtUtc),
            "created_asc" => query.OrderBy(item => item.CreatedAtUtc),
            "name_asc" => query.OrderBy(item => item.Name),
            "name_desc" => query.OrderByDescending(item => item.Name),
            "pressure_desc" => query.OrderByDescending(item => item.Summary != null ? item.Summary.TotalPressureDrop : 0),
            "pressure_asc" => query.OrderBy(item => item.Summary != null ? item.Summary.TotalPressureDrop : 0),
            _ => query.OrderByDescending(item => item.UpdatedAtUtc)
        };

        return query
            .ToList()
            .Select(item => new SavedCalculationListItemViewModel
            {
                Id = item.Id,
                Name = item.Name,
                CreatedAtUtc = NormalizeUtc(item.CreatedAtUtc),
                UpdatedAtUtc = NormalizeUtc(item.UpdatedAtUtc),
                IsTemplate = item.IsTemplate,
                TotalPressureDrop = item.Summary?.TotalPressureDrop ?? 0
            })
            .ToList();
    }

    private static string NormalizeTemplateFilter(string? templateFilter) =>
        templateFilter is "templates" or "regular" ? templateFilter : "all";

    private static string NormalizeCalculationSort(string? sort) =>
        sort is "updated_asc" or "created_desc" or "created_asc" or "name_asc" or "name_desc" or "pressure_desc" or "pressure_asc"
            ? sort
            : "updated_desc";

    private static DateTime NormalizeUtc(DateTime utcDateTime)
    {
        return utcDateTime.Kind switch
        {
            DateTimeKind.Utc => utcDateTime,
            DateTimeKind.Local => utcDateTime.ToUniversalTime(),
            _ => DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc)
        };
    }

    private void SyncGuestPresetsInternal(int userId, IEnumerable<GuestPresetSyncItem>? guestPresets)
    {
        if (guestPresets is null)
        {
            return;
        }

        foreach (var item in guestPresets)
        {
            if (item is null || string.IsNullOrWhiteSpace(item.Name))
            {
                continue;
            }

            var model = item.Model ?? new CalcViewModel();
            PopulateCatalogs(model);
            NormalizeEditorModel(model);
            UpdateHeightSummary(model);

            var response = _calculationService.Calculate(model);
            if (!response.Success)
            {
                continue;
            }

            SaveCalculationForUser(userId, item.Name.Trim(), model, response, null, isTemplate: true);
        }
    }

    private string ResolveCalculationName(int? userId, CalcViewModel model)
    {
        if (userId.HasValue && model.CurrentCalculationId.HasValue)
        {
            var existingName = _context.SavedCalculations
                .Where(item => item.UserId == userId.Value && item.Id == model.CurrentCalculationId.Value)
                .Select(item => item.Name)
                .FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(existingName))
            {
                return existingName.Trim();
            }
        }

        if (!string.IsNullOrWhiteSpace(model.CurrentCalculationName))
        {
            return userId.HasValue
                ? BuildUniqueCalculationName(userId.Value, model.CurrentCalculationName.Trim(), model.CurrentCalculationId)
                : model.CurrentCalculationName.Trim();
        }

        return userId.HasValue ? BuildNextCalculationName(userId.Value) : "Расчет №1";
    }

    private string BuildNextCalculationName(int userId)
    {
        var usedNames = _context.SavedCalculations
            .Where(item => item.UserId == userId)
            .Select(item => item.Name)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var number = 1;
        while (usedNames.Contains($"Расчет №{number}"))
        {
            number++;
        }

        return $"Расчет №{number}";
    }

    private string BuildUniqueCalculationName(int userId, string? preferredName, int? ignoredCalculationId = null)
    {
        var baseName = string.IsNullOrWhiteSpace(preferredName)
            ? BuildNextCalculationName(userId)
            : preferredName.Trim();
        var name = baseName;
        var suffix = 2;

        while (_context.SavedCalculations.Any(item =>
                   item.UserId == userId &&
                   (!ignoredCalculationId.HasValue || item.Id != ignoredCalculationId.Value) &&
                   item.Name == name) ||
               _context.UserPresets.Any(item =>
                   item.UserId == userId &&
                   (!ignoredCalculationId.HasValue || item.SavedCalculationId != ignoredCalculationId.Value) &&
                   item.Name == name))
        {
            name = $"{baseName} ({suffix})";
            suffix++;
        }

        return name;
    }

    private int SaveCalculationForUser(
        int userId,
        string name,
        CalcViewModel model,
        PressureCalculationResponse response,
        int? calculationId,
        bool isTemplate)
    {
        var now = DateTime.UtcNow;
        var calculation = calculationId.HasValue
            ? LoadSavedCalculation(userId, calculationId.Value)
            : null;

        if (calculation is null)
        {
            calculation = new SavedCalculation
            {
                UserId = userId,
                CreatedAtUtc = now
            };
            _context.SavedCalculations.Add(calculation);
        }
        else
        {
            _context.SavedCalculationSections.RemoveRange(calculation.Sections);
            _context.SavedCalculationResults.RemoveRange(calculation.Results);
            _context.SavedCalculationRecommendations.RemoveRange(calculation.Recommendations);
            _context.SavedCalculationNotices.RemoveRange(calculation.Notices);
            calculation.Sections = [];
            calculation.Results = [];
            calculation.Recommendations = [];
            calculation.Notices = [];
        }

        var calculationName = string.IsNullOrWhiteSpace(name)
            ? ResolveCalculationName(userId, model)
            : BuildUniqueCalculationName(userId, name, calculation.Id);
        var storage = CreateStorageCopy(model);
        storage.CurrentCalculationName = calculationName;

        calculation.Name = calculationName;
        calculation.IsTemplate = calculation.IsTemplate || isTemplate;
        calculation.UpdatedAtUtc = now;
        ApplyInputSnapshot(calculation, storage);
        ApplySummarySnapshot(calculation, response.Summary);

        calculation.Sections = storage.Sections
            .Select((section, index) => MapSectionSnapshot(section, index))
            .ToList();
        calculation.Results = response.Results
            .Select(MapResultSnapshot)
            .ToList();
        calculation.Recommendations = response.Recommendations
            .Select((recommendation, index) => MapRecommendationSnapshot(recommendation, index))
            .ToList();
        calculation.Notices = response.Notices
            .Select((notice, index) => new SavedCalculationNotice
            {
                SortOrder = index,
                Text = notice
            })
            .ToList();

        _context.SaveChanges();

        if (calculation.IsTemplate)
        {
            UpsertPresetFromCalculation(calculation);
        }
        else
        {
            RemovePresetForCalculation(calculation.Id);
        }

        _context.SaveChanges();
        return calculation.Id;
    }

    private SavedCalculation? LoadSavedCalculation(int userId, int id) =>
        _context.SavedCalculations
            .Include(item => item.Input)
                .ThenInclude(input => input!.Roughness)
                    .ThenInclude(roughness => roughness!.Material)
            .Include(item => item.Input)
                .ThenInclude(input => input!.Roughness)
                    .ThenInclude(roughness => roughness!.SurfaceCondition)
            .Include(item => item.Summary)
            .Include(item => item.Sections)
                .ThenInclude(section => section.LocalResistance)
            .Include(item => item.Sections)
                .ThenInclude(section => section.Roughness)
                    .ThenInclude(roughness => roughness!.Material)
            .Include(item => item.Sections)
                .ThenInclude(section => section.Roughness)
                    .ThenInclude(roughness => roughness!.SurfaceCondition)
            .Include(item => item.Results)
                .ThenInclude(result => result.RoughnessReference)
                    .ThenInclude(roughness => roughness!.Material)
            .Include(item => item.Results)
                .ThenInclude(result => result.RoughnessReference)
                    .ThenInclude(roughness => roughness!.SurfaceCondition)
            .Include(item => item.Recommendations)
            .Include(item => item.Notices)
            .FirstOrDefault(item => item.Id == id && item.UserId == userId);

    private CalcViewModel? LoadCalculationInput(int userId, int id)
    {
        var calculation = LoadSavedCalculation(userId, id);
        return calculation is null ? null : BuildModelFromCalculation(calculation);
    }

    private CalcViewModel BuildModelFromCalculation(SavedCalculation calculation)
    {
        var input = calculation.Input ?? new SavedCalculationInput();
        var totalHeight = calculation.Sections.Sum(section => section.HeightDelta);
        var referenceAirDensity = input.AirDensityAtNormalConditions > 0
            ? input.AirDensityAtNormalConditions
            : 1.293;

        var model = new CalcViewModel
        {
            CurrentCalculationId = calculation.Id,
            CurrentCalculationName = calculation.Name,
            TgasInitial = input.TgasInitial,
            TgasInitialUnit = input.TgasInitialUnit,
            TemperatureLossPerMeter = input.TemperatureLossPerMeter,
            GasFlow = input.GasFlow,
            GasFlowUnit = input.GasFlowUnit,
            MaterialType = input.Roughness?.Type ?? string.Empty,
            SurfaceCondition = input.Roughness?.Condition ?? string.Empty,
            UseCustomRoughness = input.UseCustomRoughness,
            CustomRoughness = input.CustomRoughness,
            CustomRoughnessUnit = input.CustomRoughnessUnit,
            UseGeometricPressure = input.UseGeometricPressure,
            AmbientAirTemperature = input.AmbientAirTemperature,
            AmbientAirTemperatureUnit = input.AmbientAirTemperatureUnit,
            AmbientAirDensity = CalculateAmbientAirDensity(input.AmbientAirTemperature ?? 20, referenceAirDensity),
            AirDensityAtNormalConditions = referenceAirDensity,
            HeightDifference = Math.Abs(totalHeight),
            HeightDirection = totalHeight switch
            {
                > 0 => "up",
                < 0 => "down",
                _ => "none"
            },
            Y_N2 = input.Y_N2,
            Y_N2Unit = input.Y_N2Unit,
            Y_O2 = input.Y_O2,
            Y_O2Unit = input.Y_O2Unit,
            Y_CO2 = input.Y_CO2,
            Y_CO2Unit = input.Y_CO2Unit,
            Y_H2O = input.Y_H2O,
            Y_H2OUnit = input.Y_H2OUnit,
            Sections = calculation.Sections
                .OrderBy(section => section.SortOrder)
                .Select(MapSectionInput)
                .ToList()
        };

        PopulateCatalogs(model);
        EnsureEditorDefaults(model, ensureDefaultSection: false);
        return model;
    }

    private CalcPageViewModel BuildResultPage(SavedCalculation calculation, AppUser user)
    {
        var summary = calculation.Summary ?? new SavedCalculationSummary();

        return new()
        {
            Input = BuildModelFromCalculation(calculation),
            Summary = new CalculationSummaryViewModel
            {
                TotalPressureDrop = summary.TotalPressureDrop,
                FrictionLoss = summary.FrictionLoss,
                LocalLoss = summary.LocalLoss,
                GeometricLoss = summary.GeometricLoss,
                TotalRouteLength = summary.TotalRouteLength,
                TotalHeightChange = summary.TotalHeightChange,
                AverageVelocity = summary.AverageVelocity,
                MaxVelocity = summary.MaxVelocity,
                AmbientAirDensity = summary.AmbientAirDensity,
                CriticalSectionName = summary.CriticalSectionName,
                CriticalSectionLoss = summary.CriticalSectionLoss,
                EfficiencyLabel = summary.EfficiencyLabel
            },
            Results = calculation.Results
                .OrderBy(result => result.SectionNumber)
                .Select(MapResultViewModel)
                .ToList(),
            Recommendations = calculation.Recommendations
                .OrderBy(recommendation => recommendation.SortOrder)
                .Select(MapRecommendationViewModel)
                .ToList(),
            Notices = calculation.Notices
                .OrderBy(notice => notice.SortOrder)
                .Select(notice => notice.Text)
                .ToList(),
            IsAuthenticated = true,
            UserLogin = user.Login,
            SavedCalculationId = calculation.Id,
            CalculationName = calculation.Name
        };
    }

    private UserPreset UpsertPresetFromCalculation(SavedCalculation calculation)
    {
        var preset = _context.UserPresets.FirstOrDefault(item =>
            item.UserId == calculation.UserId &&
            item.SavedCalculationId == calculation.Id);

        if (!calculation.IsTemplate)
        {
            if (preset is not null)
            {
                _context.UserPresets.Remove(preset);
            }

            return preset ?? new UserPreset();
        }

        preset ??= _context.UserPresets.FirstOrDefault(item =>
            item.UserId == calculation.UserId &&
            item.Name == calculation.Name);

        var now = DateTime.UtcNow;
        if (preset is null)
        {
            preset = new UserPreset
            {
                UserId = calculation.UserId,
                CreatedAtUtc = now
            };
            _context.UserPresets.Add(preset);
        }

        preset.SavedCalculationId = calculation.Id;
        preset.Name = calculation.Name;
        preset.IsTemplate = true;
        preset.UpdatedAtUtc = now;
        return preset;
    }

    private void RemovePresetForCalculation(int calculationId)
    {
        var presets = _context.UserPresets.Where(item => item.SavedCalculationId == calculationId).ToList();
        if (presets.Count > 0)
        {
            _context.UserPresets.RemoveRange(presets);
        }
    }

    private int? ResolveRoughnessId(string? materialType, string? surfaceCondition)
    {
        if (string.IsNullOrWhiteSpace(materialType) || string.IsNullOrWhiteSpace(surfaceCondition))
        {
            return null;
        }

        var material = materialType.Trim();
        var condition = surfaceCondition.Trim();
        return RoughnessCatalogQuery()
            .Where(item =>
                item.Material != null &&
                item.SurfaceCondition != null &&
                item.Material.Name == material &&
                item.SurfaceCondition.Name == condition)
            .Select(item => (int?)item.Id)
            .FirstOrDefault();
    }

    private int? ResolveLocalResistanceId(string? localResistanceType)
    {
        if (string.IsNullOrWhiteSpace(localResistanceType))
        {
            return null;
        }

        var type = localResistanceType.Trim();
        return _context.LRCs
            .Where(item => item.TypeofLR == type)
            .Select(item => (int?)item.Id)
            .FirstOrDefault();
    }

    private void ApplyInputSnapshot(SavedCalculation calculation, CalcViewModel model)
    {
        var input = calculation.Input ??= new SavedCalculationInput();
        input.TgasInitial = model.TgasInitial;
        input.TgasInitialUnit = model.TgasInitialUnit;
        input.TemperatureLossPerMeter = model.TemperatureLossPerMeter;
        input.GasFlow = model.GasFlow;
        input.GasFlowUnit = model.GasFlowUnit;
        input.RoughnessId = ResolveRoughnessId(model.MaterialType, model.SurfaceCondition);
        input.UseCustomRoughness = model.UseCustomRoughness;
        input.CustomRoughness = model.CustomRoughness;
        input.CustomRoughnessUnit = model.CustomRoughnessUnit;
        input.UseGeometricPressure = model.UseGeometricPressure;
        input.AmbientAirTemperature = model.AmbientAirTemperature;
        input.AmbientAirTemperatureUnit = model.AmbientAirTemperatureUnit;
        input.AirDensityAtNormalConditions = model.AirDensityAtNormalConditions;
        input.Y_N2 = model.Y_N2;
        input.Y_N2Unit = model.Y_N2Unit;
        input.Y_O2 = model.Y_O2;
        input.Y_O2Unit = model.Y_O2Unit;
        input.Y_CO2 = model.Y_CO2;
        input.Y_CO2Unit = model.Y_CO2Unit;
        input.Y_H2O = model.Y_H2O;
        input.Y_H2OUnit = model.Y_H2OUnit;
    }

    private static void ApplySummarySnapshot(SavedCalculation calculation, CalculationSummaryViewModel summary)
    {
        var snapshot = calculation.Summary ??= new SavedCalculationSummary();
        snapshot.TotalPressureDrop = summary.TotalPressureDrop;
        snapshot.FrictionLoss = summary.FrictionLoss;
        snapshot.LocalLoss = summary.LocalLoss;
        snapshot.GeometricLoss = summary.GeometricLoss;
        snapshot.TotalRouteLength = summary.TotalRouteLength;
        snapshot.TotalHeightChange = summary.TotalHeightChange;
        snapshot.AverageVelocity = summary.AverageVelocity;
        snapshot.MaxVelocity = summary.MaxVelocity;
        snapshot.AmbientAirDensity = summary.AmbientAirDensity;
        snapshot.CriticalSectionName = summary.CriticalSectionName;
        snapshot.CriticalSectionLoss = summary.CriticalSectionLoss;
        snapshot.EfficiencyLabel = summary.EfficiencyLabel;
    }

    private SavedCalculationSection MapSectionSnapshot(SectionInput section, int index) =>
        new()
        {
            SortOrder = index,
            SectionKind = section.SectionKind,
            CrossSectionShape = section.CrossSectionShape,
            OutletCrossSectionShape = section.OutletCrossSectionShape,
            BlockTitle = section.BlockTitle,
            Diameter = section.Diameter,
            DiameterUnit = section.DiameterUnit,
            DiameterB = section.DiameterB,
            DiameterBUnit = section.DiameterBUnit,
            OutletDiameter = section.OutletDiameter,
            OutletDiameterUnit = section.OutletDiameterUnit,
            OutletDiameterB = section.OutletDiameterB,
            OutletDiameterBUnit = section.OutletDiameterBUnit,
            Length = section.Length,
            LengthUnit = section.LengthUnit,
            TemperatureLossPerMeter = section.TemperatureLossPerMeter,
            TemperatureLossUnit = section.TemperatureLossUnit,
            TurnAngle = section.TurnAngle,
            TurnAngleUnit = section.TurnAngleUnit,
            HeightDelta = section.HeightDelta,
            HeightDeltaUnit = section.HeightDeltaUnit,
            LocalResistanceId = ResolveLocalResistanceId(section.LocalResistanceType),
            LocalResistanceParamX = section.LocalResistanceParamX,
            LocalResistanceParamY = section.LocalResistanceParamY,
            CustomLRC = section.CustomLRC,
            UseCustomLRC = section.UseCustomLRC,
            UseIndividualMaterial = section.UseIndividualMaterial,
            RoughnessId = section.UseIndividualMaterial || section.UseCustomRoughness
                ? ResolveRoughnessId(section.MaterialType, section.SurfaceCondition)
                : null,
            UseCustomRoughness = section.UseCustomRoughness,
            CustomRoughness = section.CustomRoughness,
            CustomRoughnessUnit = section.CustomRoughnessUnit
        };

    private static SectionInput MapSectionInput(SavedCalculationSection section) =>
        new()
        {
            SectionKind = section.SectionKind,
            CrossSectionShape = section.CrossSectionShape,
            OutletCrossSectionShape = section.OutletCrossSectionShape,
            BlockTitle = section.BlockTitle,
            Diameter = section.Diameter,
            DiameterUnit = section.DiameterUnit,
            DiameterB = section.DiameterB,
            DiameterBUnit = section.DiameterBUnit,
            OutletDiameter = section.OutletDiameter,
            OutletDiameterUnit = section.OutletDiameterUnit,
            OutletDiameterB = section.OutletDiameterB,
            OutletDiameterBUnit = section.OutletDiameterBUnit,
            Length = section.Length,
            LengthUnit = section.LengthUnit,
            TemperatureLossPerMeter = section.TemperatureLossPerMeter,
            TemperatureLossUnit = section.TemperatureLossUnit,
            TurnAngle = section.TurnAngle,
            TurnAngleUnit = section.TurnAngleUnit,
            HeightDelta = section.HeightDelta,
            HeightDeltaUnit = section.HeightDeltaUnit,
            LocalResistanceType = section.LocalResistanceType,
            LocalResistanceParamX = section.LocalResistanceParamX,
            LocalResistanceParamY = section.LocalResistanceParamY,
            CustomLRC = section.CustomLRC,
            UseCustomLRC = section.UseCustomLRC,
            UseIndividualMaterial = section.UseIndividualMaterial,
            MaterialType = section.MaterialType,
            SurfaceCondition = section.SurfaceCondition,
            UseCustomRoughness = section.UseCustomRoughness,
            CustomRoughness = section.CustomRoughness,
            CustomRoughnessUnit = section.CustomRoughnessUnit
        };

    private SavedCalculationResult MapResultSnapshot(CalcResultsViewModel result) =>
        new()
        {
            SectionNumber = result.SectionNumber,
            SectionName = result.SectionName,
            SectionType = result.SectionType,
            CrossSectionShape = result.CrossSectionShape,
            OutletCrossSectionShape = result.OutletCrossSectionShape,
            RoughnessId = ResolveRoughnessId(result.MaterialType, result.SurfaceCondition),
            Length = result.Length,
            Diameter = result.Diameter,
            DiameterB = result.DiameterB,
            OutletDiameter = result.OutletDiameter,
            OutletDiameterB = result.OutletDiameterB,
            EquivalentDiameter = result.EquivalentDiameter,
            OutletEquivalentDiameter = result.OutletEquivalentDiameter,
            CrossSectionArea = result.CrossSectionArea,
            HeightDelta = result.HeightDelta,
            Roughness = result.Roughness,
            AverageTemperature = result.AverageTemperature,
            InletTemperature = result.InletTemperature,
            OutletTemperature = result.OutletTemperature,
            GasDensity = result.GasDensity,
            AmbientAirDensity = result.AmbientAirDensity,
            FlowVelocity = result.FlowVelocity,
            Re = result.Re,
            Lambda = result.Lambda,
            Zeta = result.Zeta,
            PressureDropFriction = result.PressureDropFriction,
            PressureDropLocal = result.PressureDropLocal,
            GeometricPressureDrop = result.GeometricPressureDrop,
            TotalPressureDrop = result.TotalPressureDrop,
            DominantLossType = result.DominantLossType
        };

    private static CalcResultsViewModel MapResultViewModel(SavedCalculationResult result) =>
        new()
        {
            SectionNumber = result.SectionNumber,
            SectionName = result.SectionName,
            SectionType = result.SectionType,
            CrossSectionShape = result.CrossSectionShape,
            OutletCrossSectionShape = result.OutletCrossSectionShape,
            MaterialType = result.MaterialType,
            SurfaceCondition = result.SurfaceCondition,
            Length = result.Length,
            Diameter = result.Diameter,
            DiameterB = result.DiameterB,
            OutletDiameter = result.OutletDiameter,
            OutletDiameterB = result.OutletDiameterB,
            EquivalentDiameter = result.EquivalentDiameter,
            OutletEquivalentDiameter = result.OutletEquivalentDiameter,
            CrossSectionArea = result.CrossSectionArea,
            HeightDelta = result.HeightDelta,
            Roughness = result.Roughness,
            AverageTemperature = result.AverageTemperature,
            InletTemperature = result.InletTemperature,
            OutletTemperature = result.OutletTemperature,
            GasDensity = result.GasDensity,
            AmbientAirDensity = result.AmbientAirDensity,
            FlowVelocity = result.FlowVelocity,
            Re = result.Re,
            Lambda = result.Lambda,
            Zeta = result.Zeta,
            PressureDropFriction = result.PressureDropFriction,
            PressureDropLocal = result.PressureDropLocal,
            GeometricPressureDrop = result.GeometricPressureDrop,
            TotalPressureDrop = result.TotalPressureDrop,
            DominantLossType = result.DominantLossType
        };

    private static SavedCalculationRecommendation MapRecommendationSnapshot(
        OptimizationRecommendationViewModel recommendation,
        int index) =>
        new()
        {
            SortOrder = index,
            Title = recommendation.Title,
            Description = recommendation.Description,
            Priority = recommendation.Priority,
            ImpactText = recommendation.ImpactText,
            EstimatedSavingPa = recommendation.EstimatedSavingPa
        };

    private static OptimizationRecommendationViewModel MapRecommendationViewModel(
        SavedCalculationRecommendation recommendation) =>
        new()
        {
            Title = recommendation.Title,
            Description = recommendation.Description,
            Priority = recommendation.Priority,
            ImpactText = recommendation.ImpactText,
            EstimatedSavingPa = recommendation.EstimatedSavingPa
        };

    private string[] CollectErrors() =>
        ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .Where(message => !string.IsNullOrWhiteSpace(message))
            .Distinct()
            .ToArray();

    private static CalcViewModel CreateStorageCopy(CalcViewModel source)
    {
        var copy = new CalcViewModel
        {
            TgasInitial = source.TgasInitial,
            TemperatureLossPerMeter = source.TemperatureLossPerMeter,
            TgasInitialUnit = source.TgasInitialUnit,
            GasFlow = source.GasFlow,
            GasFlowUnit = source.GasFlowUnit,
            MaterialType = source.MaterialType,
            SurfaceCondition = source.SurfaceCondition,
            UseCustomRoughness = source.UseCustomRoughness,
            CustomRoughness = source.CustomRoughness,
            CustomRoughnessUnit = source.CustomRoughnessUnit,
            HeightDifference = source.HeightDifference,
            HeightDirection = source.HeightDirection,
            UseGeometricPressure = source.UseGeometricPressure,
            AmbientAirTemperature = source.AmbientAirTemperature,
            AmbientAirTemperatureUnit = source.AmbientAirTemperatureUnit,
            AmbientAirDensity = source.AmbientAirDensity,
            AirDensityAtNormalConditions = source.AirDensityAtNormalConditions,
            CurrentCalculationId = source.CurrentCalculationId,
            CurrentCalculationName = source.CurrentCalculationName,
            Y_N2 = source.Y_N2,
            Y_N2Unit = source.Y_N2Unit,
            Y_O2 = source.Y_O2,
            Y_O2Unit = source.Y_O2Unit,
            Y_CO2 = source.Y_CO2,
            Y_CO2Unit = source.Y_CO2Unit,
            Y_H2O = source.Y_H2O,
            Y_H2OUnit = source.Y_H2OUnit,
            OptimizationGoal = source.OptimizationGoal,
            Sections = source.Sections.Select(section => new SectionInput
            {
                SectionKind = section.SectionKind,
                CrossSectionShape = section.CrossSectionShape,
                OutletCrossSectionShape = section.OutletCrossSectionShape,
                BlockTitle = section.BlockTitle,
                Diameter = section.Diameter,
                DiameterUnit = section.DiameterUnit,
                DiameterB = section.DiameterB,
                DiameterBUnit = section.DiameterBUnit,
                OutletDiameter = section.OutletDiameter,
                OutletDiameterUnit = section.OutletDiameterUnit,
                OutletDiameterB = section.OutletDiameterB,
                OutletDiameterBUnit = section.OutletDiameterBUnit,
                Length = section.Length,
                LengthUnit = section.LengthUnit,
                TemperatureLossPerMeter = section.TemperatureLossPerMeter,
                TemperatureLossUnit = section.TemperatureLossUnit,
                TurnAngle = section.TurnAngle,
                TurnAngleUnit = section.TurnAngleUnit,
                HeightDelta = section.HeightDelta,
                HeightDeltaUnit = section.HeightDeltaUnit,
                LocalResistanceType = section.LocalResistanceType,
                LocalResistanceParamX = section.LocalResistanceParamX,
                LocalResistanceParamY = section.LocalResistanceParamY,
                CustomLRC = section.CustomLRC,
                UseCustomLRC = section.UseCustomLRC,
                UseIndividualMaterial = section.UseIndividualMaterial,
                MaterialType = section.MaterialType,
                SurfaceCondition = section.SurfaceCondition,
                UseCustomRoughness = section.UseCustomRoughness,
                CustomRoughness = section.CustomRoughness,
                CustomRoughnessUnit = section.CustomRoughnessUnit
            }).ToList()
        };

        return copy;
    }

    private CalcViewModel DeserializeStoredModel(string payloadJson)
    {
        try
        {
            return JsonConvert.DeserializeObject<CalcViewModel>(payloadJson) ?? new CalcViewModel();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Не удалось десериализовать сохранённую заготовку");
            return new CalcViewModel();
        }
    }

    private static void UpdateHeightSummary(CalcViewModel model)
    {
        var totalHeight = model.Sections.Sum(x => x.HeightDelta);
        model.HeightDifference = Math.Abs(totalHeight);
        model.HeightDirection = totalHeight switch
        {
            > 0 => "up",
            < 0 => "down",
            _ => "none"
        };
    }

    private static double CalculateAmbientAirDensity(double temperatureCelsius, double referenceDensity)
    {
        const double normalTemperatureKelvin = 273.15;
        var absoluteTemperature = temperatureCelsius + normalTemperatureKelvin;
        return absoluteTemperature <= 0
            ? referenceDensity
            : referenceDensity * normalTemperatureKelvin / absoluteTemperature;
    }

}
