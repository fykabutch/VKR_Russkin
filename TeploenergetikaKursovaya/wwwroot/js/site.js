(function () {
  const guestPresetKey = "dymtrassa.guestPresets.v1";
  const authShell = document.getElementById("authShell");
  const authModal = document.getElementById("authModal");
  const authForm = document.getElementById("authForm");
  const authError = document.getElementById("authError");
  const authSubmit = document.getElementById("authSubmit");
  const authTitle = document.getElementById("authModalTitle");
  const authLogin = document.getElementById("authLogin");
  const authPassword = document.getElementById("authPassword");
  let authMode = "login";
  let pendingCalculationSave = null;

  window.currentAuthState = { isAuthenticated: false };

  document.addEventListener("click", handleDocumentClick);
  if (authForm) {
    authForm.addEventListener("submit", submitAuthForm);
  }

  refreshAuthState();

  window.openAuthModal = function (mode, pendingSave) {
    pendingCalculationSave = pendingSave || null;
    openAuthModal(mode || "login");
  };

  async function refreshAuthState() {
    try {
      const response = await fetch("/Home/AuthState");
      if (!response.ok) {
        return;
      }

      window.currentAuthState = await response.json();
      renderAuthShell();
      document.dispatchEvent(new CustomEvent("teplo:auth-state", { detail: window.currentAuthState }));
    } catch (_error) {
      renderAuthShell();
    }
  }

  function renderAuthShell() {
    document.querySelectorAll("[data-guest-save-notice]").forEach((notice) => {
      notice.classList.toggle("d-none", Boolean(window.currentAuthState?.isAuthenticated));
    });

    if (!authShell) {
      return;
    }

    if (!window.currentAuthState?.isAuthenticated) {
      authShell.innerHTML = '<button type="button" class="btn btn-primary auth-login-button" data-auth-open data-auth-mode="login">Вход</button>';
      return;
    }

    const rawLogin = window.currentAuthState.login || "Профиль";
    const login = escapeHtml(rawLogin);
    const initial = escapeHtml(String(rawLogin).trim().charAt(0).toUpperCase() || "П");
    authShell.innerHTML = [
      `<button type="button" class="btn btn-outline-primary btn-sm profile-button" data-profile-toggle><span class="profile-avatar" aria-hidden="true">${initial}</span>${login}</button>`,
      '<div class="profile-menu d-none" data-profile-menu>',
      '<a href="/Home/MyCalculations">Мои расчеты</a>',
      '<button type="button" data-auth-logout>Выход</button>',
      '</div>'
    ].join("");
  }

  function handleDocumentClick(event) {
    const authOpen = event.target.closest("[data-auth-open]");
    if (authOpen) {
      openAuthModal(authOpen.dataset.authMode || "login");
      return;
    }

    const saveGuestCalculation = event.target.closest("#saveGuestCalculationBtn");
    if (saveGuestCalculation) {
      const payload = window.currentCalculationSavePayload;
      if (window.currentAuthState?.isAuthenticated) {
        saveCalculation(payload);
      } else {
        window.openAuthModal("login", payload);
      }
      return;
    }

    const profileToggle = event.target.closest("[data-profile-toggle]");
    if (profileToggle) {
      const menu = authShell?.querySelector("[data-profile-menu]");
      menu?.classList.toggle("d-none");
      return;
    }

    if (!event.target.closest("#authShell")) {
      authShell?.querySelector("[data-profile-menu]")?.classList.add("d-none");
    }

    if (event.target.closest("[data-auth-logout]")) {
      logout();
      return;
    }

    const tab = event.target.closest("[data-auth-tab]");
    if (tab) {
      setAuthMode(tab.dataset.authTab || "login");
      return;
    }

    if (event.target.closest("#authModalClose") || event.target === authModal) {
      closeAuthModal();
    }
  }

  function openAuthModal(mode) {
    setAuthMode(mode === "register" ? "register" : "login");
    clearAuthError();
    authModal?.classList.remove("d-none");
    authModal?.setAttribute("aria-hidden", "false");
    window.setTimeout(() => authLogin?.focus(), 0);
  }

  function closeAuthModal() {
    authModal?.classList.add("d-none");
    authModal?.setAttribute("aria-hidden", "true");
    clearAuthError();
  }

  function setAuthMode(mode) {
    authMode = mode === "register" ? "register" : "login";
    authTitle.textContent = authMode === "register" ? "Регистрация" : "Вход в профиль";
    authSubmit.textContent = authMode === "register" ? "Зарегистрироваться" : "Войти";
    document.querySelectorAll("[data-auth-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.authTab === authMode);
    });
  }

  async function submitAuthForm(event) {
    event.preventDefault();
    clearAuthError();

    const login = (authLogin?.value || "").trim();
    const password = authPassword?.value || "";
    const endpoint = authMode === "register" ? "/Home/Register" : "/Home/Login";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login,
          password,
          guestPresets: getGuestPresetsForSync()
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        showAuthError(data.error || "Не удалось войти в профиль.");
        return;
      }

      window.localStorage.removeItem(guestPresetKey);
      window.currentAuthState = {
        isAuthenticated: true,
        login: data.login,
        presets: data.presets || [],
        calculations: data.calculations || []
      };
      renderAuthShell();
      closeAuthModal();
      document.dispatchEvent(new CustomEvent("teplo:auth-state", { detail: window.currentAuthState }));

      if (pendingCalculationSave) {
        await saveCalculation(pendingCalculationSave);
        pendingCalculationSave = null;
      } else if (document.getElementById("routeForm")) {
        window.location.reload();
      }
    } catch (_error) {
      showAuthError("Не удалось обратиться к серверу авторизации.");
    }
  }

  async function logout() {
    await fetch("/Home/Logout", { method: "POST" });
    window.currentAuthState = { isAuthenticated: false };
    renderAuthShell();
    if (document.getElementById("routeForm")) {
      window.location.reload();
    }
  }

  async function saveCalculation(payload) {
    if (!payload) {
      return;
    }

    try {
      const response = await fetch("/Home/SaveCalculation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        showAuthError(data.error || "Не удалось сохранить расчет.");
        openAuthModal("login");
        return;
      }

      window.location.href = `/Home/CalculationResult?id=${encodeURIComponent(data.calculationId)}`;
    } catch (_error) {
      showAuthError("Не удалось сохранить расчет.");
      openAuthModal("login");
    }
  }

  function getGuestPresetsForSync() {
    try {
      const raw = window.localStorage.getItem(guestPresetKey);
      const presets = raw ? JSON.parse(raw) : [];
      return Array.isArray(presets)
        ? presets
            .filter((item) => item && item.name && item.model)
            .map((item) => ({ name: item.name, model: item.model }))
        : [];
    } catch (_error) {
      return [];
    }
  }

  function showAuthError(message) {
    if (!authError) {
      return;
    }

    authError.textContent = message;
    authError.classList.remove("d-none");
  }

  function clearAuthError() {
    if (!authError) {
      return;
    }

    authError.textContent = "";
    authError.classList.add("d-none");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();

(function () {
  const storageKey = "dymtrassa.hideOptimizationRecommendations.v1";

  let recommendationsHidden = readStoredState();

  applyRecommendationsState();
  document.addEventListener("click", handleRecommendationsToggleClick);
  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey) {
      return;
    }

    recommendationsHidden = readStoredState();
    applyRecommendationsState();
  });

  function handleRecommendationsToggleClick(event) {
    const toggle = event.target.closest("[data-recommendations-toggle]");
    if (!toggle) {
      return;
    }

    recommendationsHidden = !recommendationsHidden;
    writeStoredState(recommendationsHidden);
    applyRecommendationsState();
  }

  function applyRecommendationsState() {
    document.querySelectorAll("[data-recommendations-panel]").forEach((panel) => {
      panel.classList.toggle("is-collapsed", recommendationsHidden);
    });

    document.querySelectorAll("[data-recommendations-toggle]").forEach((button) => {
      button.textContent = recommendationsHidden ? "Показать" : "Скрыть";
      button.setAttribute("aria-expanded", String(!recommendationsHidden));
    });
  }

  function readStoredState() {
    try {
      return window.localStorage.getItem(storageKey) === "true";
    } catch (_error) {
      return false;
    }
  }

  function writeStoredState(value) {
    try {
      window.localStorage.setItem(storageKey, value ? "true" : "false");
    } catch (_error) {
      // The toggle should keep working for the current page even when storage is blocked.
    }
  }
})();
