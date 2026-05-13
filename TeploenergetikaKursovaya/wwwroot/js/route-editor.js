(function () {
  const form = document.getElementById("routeForm");
  if (!form) {
    return;
  }

  const config = window.routeEditorConfig || {};
  const draftKey = "dymtrassa.routeDraft.v3";
  const guestPresetKey = "dymtrassa.guestPresets.v1";
  let sectionCounter = 0;

  const elements = {
    validationPanel: form.querySelector(".validation-panel"),
    routePalette: document.getElementById("routePalette"),
    routeCanvas: document.getElementById("routeCanvas"),
    routeCountBadge: document.getElementById("routeCountBadge"),
    blockInspectorBody: document.getElementById("blockInspectorBody"),
    inspectorTitle: document.getElementById("inspectorTitle"),
    removeSelectedBlockBtn: document.getElementById("removeSelectedBlockBtn"),
    sectionInputsHost: document.getElementById("sectionInputsHost"),
    previewStatus: document.getElementById("previewStatus"),
    previewEmpty: document.getElementById("previewEmpty"),
    liveResultsWrapper: document.getElementById("liveResultsWrapper"),
    liveResultsTable: document.getElementById("liveResultsTable"),
    metricTotal: document.getElementById("metricTotal"),
    metricFriction: document.getElementById("metricFriction"),
    metricLocal: document.getElementById("metricLocal"),
    metricGeometric: document.getElementById("metricGeometric"),
    metricLength: document.getElementById("metricLength"),
    metricVelocity: document.getElementById("metricVelocity"),
    metricCritical: document.getElementById("metricCritical"),
    efficiencyLabel: document.getElementById("efficiencyLabel"),
    heightSummary: document.getElementById("heightSummary"),
    geometryPressurePanel: document.getElementById("geometryPressurePanel"),
    toggleGeometryPressureBtn: document.getElementById("toggleGeometryPressureBtn"),
    geometricPressureBody: document.getElementById("geometricPressureBody"),
    geometryPressureSummary: document.getElementById("geometryPressureSummary"),
    geometryPressureSignHint: document.getElementById("geometryPressureSignHint"),
    routeHeightDelta: document.getElementById("RouteHeightDelta"),
    ambientAirTemperature: document.getElementById("AmbientAirTemperature"),
    ambientAirDensityValue: document.getElementById("ambientAirDensityValue"),
    recommendationsList: document.getElementById("recommendationsList"),
    noticesList: document.getElementById("noticesList"),
    presetName: document.getElementById("presetName"),
    presetSelect: document.getElementById("presetSelect"),
    presetStatus: document.getElementById("presetStatus"),
    savePresetBtn: document.getElementById("savePresetBtn"),
    loadPresetBtn: document.getElementById("loadPresetBtn"),
    deletePresetBtn: document.getElementById("deletePresetBtn"),
    clearDraftBtn: document.getElementById("clearDraftBtn"),
    globalMaterialType: document.getElementById("MaterialType"),
    globalSurfaceCondition: document.getElementById("SurfaceCondition"),
    useCustomRoughness: document.getElementById("UseCustomRoughness"),
    globalCustomRoughnessField: document.getElementById("globalCustomRoughnessField"),
    globalRoughnessSummary: document.getElementById("globalRoughnessSummary"),
    gasCompositionSummary: document.getElementById("gasCompositionSummary")
  };

  const materialCatalog = config.materialCatalog || {};
  const roughnessCatalog = Array.isArray(config.roughnessCatalog) ? config.roughnessCatalog : [];
  const localResistanceTypes = Array.isArray(config.localResistanceTypes) ? config.localResistanceTypes : [];
  const localResistanceCatalog = config.localResistanceCatalog || {};
  const fieldUnitIds = [
    "TgasInitial",
    "TemperatureLossPerMeter",
    "GasFlow",
    "CustomRoughness",
    "RouteHeightDelta",
    "AmbientAirTemperature",
    "Y_N2",
    "Y_O2",
    "Y_CO2",
    "Y_H2O"
  ];
  const gasComponentFieldIds = ["Y_N2", "Y_O2", "Y_CO2", "Y_H2O"];

  const unitDefinitions = {
    c: { toBase: (value) => value, fromBase: (value) => value },
    k: { toBase: (value) => value - 273.15, fromBase: (value) => value + 273.15 },
    cPerM: { toBase: (value) => value, fromBase: (value) => value },
    cPer10M: { toBase: (value) => value / 10, fromBase: (value) => value * 10 },
    cTotal: { toBase: (value) => value, fromBase: (value) => value },
    m3s: { toBase: (value) => value, fromBase: (value) => value },
    m3h: { toBase: (value) => value / 3600, fromBase: (value) => value * 3600 },
    m: { toBase: (value) => value, fromBase: (value) => value },
    mm: { toBase: (value) => value / 1000, fromBase: (value) => value * 1000 },
    deg: { toBase: (value) => value, fromBase: (value) => value },
    rad: { toBase: (value) => value * 180 / Math.PI, fromBase: (value) => value * Math.PI / 180 },
    fraction: { toBase: (value) => value, fromBase: (value) => value },
    percent: { toBase: (value) => value / 100, fromBase: (value) => value * 100 }
  };

  const baseUnitsByField = {
    TgasInitial: "c",
    TemperatureLossPerMeter: "cPerM",
    GasFlow: "m3s",
    CustomRoughness: "m",
    RouteHeightDelta: "m",
    AmbientAirTemperature: "c",
    Y_N2: "fraction",
    Y_O2: "fraction",
    Y_CO2: "fraction",
    Y_H2O: "fraction"
  };

  const sectionBaseUnits = {
    diameter: "m",
    diameterB: "m",
    outletDiameter: "m",
    outletDiameterB: "m",
    localResistanceParamX: "m",
    localResistanceParamY: "m",
    length: "m",
    heightDelta: "m",
    customRoughness: "m",
    turnAngle: "deg",
    temperatureLossPerMeter: "cPerM"
  };

  const state = {
    sections: [],
    selectedId: null,
    presets: (Array.isArray(config.savedPresets) ? [...config.savedPresets] : []).concat(loadGuestPresets()),
    previewTimer: null,
    previewAbortController: null,
    dragPayload: null,
    useGeometricPressure: Boolean(config.useGeometricPressure)
  };

  const staticTooltips = {
    presetName: {
      title: "Название заготовки",
      essence: "Имя сохраненного набора исходных данных.",
      logic: "Используется только для списка заготовок и не влияет на расчет трассы."
    },
    presetSelect: {
      title: "Сохраненные заготовки",
      essence: "Ранее сохраненные варианты исходных данных и маршрута.",
      logic: "При загрузке заготовка переносит параметры в редактор, после чего их можно менять вручную."
    },
    TgasInitial: {
      title: "Начальная температура газа",
      essence: "Температура дымовых газов на входе в первый элемент трассы.",
      logic: "От нее программа последовательно считает температуру в каждом блоке с учетом теплопотерь."
    },
    GasFlow: {
      title: "Расход газа",
      essence: "Объемный расход газа в рабочем состоянии.",
      logic: "Используется для расчета скорости потока, динамического давления и потерь давления."
    },
    MaterialType: {
      title: "Базовый материал трассы",
      essence: "Материал стенки, по которому выбирается справочная эквивалентная шероховатость.",
      logic: "Применяется ко всей трассе, пока для отдельного блока не включен индивидуальный материал."
    },
    SurfaceCondition: {
      title: "Состояние поверхности",
      essence: "Качество внутренней поверхности выбранного материала.",
      logic: "Вместе с материалом определяет Kэ для расчета коэффициента трения."
    },
    UseCustomRoughness: {
      title: "Собственная шероховатость трассы",
      essence: "Ручное значение эквивалентной шероховатости вместо справочника.",
      logic: "Если включено, программа использует введенное Kэ для всей трассы, кроме блоков со своими настройками."
    },
    CustomRoughness: {
      title: "Эквивалентная шероховатость",
      essence: "Числовое значение Kэ, характеризующее неровность стенки канала.",
      logic: "Попадает в расчет коэффициента трения. Можно вводить в метрах или миллиметрах."
    },
    AmbientAirTemperature: {
      title: "Температура наружного воздуха",
      essence: "Температура воздуха вокруг дымовой трассы.",
      logic: "Используется только при включенном учете геометрического давления: по ней программа вычисляет плотность наружного воздуха."
    },
    Y_N2: {
      title: "Доля азота",
      essence: "Объемная доля N₂ в составе дымовых газов.",
      logic: "Участвует в расчете плотности смеси. Сумма компонентов должна быть близка к 100%."
    },
    Y_O2: {
      title: "Доля кислорода",
      essence: "Объемная доля O₂ в составе дымовых газов.",
      logic: "Участвует в расчете плотности смеси. Можно задавать долей или процентами."
    },
    Y_CO2: {
      title: "Доля углекислого газа",
      essence: "Объемная доля CO₂ в составе дымовых газов.",
      logic: "Влияет на расчетную плотность газа и итоговые потери давления."
    },
    Y_H2O: {
      title: "Доля водяного пара",
      essence: "Объемная доля H₂O в составе дымовых газов.",
      logic: "Учитывается в расчете плотности газовой смеси."
    }
  };

  const tooltipState = {
    showTimer: null,
    hideTimer: null,
    trigger: null,
    tooltip: null
  };

  const kindMeta = {
    Straight: {
      label: "Прямой участок",
      createDefaults: () => ({ diameter: "0.9", length: "12", heightDelta: "0" }),
      icon: [
        '<svg class="block-svg" viewBox="0 0 64 40" aria-hidden="true">',
        '<rect x="6" y="15" width="52" height="10" rx="5" fill="#507f82"></rect>',
        '<rect x="10" y="18" width="44" height="4" rx="2" fill="#cce0e0"></rect>',
        "</svg>"
      ].join("")
    },
    Bend: {
      label: "Поворот",
      createDefaults: () => ({ diameter: "0.9", length: "2", turnAngle: "90", heightDelta: "0" }),
      icon: [
        '<svg class="block-svg" viewBox="0 0 64 40" aria-hidden="true">',
        '<path d="M12 28V14a6 6 0 0 1 6-6h24" fill="none" stroke="#8f3d2e" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"></path>',
        '<path d="M12 28V14a6 6 0 0 1 6-6h24" fill="none" stroke="#f3ddd3" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>',
        "</svg>"
      ].join("")
    },
    Contraction: {
      label: "Сужение",
      createDefaults: () => ({ diameter: "0.9", outletDiameter: "0.75", length: "1.5", heightDelta: "0" }),
      icon: [
        '<svg class="block-svg" viewBox="0 0 64 40" aria-hidden="true">',
        '<path d="M6 13h18l10 7-10 7H6z" fill="#d8a661"></path>',
        '<path d="M34 15h20v10H34z" fill="#8f3d2e"></path>',
        '<path d="M10 17h12l7 3-7 3H10z" fill="#f7ecd4"></path>',
        "</svg>"
      ].join("")
    },
    Expansion: {
      label: "Расширение",
      createDefaults: () => ({ diameter: "0.75", outletDiameter: "0.9", length: "1.5", heightDelta: "0" }),
      icon: [
        '<svg class="block-svg" viewBox="0 0 64 40" aria-hidden="true">',
        '<path d="M10 15h20v10H10z" fill="#8f3d2e"></path>',
        '<path d="M30 13h18l10 7-10 7H30z" fill="#507f82"></path>',
        '<path d="M34 17h12l7 3-7 3H34z" fill="#d8edf0"></path>',
        "</svg>"
      ].join("")
    },
    LocalResistance: {
      label: "Местное сопротивление",
      createDefaults: () => ({
        diameter: "0.9",
        length: "0.5",
        heightDelta: "0",
        localResistanceType: localResistanceTypes[0] || ""
      }),
      icon: [
        '<svg class="block-svg" viewBox="0 0 64 40" aria-hidden="true">',
        '<rect x="6" y="17" width="16" height="6" rx="3" fill="#507f82"></rect>',
        '<circle cx="32" cy="20" r="9" fill="#8f3d2e"></circle>',
        '<circle cx="32" cy="20" r="4" fill="#f9e4dc"></circle>',
        '<rect x="42" y="17" width="16" height="6" rx="3" fill="#507f82"></rect>',
        "</svg>"
      ].join("")
    }
  };

  init();

  function init() {
    initUnitSelectors();
    decoratePalette();
    bindStaticEvents();
    decorateStaticTooltips();
    hydratePresetSelect();
    syncGlobalSurfaceOptions();
    toggleGlobalRoughnessField();
    updateGlobalRoughnessSummary();
    hydrateGeometryPressureWidget(state.useGeometricPressure);
    updateAmbientAirDensity();
    updateGasCompositionSummary();

    const draft = loadDraft();
    if (draft) {
      applySnapshot(draft, "Восстановлен последний черновик редактора.");
      return;
    }

    state.sections = normalizeSections(config.initialSections);
    state.selectedId = state.sections[0] ? state.sections[0].id : null;
    renderAll({ schedulePreview: true, saveDraft: true });
    setPresetStatus("Черновик редактора сохраняется автоматически и не стирается после перехода к отчёту.");
  }

  function bindStaticEvents() {
    form.addEventListener("input", handleFormInteraction);
    form.addEventListener("change", handleFormInteraction);
    form.addEventListener("click", handleFormClick);
    form.addEventListener("submit", handleSubmit);
    document.addEventListener("mouseover", handleContextTooltipMouseOver);
    document.addEventListener("mouseout", handleContextTooltipMouseOut);
    document.addEventListener("focusin", handleContextTooltipFocusIn);
    document.addEventListener("focusout", handleContextTooltipFocusOut);
    document.addEventListener("click", handleContextTooltipClick, true);
    document.addEventListener("keydown", hideContextTooltipNow);
    document.addEventListener("teplo:auth-state", handleAuthStateChange);
    window.addEventListener("scroll", hideContextTooltipNow, true);
    window.addEventListener("resize", hideContextTooltipNow);

    elements.routeCanvas.addEventListener("dragover", handleCanvasDragOver);
    elements.routeCanvas.addEventListener("dragleave", handleCanvasDragLeave);
    elements.routeCanvas.addEventListener("drop", handleCanvasDrop);

    elements.blockInspectorBody.addEventListener("input", handleInspectorInteraction);
    elements.blockInspectorBody.addEventListener("change", handleInspectorInteraction);
    elements.blockInspectorBody.addEventListener("click", handleInspectorClick);

    elements.removeSelectedBlockBtn.addEventListener("click", removeSelectedSection);
    elements.savePresetBtn.addEventListener("click", savePreset);
    elements.loadPresetBtn.addEventListener("click", loadPreset);
    elements.deletePresetBtn.addEventListener("click", deletePreset);
    elements.clearDraftBtn.addEventListener("click", clearDraft);
    if (elements.toggleGeometryPressureBtn) {
      elements.toggleGeometryPressureBtn.addEventListener("click", toggleGeometryPressureAnalysis);
    }
    if (elements.noticesList) {
      elements.noticesList.addEventListener("click", handleNoticeAction);
    }
  }

  function decoratePalette() {
    const items = elements.routePalette ? elements.routePalette.querySelectorAll(".palette-item") : [];
    items.forEach((button) => {
      const kind = normalizeKind(button.dataset.kind);
      const meta = kindMeta[kind];

      button.innerHTML = [
        `<span class="palette-item__art">${meta.icon}</span>`,
        `<span class="palette-item__label">${meta.label}</span>`
      ].join("");

      button.addEventListener("click", () => insertSection(kind, null, true));
      button.addEventListener("dragstart", (event) => {
        state.dragPayload = { type: "new", kind: kind };
        event.dataTransfer.effectAllowed = "copy";
      });
      button.addEventListener("dragend", cleanupDragState);
    });
  }

  function handleFormInteraction(event) {
    if (event.target.closest("#blockInspectorBody")) {
      return;
    }

    if (event.target.matches("[data-unit-for]")) {
      handleGlobalUnitChange(event.target);
      updateGlobalRoughnessSummary();
      if (event.target.closest("#geometryPressurePanel")) {
        updateAmbientAirDensity();
        updateHeightSummary();
        renderHiddenInputs();
        saveDraftSilently();
        schedulePreview();
        return;
      }
    }

    if (event.target.closest("#geometryPressurePanel")) {
      updateAmbientAirDensity();
      updateHeightSummary();
      renderHiddenInputs();
      saveDraftSilently();
      schedulePreview();
      return;
    }

    if (event.target === elements.globalMaterialType) {
      syncGlobalSurfaceOptions();
      updateGlobalRoughnessSummary();
      renderInspector();
    }

    if (event.target === elements.globalSurfaceCondition) {
      updateGlobalRoughnessSummary();
      renderInspector();
    }

    if (event.target === elements.useCustomRoughness) {
      toggleGlobalRoughnessField();
      updateGlobalRoughnessSummary();
      renderInspector();
    }

    if (event.target && event.target.id === "CustomRoughness") {
      updateGlobalRoughnessSummary();
      renderInspector();
    }

    renderHiddenInputs();
    updateGasCompositionSummary();
    updateHeightSummary();
    schedulePreview();
    saveDraftSilently();
  }

  function handleInspectorInteraction(event) {
    if (event.target.dataset.unitField) {
      handleSectionUnitChange(event.target);
      return;
    }

    const field = event.target.dataset.field;
    if (!field) {
      return;
    }

    const section = getSelectedSection();
    if (!section) {
      return;
    }

      section[field] = event.target.type === "checkbox"
        ? event.target.checked
        : sanitizeValue(event.target.value);

      if (field === "useCustomLrc" && section.useCustomLrc && !section.customLrc) {
        section.customLrc = getAutoKmsValue(section);
      }

    ensureSection(section);

    if (field === "materialType") {
      const conditions = getSurfaceOptions(section.materialType);
      if (!conditions.includes(section.surfaceCondition)) {
        section.surfaceCondition = conditions[0] || "";
      }
    }

    if (field === "localResistanceType") {
      applyTabularParameterDefaults(section);
    }

    if (isConicalCollectorSection(section) || isStraightPipeEntranceSection(section)) {
      updateDerivedLocalResistanceParams(section);
      if (["diameter", "localResistanceType", "crossSectionShape"].includes(field)) {
        syncConicalCollectorOutletToNext(section);
      }
    }

      if (["useCustomLrc", "useIndividualMaterial", "useCustomRoughness", "materialType", "localResistanceType", "crossSectionShape", "outletCrossSectionShape"].includes(field)) {
        renderInspector();
      }
      updateAutoKmsField();
      updateSectionRoughnessSummary(section);

    renderCanvas();
    renderHiddenInputs();
    updateHeightSummary();
    schedulePreview();
    saveDraftSilently();
  }

  function handleFormClick(event) {
    const roughnessButton = event.target.closest("[data-open-roughness-table]");
    if (!roughnessButton) {
      return;
    }

    event.preventDefault();
    const section = roughnessButton.dataset.roughnessContext === "section"
      ? getSelectedSection()
      : null;
    showRoughnessGuide(section);
  }

  function handleAuthStateChange(event) {
    const authState = event.detail || {};
    if (authState.isAuthenticated && Array.isArray(authState.presets)) {
      state.presets = authState.presets;
      hydratePresetSelect("");
      setPresetStatus("Профиль подключен: заготовки теперь сохраняются в базе данных.");
    } else if (!authState.isAuthenticated) {
      state.presets = loadGuestPresets();
      hydratePresetSelect("");
    }
  }

  function handleInspectorClick(event) {
    const guideButton = event.target.closest("[data-open-resistance-table]");
    if (!guideButton) {
      return;
    }

    event.preventDefault();
    const section = getSelectedSection();
    if (!section) {
      return;
    }

    showResistanceGuide(section);
  }

  function handleSubmit(event) {
    renderHiddenInputs();
    const blockingMessages = collectBlockingMessages();
    if (blockingMessages.length > 0) {
      event.preventDefault();
      showValidationMessages(blockingMessages);
      renderNotices(blockingMessages);
      setPreviewStatus("Есть ошибки в данных", "is-error");
      return;
    }

    saveDraftSilently();
    applyBaseValuesToStaticFields();
  }

  function handleCanvasDragOver(event) {
    event.preventDefault();
    elements.routeCanvas.classList.add("is-dragover");

    const node = event.target.closest(".route-node");
    clearDropIndicators();
    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const isAfter = event.clientX > rect.left + rect.width / 2;
    node.classList.add(isAfter ? "drop-after" : "drop-before");
  }

  function handleCanvasDragLeave(event) {
    if (!elements.routeCanvas.contains(event.relatedTarget)) {
      clearDropIndicators();
      elements.routeCanvas.classList.remove("is-dragover");
    }
  }

  function handleCanvasDrop(event) {
    event.preventDefault();
    elements.routeCanvas.classList.remove("is-dragover");

    if (!state.dragPayload) {
      clearDropIndicators();
      return;
    }

    const node = event.target.closest(".route-node");
    let targetId = null;
    let placeAfter = true;

    if (node) {
      const rect = node.getBoundingClientRect();
      placeAfter = event.clientX > rect.left + rect.width / 2;
      targetId = node.dataset.id;
    }

    if (state.dragPayload.type === "new") {
      insertSection(state.dragPayload.kind, targetId, placeAfter);
    } else if (state.dragPayload.type === "existing") {
      moveSection(state.dragPayload.id, targetId, placeAfter);
    }

    cleanupDragState();
  }

  function insertSection(kind, targetId, placeAfter) {
    const insertIndex = resolveInsertIndex(targetId, placeAfter);
    const section = createSection(kind, insertIndex);
    state.sections.splice(insertIndex, 0, section);
    state.selectedId = section.id;
    renderAll({ schedulePreview: true, saveDraft: true });
  }

  function moveSection(sectionId, targetId, placeAfter) {
    const currentIndex = state.sections.findIndex((section) => section.id === sectionId);
    if (currentIndex === -1) {
      return;
    }

    const [section] = state.sections.splice(currentIndex, 1);
    let insertIndex = resolveInsertIndex(targetId, placeAfter);
    if (insertIndex > currentIndex) {
      insertIndex -= 1;
    }

    state.sections.splice(insertIndex, 0, section);
    state.selectedId = section.id;
    renderAll({ schedulePreview: true, saveDraft: true });
  }

  function removeSelectedSection() {
    if (!state.selectedId) {
      return;
    }

    state.sections = state.sections.filter((section) => section.id !== state.selectedId);
    state.selectedId = state.sections[0] ? state.sections[0].id : null;
    renderAll({ schedulePreview: true, saveDraft: true });
  }

  function resolveInsertIndex(targetId, placeAfter) {
    if (!targetId) {
      return state.sections.length;
    }

    const targetIndex = state.sections.findIndex((section) => section.id === targetId);
    if (targetIndex === -1) {
      return state.sections.length;
    }

    return placeAfter ? targetIndex + 1 : targetIndex;
  }

  function renderAll(options) {
    syncConicalCollectorOutlets();
    updateGlobalRoughnessSummary();
    renderCanvas();
    renderInspector();
    renderHiddenInputs();
    hydratePresetSelect();
    updateHeightSummary();

    if (options && options.schedulePreview) {
      schedulePreview();
    }

    if (options && options.saveDraft) {
      saveDraftSilently();
    }
  }

  function renderCanvas() {
    elements.routeCanvas.innerHTML = "";
    elements.routeCountBadge.textContent = `${state.sections.length} блоков`;

    if (state.sections.length === 0) {
      elements.routeCanvas.innerHTML = '<div class="route-empty-state">Перетащите блок из палитры на холст или нажмите на нужный тип элемента, чтобы начать построение трассы.</div>';
      return;
    }

    state.sections.forEach((section, index) => {
      const node = document.createElement("button");
      node.type = "button";
      node.className = `route-node${section.id === state.selectedId ? " is-selected" : ""}`;
      node.dataset.id = section.id;
      node.draggable = true;
      node.innerHTML = [
        `<span class="route-node__step">${index + 1}</span>`,
        `<span class="route-node__art">${kindMeta[section.kind].icon}</span>`,
        '<span class="route-node__content">',
        `<strong class="route-node__title">${escapeHtml(getSectionTitle(section, index + 1))}</strong>`,
        `<span class="route-node__kind">${kindMeta[section.kind].label}</span>`,
        `<span class="route-node__meta">${escapeHtml(describeNodeMeta(section))}</span>`,
        "</span>"
      ].join("");

      node.addEventListener("click", () => {
        state.selectedId = section.id;
        renderCanvas();
        renderInspector();
        saveDraftSilently();
      });

      node.addEventListener("dragstart", (event) => {
        state.dragPayload = { type: "existing", id: section.id };
        node.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "move";
      });

      node.addEventListener("dragend", cleanupDragState);
      elements.routeCanvas.appendChild(node);

      if (index < state.sections.length - 1) {
        const connector = document.createElement("div");
        connector.className = "route-connector";
        connector.setAttribute("aria-hidden", "true");
        connector.textContent = "→";
        elements.routeCanvas.appendChild(connector);
      }
    });
  }

  function renderInspector() {
    hideContextTooltipNow();
    const section = getSelectedSection();

    if (!section) {
      elements.inspectorTitle.textContent = "Блок не выбран";
      elements.removeSelectedBlockBtn.classList.add("d-none");
      elements.blockInspectorBody.className = "block-inspector-empty";
      elements.blockInspectorBody.textContent = "Выберите блок на холсте, чтобы задать его параметры.";
      return;
    }

    const sectionIndex = state.sections.findIndex((item) => item.id === section.id) + 1;
    const isConicalCollector = section.kind === "LocalResistance" && isConicalCollectorType(section.localResistanceType);
    const isPipeEntrance = section.kind === "LocalResistance" && isStraightPipeEntranceType(section.localResistanceType);
    const isRoundLockedLocalResistance = isConicalCollector || isPipeEntrance;
    const shape = isRoundLockedLocalResistance ? "Round" : normalizeShape(section.crossSectionShape);
    const outletShape = normalizeShape(section.outletCrossSectionShape || shape);
    const surfaceOptions = renderOptions(getSurfaceOptions(section.materialType), section.surfaceCondition);
    const shapeOptions = [
      { value: "Round", label: "Круглое сечение" },
      { value: "Rectangle", label: "Прямоугольное сечение" }
    ];
    const shapeHint = isConicalCollector
      ? "Форма фиксируется как круглое сечение для расчетного диаметра d₀."
      : isPipeEntrance
      ? "Форма фиксируется как круглое сечение: для расчета используется диаметр Dг прямой трубы."
      : shape === "Rectangle"
      ? "Для прямоугольного канала программа автоматически вычисляет эквивалентный диаметр по формуле dэкв = 4S / П, где S = a·b, П = 2(a + b)."
      : "Для круглой трубы расчётный и эквивалентный диаметры совпадают.";
    const inletHint = `${shapeHint} Новый блок копирует параметры предыдущего только при добавлении; дальше этот участок можно менять вручную.`;
    const outletShapeHint = "Выходная форма нужна для переходов между круглыми и прямоугольными участками.";

    elements.inspectorTitle.textContent = getSectionTitle(section, sectionIndex);
    elements.removeSelectedBlockBtn.classList.remove("d-none");
    elements.blockInspectorBody.className = "";
    elements.blockInspectorBody.innerHTML = [
      '<div class="section-form">',
      '<div class="section-toggle-row">',
      renderToggle("useIndividualMaterial", section.useIndividualMaterial, "Индивидуальный материал блока"),
      renderToggle("useCustomRoughness", section.useCustomRoughness, "Собственная шероховатость"),
      "</div>",
      '<div class="section-form-grid">',
      renderTextField("Название блока", "blockTitle", section.blockTitle, "Например: участок после котла", true),
      isRoundLockedLocalResistance ? '<div class="section-form-subhead field-span-2">Основные параметры</div>' : "",
      renderNamedSelectField("Форма поперечного сечения", "crossSectionShape", shapeOptions, shape, isRoundLockedLocalResistance ? shapeHint : "Выберите геометрию входа этого конкретного участка.", isRoundLockedLocalResistance),
      renderNumberField(getEntrySizeLabel(section), "diameter", section.diameter, "0.001", "0.001", "", getEntrySizeHint(section, inletHint), getSectionUnitOptions(section, "diameter"), false),
      shape === "Rectangle"
        ? renderNumberField(getEntrySizeBLabel(section), "diameterB", section.diameterB, "0.001", "0.001", "", inletHint, getSectionUnitOptions(section, "diameterB"), false)
        : "",
      requiresSectionLength(section)
        ? renderNumberField(getLengthLabel(section), "length", section.length, "0.001", "0.001", "", getLengthHint(section), getSectionUnitOptions(section, "length"))
        : "",
      requiresSectionLength(section)
        ? renderNumberField("Теплопотери блока", "temperatureLossPerMeter", section.temperatureLossPerMeter, "0.01", "0", "10", "Внутри расчёта хранится °C/м. Если выбрано «°C всего», значение делится на длину участка.", getSectionUnitOptions(section, "temperatureLossPerMeter"))
        : "",
      section.kind === "Bend"
        ? renderNumberField("Угол поворота", "turnAngle", section.turnAngle, "1", "1", "180", "Укажите угол фактического разворота потока.", getSectionUnitOptions(section, "turnAngle"))
        : "",
      section.kind === "Contraction" || section.kind === "Expansion"
        ? renderNamedSelectField("Форма выходного сечения", "outletCrossSectionShape", shapeOptions, outletShape, outletShapeHint, false)
        : "",
      section.kind === "Contraction" || section.kind === "Expansion"
        ? renderNumberField(getOutletSizeLabel({ crossSectionShape: outletShape }), "outletDiameter", section.outletDiameter, "0.001", "0.001", "", "Для сужения выходная площадь обычно меньше входной, для расширения — больше. При смене формы программа учитывает переход как адаптер.", getSectionUnitOptions(section, "outletDiameter"))
        : "",
      (section.kind === "Contraction" || section.kind === "Expansion") && outletShape === "Rectangle"
        ? renderNumberField(getOutletSizeBLabel({ crossSectionShape: outletShape }), "outletDiameterB", section.outletDiameterB, "0.001", "0.001", "", "Для прямоугольного выхода задайте вторую сторону b.", getSectionUnitOptions(section, "outletDiameterB"))
        : "",
        "",
        section.kind === "LocalResistance"
          ? renderLocalResistanceFields(section)
          : (isKmsAdjustableSection(section)
              ? renderElementKmsFields(section)
              : ""),
      "</div>",
      shape === "Rectangle"
        ? '<p class="inspector-note">Для прямоугольного канала используется формула <strong>dэкв = 4S / П</strong>, где <strong>S = a·b</strong>, <strong>П = 2(a + b)</strong>.</p>'
        : '<p class="inspector-note">Для круглого канала эквивалентный диаметр совпадает с введённым диаметром трубы.</p>',
      '<div class="inspector-panel mt-3">',
      renderMaterialRoughnessPanel(section, surfaceOptions),
      "</div>",
      "</div>"
    ].join("");
  }

  function renderMaterialRoughnessPanel(section, surfaceOptions) {
    if (!section.useIndividualMaterial && !section.useCustomRoughness) {
      return `<div data-role="section-roughness-summary">${buildRoughnessSummaryHtml(getRoughnessSelection(null, "section"))}</div>`;
    }

    const fields = [];
    if (section.useIndividualMaterial) {
      fields.push(renderSelectField("Материал блока", "materialType", Object.keys(materialCatalog), section.materialType, "Материал будет использоваться только для этого блока."));
      fields.push(renderRawField(
        "Состояние поверхности",
        `<select class="form-select" data-field="surfaceCondition">${surfaceOptions}</select>`,
        "Выберите состояние поверхности для расчёта табличной шероховатости."
      ));
    }

    if (section.useCustomRoughness) {
      fields.push(renderNumberField("Индивидуальная шероховатость", "customRoughness", section.customRoughness, "0.000001", "0.000001", "0.1", "Это значение используется в расчёте вместо справочной шероховатости материала.", getSectionUnitOptions(section, "customRoughness")));
    }

    fields.push(`<div class="field field-span-2" data-role="section-roughness-summary">${buildRoughnessSummaryHtml(getRoughnessSelection(section, "section"))}</div>`);

    return `<div class="section-form-grid">${fields.join("")}</div>`;
  }

  function renderHiddenInputs() {
    syncConicalCollectorOutlets();
    elements.sectionInputsHost.innerHTML = "";
    const routeHeightDelta = getRouteHeightDelta();

    addGlobalHiddenInputs();

    state.sections.forEach((section, index) => {
      updateDerivedLocalResistanceParams(section);
      const localResistanceParamY = getLocalResistanceParamYForSubmit(section);
      addHiddenInput(`Sections[${index}].SectionKind`, section.kind);
      addHiddenInput(`Sections[${index}].CrossSectionShape`, section.crossSectionShape);
      addHiddenInput(`Sections[${index}].OutletCrossSectionShape`, section.outletCrossSectionShape || section.crossSectionShape);
      addHiddenInput(`Sections[${index}].BlockTitle`, section.blockTitle);
      addHiddenInput(`Sections[${index}].Diameter`, getSectionBaseValue(section, "diameter"));
      addHiddenInput(`Sections[${index}].DiameterUnit`, getSectionUnit(section, "diameter"));
      addHiddenInput(`Sections[${index}].DiameterB`, getSectionBaseValue(section, "diameterB"));
      addHiddenInput(`Sections[${index}].DiameterBUnit`, getSectionUnit(section, "diameterB"));
      addHiddenInput(`Sections[${index}].OutletDiameter`, getSectionBaseValue(section, "outletDiameter"));
      addHiddenInput(`Sections[${index}].OutletDiameterUnit`, getSectionUnit(section, "outletDiameter"));
      addHiddenInput(`Sections[${index}].OutletDiameterB`, getSectionBaseValue(section, "outletDiameterB"));
      addHiddenInput(`Sections[${index}].OutletDiameterBUnit`, getSectionUnit(section, "outletDiameterB"));
      addHiddenInput(`Sections[${index}].Length`, getSectionBaseValue(section, "length"));
      addHiddenInput(`Sections[${index}].LengthUnit`, getSectionUnit(section, "length"));
      addHiddenInput(`Sections[${index}].TemperatureLossPerMeter`, getSectionBaseValue(section, "temperatureLossPerMeter"));
      addHiddenInput(`Sections[${index}].TemperatureLossUnit`, getSectionUnit(section, "temperatureLossPerMeter"));
      addHiddenInput(`Sections[${index}].TurnAngle`, getSectionBaseValue(section, "turnAngle"));
      addHiddenInput(`Sections[${index}].TurnAngleUnit`, getSectionUnit(section, "turnAngle"));
      addHiddenInput(`Sections[${index}].HeightDelta`, index === 0 ? formatNullable(routeHeightDelta) : "0");
      addHiddenInput(`Sections[${index}].HeightDeltaUnit`, "m");
      addHiddenInput(`Sections[${index}].LocalResistanceType`, section.localResistanceType);
      addHiddenInput(`Sections[${index}].LocalResistanceParamX`, getLocalResistanceParamXForSubmit(section));
      addHiddenInput(`Sections[${index}].LocalResistanceParamY`, localResistanceParamY);
      addHiddenInput(`Sections[${index}].CustomLRC`, section.customLrc);
      addHiddenInput(`Sections[${index}].UseCustomLRC`, section.useCustomLrc ? "true" : "false");
      addHiddenInput(`Sections[${index}].UseIndividualMaterial`, section.useIndividualMaterial ? "true" : "false");
      addHiddenInput(`Sections[${index}].MaterialType`, section.materialType);
      addHiddenInput(`Sections[${index}].SurfaceCondition`, section.surfaceCondition);
      addHiddenInput(`Sections[${index}].UseCustomRoughness`, section.useCustomRoughness ? "true" : "false");
      addHiddenInput(`Sections[${index}].CustomRoughness`, getSectionBaseValue(section, "customRoughness"));
      addHiddenInput(`Sections[${index}].CustomRoughnessUnit`, getSectionUnit(section, "customRoughness"));
    });
  }

  function addGlobalHiddenInputs() {
    const routeHeightDelta = getRouteHeightDelta();
    addHiddenInput("TgasInitialUnit", getFieldUnit("TgasInitial"));
    addHiddenInput("GasFlowUnit", getFieldUnit("GasFlow"));
    addHiddenInput("CustomRoughnessUnit", getFieldUnit("CustomRoughness"));
    addHiddenInput("UseGeometricPressure", state.useGeometricPressure ? "true" : "false");
    addHiddenInput("HeightDifference", Math.abs(routeHeightDelta).toString());
    addHiddenInput("HeightDirection", routeHeightDelta > 0 ? "up" : routeHeightDelta < 0 ? "down" : "none");
    addHiddenInput("CurrentCalculationId", getFieldValue("CurrentCalculationId"));
    addHiddenInput("CurrentCalculationName", getFieldValue("CurrentCalculationName"));
    addHiddenInput("AmbientAirTemperature", state.useGeometricPressure ? formatNullable(getBaseFieldValue("AmbientAirTemperature")) : "");
    addHiddenInput("AmbientAirTemperatureUnit", getFieldUnit("AmbientAirTemperature"));
    addHiddenInput("Y_N2Unit", getFieldUnit("Y_N2"));
    addHiddenInput("Y_O2Unit", getFieldUnit("Y_O2"));
    addHiddenInput("Y_CO2Unit", getFieldUnit("Y_CO2"));
    addHiddenInput("Y_H2OUnit", getFieldUnit("Y_H2O"));
  }

  function addHiddenInput(name, value) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value == null ? "" : value;
    elements.sectionInputsHost.appendChild(input);
  }

  function schedulePreview() {
    window.clearTimeout(state.previewTimer);
    state.previewTimer = window.setTimeout(runPreview, 280);
  }

  async function runPreview() {
    renderHiddenInputs();
    const blockingMessages = collectBlockingMessages();
    if (blockingMessages.length > 0) {
      showValidationMessages(blockingMessages);
      resetPreviewWidgets();
      renderNotices(blockingMessages);
      setPreviewStatus("Есть ошибки в данных", "is-error");
      return;
    }

    setPreviewStatus("Выполняется расчёт", "");

    if (state.previewAbortController) {
      state.previewAbortController.abort();
    }

    state.previewAbortController = new AbortController();

    try {
      const response = await fetch("/Home/Preview", {
        method: "POST",
        body: buildBaseFormData(),
        signal: state.previewAbortController.signal
      });

      const data = await response.json();
      if (!response.ok) {
        const messages = Array.isArray(data.errors) ? data.errors : ["Не удалось обновить расчёт."];
        showValidationMessages(messages);
        resetPreviewWidgets();
        renderNotices(messages);
        setPreviewStatus("Есть ошибки в данных", "is-error");
        return;
      }

      applyPreviewResponse(data);
      showValidationMessages([]);
      setPreviewStatus("Расчёт обновлён", "is-success");
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }

      resetPreviewWidgets();
      const messages = ["Во время предварительного расчёта возникла ошибка."];
      showValidationMessages(messages);
      renderNotices(messages);
      setPreviewStatus("Ошибка расчёта", "is-error");
    }
  }

  function applyPreviewResponse(response) {
    const summary = response.summary || response.Summary || {};
    const results = response.results || response.Results || [];
    const recommendations = response.recommendations || response.Recommendations || [];
    const notices = response.notices || response.Notices || [];

    elements.previewEmpty.classList.toggle("d-none", results.length > 0);
    elements.liveResultsWrapper.classList.toggle("d-none", results.length === 0);

    renderLiveResults(results);
    renderMetrics(summary);
    renderRecommendations(recommendations);
    renderNotices(notices);
    updateHeightSummary(summary.totalHeightChange ?? summary.TotalHeightChange);
    updateAutoKmsField();
  }

  function renderLiveResults(results) {
    const tbody = elements.liveResultsTable.querySelector("tbody");
    tbody.innerHTML = results.map((item) => {
      const shape = translateShape(readProp(item, "crossSectionShape", "CrossSectionShape"));
      const outletShape = translateShape(readProp(item, "outletCrossSectionShape", "OutletCrossSectionShape"));
      const equivalentDiameter = formatNumber(readProp(item, "equivalentDiameter", "EquivalentDiameter"), 3);
      const outletEquivalentDiameter = formatNumber(readProp(item, "outletEquivalentDiameter", "OutletEquivalentDiameter"), 3);
      const shapeText = shape === outletShape
        ? `${escapeHtml(shape)} / ${equivalentDiameter} м`
        : `${escapeHtml(shape)} → ${escapeHtml(outletShape)} / ${equivalentDiameter}→${outletEquivalentDiameter} м`;
      return [
        "<tr>",
        `<td>${escapeHtml(readProp(item, "sectionName", "SectionName") || "—")}</td>`,
        `<td>${escapeHtml(readProp(item, "sectionType", "SectionType") || "—")}</td>`,
        `<td>${shapeText}</td>`,
        `<td>${formatNumber(readProp(item, "flowVelocity", "FlowVelocity"), 2)} м/с</td>`,
        `<td>${formatNumber(readProp(item, "lambda", "Lambda"), 4)} / ${formatNumber(readProp(item, "zeta", "Zeta"), 3)}</td>`,
        `<td>${formatNumber(readProp(item, "pressureDropFriction", "PressureDropFriction"), 1)}</td>`,
        `<td>${formatNumber(readProp(item, "pressureDropLocal", "PressureDropLocal"), 1)}</td>`,
        `<td>${formatNumber(readProp(item, "geometricPressureDrop", "GeometricPressureDrop"), 1)}</td>`,
        `<td>${formatNumber(readProp(item, "totalPressureDrop", "TotalPressureDrop"), 1)}</td>`,
        `<td>${escapeHtml(readProp(item, "dominantLossType", "DominantLossType") || "—")}</td>`,
        "</tr>"
      ].join("");
    }).join("");
  }

  function renderMetrics(summary) {
    elements.metricTotal.textContent = `${formatNumber(readProp(summary, "totalPressureDrop", "TotalPressureDrop"), 1)} Па`;
    elements.metricFriction.textContent = `${formatNumber(readProp(summary, "frictionLoss", "FrictionLoss"), 1)} Па`;
    elements.metricLocal.textContent = `${formatNumber(readProp(summary, "localLoss", "LocalLoss"), 1)} Па`;
    elements.metricGeometric.textContent = `${formatNumber(readProp(summary, "geometricLoss", "GeometricLoss"), 1)} Па`;
    elements.metricLength.textContent = `${formatNumber(readProp(summary, "totalRouteLength", "TotalRouteLength"), 2)} м`;
    elements.metricVelocity.textContent = `${formatNumber(readProp(summary, "maxVelocity", "MaxVelocity"), 2)} м/с`;
    elements.metricCritical.textContent = readProp(summary, "criticalSectionName", "CriticalSectionName") || "—";
    elements.efficiencyLabel.textContent = readProp(summary, "efficiencyLabel", "EfficiencyLabel") || "Ожидается расчёт";
  }

  function renderRecommendations(recommendations) {
    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      elements.recommendationsList.innerHTML = '<p class="muted-text">Рекомендации появятся после первого успешного расчёта.</p>';
      return;
    }

    elements.recommendationsList.innerHTML = recommendations.map((item) => {
      const title = escapeHtml(readProp(item, "title", "Title") || "Рекомендация");
      const priority = escapeHtml(readProp(item, "priority", "Priority") || "Средний");
      const description = escapeHtml(readProp(item, "description", "Description") || "");
      const impactText = escapeHtml(readProp(item, "impactText", "ImpactText") || "");
      return [
        '<article class="recommendation-card">',
        '<div class="recommendation-head">',
        `<strong>${title}</strong>`,
        `<span>${priority}</span>`,
        "</div>",
        `<p>${description}</p>`,
        impactText ? `<small>${impactText}</small>` : "",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderNotices(notices) {
    const serverNotices = Array.isArray(notices)
      ? notices
          .filter((notice) => !String(notice).startsWith("Между блоками"))
          .map((notice) => ({ text: notice }))
      : [];
    const connectionNotices = buildConnectionNotices();
    const allNotices = serverNotices.concat(connectionNotices);

    if (allNotices.length === 0) {
      elements.noticesList.innerHTML = '<li class="muted-text">Пока сообщений нет.</li>';
      return;
    }

    elements.noticesList.innerHTML = allNotices.map((notice) => {
      const action = notice.actionIndex == null
        ? ""
        : `<button type="button" class="btn btn-sm btn-outline-primary mt-2" data-insert-transition-after="${notice.actionIndex}">Вставить переход</button>`;
      return `<li>${escapeHtml(notice.text)}${action}</li>`;
    }).join("");
  }

  function buildConnectionNotices() {
    const notices = [];
    for (let index = 0; index < state.sections.length - 1; index += 1) {
      const previousOutlet = getEffectiveOutletConnection(state.sections[index]);
      const nextInlet = getEffectiveInletConnection(state.sections[index + 1]);
      if (!previousOutlet.sizeA || !nextInlet.sizeA) {
        continue;
      }

      const shapeMismatch = previousOutlet.shape !== nextInlet.shape;
      const sizeMismatch = Math.abs(previousOutlet.sizeA - nextInlet.sizeA) > 0.000001;
      const secondSizeMismatch = previousOutlet.shape === "Rectangle" &&
        nextInlet.shape === "Rectangle" &&
        previousOutlet.sizeB != null &&
        nextInlet.sizeB != null &&
        Math.abs(previousOutlet.sizeB - nextInlet.sizeB) > 0.000001;

      if (shapeMismatch || sizeMismatch || secondSizeMismatch) {
        notices.push({
          text: `Между блоками ${index + 1} и ${index + 2} меняется форма или размер сечения. Можно вставить переход-конфузор/диффузор, чтобы не считать скачок как прямое соединение.`,
          actionIndex: index
        });
      }
    }

    return notices;
  }

  function handleNoticeAction(event) {
    const button = event.target.closest("[data-insert-transition-after]");
    if (!button) {
      return;
    }

    const index = parseInt(button.dataset.insertTransitionAfter, 10);
    if (Number.isNaN(index)) {
      return;
    }

    insertTransitionBetween(index);
  }

  function resetPreviewWidgets() {
    elements.previewEmpty.classList.remove("d-none");
    elements.liveResultsWrapper.classList.add("d-none");
    elements.metricTotal.textContent = "0 Па";
    elements.metricFriction.textContent = "0 Па";
    elements.metricLocal.textContent = "0 Па";
    elements.metricGeometric.textContent = "0 Па";
    elements.metricLength.textContent = "0 м";
    elements.metricVelocity.textContent = "0 м/с";
    elements.metricCritical.textContent = "—";
    elements.efficiencyLabel.textContent = "Ожидается расчёт";
    renderRecommendations([]);
    renderNotices([]);
    updateHeightSummary();
  }

  function setPreviewStatus(text, toneClass) {
    elements.previewStatus.textContent = text;
    elements.previewStatus.className = "status-badge";
    if (toneClass) {
      elements.previewStatus.classList.add(toneClass);
    }
  }

  function updateHeightSummary(totalHeightFromSummary) {
    const totalHeight = typeof totalHeightFromSummary === "number"
      ? totalHeightFromSummary
      : getRouteHeightDelta();

    if (Math.abs(totalHeight) < 0.0001) {
      elements.heightSummary.textContent = "Суммарный перепад высоты по текущему маршруту: 0.00 м.";
      updateGeometryPressurePanel(totalHeight);
      return;
    }

    const direction = totalHeight > 0 ? "подъём" : "снижение";
    elements.heightSummary.textContent = `Суммарный перепад высоты по текущему маршруту: ${formatNumber(totalHeight, 2)} м (${direction}).`;
    updateGeometryPressurePanel(totalHeight);
  }

  function getRouteHeightDelta() {
    return parseNumber(getBaseFieldValue("RouteHeightDelta"), 0) || 0;
  }

  function updateGeometryPressurePanel(totalHeight) {
    if (!elements.geometryPressureSummary || !elements.geometryPressureSignHint) {
      return;
    }

    if (!state.useGeometricPressure) {
      elements.geometryPressureSummary.textContent = "Учет выключен: геометрическая составляющая не добавляется к общим потерям.";
      elements.geometryPressureSignHint.textContent = "Включите блок, если конечная отметка трассы выше или ниже начальной и это нужно учесть в расчете.";
      return;
    }

    if (Math.abs(totalHeight) < 0.0001) {
      elements.geometryPressureSummary.textContent = "H = 0: конечная и начальная отметки совпадают, геометрическое давление не учитывается.";
      elements.geometryPressureSignHint.textContent = "Подъемы и спуски на одинаковую высоту взаимно компенсируются.";
      return;
    }

    if (totalHeight > 0) {
      elements.geometryPressureSummary.textContent = `H = ${formatNumber(totalHeight, 2)} м: конечная точка трассы выше начальной.`;
      elements.geometryPressureSignHint.textContent = "Горячие газы движутся вверх естественно, поэтому ΔPгеом считается со знаком минус и уменьшает общее сопротивление.";
      return;
    }

    elements.geometryPressureSummary.textContent = `H = ${formatNumber(totalHeight, 2)} м: конечная точка трассы ниже начальной.`;
    elements.geometryPressureSignHint.textContent = "Горячие газы приходится вести вниз, поэтому ΔPгеом считается со знаком плюс и увеличивает общее сопротивление.";
  }

  function toggleGeometryPressureAnalysis() {
    hydrateGeometryPressureWidget(!state.useGeometricPressure);
    updateAmbientAirDensity();
    updateHeightSummary();
    renderHiddenInputs();
    saveDraftSilently();
    schedulePreview();
  }

  function hydrateGeometryPressureWidget(isEnabled) {
    state.useGeometricPressure = Boolean(isEnabled);
    if (elements.geometricPressureBody) {
      elements.geometricPressureBody.classList.toggle("d-none", !state.useGeometricPressure);
    }
    if (elements.toggleGeometryPressureBtn) {
      elements.toggleGeometryPressureBtn.classList.toggle("btn-primary", state.useGeometricPressure);
      elements.toggleGeometryPressureBtn.classList.toggle("btn-outline-primary", !state.useGeometricPressure);
      elements.toggleGeometryPressureBtn.textContent = state.useGeometricPressure
        ? "Учет геометрического давления включен"
        : "Учитывать в расчете";
    }
  }

  function updateAmbientAirDensity() {
    if (!elements.ambientAirDensityValue) {
      return;
    }

    const density = calculateAmbientAirDensity();
    elements.ambientAirDensityValue.textContent = density == null
      ? "—"
      : `${formatNumber(density, 3)} кг/м³`;
  }

  function calculateAmbientAirDensity() {
    const temperature = getBaseFieldValue("AmbientAirTemperature");
    if (temperature == null) {
      return null;
    }

    const absoluteTemperature = temperature + 273.15;
    if (absoluteTemperature <= 0) {
      return null;
    }

    return getAirDensityReference() * 273.15 / absoluteTemperature;
  }

  function getAirDensityReference() {
    const value = Number(config.airDensityAtNormalConditions ?? config.AirDensityAtNormalConditions);
    return Number.isFinite(value) && value > 0 ? value : 1.293;
  }

  function updateGasCompositionSummary() {
    if (!elements.gasCompositionSummary) {
      return;
    }

    const sum = getGasCompositionSum();
    const percent = sum * 100;
    const isValid = percent >= 99 && percent <= 100;
    elements.gasCompositionSummary.textContent = `Сумма: ${formatNumber(percent, 1)}%`;
    elements.gasCompositionSummary.classList.toggle("is-error", !isValid);

    gasComponentFieldIds.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.classList.toggle("is-invalid", !isValid);
      }
    });
  }

  function getGasCompositionSum() {
    return gasComponentFieldIds.reduce((total, fieldId) => total + (getBaseFieldValue(fieldId) || 0), 0);
  }

  function collectBlockingMessages() {
    syncConicalCollectorOutlets();
    const messages = [];
    const sum = getGasCompositionSum();
    if (sum > 1.000001) {
      messages.push(`Сумма компонентов газа больше 100% (${formatNumber(sum * 100, 1)}%). Сформировать отчет невозможно.`);
    } else if (sum < 0.99) {
      messages.push(`Сумма компонентов газа меньше 100% (${formatNumber(sum * 100, 1)}%). Проверьте состав перед формированием отчета.`);
    }

    if (state.useGeometricPressure && calculateAmbientAirDensity() == null) {
      messages.push("Учет геометрического давления включен, но температура наружного воздуха задана некорректно.");
    }

    state.sections.forEach((section, index) => {
      const title = getSectionTitle(section, index + 1);
      if (requiresSectionLength(section) && parseNumber(getSectionBaseValue(section, "length"), null) == null) {
        messages.push(`Поле «Длина элемента» в блоке «${title}» не заполнено. Без длины невозможно сформировать корректный отчет.`);
      }

      if (parseNumber(getSectionBaseValue(section, "diameter"), null) == null) {
        messages.push(`Поле «${getEntrySizeLabel(section)}» в блоке «${title}» не заполнено.`);
      }

      if (normalizeShape(section.crossSectionShape) === "Rectangle" &&
          parseNumber(getSectionBaseValue(section, "diameterB"), null) == null) {
        messages.push(`Поле «${getEntrySizeBLabel(section)}» в блоке «${title}» не заполнено.`);
      }

      if (isKmsAdjustableSection(section)) {
        if (section.useCustomLrc && parseNumber(section.customLrc, null) == null) {
          messages.push(`В блоке «${title}» разблокирован КМС, но пользовательское значение не введено.`);
        }
      }

      if (section.kind === "LocalResistance") {
        if (!section.useCustomLrc && !section.localResistanceType) {
          messages.push(`В блоке «${title}» не выбран тип местного сопротивления для автоматического расчета КМС.`);
        }

        if (!section.useCustomLrc && section.localResistanceType) {
          const resistanceItem = getLocalResistanceItem(section.localResistanceType);
          const isConical = isConicalCollectorType(section.localResistanceType);
          const isPipeEntrance = isStraightPipeEntranceType(section.localResistanceType);
          const resistanceContext = getResistanceParameterContext(section, resistanceItem);
          if (!resistanceItem) {
            messages.push(`В блоке «${title}» для типа «${section.localResistanceType}» не найдено значение КМС в таблице LRCs.`);
          } else if (isTabularResistance(resistanceItem) &&
              (resistanceContext.rawParamX == null || resistanceContext.rawParamY == null)) {
            messages.push(isConical
              ? `В блоке «${title}» для конического коллектора укажите выходной диаметр d₀, длину раструба l и угол α.`
              : isPipeEntrance
                ? `В блоке «${title}» для входа в прямую трубу укажите диаметр Dг, расстояние b и толщину кромки δ₁.`
                : `В блоке «${title}» для табличного сопротивления «${section.localResistanceType}» укажите угол α и отношение l/d₀.`);
          } else if (getLocalResistanceValue(section) == null) {
            messages.push(`В блоке «${title}» параметры сопротивления «${section.localResistanceType}» не попадают в расчетную таблицу LRCs.`);
          }
        }
      }
    });

    return messages;
  }

  async function savePreset() {
    const name = (elements.presetName.value || "").trim();
    if (!name) {
      setPresetStatus("Укажите название заготовки перед сохранением.", true);
      return;
    }

    const payloadModel = buildApiModel();
    if (!payloadModel) {
      setPresetStatus("Для сохранения заготовки сначала заполните основные числовые параметры трассы.", true);
      return;
    }

    try {
      const response = await fetch("/Home/SavePreset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name,
          model: payloadModel
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        if (response.status === 401) {
          const preset = saveGuestPreset(name, payloadModel);
          hydratePresetSelect(preset.id);
          elements.presetName.value = "";
          setPresetStatus("Гостевая заготовка сохранена в браузере. После входа она перенесется в профиль.");
          return;
        }

        setPresetStatus(data.error || "Не удалось сохранить заготовку.", true);
        return;
      }

      state.presets = Array.isArray(data.presets) ? data.presets : state.presets.filter((preset) => !isGuestPresetId(readProp(preset, "id", "Id")));
      hydratePresetSelect(data.presetId);
      elements.presetName.value = "";
      setPresetStatus("Заготовка сохранена в базе данных пользователя.");
    } catch (_error) {
      const preset = saveGuestPreset(name, payloadModel);
      hydratePresetSelect(preset.id);
      elements.presetName.value = "";
      setPresetStatus("Сервер недоступен, поэтому заготовка сохранена как гостевая в браузере.");
    }
  }

  async function loadPreset() {
    const presetId = elements.presetSelect.value;
    if (!presetId) {
      setPresetStatus("Сначала выберите сохранённую заготовку.", true);
      return;
    }

    if (isGuestPresetId(presetId)) {
      const preset = state.presets.find((item) => String(readProp(item, "id", "Id")) === presetId);
      if (!preset || !preset.model) {
        setPresetStatus("Гостевая заготовка не найдена.", true);
        return;
      }

      applySnapshot({
        form: mapModelToDraftForm(preset.model),
        sections: readProp(preset.model, "sections", "Sections") || [],
        selectedId: null
      }, `Гостевая заготовка «${preset.name || "без названия"}» загружена в редактор.`);

      hydratePresetSelect(presetId);
      return;
    }

    try {
      const response = await fetch(`/Home/GetPreset?id=${encodeURIComponent(presetId)}`);
      const data = await response.json();
      if (!response.ok) {
        setPresetStatus(data.error || "Не удалось загрузить заготовку.", true);
        return;
      }

      applySnapshot({
        form: mapModelToDraftForm(data.model),
        sections: readProp(data.model, "sections", "Sections") || [],
        selectedId: null
      }, `Заготовка «${data.name || "без названия"}» загружена в редактор.`);

      hydratePresetSelect(presetId);
    } catch (_error) {
      setPresetStatus("Не удалось загрузить заготовку.", true);
    }
  }

  async function deletePreset() {
    const presetId = elements.presetSelect.value;
    if (!presetId) {
      setPresetStatus("Выберите заготовку, которую нужно удалить.", true);
      return;
    }

    if (isGuestPresetId(presetId)) {
      deleteGuestPreset(presetId);
      hydratePresetSelect("");
      setPresetStatus("Гостевая заготовка удалена из браузера.");
      return;
    }

    try {
      const response = await fetch(`/Home/DeletePreset?id=${encodeURIComponent(presetId)}`, {
        method: "POST"
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setPresetStatus(data.error || "Не удалось удалить заготовку.", true);
        return;
      }

      state.presets = Array.isArray(data.presets) ? data.presets : [];
      hydratePresetSelect("");
      setPresetStatus("Заготовка удалена из базы данных.");
    } catch (_error) {
      setPresetStatus("Не удалось удалить заготовку.", true);
    }
  }

  function clearDraft() {
    window.localStorage.removeItem(draftKey);
    window.location.href = "/Home/Calc";
  }

  function loadGuestPresets() {
    try {
      const raw = window.localStorage.getItem(guestPresetKey);
      const presets = raw ? JSON.parse(raw) : [];
      return Array.isArray(presets) ? presets : [];
    } catch (_error) {
      return [];
    }
  }

  function saveGuestPreset(name, model) {
    const presets = loadGuestPresets();
    const now = new Date().toISOString();
    const preset = {
      id: `guest:${Date.now()}`,
      name,
      model,
      updatedAtLocal: now
    };

    const existingIndex = presets.findIndex((item) => item && item.name === name);
    if (existingIndex >= 0) {
      preset.id = presets[existingIndex].id || preset.id;
      presets[existingIndex] = preset;
    } else {
      presets.unshift(preset);
    }

    window.localStorage.setItem(guestPresetKey, JSON.stringify(presets));
    state.presets = state.presets.filter((item) => !isGuestPresetId(readProp(item, "id", "Id"))).concat(presets);
    return preset;
  }

  function deleteGuestPreset(id) {
    const presets = loadGuestPresets().filter((item) => String(item.id) !== String(id));
    window.localStorage.setItem(guestPresetKey, JSON.stringify(presets));
    state.presets = state.presets.filter((item) => String(readProp(item, "id", "Id")) !== String(id));
  }

  function isGuestPresetId(id) {
    return String(id || "").startsWith("guest:");
  }

  function hydratePresetSelect(selectedId) {
    if (!elements.presetSelect) {
      return;
    }

    const currentValue = selectedId == null ? elements.presetSelect.value : String(selectedId);
    elements.presetSelect.innerHTML = ['<option value="">Выберите заготовку</option>']
      .concat(state.presets.map((preset) => {
        const id = readProp(preset, "id", "Id");
        const name = readProp(preset, "name", "Name") || "Без названия";
        const updatedAt = formatPresetDate(readProp(preset, "updatedAtLocal", "UpdatedAtLocal"));
        return `<option value="${escapeAttr(String(id))}">${escapeHtml(updatedAt ? `${name} (${updatedAt})` : name)}</option>`;
      }))
      .join("");

    if (currentValue) {
      elements.presetSelect.value = String(currentValue);
    }
  }

  function setPresetStatus(message, isError) {
    elements.presetStatus.textContent = message;
    elements.presetStatus.style.color = isError ? "var(--danger)" : "var(--muted)";
  }

  function formatPresetDate(value) {
    if (!value) {
      return "";
    }

    const raw = String(value);
    if (/^\d{2}\.\d{2}\.\d{4}/.test(raw)) {
      return raw;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return raw;
    }

    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(parsed).replace(",", "");
  }

  function saveDraftSilently() {
    const snapshot = {
      form: collectDraftForm(),
      sections: state.sections,
      selectedId: state.selectedId
    };

    window.localStorage.setItem(draftKey, JSON.stringify(snapshot));
  }

  function loadDraft() {
    try {
      const raw = window.localStorage.getItem(draftKey);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function applySnapshot(snapshot, statusMessage) {
    if (!snapshot) {
      return;
    }

    applyDraftForm(snapshot.form || {});
    state.sections = normalizeSections(snapshot.sections);
    state.selectedId = state.sections.some((section) => section.id === snapshot.selectedId)
      ? snapshot.selectedId
      : (state.sections[0] ? state.sections[0].id : null);

    renderAll({ schedulePreview: true, saveDraft: true });
    setPresetStatus(statusMessage);
  }

  function collectDraftForm() {
    return {
      tgasInitial: getFieldValue("TgasInitial"),
      temperatureLossPerMeter: getFieldValue("TemperatureLossPerMeter"),
      gasFlow: getFieldValue("GasFlow"),
      optimizationGoal: getFieldValue("OptimizationGoal"),
      materialType: getFieldValue("MaterialType"),
      surfaceCondition: getFieldValue("SurfaceCondition"),
      useCustomRoughness: elements.useCustomRoughness.checked,
      customRoughness: getFieldValue("CustomRoughness"),
      useGeometricPressure: state.useGeometricPressure,
      routeHeightDelta: getFieldValue("RouteHeightDelta"),
      ambientAirTemperature: getFieldValue("AmbientAirTemperature"),
      yN2: getFieldValue("Y_N2"),
      yO2: getFieldValue("Y_O2"),
      yCO2: getFieldValue("Y_CO2"),
      yH2O: getFieldValue("Y_H2O"),
      units: collectGlobalUnits()
    };
  }

  function applyDraftForm(formValues) {
    applyGlobalUnits(formValues.units || {});
    setFieldValue("TgasInitial", formValues.tgasInitial);
    setFieldValue("TemperatureLossPerMeter", formValues.temperatureLossPerMeter);
    setFieldValue("GasFlow", formValues.gasFlow);
    setFieldValue("OptimizationGoal", formValues.optimizationGoal);
    setFieldValue("MaterialType", formValues.materialType || elements.globalMaterialType.value);
    syncGlobalSurfaceOptions(formValues.surfaceCondition);
    elements.useCustomRoughness.checked = Boolean(formValues.useCustomRoughness);
    toggleGlobalRoughnessField();
    setFieldValue("CustomRoughness", formValues.customRoughness);
    setFieldValue("Y_N2", formValues.yN2);
    setFieldValue("Y_O2", formValues.yO2);
    setFieldValue("Y_CO2", formValues.yCO2);
    setFieldValue("Y_H2O", formValues.yH2O);
    hydrateGeometryPressureWidget(Boolean(formValues.useGeometricPressure));
    setFieldValue("RouteHeightDelta", formValues.routeHeightDelta);
    setFieldValue("AmbientAirTemperature", formValues.ambientAirTemperature);
    updateAmbientAirDensity();
    updateHeightSummary();
    updateGasCompositionSummary();
    updateGlobalRoughnessSummary();
  }

  function resetStaticFormToDefaults() {
    form.reset();
    syncGlobalSurfaceOptions();
    toggleGlobalRoughnessField();
    initUnitSelectors();
    hydrateGeometryPressureWidget(false);
    updateAmbientAirDensity();
    updateGasCompositionSummary();
    updateGlobalRoughnessSummary();
    setPreviewStatus("Ожидание расчёта", "");
    showValidationMessages([]);
  }

  function buildApiModel() {
    syncConicalCollectorOutlets();
    const tgasInitial = getBaseFieldValue("TgasInitial");
    const temperatureLossPerMeter = getBaseFieldValue("TemperatureLossPerMeter");
    const gasFlow = getBaseFieldValue("GasFlow");

    if (tgasInitial == null || temperatureLossPerMeter == null || gasFlow == null) {
      return null;
    }

    const totalHeight = getRouteHeightDelta();

    return {
      CurrentCalculationId: parseNumber(getFieldValue("CurrentCalculationId"), null),
      CurrentCalculationName: getFieldValue("CurrentCalculationName") || null,
      TgasInitial: tgasInitial,
      TgasInitialUnit: getFieldUnit("TgasInitial"),
      TemperatureLossPerMeter: temperatureLossPerMeter,
      GasFlow: gasFlow,
      GasFlowUnit: getFieldUnit("GasFlow"),
      OptimizationGoal: getFieldValue("OptimizationGoal"),
      MaterialType: getGlobalMaterial(),
      SurfaceCondition: getGlobalSurfaceCondition(),
      UseCustomRoughness: elements.useCustomRoughness.checked,
      CustomRoughness: getBaseFieldValue("CustomRoughness"),
      CustomRoughnessUnit: getFieldUnit("CustomRoughness"),
      HeightDifference: Math.abs(totalHeight),
      HeightDirection: totalHeight > 0 ? "up" : totalHeight < 0 ? "down" : "none",
      UseGeometricPressure: state.useGeometricPressure,
      AmbientAirTemperature: getBaseFieldValue("AmbientAirTemperature"),
      AmbientAirTemperatureUnit: getFieldUnit("AmbientAirTemperature"),
      AmbientAirDensity: calculateAmbientAirDensity(),
      AirDensityAtNormalConditions: getAirDensityReference(),
      Y_N2: getBaseFieldValue("Y_N2"),
      Y_N2Unit: getFieldUnit("Y_N2"),
      Y_O2: getBaseFieldValue("Y_O2"),
      Y_O2Unit: getFieldUnit("Y_O2"),
      Y_CO2: getBaseFieldValue("Y_CO2"),
      Y_CO2Unit: getFieldUnit("Y_CO2"),
      Y_H2O: getBaseFieldValue("Y_H2O"),
      Y_H2OUnit: getFieldUnit("Y_H2O"),
      Sections: state.sections.map((section, index) => {
        updateDerivedLocalResistanceParams(section);
        return {
          SectionKind: section.kind,
          CrossSectionShape: section.crossSectionShape,
          OutletCrossSectionShape: section.outletCrossSectionShape || section.crossSectionShape,
          BlockTitle: section.blockTitle || null,
          Diameter: parseNumber(getSectionBaseValue(section, "diameter"), null),
          DiameterUnit: getSectionUnit(section, "diameter"),
          DiameterB: parseNumber(getSectionBaseValue(section, "diameterB"), null),
          DiameterBUnit: getSectionUnit(section, "diameterB"),
          OutletDiameter: parseNumber(getSectionBaseValue(section, "outletDiameter"), null),
          OutletDiameterUnit: getSectionUnit(section, "outletDiameter"),
          OutletDiameterB: parseNumber(getSectionBaseValue(section, "outletDiameterB"), null),
          OutletDiameterBUnit: getSectionUnit(section, "outletDiameterB"),
          Length: parseNumber(getSectionBaseValue(section, "length"), null),
          LengthUnit: getSectionUnit(section, "length"),
          TemperatureLossPerMeter: parseNumber(getSectionBaseValue(section, "temperatureLossPerMeter"), null),
          TemperatureLossUnit: getSectionUnit(section, "temperatureLossPerMeter"),
          TurnAngle: parseNumber(getSectionBaseValue(section, "turnAngle"), null),
          TurnAngleUnit: getSectionUnit(section, "turnAngle"),
          HeightDelta: index === 0 ? totalHeight : 0,
          HeightDeltaUnit: "m",
          LocalResistanceType: section.localResistanceType || null,
          LocalResistanceParamX: parseNumber(getLocalResistanceParamXForSubmit(section), null),
          LocalResistanceParamY: parseNumber(getLocalResistanceParamYForSubmit(section), null),
          CustomLRC: parseNumber(section.customLrc, null),
          UseCustomLRC: section.useCustomLrc,
          UseIndividualMaterial: section.useIndividualMaterial,
          MaterialType: section.materialType || null,
          SurfaceCondition: section.surfaceCondition || null,
          UseCustomRoughness: section.useCustomRoughness,
          CustomRoughness: parseNumber(getSectionBaseValue(section, "customRoughness"), null),
          CustomRoughnessUnit: getSectionUnit(section, "customRoughness")
        };
      })
    };
  }

  function mapModelToDraftForm(model) {
    const units = {
      TgasInitial: readProp(model, "tgasInitialUnit", "TgasInitialUnit") || "c",
      GasFlow: readProp(model, "gasFlowUnit", "GasFlowUnit") || "m3s",
      CustomRoughness: readProp(model, "customRoughnessUnit", "CustomRoughnessUnit") || "m",
      AmbientAirTemperature: readProp(model, "ambientAirTemperatureUnit", "AmbientAirTemperatureUnit") || "c",
      RouteHeightDelta: "m",
      Y_N2: readProp(model, "y_N2Unit", "Y_N2Unit") || "fraction",
      Y_O2: readProp(model, "y_O2Unit", "Y_O2Unit") || "fraction",
      Y_CO2: readProp(model, "y_CO2Unit", "Y_CO2Unit") || "fraction",
      Y_H2O: readProp(model, "y_H2OUnit", "Y_H2OUnit") || "fraction"
    };
    const heightDifference = parseNumber(readProp(model, "heightDifference", "HeightDifference"), 0) || 0;
    const heightDirection = readProp(model, "heightDirection", "HeightDirection");
    const sectionHeight = (readProp(model, "sections", "Sections") || [])
      .reduce((sum, section) => sum + (parseNumber(readProp(section, "heightDelta", "HeightDelta"), 0) || 0), 0);
    const routeHeightDelta = heightDirection === "down"
      ? -heightDifference
      : heightDirection === "up"
        ? heightDifference
        : sectionHeight;

    return {
      tgasInitial: formatDisplayFromBase(readProp(model, "tgasInitial", "TgasInitial"), "c", units.TgasInitial),
      temperatureLossPerMeter: readProp(model, "temperatureLossPerMeter", "TemperatureLossPerMeter"),
      gasFlow: formatDisplayFromBase(readProp(model, "gasFlow", "GasFlow"), "m3s", units.GasFlow),
      optimizationGoal: readProp(model, "optimizationGoal", "OptimizationGoal"),
      materialType: readProp(model, "materialType", "MaterialType"),
      surfaceCondition: readProp(model, "surfaceCondition", "SurfaceCondition"),
      useCustomRoughness: readProp(model, "useCustomRoughness", "UseCustomRoughness"),
      customRoughness: formatDisplayFromBase(readProp(model, "customRoughness", "CustomRoughness"), "m", units.CustomRoughness),
      useGeometricPressure: readProp(model, "useGeometricPressure", "UseGeometricPressure"),
      routeHeightDelta: formatDisplayFromBase(routeHeightDelta, "m", units.RouteHeightDelta),
      ambientAirTemperature: formatDisplayFromBase(readProp(model, "ambientAirTemperature", "AmbientAirTemperature"), "c", units.AmbientAirTemperature),
      yN2: formatDisplayFromBase(readProp(model, "y_N2", "Y_N2"), "fraction", units.Y_N2),
      yO2: formatDisplayFromBase(readProp(model, "y_O2", "Y_O2"), "fraction", units.Y_O2),
      yCO2: formatDisplayFromBase(readProp(model, "y_CO2", "Y_CO2"), "fraction", units.Y_CO2),
      yH2O: formatDisplayFromBase(readProp(model, "y_H2O", "Y_H2O"), "fraction", units.Y_H2O),
      units
    };
  }

  function normalizeSections(sourceSections) {
    const items = Array.isArray(sourceSections) ? sourceSections : [];

    return items.map((rawSection) => ensureSection(normalizeSection(rawSection)));
  }

  function normalizeSection(rawSection) {
    const kind = normalizeKind(readProp(rawSection, "kind", "Kind", "sectionKind", "SectionKind"));
    const hasModelUnitProps = !readProp(rawSection, "units", "Units") && Boolean(readProp(rawSection, "diameterUnit", "DiameterUnit"));
    const normalized = {
      id: readProp(rawSection, "id", "Id") || createId(),
      kind: kind,
      crossSectionShape: sanitizeValue(readProp(rawSection, "crossSectionShape", "CrossSectionShape")),
      outletCrossSectionShape: sanitizeValue(readProp(rawSection, "outletCrossSectionShape", "OutletCrossSectionShape")),
      blockTitle: sanitizeValue(readProp(rawSection, "blockTitle", "BlockTitle")),
      diameter: sanitizeValue(readProp(rawSection, "diameter", "Diameter")),
      diameterB: sanitizeValue(readProp(rawSection, "diameterB", "DiameterB")),
      outletDiameter: sanitizeValue(readProp(rawSection, "outletDiameter", "OutletDiameter")),
      outletDiameterB: sanitizeValue(readProp(rawSection, "outletDiameterB", "OutletDiameterB")),
      length: sanitizeValue(readProp(rawSection, "length", "Length")),
      temperatureLossPerMeter: sanitizeValue(readProp(rawSection, "temperatureLossPerMeter", "TemperatureLossPerMeter")),
      turnAngle: sanitizeValue(readProp(rawSection, "turnAngle", "TurnAngle")),
      heightDelta: sanitizeValue(readProp(rawSection, "heightDelta", "HeightDelta")),
      localResistanceType: sanitizeValue(readProp(rawSection, "localResistanceType", "LocalResistanceType")),
      localResistanceParamX: sanitizeValue(readProp(rawSection, "localResistanceParamX", "LocalResistanceParamX")),
      localResistanceParamY: sanitizeValue(readProp(rawSection, "localResistanceParamY", "LocalResistanceParamY")),
      customLrc: sanitizeValue(readProp(rawSection, "customLrc", "CustomLRC")),
      useCustomLrc: Boolean(readProp(rawSection, "useCustomLrc", "UseCustomLRC")),
      useIndividualMaterial: Boolean(readProp(rawSection, "useIndividualMaterial", "UseIndividualMaterial")),
      materialType: sanitizeValue(readProp(rawSection, "materialType", "MaterialType")),
      surfaceCondition: sanitizeValue(readProp(rawSection, "surfaceCondition", "SurfaceCondition")),
      useCustomRoughness: Boolean(readProp(rawSection, "useCustomRoughness", "UseCustomRoughness")),
      customRoughness: sanitizeValue(readProp(rawSection, "customRoughness", "CustomRoughness")),
      units: normalizeSectionUnits(readProp(rawSection, "units", "Units") || mapSectionUnitProps(rawSection))
    };

    return hasModelUnitProps ? applySectionDisplayUnitsFromBase(normalized) : normalized;
  }

  function ensureSection(section) {
    const defaults = kindMeta[section.kind].createDefaults();
    section.units = normalizeSectionUnits(section.units);
    section.localResistanceType = section.localResistanceType || defaults.localResistanceType || "";
    section.crossSectionShape = normalizeShape(section.crossSectionShape);
    if (section.kind === "LocalResistance" &&
        (isConicalCollectorType(section.localResistanceType) || isStraightPipeEntranceType(section.localResistanceType))) {
      section.crossSectionShape = "Round";
    }
    section.outletCrossSectionShape = section.kind === "Contraction" || section.kind === "Expansion"
      ? normalizeShape(section.outletCrossSectionShape || section.crossSectionShape)
      : section.crossSectionShape;
    section.diameter = section.diameter || defaults.diameter || "";
    if (section.crossSectionShape === "Rectangle") {
      section.diameterB = section.diameterB || section.diameter || defaults.diameter || "";
    } else {
      section.diameterB = "";
    }
    section.length = section.length || defaults.length || "";
    section.temperatureLossPerMeter = section.temperatureLossPerMeter || getFieldValue("TemperatureLossPerMeter") || "0.18";
    section.turnAngle = section.turnAngle || defaults.turnAngle || "";
    section.outletDiameter = section.outletDiameter || defaults.outletDiameter || "";
    if (section.outletCrossSectionShape === "Rectangle") {
      section.outletDiameterB = section.outletDiameterB || section.outletDiameter || section.diameterB || "";
    } else {
      section.outletDiameterB = "";
    }
    section.heightDelta = section.heightDelta || defaults.heightDelta || "0";
    section.materialType = section.materialType || getGlobalMaterial();

    const availableConditions = getSurfaceOptions(section.materialType);
    if (!availableConditions.includes(section.surfaceCondition)) {
      section.surfaceCondition = availableConditions[0] || "";
    }

    updateDerivedLocalResistanceParams(section);
    return section;
  }

  function createSection(kind, insertIndex) {
    const defaults = kindMeta[kind].createDefaults();
    const materialType = getGlobalMaterial();
    const conditions = getSurfaceOptions(materialType);
    const previous = typeof insertIndex === "number" && insertIndex > 0
      ? state.sections[insertIndex - 1]
      : null;
    const previousOutlet = previous ? getEffectiveOutletConnection(previous) : null;
    const inheritedUnits = previous ? normalizeSectionUnits(previous.units) : normalizeSectionUnits();
    const inheritedShape = previousOutlet ? previousOutlet.shape : "Round";
    const inheritedDiameter = previousOutlet && previousOutlet.sizeA != null
      ? formatForInput(convertValue(previousOutlet.sizeA, "m", inheritedUnits.diameter))
      : (defaults.diameter || "");
    const inheritedDiameterB = previousOutlet && previousOutlet.shape === "Rectangle" && previousOutlet.sizeB != null
      ? formatForInput(convertValue(previousOutlet.sizeB, "m", inheritedUnits.diameterB))
      : "";

    const section = ensureSection({
      id: createId(),
      kind: kind,
      crossSectionShape: inheritedShape,
      outletCrossSectionShape: inheritedShape,
      blockTitle: "",
      diameter: inheritedDiameter,
      diameterB: inheritedDiameterB,
      outletDiameter: defaults.outletDiameter || "",
      outletDiameterB: "",
      length: defaults.length || "",
      temperatureLossPerMeter: previous ? previous.temperatureLossPerMeter : (getFieldValue("TemperatureLossPerMeter") || "0.18"),
      turnAngle: defaults.turnAngle || "",
      heightDelta: defaults.heightDelta || "0",
      localResistanceType: defaults.localResistanceType || "",
      localResistanceParamX: "",
      localResistanceParamY: "",
      customLrc: "",
      useCustomLrc: false,
      useIndividualMaterial: previous ? previous.useIndividualMaterial : false,
      materialType: previous ? previous.materialType : materialType,
      surfaceCondition: previous ? previous.surfaceCondition : (conditions[0] || ""),
      useCustomRoughness: previous ? previous.useCustomRoughness : false,
      customRoughness: previous ? previous.customRoughness : "",
      units: normalizeSectionUnits(previous ? previous.units : null)
    });
    applyTabularParameterDefaults(section);
    return section;
  }

  function insertTransitionBetween(index) {
    if (index < 0 || index >= state.sections.length - 1) {
      return;
    }

    const previousOutlet = getEffectiveOutletConnection(state.sections[index]);
    const nextInlet = getEffectiveInletConnection(state.sections[index + 1]);
    if (!previousOutlet.sizeA || !nextInlet.sizeA) {
      return;
    }

    const inletArea = calculateConnectionArea(previousOutlet);
    const outletArea = calculateConnectionArea(nextInlet);
    const kind = outletArea < inletArea ? "Contraction" : "Expansion";
    const transition = createSection(kind, index + 1);
    transition.blockTitle = previousOutlet.shape === nextInlet.shape
      ? (kind === "Contraction" ? "Переход-сужение" : "Переход-расширение")
      : "Переход формы";
    transition.crossSectionShape = previousOutlet.shape;
    transition.outletCrossSectionShape = nextInlet.shape;
    setSectionDisplayValueFromBase(transition, "diameter", previousOutlet.sizeA);
    transition.diameterB = "";
    if (previousOutlet.shape === "Rectangle" && previousOutlet.sizeB != null) {
      setSectionDisplayValueFromBase(transition, "diameterB", previousOutlet.sizeB);
    }
    setSectionDisplayValueFromBase(transition, "outletDiameter", nextInlet.sizeA);
    transition.outletDiameterB = "";
    if (nextInlet.shape === "Rectangle" && nextInlet.sizeB != null) {
      setSectionDisplayValueFromBase(transition, "outletDiameterB", nextInlet.sizeB);
    }

    state.sections.splice(index + 1, 0, ensureSection(transition));
    state.selectedId = transition.id;
    renderAll({ schedulePreview: true, saveDraft: true });
  }

  function createId() {
    sectionCounter += 1;
    return `section-${Date.now()}-${sectionCounter}`;
  }

  function normalizeKind(value) {
    if (value === "Bend" || value === "Contraction" || value === "Expansion" || value === "LocalResistance") {
      return value;
    }

    if (value === "МС") {
      return "LocalResistance";
    }

    return "Straight";
  }

  function normalizeShape(value) {
    const normalizedValue = String(value || "").trim().toLowerCase();
    return normalizedValue === "rectangle" ||
      normalizedValue === "rectangular" ||
      normalizedValue === "square" ||
      normalizedValue === "прямоугольное" ||
      normalizedValue === "прямоугольный" ||
      normalizedValue === "квадратное" ||
      normalizedValue === "квадратный"
      ? "Rectangle"
      : "Round";
  }

  function translateShape(value) {
    return normalizeShape(value) === "Rectangle" ? "Прямоугольное" : "Круглое";
  }

  function getSelectedSection() {
    return state.sections.find((section) => section.id === state.selectedId) || null;
  }

  function getSectionTitle(section, fallbackNumber) {
    return section.blockTitle || `${kindMeta[section.kind].label} ${fallbackNumber}`;
  }

  function getEntrySizeLabel(section) {
    if (isConicalCollectorSection(section)) {
      return "Выходной диаметр d₀";
    }

    if (isStraightPipeEntranceSection(section)) {
      return "Диаметр Dг";
    }

    return normalizeShape(section.crossSectionShape) === "Rectangle"
      ? "Сторона a входа"
      : "Входной диаметр";
  }

  function getEntrySizeHint(section, fallbackHint) {
    if (isConicalCollectorSection(section)) {
      return {
        title: "Параметры сечения",
        essence: "Элемент всегда имеет круглое сечение. Значение d₀ определяет диаметр всей последующей трассы.",
        logic: "При добавлении нового блока параметры копируются автоматически, но остаются доступными для ручного изменения в каждом отдельном узле."
      };
    }

    if (isStraightPipeEntranceSection(section)) {
      return {
        title: "Диаметр прямой трубы",
        essence: "Dг — диаметр трубы постоянного поперечного сечения, в которую входит поток.",
        logic: "По этому диаметру программа автоматически считает отношения b/Dг и δ₁/Dг для выбора КМС из таблицы."
      };
    }

    return fallbackHint;
  }

  function getLengthLabel(section) {
    return isConicalCollectorSection(section)
      ? "Длина раструба l"
      : "Длина элемента";
  }

  function getLengthHint(section) {
    return isConicalCollectorSection(section)
      ? "Длина раструба нужна для автоматического расчета отношения l/d₀ по таблице КМС."
      : "Длина нужна для расчёта потерь на трение и итоговой протяжённости маршрута.";
  }

  function requiresSectionLength(section) {
    return !isStraightPipeEntranceSection(section);
  }

  function getEntrySizeBLabel(section) {
    return normalizeShape(section.crossSectionShape) === "Rectangle"
      ? "Сторона b входа"
      : "Вторая сторона входа";
  }

  function getOutletSizeLabel(section) {
    return normalizeShape(section.crossSectionShape) === "Rectangle"
      ? "Сторона a выхода"
      : "Выходной диаметр";
  }

  function getOutletSizeBLabel(section) {
    return normalizeShape(section.crossSectionShape) === "Rectangle"
      ? "Сторона b выхода"
      : "Вторая сторона выхода";
  }

  function describeNodeMeta(section) {
    const parts = [];
    const shape = normalizeShape(section.crossSectionShape);
    parts.push(translateShape(shape));

    if (section.diameter) {
      if (shape === "Rectangle") {
        parts.push(`a×b ${section.diameter}×${section.diameterB || "?"} ${getUnitLabel(getSectionUnit(section, "diameter"))}`);
      } else if (isConicalCollectorSection(section)) {
        parts.push(`d₀ ${section.diameter} ${getUnitLabel(getSectionUnit(section, "diameter"))}`);
      } else {
        parts.push(`D ${section.diameter} ${getUnitLabel(getSectionUnit(section, "diameter"))}`);
      }
    }
    if ((section.kind === "Straight" || isConicalCollectorSection(section)) && section.length) {
      parts.push(`L ${section.length} ${getUnitLabel(getSectionUnit(section, "length"))}`);
    }
    if ((section.kind === "Contraction" || section.kind === "Expansion") && section.outletDiameter) {
      const outletShape = normalizeShape(section.outletCrossSectionShape || shape);
      if (outletShape === "Rectangle") {
        parts.push(`a×b вых ${section.outletDiameter}×${section.outletDiameterB || "?"} ${getUnitLabel(getSectionUnit(section, "outletDiameter"))}`);
      } else {
        parts.push(`Dвых ${section.outletDiameter} ${getUnitLabel(getSectionUnit(section, "outletDiameter"))}`);
      }
    }
    if (section.temperatureLossPerMeter) {
      parts.push(`ΔT ${section.temperatureLossPerMeter} ${getUnitLabel(getSectionUnit(section, "temperatureLossPerMeter"))}`);
    }
    if (section.kind === "Bend" && section.turnAngle) {
      parts.push(`${section.turnAngle}${getUnitLabel(getSectionUnit(section, "turnAngle"))}`);
    }
    if (isKmsAdjustableSection(section) && section.kind !== "LocalResistance" && section.useCustomLrc && section.customLrc) {
      parts.push(`ζ ${section.customLrc}`);
    }
    if (section.kind === "LocalResistance") {
      parts.push(section.useCustomLrc && section.customLrc ? `ζ ${section.customLrc}` : (section.localResistanceType || "справочник"));
    }

    return parts.length ? parts.join(" · ") : "Нажмите на блок, чтобы задать параметры";
  }

  function renderToggle(field, checked, label) {
    return [
      '<label class="section-toggle-card">',
      `<input class="form-check-input" type="checkbox" data-field="${field}" ${checked ? "checked" : ""}>`,
      `<span>${escapeHtml(label)}</span>`,
      "</label>"
    ].join("");
  }

  function renderTextField(label, field, value, placeholder, fullWidth) {
    return renderRawField(
      label,
      `<input class="form-control" type="text" data-field="${field}" value="${escapeAttr(value || "")}" placeholder="${escapeAttr(placeholder || "")}" maxlength="120">`,
      "",
      fullWidth
    );
  }

  function renderNumberField(label, field, value, step, min, max, hint, unitOptions, readonly) {
    const attrs = [
      'class="form-control"',
      'type="number"',
      `data-field="${field}"`,
      `value="${escapeAttr(value || "")}"`,
      step ? `step="${step}"` : "",
      min !== "" && min != null ? `min="${min}"` : "",
      max !== "" && max != null ? `max="${max}"` : "",
      readonly ? "readonly" : ""
    ].filter(Boolean).join(" ");
    const inputHtml = `<input ${attrs}>`;

    if (!unitOptions) {
      return renderRawField(label, inputHtml, hint, false);
    }

    return renderRawField(
      label,
      [
        '<div class="unit-input-row">',
        inputHtml,
        `<select class="form-select unit-select" data-unit-field="${field}" data-current-unit="${escapeAttr(unitOptions.current)}">${renderNamedOptions(unitOptions.options, unitOptions.current)}</select>`,
        "</div>"
      ].join(""),
      hint,
      false
    );
  }

  function renderElementKmsFields(section) {
    const zetaHint = section.useCustomLrc
      ? "Ручное значение будет использовано вместо автоматического коэффициента этого элемента."
      : "Автоматический КМС рассчитывается по геометрии выбранного блока.";

    return renderKmsValueField(section, "", zetaHint);
  }

  function renderLocalResistanceFields(section) {
    const resistanceItem = getLocalResistanceItem(section.localResistanceType);
    const isTabular = isTabularResistance(resistanceItem);
    const isConical = isConicalCollectorType(section.localResistanceType);
    const isPipeEntrance = isStraightPipeEntranceType(section.localResistanceType);
    const xConfig = getResistanceAxisConfig(section.localResistanceType, "x");
    const yConfig = getResistanceAxisConfig(section.localResistanceType, "y");
    const guideButton = !section.useCustomLrc && isTabular
      ? [
          '<button type="button" class="kms-guide-button" data-open-resistance-table aria-haspopup="dialog" aria-label="Открыть таблицу КМС" title="Открыть таблицу КМС">',
          '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
          '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z"></path>',
          '<path d="M4 9h16M4 14h16M9 4v16M15 4v16"></path>',
          "</svg>",
          "</button>"
        ].join("")
      : "";
    const zetaHint = section.useCustomLrc
      ? "Замок открыт: пользовательское значение будет использовано вместо справочного."
      : (isTabular
          ? "Автоматический КМС интерполируется по табличным параметрам выбранного сопротивления."
          : "Замок закрыт: значение рассчитывается автоматически по выбранному типу местного сопротивления.");
    const xUnitOptions = isPipeEntrance ? getSectionUnitOptions(section, "localResistanceParamX") : null;
    const yUnitOptions = isPipeEntrance ? getSectionUnitOptions(section, "localResistanceParamY") : null;

    return [
      renderRawField(
        "Тип местного сопротивления",
        `<select class="form-select" data-field="localResistanceType" ${section.useCustomLrc ? "disabled" : ""}>${renderOptions(localResistanceTypes, section.localResistanceType)}</select>`,
        section.useCustomLrc ? "При ручном вводе КМС выбор справочного сопротивления заблокирован." : "Выберите тип элемента из справочника.",
        false
      ),
      !section.useCustomLrc && isTabular
        ? renderNumberField(xConfig.label, "localResistanceParamX", section.localResistanceParamX, xConfig.step, xConfig.min, xConfig.max, `${xConfig.hint} ${describeTabularRange(resistanceItem, "x", section.localResistanceType)}`, xUnitOptions, false)
        : "",
      !section.useCustomLrc && isTabular && isConical
        ? renderDerivedConicalRatioField(section, resistanceItem)
        : "",
      !section.useCustomLrc && isTabular && !isConical
        ? renderNumberField(yConfig.label, "localResistanceParamY", section.localResistanceParamY, yConfig.step, yConfig.min, yConfig.max, `${yConfig.hint} ${describeTabularRange(resistanceItem, "y", section.localResistanceType)}`, yUnitOptions, false)
        : "",
      !section.useCustomLrc && isTabular && isPipeEntrance
        ? renderDerivedPipeEntranceRatiosField(section, resistanceItem)
        : "",
      renderKmsValueField(section, guideButton, zetaHint)
      ].join("");
  }

  function renderDerivedConicalRatioField(section, resistanceItem) {
    const context = getResistanceParameterContext(section, resistanceItem);
    const value = context.rawParamY == null ? "" : formatCompactNumber(context.rawParamY, 3);
    const hint = context.yClamped
      ? `l/d₀ выше диапазона таблицы; для КМС будет использована последняя строка l/d₀ = ${formatCompactNumber(context.paramY, 3)}.`
      : `Программа считает l/d₀ = l / d₀ автоматически. ${describeTabularRange(resistanceItem, "y", section.localResistanceType)}`;

    return renderRawField(
      "Расчетное отношение l/d₀",
      `<input class="form-control kms-input is-locked" type="text" readonly value="${escapeAttr(value || "—")}">`,
      hint,
      false
    );
  }

  function renderDerivedPipeEntranceRatiosField(section, resistanceItem) {
    const context = getResistanceParameterContext(section, resistanceItem);
    const ratioX = context.rawParamX == null ? "—" : formatCompactNumber(context.rawParamX, 3);
    const ratioY = context.rawParamY == null ? "—" : formatCompactNumber(context.rawParamY, 3);
    const hintParts = [
      "Программа считает b/Dг = b / Dг и δ₁/Dг = δ₁ / Dг автоматически."
    ];

    if (context.xClamped) {
      hintParts.push(`b/Dг выше диапазона таблицы; используется последняя колонка ${formatResistanceAxisValue(section.localResistanceType, "x", context.paramX)}.`);
    }

    if (context.yClamped) {
      hintParts.push(`δ₁/Dг выше диапазона таблицы; используется последняя строка ${formatResistanceAxisValue(section.localResistanceType, "y", context.paramY)}.`);
    }

    return renderRawField(
      "Расчетные отношения",
      `<input class="form-control kms-input is-locked" type="text" readonly value="${escapeAttr(`b/Dг = ${ratioX}; δ₁/Dг = ${ratioY}`)}">`,
      hintParts.join(" "),
      true
    );
  }

  function renderKmsValueField(section, guideButton, zetaHint) {
    const zetaValue = section.useCustomLrc
      ? section.customLrc
      : getAutoKmsValue(section);
    const zetaInputAttrs = section.useCustomLrc
      ? 'type="number" step="0.001" min="0" inputmode="decimal"'
      : 'type="text" readonly';

    return renderRawField(
      "КМС ζ",
      [
        `<div class="kms-control${guideButton ? " has-guide" : ""}">`,
        '<div class="kms-value-wrap">',
        `<input class="form-control kms-input${section.useCustomLrc ? "" : " is-locked"}" ${zetaInputAttrs} data-field="customLrc" data-role="kms-value" value="${escapeAttr(zetaValue)}">`,
        guideButton,
        "</div>",
        '<label class="section-toggle-card kms-lock">',
        `<input class="form-check-input" type="checkbox" data-field="useCustomLrc" ${section.useCustomLrc ? "checked" : ""}>`,
        `<span>${section.useCustomLrc ? "Ручной ввод" : "Автоматически"}</span>`,
        "</label>",
        "</div>"
      ].join(""),
      zetaHint,
      true
    );
  }

  function getLocalResistanceItem(typeName) {
    const normalizedName = String(typeName || "").trim();
    if (!normalizedName) {
      return null;
    }

    if (Object.prototype.hasOwnProperty.call(localResistanceCatalog, normalizedName)) {
      return localResistanceCatalog[normalizedName];
    }

    const lowerName = normalizedName.toLowerCase();
    const matchedKey = Object.keys(localResistanceCatalog)
      .find((key) => String(key || "").trim().toLowerCase() === lowerName);

    return matchedKey ? localResistanceCatalog[matchedKey] : null;
  }

  function isTabularResistance(item) {
    return Boolean(item && typeof item === "object" && (item.isTabular || item.IsTabular));
  }

  function getResistanceDefaultValue(item) {
    if (item == null) {
      return null;
    }

    if (typeof item === "number" || typeof item === "string") {
      const value = Number(item);
      return Number.isFinite(value) ? value : null;
    }

    const raw = readProp(item, "defaultValue", "DefaultValue");
    if (raw == null) {
      return null;
    }

    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  function getResistancePoints(item) {
    const points = readProp(item, "points", "Points");
    return Array.isArray(points) ? points : [];
  }

  function getResistanceAxisConfig(typeName, axis) {
    const isConical = isConicalCollectorType(typeName);
    const isPipeEntrance = isStraightPipeEntranceType(typeName);

    if (isPipeEntrance) {
      return axis === "x"
        ? {
            label: "Расстояние b",
            step: "0.001",
            min: "0",
            max: "",
            hint: "b — расстояние от стенки до входного сечения. Введите размер; отношение b/Dг программа считает автоматически. При b/Dг ≥ 0,5 используется последняя колонка таблицы.",
            digits: 3,
            summaryLabel: "b/D<sub>г</sub>",
            tableLabel: "b/D<sub>г</sub>",
            clampLabel: "b/Dг"
          }
        : {
            label: "Толщина кромки δ₁",
            step: "0.001",
            min: "0",
            max: "",
            hint: "δ₁ — толщина входной кромки. Введите размер; отношение δ₁/Dг программа считает автоматически. При δ₁/Dг ≥ 0,05 используется последняя строка таблицы.",
            digits: 3,
            summaryLabel: "δ<sub>1</sub>/D<sub>г</sub>",
            tableLabel: "δ<sub>1</sub>/D<sub>г</sub>",
            clampLabel: "δ₁/Dг"
          };
    }

    if (axis === "x") {
      return {
        label: isConical ? "Угол раскрытия α" : "Угол α",
        step: "1",
        min: "0",
        max: "180",
        hint: "Угол α, градусы.",
        digits: 0,
        summaryLabel: "α",
        tableLabel: "α, град",
        clampLabel: "α",
        suffix: "град"
      };
    }

    return {
      label: "Отношение l/d₀",
      step: "0.001",
      min: "0",
      max: "",
      hint: "Безразмерное отношение l/d₀.",
      digits: 3,
      summaryLabel: "l/d<sub>0</sub>",
      tableLabel: "l/d<sub>0</sub>",
      clampLabel: "l/d₀"
    };
  }

  function interpolateResistanceValue(points, paramX, paramY) {
    if (!Array.isArray(points) || points.length === 0 || paramX == null || paramY == null) {
      return null;
    }

    const xs = uniqueSorted(points.map((point) => readPointNumber(point, "paramX", "ParamX")));
    const ys = uniqueSorted(points.map((point) => readPointNumber(point, "paramY", "ParamY")));
    const xBounds = findNumericBounds(xs, paramX);
    const yBounds = findNumericBounds(ys, paramY);
    if (!xBounds || !yBounds) {
      return null;
    }

    const q11 = findPointZeta(points, xBounds.lower, yBounds.lower);
    const q21 = findPointZeta(points, xBounds.upper, yBounds.lower);
    const q12 = findPointZeta(points, xBounds.lower, yBounds.upper);
    const q22 = findPointZeta(points, xBounds.upper, yBounds.upper);
    if ([q11, q21, q12, q22].some((value) => value == null)) {
      return null;
    }

    return interpolate2D(paramX, paramY, xBounds.lower, xBounds.upper, yBounds.lower, yBounds.upper, q11, q21, q12, q22);
  }

  function uniqueSorted(values) {
    return Array.from(new Set(values.filter((value) => Number.isFinite(value))))
      .sort((left, right) => left - right);
  }

  function findNumericBounds(values, value) {
    const tolerance = 0.000001;
    if (!values.length || value < values[0] - tolerance || value > values[values.length - 1] + tolerance) {
      return null;
    }

    const exact = values.find((point) => Math.abs(point - value) <= tolerance);
    if (exact != null) {
      return { lower: exact, upper: exact };
    }

    for (let index = 0; index < values.length - 1; index += 1) {
      if (values[index] <= value && value <= values[index + 1]) {
        return { lower: values[index], upper: values[index + 1] };
      }
    }

    return null;
  }

  function findPointZeta(points, x, y) {
    const point = points.find((item) =>
      Math.abs(readPointNumber(item, "paramX", "ParamX") - x) < 0.000001 &&
      Math.abs(readPointNumber(item, "paramY", "ParamY") - y) < 0.000001);

    return point ? readPointNumber(point, "zetaValue", "ZetaValue") : null;
  }

  function interpolate2D(x, y, x1, x2, y1, y2, q11, q21, q12, q22) {
    if (Math.abs(x2 - x1) < 0.000001 && Math.abs(y2 - y1) < 0.000001) {
      return q11;
    }

    if (Math.abs(x2 - x1) < 0.000001) {
      return linearInterpolate(y, y1, y2, q11, q12);
    }

    if (Math.abs(y2 - y1) < 0.000001) {
      return linearInterpolate(x, x1, x2, q11, q21);
    }

    const r1 = linearInterpolate(x, x1, x2, q11, q21);
    const r2 = linearInterpolate(x, x1, x2, q12, q22);
    return linearInterpolate(y, y1, y2, r1, r2);
  }

  function linearInterpolate(value, lower, upper, lowerValue, upperValue) {
    if (Math.abs(upper - lower) < 0.000001) {
      return lowerValue;
    }

    const ratio = (value - lower) / (upper - lower);
    return lowerValue + ratio * (upperValue - lowerValue);
  }

  function readPointNumber(point) {
    const raw = readProp.apply(null, [point].concat(Array.prototype.slice.call(arguments, 1)));
    if (raw == null) {
      return NaN;
    }

    const value = Number(raw);
    return Number.isFinite(value) ? value : NaN;
  }

  function describeTabularRange(item, axis, typeName) {
    const key = axis === "x" ? ["paramX", "ParamX"] : ["paramY", "ParamY"];
    const values = uniqueSorted(getResistancePoints(item).map((point) => readPointNumber(point, key[0], key[1])));
    if (!values.length) {
      return "";
    }

    const config = getResistanceAxisConfig(typeName, axis);
    const isPipeEntrance = isStraightPipeEntranceType(typeName);
    const rangeSubject = isPipeEntrance
      ? `расчетного отношения ${config.clampLabel}: `
      : "";
    const clampHint = isPipeEntrance
      ? ` Значения выше ${formatNumber(values[values.length - 1], config.digits)} считаются как ${formatNumber(values[values.length - 1], config.digits)}.`
      : "";

    return `Диапазон ${rangeSubject}${formatNumber(values[0], config.digits)}...${formatNumber(values[values.length - 1], config.digits)}.${clampHint}`;
  }

  function applyTabularParameterDefaults(section) {
    const item = getLocalResistanceItem(section.localResistanceType);
    if (!isTabularResistance(item)) {
      return;
    }

    if (isStraightPipeEntranceType(section.localResistanceType)) {
      section.localResistanceParamX = "";
      section.localResistanceParamY = "";
      updateDerivedLocalResistanceParams(section);
      return;
    }

    const points = getResistancePoints(item);
    const xs = uniqueSorted(points.map((point) => readPointNumber(point, "paramX", "ParamX")));
    const ys = uniqueSorted(points.map((point) => readPointNumber(point, "paramY", "ParamY")));
    if (!section.localResistanceParamX && xs.length) {
      const defaultX = xs.includes(60) ? 60 : xs[Math.floor(xs.length / 2)];
      section.localResistanceParamX = formatForInput(defaultX);
    }
    if (!isConicalCollectorSection(section) && !section.localResistanceParamY && ys.length) {
      const defaultY = ys.includes(0.25) ? 0.25 : ys[Math.floor(ys.length / 2)];
      section.localResistanceParamY = formatForInput(defaultY);
    }
    updateDerivedLocalResistanceParams(section);
  }

  function showResistanceGuide(section) {
    const item = getLocalResistanceItem(section.localResistanceType);
    if (!isTabularResistance(item)) {
      return;
    }

    const modal = getResistanceGuideModal();
    const title = modal.querySelector('[data-role="resistance-guide-title"]');
    const body = modal.querySelector('[data-role="resistance-guide-body"]');
    if (title) {
      title.textContent = section.localResistanceType || "Таблица КМС";
    }
    if (body) {
      body.innerHTML = buildResistanceGuideHtml(section, item);
    }

    if (window.bootstrap && window.bootstrap.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(modal).show();
      return;
    }

    modal.classList.add("show");
    modal.style.display = "block";
    modal.removeAttribute("aria-hidden");
  }

  function getResistanceGuideModal() {
    let modal = document.getElementById("resistanceGuideModal");
    if (modal) {
      return modal;
    }

    modal = document.createElement("div");
    modal.id = "resistanceGuideModal";
    modal.className = "modal fade resistance-guide-modal";
    modal.tabIndex = -1;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = [
      '<div class="modal-dialog modal-dialog-centered modal-lg resistance-guide-dialog">',
      '<div class="modal-content">',
      '<div class="modal-header">',
      '<h3 class="modal-title" data-role="resistance-guide-title">Таблица КМС</h3>',
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>',
      "</div>",
      '<div class="modal-body" data-role="resistance-guide-body"></div>',
      "</div>",
      "</div>"
    ].join("");
    document.body.appendChild(modal);
    return modal;
  }

  function buildResistanceGuideHtml(section, item) {
    const context = getResistanceParameterContext(section, item);
    const paramX = context.rawParamX;
    const paramY = context.rawParamY;
    const zeta = getLocalResistanceValue(section);
    const image = getResistanceGuideImage(section.localResistanceType);
    const xConfig = getResistanceAxisConfig(section.localResistanceType, "x");
    const yConfig = getResistanceAxisConfig(section.localResistanceType, "y");
    const isPipeEntrance = isStraightPipeEntranceSection(section);
    return [
      '<div class="resistance-guide-layout">',
      image
        ? `<figure class="resistance-guide-figure"><img src="${escapeAttr(image)}" alt="Схема конического коллектора"></figure>`
        : "",
      '<div class="resistance-guide-summary">',
      isPipeEntrance
        ? buildPipeEntranceSummaryParams(context, xConfig, yConfig)
        : [
            buildResistanceSummaryParam(xConfig, paramX),
            buildResistanceSummaryParam(yConfig, paramY)
          ].join(""),
      `<span class="resistance-guide-param"><span>ζ =</span><strong>${zeta == null ? "—" : formatCompactNumber(zeta, 3)}</strong></span>`,
      context.xClamped
        ? `<span class="resistance-guide-note">${escapeHtml(xConfig.clampLabel)} выше таблицы, поэтому использована последняя колонка ${formatResistanceAxisValue(section.localResistanceType, "x", context.paramX)}.</span>`
        : "",
      context.yClamped
        ? `<span class="resistance-guide-note">${escapeHtml(yConfig.clampLabel)} выше таблицы, поэтому использована последняя строка ${formatResistanceAxisValue(section.localResistanceType, "y", context.paramY)}.</span>`
        : "",
      "</div>",
      "</div>",
      buildResistanceGuideTableHtml(section, item)
    ].join("");
  }

  function buildPipeEntranceSummaryParams(context, xConfig, yConfig) {
    return [
      `<span class="resistance-guide-param"><span>D<sub>г</sub> =</span><strong>${formatCompactNumber(context.diameter, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>b =</span><strong>${formatCompactNumber(context.inputParamX, 3)}</strong><span>м</span></span>`,
      `<span class="resistance-guide-param"><span>δ<sub>1</sub> =</span><strong>${formatCompactNumber(context.inputParamY, 3)}</strong><span>м</span></span>`,
      buildResistanceSummaryParam(xConfig, context.rawParamX),
      buildResistanceSummaryParam(yConfig, context.rawParamY)
    ].join("");
  }

  function buildResistanceSummaryParam(config, value) {
    const suffix = config.suffix ? `<span>${escapeHtml(config.suffix)}</span>` : "";
    return `<span class="resistance-guide-param"><span>${config.summaryLabel} =</span><strong>${formatCompactNumber(value, config.digits)}</strong>${suffix}</span>`;
  }

  function buildResistanceGuideTableHtml(section, item) {
    const points = getResistancePoints(item);
    const xs = uniqueSorted(points.map((point) => readPointNumber(point, "paramX", "ParamX")));
    const ys = uniqueSorted(points.map((point) => readPointNumber(point, "paramY", "ParamY")));
    if (!xs.length || !ys.length) {
      return '<p class="inspector-note">Для выбранного сопротивления нет табличных данных.</p>';
    }

    const selection = getResistanceTableSelection(section, item);
    const xConfig = getResistanceAxisConfig(section.localResistanceType, "x");
    const yConfig = getResistanceAxisConfig(section.localResistanceType, "y");
    const zetaHeader = isConicalCollectorType(section.localResistanceType)
      ? "ζ<sub>0</sub>"
      : "ζ";
    const headerCells = xs
      .map((x) => {
        const sourceClass = selection && isValueWithinBounds(x, selection.xBounds) ? " class=\"is-source-axis\"" : "";
        return `<th scope="col"${sourceClass}>${formatResistanceAxisValue(section.localResistanceType, "x", x)}</th>`;
      })
      .join("");
    const bodyRows = ys
      .map((y) => {
        const rowClass = selection && isValueWithinBounds(y, selection.yBounds) ? " class=\"is-source-axis\"" : "";
        const cells = xs.map((x) => {
          const zeta = findPointZeta(points, x, y);
          const isSource = selection && isValueWithinBounds(x, selection.xBounds) && isValueWithinBounds(y, selection.yBounds);
          const exact = isSource && selection.isExact;
          const className = isSource ? ` class="${exact ? "is-source is-exact" : "is-source"}"` : "";
          return `<td${className}>${zeta == null ? "—" : formatCompactNumber(zeta, 3)}</td>`;
        }).join("");
        return `<tr><th scope="row"${rowClass}>${formatResistanceAxisValue(section.localResistanceType, "y", y)}</th>${cells}</tr>`;
      })
      .join("");

    return [
      '<div class="resistance-table-wrap">',
      '<table class="resistance-guide-table">',
      "<thead>",
      `<tr><th class="resistance-guide-axis" scope="col" rowspan="2">${yConfig.tableLabel}</th><th class="resistance-guide-title-cell" scope="col" colspan="${xs.length}">Значение ${zetaHeader} при ${xConfig.tableLabel}</th></tr>`,
      "<tr>",
      headerCells,
      "</tr>",
      "</thead>",
      `<tbody>${bodyRows}</tbody>`,
      "</table>",
      "</div>"
    ].join("");
  }

  function formatResistanceAxisValue(typeName, axis, value) {
    const config = getResistanceAxisConfig(typeName, axis);
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return "—";
    }

    if (isStraightPipeEntranceType(typeName)) {
      if (axis === "x" && parsed >= 0.5 - 0.000001) {
        return `≥${formatNumber(0.5, config.digits)}`;
      }

      if (axis === "y" && parsed >= 0.05 - 0.000001) {
        return `≥${formatNumber(0.05, config.digits)}`;
      }
    }

    return formatNumber(parsed, config.digits);
  }

  function getResistanceTableSelection(section, item) {
    const points = getResistancePoints(item);
    const context = getResistanceParameterContext(section, item);
    const paramX = context.paramX;
    const paramY = context.paramY;
    if (paramX == null || paramY == null) {
      return null;
    }

    const xs = uniqueSorted(points.map((point) => readPointNumber(point, "paramX", "ParamX")));
    const ys = uniqueSorted(points.map((point) => readPointNumber(point, "paramY", "ParamY")));
    const xBounds = findNumericBounds(xs, paramX);
    const yBounds = findNumericBounds(ys, paramY);
    if (!xBounds || !yBounds) {
      return null;
    }

    return {
      xBounds,
      yBounds,
      isExact: Math.abs(xBounds.lower - xBounds.upper) < 0.000001 && Math.abs(yBounds.lower - yBounds.upper) < 0.000001
    };
  }

  function isValueWithinBounds(value, bounds) {
    return bounds && value >= bounds.lower - 0.000001 && value <= bounds.upper + 0.000001;
  }

  function getResistanceGuideImage(typeName) {
    return isConicalCollectorType(typeName)
      ? "/img/conical-collector.svg"
      : "";
  }

  function isConicalCollectorType(typeName) {
    return String(typeName || "").trim().toLowerCase().includes("\u043a\u043e\u043d\u0438\u0447\u0435\u0441");
  }

  function isStraightPipeEntranceType(typeName) {
    const normalized = String(typeName || "").trim().toLowerCase();
    return normalized.includes("вход") &&
      normalized.includes("прям") &&
      normalized.includes("труб");
  }

  function isConicalCollectorSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && isConicalCollectorType(section.localResistanceType));
  }

  function isStraightPipeEntranceSection(section) {
    return Boolean(section && section.kind === "LocalResistance" && isStraightPipeEntranceType(section.localResistanceType));
  }

  function calculateConicalCollectorRatio(section) {
    const length = parseNumber(getSectionBaseValue(section, "length"), null);
    const diameter = parseNumber(getSectionBaseValue(section, "diameter"), null);
    if (length == null || diameter == null || diameter <= 0) {
      return null;
    }

    return length / diameter;
  }

  function updateDerivedLocalResistanceParams(section) {
    if (!isConicalCollectorSection(section) && !isStraightPipeEntranceSection(section)) {
      return;
    }

    section.crossSectionShape = "Round";
    section.outletCrossSectionShape = "Round";
    section.diameterB = "";
    section.outletDiameterB = "";
    if (!isConicalCollectorSection(section)) {
      section.length = "";
      return;
    }

    const ratio = calculateConicalCollectorRatio(section);
    section.localResistanceParamY = ratio == null ? "" : formatForInput(ratio);
  }

  function getLocalResistanceParamYForSubmit(section) {
    if (!isConicalCollectorSection(section)) {
      return isStraightPipeEntranceSection(section)
        ? getSectionBaseValue(section, "localResistanceParamY")
        : section.localResistanceParamY;
    }

    const ratio = calculateConicalCollectorRatio(section);
    return ratio == null ? "" : formatForInput(ratio);
  }

  function getLocalResistanceParamXForSubmit(section) {
    return isStraightPipeEntranceSection(section)
      ? getSectionBaseValue(section, "localResistanceParamX")
      : section.localResistanceParamX;
  }

  function syncConicalCollectorOutletToNext(section) {
    if (!isConicalCollectorSection(section) && !isStraightPipeEntranceSection(section)) {
      return;
    }

    const index = state.sections.findIndex((item) => item.id === section.id);
    const next = index >= 0 ? state.sections[index + 1] : null;
    const diameter = parseNumber(getSectionBaseValue(section, "diameter"), null);
    if (!next || diameter == null || diameter <= 0) {
      return;
    }

    next.crossSectionShape = "Round";
    next.diameterB = "";
    setSectionDisplayValueFromBase(next, "diameter", diameter);
    if (next.kind !== "Contraction" && next.kind !== "Expansion") {
      next.outletCrossSectionShape = "Round";
    }
    ensureSection(next);
  }

  function syncConicalCollectorOutlets() {
    state.sections.forEach((section) => {
      updateDerivedLocalResistanceParams(section);
      syncConicalCollectorOutletToNext(section);
    });
  }

  function decorateStaticTooltips() {
    Object.entries(staticTooltips).forEach(([fieldId, tooltip]) => {
      const label = form.querySelector(`label[for="${fieldId}"]`);
      if (!label || label.querySelector("[data-context-tooltip-trigger]")) {
        return;
      }

      label.classList.add("field-label");
      label.appendChild(createContextTooltipButton(label.textContent || fieldId, tooltip));
    });
  }

  function getResistanceParameterContext(section, item) {
    const inputParamX = isStraightPipeEntranceSection(section)
      ? parseNumber(getSectionBaseValue(section, "localResistanceParamX"), null)
      : parseNumber(section && section.localResistanceParamX, null);
    const inputParamY = isStraightPipeEntranceSection(section)
      ? parseNumber(getSectionBaseValue(section, "localResistanceParamY"), null)
      : parseNumber(section && section.localResistanceParamY, null);
    const diameter = parseNumber(section ? getSectionBaseValue(section, "diameter") : null, null);
    let rawParamX = inputParamX;
    let paramX = rawParamX;
    const isConical = isConicalCollectorSection(section);
    const isPipeEntrance = isStraightPipeEntranceSection(section);
    let rawParamY = isConical
      ? calculateConicalCollectorRatio(section)
      : inputParamY;
    let paramY = rawParamY;
    let xClamped = false;
    let yClamped = false;

    if (isPipeEntrance) {
      rawParamX = inputParamX != null && diameter != null && diameter > 0
        ? inputParamX / diameter
        : null;
      rawParamY = inputParamY != null && diameter != null && diameter > 0
        ? inputParamY / diameter
        : null;
      paramX = rawParamX;
      paramY = rawParamY;
    }

    if (isPipeEntrance && item && rawParamX != null) {
      const xs = uniqueSorted(getResistancePoints(item).map((point) => readPointNumber(point, "paramX", "ParamX")));
      const maxX = xs.length ? xs[xs.length - 1] : null;
      if (maxX != null && rawParamX > maxX + 0.000001) {
        paramX = maxX;
        xClamped = true;
      }
    }

    if ((isConical || isPipeEntrance) && item && rawParamY != null) {
      const ys = uniqueSorted(getResistancePoints(item).map((point) => readPointNumber(point, "paramY", "ParamY")));
      const maxY = ys.length ? ys[ys.length - 1] : null;
      if (maxY != null && rawParamY > maxY + 0.000001) {
        paramY = maxY;
        yClamped = true;
      }
    }

    return {
      paramX,
      paramY,
      rawParamX,
      rawParamY,
      inputParamX,
      inputParamY,
      diameter,
      xClamped,
      yClamped
    };
  }

  function getLocalResistanceValue(sectionOrTypeName) {
    const section = typeof sectionOrTypeName === "object" ? sectionOrTypeName : null;
    const typeName = section ? section.localResistanceType : sectionOrTypeName;
    const item = getLocalResistanceItem(typeName);
    if (!item) {
      return null;
    }

    if (!isTabularResistance(item)) {
      return getResistanceDefaultValue(item);
    }

    if (!section) {
      return null;
    }

    const context = getResistanceParameterContext(section, item);
    return interpolateResistanceValue(getResistancePoints(item), context.paramX, context.paramY);
  }

  function getAutoKmsValue(sectionOrIndex) {
    const section = typeof sectionOrIndex === "number"
      ? state.sections[sectionOrIndex - 1]
      : sectionOrIndex;
    const zeta = getCalculatedKmsValue(section);
    return zeta == null ? "" : formatForInput(zeta);
  }

  function updateAutoKmsField() {
    const section = getSelectedSection();
    if (!section || !isKmsAdjustableSection(section) || section.useCustomLrc) {
      return;
    }

    const field = elements.blockInspectorBody.querySelector('[data-role="kms-value"]');
    if (field) {
      field.value = getAutoKmsValue(section);
    }
  }

  function isKmsAdjustableSection(section) {
    return Boolean(section && ["Bend", "Contraction", "Expansion", "LocalResistance"].includes(section.kind));
  }

  function getCalculatedKmsValue(section) {
    if (!section) {
      return null;
    }

    switch (section.kind) {
      case "Bend":
        return calculateBendKms(section);
      case "Contraction":
        return calculateContractionKms(section);
      case "Expansion":
        return calculateExpansionKms(section);
      case "LocalResistance":
        return getLocalResistanceValue(section);
      default:
        return null;
    }
  }

  function calculateBendKms(section) {
    const angle = parseNumber(getSectionBaseValue(section, "turnAngle"), null);
    if (angle == null) {
      return null;
    }

    const normalized = Math.min(180, Math.max(1, angle));
    const angleFactor = Math.sin(normalized * Math.PI / 360);
    return 0.18 + 0.9 * angleFactor * angleFactor;
  }

  function calculateContractionKms(section) {
    const inlet = getEffectiveInletConnection(section);
    const outlet = getEffectiveOutletConnection(section);
    const inletArea = calculateConnectionArea(inlet);
    const outletArea = calculateConnectionArea(outlet);
    if (inletArea <= 0 || outletArea <= 0) {
      return null;
    }

    const isShapeTransition = inlet.shape !== outlet.shape;
    if (outletArea >= inletArea) {
      return isShapeTransition ? 0.18 : null;
    }

    const beta = Math.sqrt(outletArea / inletArea);
    return 0.5 * (1 / Math.pow(beta, 2) - 1);
  }

  function calculateExpansionKms(section) {
    const inlet = getEffectiveInletConnection(section);
    const outlet = getEffectiveOutletConnection(section);
    const inletArea = calculateConnectionArea(inlet);
    const outletArea = calculateConnectionArea(outlet);
    if (inletArea <= 0 || outletArea <= 0) {
      return null;
    }

    const isShapeTransition = inlet.shape !== outlet.shape;
    if (outletArea <= inletArea) {
      return isShapeTransition ? 0.18 : null;
    }

    const areaRatio = inletArea / outletArea;
    return Math.pow(1 - areaRatio, 2);
  }

  function updateGlobalRoughnessSummary() {
    if (!elements.globalRoughnessSummary) {
      return;
    }

    elements.globalRoughnessSummary.innerHTML = buildRoughnessSummaryHtml(getRoughnessSelection(null, "global"));
  }

  function updateSectionRoughnessSummary(section) {
    const host = elements.blockInspectorBody.querySelector('[data-role="section-roughness-summary"]');
    if (!host) {
      return;
    }

    const selection = section && (section.useIndividualMaterial || section.useCustomRoughness)
      ? getRoughnessSelection(section, "section")
      : getRoughnessSelection(null, "section");
    host.innerHTML = buildRoughnessSummaryHtml(selection);
  }

  function getRoughnessSelection(section, context) {
    const hasSection = Boolean(section);
    const useCustom = hasSection ? section.useCustomRoughness : Boolean(elements.useCustomRoughness && elements.useCustomRoughness.checked);
    const material = hasSection && section.useIndividualMaterial
      ? section.materialType
      : getGlobalMaterial();
    const condition = hasSection && section.useIndividualMaterial
      ? section.surfaceCondition
      : getGlobalSurfaceCondition();
    const customValue = hasSection
      ? parseNumber(getSectionBaseValue(section, "customRoughness"), null)
      : getBaseFieldValue("CustomRoughness");
    const tableValue = getRoughnessValue(material, condition);

    return {
      context,
      material: material || "",
      condition: condition || "",
      useCustom,
      customValue,
      tableValue,
      effectiveValue: useCustom ? customValue : tableValue,
      isSection: hasSection
    };
  }

  function buildRoughnessSummaryHtml(selection) {
    const sourceText = selection.useCustom
      ? (selection.isSection ? "Собственная шероховатость блока" : "Собственная шероховатость трассы")
      : `${selection.material || "материал не выбран"} / ${selection.condition || "состояние не выбрано"}`;
    const valueText = selection.effectiveValue == null
      ? "—"
      : `${formatRoughnessMm(selection.effectiveValue)} мм`;

    return [
      '<div class="roughness-reference-card">',
      '<div class="roughness-reference-content">',
      `<span class="roughness-reference-title">${escapeHtml(sourceText)}</span>`,
      `<span class="roughness-reference-value">K<sub>э</sub> = <strong>${escapeHtml(valueText)}</strong></span>`,
      selection.useCustom && selection.tableValue != null
        ? `<small>Справочно для выбранного материала: ${escapeHtml(formatRoughnessMm(selection.tableValue))} мм</small>`
        : "",
      "</div>",
      buildRoughnessGuideButton(selection.context),
      "</div>"
    ].join("");
  }

  function buildRoughnessGuideButton(context) {
    return [
      `<button type="button" class="kms-guide-button roughness-guide-button" data-open-roughness-table data-roughness-context="${escapeAttr(context || "global")}" aria-haspopup="dialog" aria-label="Открыть таблицу шероховатости" title="Открыть таблицу шероховатости">`,
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
      '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13Z"></path>',
      '<path d="M4 9h16M4 14h16M9 4v16M15 4v16"></path>',
      "</svg>",
      "</button>"
    ].join("");
  }

  function getRoughnessValue(material, condition) {
    const entry = findRoughnessEntry(material, condition);
    if (!entry) {
      return null;
    }

    const value = Number(readProp(entry, "equivalentRoughness", "EquivalentRoughness"));
    return Number.isFinite(value) ? value : null;
  }

  function findRoughnessEntry(material, condition) {
    const materialName = String(material || "").trim().toLowerCase();
    const conditionName = String(condition || "").trim().toLowerCase();
    if (!materialName || !conditionName) {
      return null;
    }

    return roughnessCatalog.find((entry) =>
      String(readProp(entry, "type", "Type") || "").trim().toLowerCase() === materialName &&
      String(readProp(entry, "condition", "Condition") || "").trim().toLowerCase() === conditionName) || null;
  }

  function showRoughnessGuide(section) {
    const selection = getRoughnessSelection(section, section ? "section" : "global");
    const modal = getRoughnessGuideModal();
    const title = modal.querySelector('[data-role="roughness-guide-title"]');
    const body = modal.querySelector('[data-role="roughness-guide-body"]');
    if (title) {
      title.textContent = "Таблица эквивалентной шероховатости";
    }
    if (body) {
      body.innerHTML = buildRoughnessGuideHtml(selection);
    }

    if (window.bootstrap && window.bootstrap.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(modal).show();
      return;
    }

    modal.classList.add("show");
    modal.style.display = "block";
    modal.removeAttribute("aria-hidden");
  }

  function getRoughnessGuideModal() {
    let modal = document.getElementById("roughnessGuideModal");
    if (modal) {
      return modal;
    }

    modal = document.createElement("div");
    modal.id = "roughnessGuideModal";
    modal.className = "modal fade resistance-guide-modal material-guide-modal";
    modal.tabIndex = -1;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = [
      '<div class="modal-dialog modal-dialog-centered modal-lg">',
      '<div class="modal-content">',
      '<div class="modal-header">',
      '<h3 class="modal-title" data-role="roughness-guide-title">Таблица эквивалентной шероховатости</h3>',
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>',
      "</div>",
      '<div class="modal-body" data-role="roughness-guide-body"></div>',
      "</div>",
      "</div>"
    ].join("");
    document.body.appendChild(modal);
    return modal;
  }

  function buildRoughnessGuideHtml(selection) {
    const valueText = selection.effectiveValue == null
      ? "—"
      : `${formatRoughnessMm(selection.effectiveValue)} мм`;
    const sourceText = selection.useCustom
      ? "введено вручную"
      : `${selection.material || "—"} / ${selection.condition || "—"}`;

    return [
      '<div class="resistance-guide-summary material-guide-summary">',
      `<span class="resistance-guide-param"><span>Источник:</span><strong>${escapeHtml(sourceText)}</strong></span>`,
      `<span class="resistance-guide-param"><span>K<sub>э</sub> =</span><strong>${escapeHtml(valueText)}</strong></span>`,
      "</div>",
      buildRoughnessGuideTableHtml(selection)
    ].join("");
  }

  function buildRoughnessGuideTableHtml(selection) {
    const rows = roughnessCatalog.map((entry) => {
      const material = readProp(entry, "type", "Type") || "";
      const condition = readProp(entry, "condition", "Condition") || "";
      const referenceValue = String(readProp(entry, "referenceValue", "ReferenceValue") || "").trim();
      const value = Number(readProp(entry, "equivalentRoughness", "EquivalentRoughness"));
      const displayValue = referenceValue || (Number.isFinite(value) ? formatRoughnessMm(value) : "-");
      const isSource = String(material).trim().toLowerCase() === String(selection.material || "").trim().toLowerCase() &&
        String(condition).trim().toLowerCase() === String(selection.condition || "").trim().toLowerCase();
      return [
        `<tr${isSource ? ' class="is-source"' : ""}>`,
        `<td>${escapeHtml(material)}</td>`,
        `<td>${escapeHtml(condition)}</td>`,
        `<td>${escapeHtml(displayValue)}</td>`,
        "</tr>"
      ].join("");
    }).join("");

    return [
      '<div class="resistance-table-wrap material-table-wrap">',
      '<table class="material-guide-table">',
      "<thead>",
      "<tr><th>Материал стенки</th><th>Состояние поверхности</th><th>K<sub>э</sub>, мм</th></tr>",
      "</thead>",
      `<tbody>${rows}</tbody>`,
      "</table>",
      "</div>"
    ].join("");
  }

  function formatRoughnessMm(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return "—";
    }

    return formatCompactNumber(parsed * 1000, 4);
  }

  function renderSelectField(label, field, options, value, hint) {
    return renderRawField(
      label,
      `<select class="form-select" data-field="${field}">${renderOptions(options, value)}</select>`,
      hint,
      false
    );
  }

  function renderNamedSelectField(label, field, options, value, hint, disabled) {
    return renderRawField(
      label,
      `<select class="form-select" data-field="${field}" ${disabled ? "disabled" : ""}>${renderNamedOptions(options, value)}</select>`,
      hint,
      false
    );
  }

  function renderRawField(label, controlHtml, hint, fullWidth) {
    return [
      `<div class="field${fullWidth ? " field-span-2" : ""}">`,
      `<label class="field-label"><span>${escapeHtml(label)}</span>${renderContextTooltipTrigger(label, hint)}</label>`,
      controlHtml,
      "</div>"
    ].join("");
  }

  function renderContextTooltipTrigger(label, hint) {
    const tooltip = normalizeTooltipContent(label, hint);
    if (!tooltip) {
      return "";
    }

    return [
      '<button type="button" class="context-tooltip-trigger" data-context-tooltip-trigger',
      ` aria-label="Подсказка: ${escapeAttr(tooltip.title)}"`,
      ` data-tooltip-title="${escapeAttr(tooltip.title)}"`,
      ` data-tooltip-essence="${escapeAttr(tooltip.essence)}"`,
      ` data-tooltip-logic="${escapeAttr(tooltip.logic)}">?</button>`
    ].join("");
  }

  function createContextTooltipButton(label, hint) {
    const tooltip = normalizeTooltipContent(label, hint);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "context-tooltip-trigger";
    button.dataset.contextTooltipTrigger = "true";
    button.setAttribute("aria-label", `Подсказка: ${tooltip ? tooltip.title : label}`);
    if (tooltip) {
      button.dataset.tooltipTitle = tooltip.title;
      button.dataset.tooltipEssence = tooltip.essence;
      button.dataset.tooltipLogic = tooltip.logic;
    }
    button.textContent = "?";
    return button;
  }

  function normalizeTooltipContent(label, hint) {
    if (!hint) {
      return null;
    }

    if (typeof hint === "object") {
      const title = String(hint.title || label || "").trim();
      const essence = String(hint.essence || getDefaultTooltipEssence(label)).trim();
      const logic = String(hint.logic || hint.text || "").trim();
      if (!title || (!essence && !logic)) {
        return null;
      }

      return { title, essence, logic };
    }

    const logic = String(hint || "").trim();
    if (!logic) {
      return null;
    }

    return {
      title: String(label || "Параметр").trim(),
      essence: getDefaultTooltipEssence(label),
      logic
    };
  }

  function getDefaultTooltipEssence(label) {
    const text = String(label || "").toLowerCase();
    if (text.includes("температур")) {
      return "Температурный параметр, который влияет на свойства газа и промежуточные результаты расчета.";
    }
    if (text.includes("расход")) {
      return "Количество газа, проходящее через сечение за единицу времени.";
    }
    if (text.includes("диаметр") || text.includes("сторона") || text.includes("сечение")) {
      return "Геометрический параметр сечения, по которому считаются площадь, скорость и динамическое давление.";
    }
    if (text.includes("длина")) {
      return "Протяженность выбранного элемента трассы.";
    }
    if (text.includes("угол")) {
      return "Угол геометрического элемента, влияющий на коэффициент местного сопротивления.";
    }
    if (text.includes("кмс") || text.includes("ζ")) {
      return "Коэффициент местного сопротивления выбранного элемента.";
    }
    if (text.includes("шероховат")) {
      return "Параметр неровности внутренней поверхности канала.";
    }
    if (text.includes("материал")) {
      return "Материал стенки, по которому выбирается справочное значение шероховатости.";
    }
    if (text.includes("высот")) {
      return "Изменение отметки трассы на выбранном элементе.";
    }

    return "Параметр исходных данных для расчета дымовой трассы.";
  }

  function handleContextTooltipMouseOver(event) {
    const trigger = event.target.closest("[data-context-tooltip-trigger]");
    const tooltip = event.target.closest(".context-tooltip");
    if (trigger) {
      scheduleContextTooltipShow(trigger);
      return;
    }

    if (tooltip && tooltip === tooltipState.tooltip) {
      clearContextTooltipHideTimer();
    }
  }

  function handleContextTooltipMouseOut(event) {
    const trigger = event.target.closest("[data-context-tooltip-trigger]");
    const tooltip = event.target.closest(".context-tooltip");
    const nextTarget = event.relatedTarget;

    if (trigger && isTooltipSafeTarget(nextTarget)) {
      return;
    }

    if (tooltip && isTooltipSafeTarget(nextTarget)) {
      return;
    }

    if (trigger || tooltip) {
      scheduleContextTooltipHide();
    }
  }

  function handleContextTooltipFocusIn(event) {
    const trigger = event.target.closest("[data-context-tooltip-trigger]");
    if (trigger) {
      scheduleContextTooltipShow(trigger);
    }
  }

  function handleContextTooltipFocusOut(event) {
    const trigger = event.target.closest("[data-context-tooltip-trigger]");
    if (trigger) {
      scheduleContextTooltipHide();
    }
  }

  function handleContextTooltipClick(event) {
    const trigger = event.target.closest("[data-context-tooltip-trigger]");
    if (!trigger) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    showContextTooltip(trigger);
  }

  function scheduleContextTooltipShow(trigger) {
    clearContextTooltipHideTimer();
    window.clearTimeout(tooltipState.showTimer);
    tooltipState.showTimer = window.setTimeout(() => showContextTooltip(trigger), 500);
  }

  function scheduleContextTooltipHide() {
    window.clearTimeout(tooltipState.showTimer);
    clearContextTooltipHideTimer();
    tooltipState.hideTimer = window.setTimeout(hideContextTooltipNow, 200);
  }

  function clearContextTooltipHideTimer() {
    window.clearTimeout(tooltipState.hideTimer);
    tooltipState.hideTimer = null;
  }

  function showContextTooltip(trigger) {
    window.clearTimeout(tooltipState.showTimer);
    clearContextTooltipHideTimer();

    const title = trigger.dataset.tooltipTitle || "Подсказка";
    const essence = trigger.dataset.tooltipEssence || "";
    const logic = trigger.dataset.tooltipLogic || "";
    if (!essence && !logic) {
      return;
    }

    const tooltip = getContextTooltip();
    tooltipState.trigger = trigger;
    tooltip.innerHTML = [
      `<div class="context-tooltip__title">${escapeHtml(title)}</div>`,
      essence
        ? `<div class="context-tooltip__section"><strong>Что это?</strong><p>${escapeHtml(essence)}</p></div>`
        : "",
      logic
        ? `<div class="context-tooltip__section"><strong>Как работает?</strong><p>${escapeHtml(logic)}</p></div>`
        : ""
    ].join("");
    tooltip.classList.add("is-visible");
    tooltip.style.visibility = "hidden";
    tooltip.style.left = "0px";
    tooltip.style.top = "0px";
    positionContextTooltip(trigger, tooltip);
    tooltip.style.visibility = "visible";
  }

  function hideContextTooltipNow() {
    window.clearTimeout(tooltipState.showTimer);
    clearContextTooltipHideTimer();
    if (tooltipState.tooltip) {
      tooltipState.tooltip.classList.remove("is-visible");
      tooltipState.tooltip.style.visibility = "";
    }
    tooltipState.trigger = null;
  }

  function getContextTooltip() {
    if (tooltipState.tooltip) {
      return tooltipState.tooltip;
    }

    const tooltip = document.createElement("div");
    tooltip.className = "context-tooltip";
    tooltip.setAttribute("role", "tooltip");
    document.body.appendChild(tooltip);
    tooltipState.tooltip = tooltip;
    return tooltip;
  }

  function positionContextTooltip(trigger, tooltip) {
    const gap = 10;
    const margin = 8;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const width = tooltipRect.width;
    const height = tooltipRect.height;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const placements = [
      {
        name: "right",
        left: rect.right + gap,
        top: rect.top + rect.height / 2 - height / 2
      },
      {
        name: "left",
        left: rect.left - width - gap,
        top: rect.top + rect.height / 2 - height / 2
      },
      {
        name: "bottom",
        left: rect.left + rect.width / 2 - width / 2,
        top: rect.bottom + gap
      },
      {
        name: "top",
        left: rect.left + rect.width / 2 - width / 2,
        top: rect.top - height - gap
      }
    ];

    const selected = placements.find((placement) =>
      placement.left >= margin &&
      placement.top >= margin &&
      placement.left + width <= viewportWidth - margin &&
      placement.top + height <= viewportHeight - margin) || placements[0];

    const left = Math.min(Math.max(selected.left, margin), Math.max(margin, viewportWidth - width - margin));
    const top = Math.min(Math.max(selected.top, margin), Math.max(margin, viewportHeight - height - margin));
    tooltip.dataset.placement = selected.name;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function isTooltipSafeTarget(target) {
    if (!target) {
      return false;
    }

    return Boolean(
      target.closest &&
      (target.closest("[data-context-tooltip-trigger]") ||
        (tooltipState.tooltip && target.closest(".context-tooltip") === tooltipState.tooltip))
    );
  }

  function renderOptions(options, selectedValue) {
    return (options || [])
      .map((option) => {
        const value = option == null ? "" : String(option);
        const selected = value === String(selectedValue || "") ? " selected" : "";
        return `<option value="${escapeAttr(value)}"${selected}>${escapeHtml(value)}</option>`;
      })
      .join("");
  }

  function renderNamedOptions(options, selectedValue) {
    return (options || [])
      .map((option) => {
        const value = option && option.value != null ? String(option.value) : "";
        const label = option && option.label != null ? String(option.label) : value;
        const selected = value === String(selectedValue || "") ? " selected" : "";
        return `<option value="${escapeAttr(value)}"${selected}>${escapeHtml(label)}</option>`;
      })
      .join("");
  }

  function initUnitSelectors() {
    form.querySelectorAll("[data-unit-for]").forEach((select) => {
      if (!select.dataset.currentUnit) {
        select.dataset.currentUnit = select.value;
      }
    });
  }

  function handleGlobalUnitChange(select) {
    const fieldId = select.dataset.unitFor;
    const field = document.getElementById(fieldId);
    if (!field) {
      select.dataset.currentUnit = select.value;
      return;
    }

    const oldUnit = select.dataset.currentUnit || baseUnitsByField[fieldId] || select.value;
    const newUnit = select.value;
    const baseUnit = baseUnitsByField[fieldId] || newUnit;
    const rawValue = parseNumber(field.value, null);

    if (rawValue != null) {
      const baseValue = convertValue(rawValue, oldUnit, baseUnit);
      field.value = formatForInput(convertValue(baseValue, baseUnit, newUnit));
    }

    select.dataset.currentUnit = newUnit;
  }

  function handleSectionUnitChange(select) {
    const section = getSelectedSection();
    if (!section) {
      return;
    }

    const field = select.dataset.unitField;
    const oldUnit = section.units[field] || select.dataset.currentUnit || sectionBaseUnits[field];
    const newUnit = select.value;
    const baseUnit = sectionBaseUnits[field] || newUnit;
    const rawValue = parseNumber(section[field], null);

    if (rawValue != null) {
      if (field === "temperatureLossPerMeter") {
        const baseValue = convertTemperatureLossToBase(section, rawValue, oldUnit);
        section[field] = formatForInput(convertTemperatureLossFromBase(section, baseValue, newUnit));
      } else {
        const baseValue = convertValue(rawValue, oldUnit, baseUnit);
        section[field] = formatForInput(convertValue(baseValue, baseUnit, newUnit));
      }
    }

    section.units[field] = newUnit;
    if (isConicalCollectorSection(section) || isStraightPipeEntranceSection(section)) {
      updateDerivedLocalResistanceParams(section);
      if (isConicalCollectorSection(section) && field === "diameter") {
        syncConicalCollectorOutletToNext(section);
      }
    }
    renderCanvas();
    renderInspector();
    renderHiddenInputs();
    schedulePreview();
    saveDraftSilently();
  }

  function convertValue(value, fromUnit, toUnit) {
    const from = unitDefinitions[fromUnit];
    const to = unitDefinitions[toUnit];
    if (!from || !to) {
      return value;
    }

    return to.fromBase(from.toBase(value));
  }

  function formatDisplayFromBase(value, baseUnit, displayUnit) {
    const parsed = parseNumber(value, null);
    if (parsed == null) {
      return "";
    }

    return formatForInput(convertValue(parsed, baseUnit, displayUnit || baseUnit));
  }

  function getFieldUnit(fieldId) {
    const select = form.querySelector(`[data-unit-for="${fieldId}"]`);
    return select ? select.value : (baseUnitsByField[fieldId] || "");
  }

  function getBaseFieldValue(fieldId) {
    const value = parseNumber(getFieldValue(fieldId), null);
    if (value == null) {
      return null;
    }

    const currentUnit = getFieldUnit(fieldId);
    const baseUnit = baseUnitsByField[fieldId] || currentUnit;
    return convertValue(value, currentUnit, baseUnit);
  }

  function collectGlobalUnits() {
    return form.querySelectorAll("[data-unit-for]")
      ? Array.from(form.querySelectorAll("[data-unit-for]")).reduce((units, select) => {
          units[select.dataset.unitFor] = select.value;
          return units;
        }, {})
      : {};
  }

  function applyGlobalUnits(units) {
    form.querySelectorAll("[data-unit-for]").forEach((select) => {
      const preferred = units[select.dataset.unitFor] || baseUnitsByField[select.dataset.unitFor];
      if (preferred && Array.from(select.options).some((option) => option.value === preferred)) {
        select.value = preferred;
      }
      select.dataset.currentUnit = select.value;
    });
  }

  function buildBaseFormData() {
    renderHiddenInputs();
    const formData = new FormData(form);
    fieldUnitIds.forEach((fieldId) => {
      const baseValue = getBaseFieldValue(fieldId);
      if (baseValue != null) {
        formData.set(fieldId, formatForInput(baseValue));
      }
    });

    return formData;
  }

  function applyBaseValuesToStaticFields() {
    fieldUnitIds.forEach((fieldId) => {
      const baseValue = getBaseFieldValue(fieldId);
      if (baseValue == null) {
        return;
      }

      const field = document.getElementById(fieldId);
      const select = form.querySelector(`[data-unit-for="${fieldId}"]`);
      field.value = formatForInput(baseValue);
      if (select && baseUnitsByField[fieldId]) {
        select.value = baseUnitsByField[fieldId];
        select.dataset.currentUnit = select.value;
      }
    });
  }

  function getSectionUnitOptions(section, field) {
    const current = getSectionUnit(section, field);
    const lengthOptions = [
      { value: "m", label: "м" },
      { value: "mm", label: "мм" }
    ];

    if (field === "temperatureLossPerMeter") {
      return {
        current,
        options: [
          { value: "cPerM", label: "°C/м" },
          { value: "cTotal", label: "°C всего" }
        ]
      };
    }

    if (field === "turnAngle") {
      return {
        current,
        options: [
          { value: "deg", label: "°" },
          { value: "rad", label: "рад" }
        ]
      };
    }

    if (sectionBaseUnits[field]) {
      return {
        current,
        options: lengthOptions
      };
    }

    return null;
  }

  function normalizeSectionUnits(sourceUnits) {
    const units = {
      diameter: "m",
      diameterB: "m",
      outletDiameter: "m",
      outletDiameterB: "m",
      localResistanceParamX: "m",
      localResistanceParamY: "m",
      length: "m",
      heightDelta: "m",
      customRoughness: "m",
      turnAngle: "deg",
      temperatureLossPerMeter: "cPerM"
    };

    if (sourceUnits && typeof sourceUnits === "object") {
      Object.keys(units).forEach((key) => {
        if (sourceUnits[key] && unitDefinitions[sourceUnits[key]]) {
          units[key] = sourceUnits[key];
        }
      });
    }

    return units;
  }

  function mapSectionUnitProps(section) {
    if (!section) {
      return null;
    }

    return {
      diameter: readProp(section, "diameterUnit", "DiameterUnit"),
      diameterB: readProp(section, "diameterBUnit", "DiameterBUnit"),
      outletDiameter: readProp(section, "outletDiameterUnit", "OutletDiameterUnit"),
      outletDiameterB: readProp(section, "outletDiameterBUnit", "OutletDiameterBUnit"),
      length: readProp(section, "lengthUnit", "LengthUnit"),
      temperatureLossPerMeter: readProp(section, "temperatureLossUnit", "TemperatureLossUnit"),
      heightDelta: readProp(section, "heightDeltaUnit", "HeightDeltaUnit"),
      customRoughness: readProp(section, "customRoughnessUnit", "CustomRoughnessUnit"),
      turnAngle: readProp(section, "turnAngleUnit", "TurnAngleUnit")
    };
  }

  function applySectionDisplayUnitsFromBase(section) {
    section.diameter = formatDisplayFromBase(section.diameter, "m", section.units.diameter);
    section.diameterB = formatDisplayFromBase(section.diameterB, "m", section.units.diameterB);
    section.outletDiameter = formatDisplayFromBase(section.outletDiameter, "m", section.units.outletDiameter);
    section.outletDiameterB = formatDisplayFromBase(section.outletDiameterB, "m", section.units.outletDiameterB);
    section.localResistanceParamX = formatDisplayFromBase(section.localResistanceParamX, "m", section.units.localResistanceParamX);
    section.localResistanceParamY = formatDisplayFromBase(section.localResistanceParamY, "m", section.units.localResistanceParamY);
    section.length = formatDisplayFromBase(section.length, "m", section.units.length);
    section.heightDelta = formatDisplayFromBase(section.heightDelta, "m", section.units.heightDelta);
    section.customRoughness = formatDisplayFromBase(section.customRoughness, "m", section.units.customRoughness);
    section.turnAngle = formatDisplayFromBase(section.turnAngle, "deg", section.units.turnAngle);
    if (section.units.temperatureLossPerMeter === "cTotal") {
      const perMeter = parseNumber(section.temperatureLossPerMeter, null);
      const length = parseNumber(convertValue(parseNumber(section.length, 0), section.units.length, "m"), 0);
      section.temperatureLossPerMeter = perMeter == null ? "" : formatForInput(perMeter * length);
    }

    return section;
  }

  function getSectionUnit(section, field) {
    section.units = normalizeSectionUnits(section.units);
    return section.units[field] || sectionBaseUnits[field] || "";
  }

  function getSectionBaseValue(section, field) {
    const value = parseNumber(section[field], null);
    if (value == null) {
      return "";
    }

    const currentUnit = getSectionUnit(section, field);
    const baseUnit = sectionBaseUnits[field] || currentUnit;
    if (field === "temperatureLossPerMeter") {
      return formatForInput(convertTemperatureLossToBase(section, value, currentUnit));
    }

    return formatForInput(convertValue(value, currentUnit, baseUnit));
  }

  function setSectionDisplayValueFromBase(section, field, baseValue) {
    const baseUnit = sectionBaseUnits[field];
    const currentUnit = getSectionUnit(section, field);
    if (field === "temperatureLossPerMeter") {
      section[field] = formatForInput(convertTemperatureLossFromBase(section, baseValue, currentUnit));
      return;
    }

    section[field] = formatForInput(convertValue(baseValue, baseUnit, currentUnit));
  }

  function convertTemperatureLossToBase(section, value, unit) {
    if (unit !== "cTotal") {
      return value;
    }

    const length = parseNumber(getSectionBaseValue(section, "length"), 0);
    return length > 0 ? value / length : value;
  }

  function convertTemperatureLossFromBase(section, value, unit) {
    if (unit !== "cTotal") {
      return value;
    }

    const length = parseNumber(getSectionBaseValue(section, "length"), 0);
    return length > 0 ? value * length : value;
  }

  function getEffectiveOutletConnection(section) {
    const isConical = isConicalCollectorSection(section);
    const inletShape = isConical ? "Round" : normalizeShape(section.crossSectionShape);
    const shape = section.kind === "Contraction" || section.kind === "Expansion"
      ? normalizeShape(section.outletCrossSectionShape || inletShape)
      : inletShape;
    const fieldA = section.kind === "Contraction" || section.kind === "Expansion"
      ? "outletDiameter"
      : "diameter";
    const fieldB = section.kind === "Contraction" || section.kind === "Expansion"
      ? "outletDiameterB"
      : "diameterB";

    return {
      shape,
      sizeA: parseNumber(getSectionBaseValue(section, fieldA), null),
      sizeB: shape === "Rectangle" ? parseNumber(getSectionBaseValue(section, fieldB), null) : null
    };
  }

  function getEffectiveInletConnection(section) {
    const shape = isConicalCollectorSection(section) ? "Round" : normalizeShape(section.crossSectionShape);
    return {
      shape,
      sizeA: parseNumber(getSectionBaseValue(section, "diameter"), null),
      sizeB: shape === "Rectangle" ? parseNumber(getSectionBaseValue(section, "diameterB"), null) : null
    };
  }

  function calculateConnectionArea(connection) {
    if (!connection || !connection.sizeA) {
      return 0;
    }

    return connection.shape === "Rectangle"
      ? connection.sizeA * (connection.sizeB || connection.sizeA)
      : Math.PI * Math.pow(connection.sizeA, 2) / 4;
  }

  function syncGlobalSurfaceOptions(preferredValue) {
    const options = getSurfaceOptions(getGlobalMaterial());
    const currentValue = preferredValue || elements.globalSurfaceCondition.value;
    elements.globalSurfaceCondition.innerHTML = renderOptions(options, currentValue);
  }

  function toggleGlobalRoughnessField() {
    elements.globalCustomRoughnessField.classList.toggle("d-none", !elements.useCustomRoughness.checked);
  }

  function getSurfaceOptions(material) {
    return materialCatalog[material] || [];
  }

  function getGlobalMaterial() {
    return elements.globalMaterialType.value || Object.keys(materialCatalog)[0] || "";
  }

  function getGlobalSurfaceCondition() {
    return elements.globalSurfaceCondition.value || "";
  }

  function getFieldValue(id) {
    const field = document.getElementById(id);
    return field ? field.value : "";
  }

  function setFieldValue(id, value) {
    const field = document.getElementById(id);
    if (field && value != null) {
      field.value = value;
    }
  }

  function showValidationMessages(messages) {
    if (!elements.validationPanel) {
      return;
    }

    if (!messages || messages.length === 0) {
      elements.validationPanel.classList.add("d-none");
      elements.validationPanel.innerHTML = "";
      return;
    }

    elements.validationPanel.classList.remove("d-none");
    elements.validationPanel.innerHTML = `<ul class="mb-0">${messages.map((message) => `<li>${escapeHtml(message)}</li>`).join("")}</ul>`;
  }

  function cleanupDragState() {
    clearDropIndicators();
    elements.routeCanvas.classList.remove("is-dragover");
    state.dragPayload = null;
    elements.routeCanvas.querySelectorAll(".route-node.is-dragging").forEach((node) => {
      node.classList.remove("is-dragging");
    });
  }

  function clearDropIndicators() {
    elements.routeCanvas.querySelectorAll(".drop-before, .drop-after").forEach((node) => {
      node.classList.remove("drop-before", "drop-after");
    });
  }

  function readProp(source) {
    const keys = Array.prototype.slice.call(arguments, 1);
    for (let i = 0; i < keys.length; i += 1) {
      if (source && source[keys[i]] !== undefined && source[keys[i]] !== null) {
        return source[keys[i]];
      }
    }
    return null;
  }

  function sanitizeValue(value) {
    if (value == null) {
      return "";
    }
    return String(value).replace(",", ".").trim();
  }

  function parseNumber(value, fallback) {
    if (value === "" || value == null) {
      return fallback;
    }
    const parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function formatNumber(value, digits) {
    const parsed = parseNumber(value, 0);
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(parsed);
  }

  function formatCompactNumber(value, maxDigits) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return "—";
    }

    return new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: maxDigits
    }).format(parsed);
  }

  function formatForInput(value) {
    if (value === "" || value == null || !Number.isFinite(Number(value))) {
      return "";
    }

    return Number(value).toFixed(6).replace(/\.?0+$/, "");
  }

  function formatNullable(value) {
    return value == null ? "" : formatForInput(value);
  }

  function getUnitLabel(unit) {
    return {
      m: "м",
      mm: "мм",
      deg: "°",
      rad: "рад",
      cPerM: "°C/м",
      cTotal: "°C всего"
    }[unit] || "";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
