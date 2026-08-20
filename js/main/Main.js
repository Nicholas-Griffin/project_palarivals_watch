const MENU_THEMES = Object.freeze({
  default: {
    code: "PRW-00",
    status: "MULTIVERSE ONLINE",
    eyebrow: "Three worlds. One arena.",
    copy: "Build your squad. Outplay the lobby. Be the last team standing.",
    universe: "PalaRivals Watch",
    callout: "Choose Your World",
    primaryHero: "Img/Characters/MarvelRivals/IronManPNG.jpeg",
    secondaryHero: "Img/Characters/Overwatch/TracerPNG.png"
  },
  marvel: {
    code: "MR-01",
    status: "RIVALS NETWORK",
    eyebrow: "Multiversal combat protocol",
    copy: "Tear open the timeline. Draft impossible alliances and fight for the last reality standing.",
    universe: "Marvel Rivals",
    callout: "Rivals Assemble",
    primaryHero: "Img/Characters/MarvelRivals/IronManPNG.jpeg",
    secondaryHero: "Img/Characters/MarvelRivals/ThorPNG.jpeg"
  },
  paladins: {
    code: "RC-02",
    status: "REALM CONVERGENCE",
    eyebrow: "Champions of the shattered realm",
    copy: "Summon a legendary roster, command ancient power, and claim the Realm before rival champions do.",
    universe: "Paladins",
    callout: "The Realm Calls",
    primaryHero: "Img/Characters/Paladins/SerisPNG.png",
    secondaryHero: "Img/Characters/Paladins/RaumPNG.png"
  },
  overwatch: {
    code: "OW-76",
    status: "WATCHPOINT: GIBRALTAR",
    eyebrow: "Overwatch command // Recall active",
    copy: "The world needs heroes. Assemble a precision strike team, counter the opposition, and deploy from Watchpoint Gibraltar.",
    universe: "Overwatch",
    callout: "The World Needs Heroes",
    primaryHero: "Img/Characters/Overwatch/TracerPNG.png",
    secondaryHero: "Img/Characters/Overwatch/GenjiPNG.png"
  }
});

const COLOR_MODE_STORAGE_KEY = "palarivals-watch-color-mode";

const body = document.body;
const themeSwitches = [...document.querySelectorAll("[data-theme-switch]")];
const themeCode = document.querySelector("#ThemeCode");
const themeStatus = document.querySelector("#ThemeStatus");
const themeEyebrow = document.querySelector("#ThemeEyebrow");
const themeCopy = document.querySelector("#ThemeCopy");
const themeUniverse = document.querySelector("#ThemeUniverse");
const themeCallout = document.querySelector("#ThemeCallout");
const primaryHero = document.querySelector("#ThemeHeroPrimary");
const secondaryHero = document.querySelector("#ThemeHeroSecondary");
const colorModeButton = document.querySelector("#ColorModeButton");
const colorModeIcon = document.querySelector("#ColorModeIcon");
const colorModeLabel = document.querySelector("#ColorModeLabel");
const signupButton = document.querySelector("#SignupButton");
const loginButton = document.querySelector("#LoginButton");
const loginPanel = document.querySelector("#prwLoginPanel");
const authTitle = document.querySelector("#prwAuthTitle");
const authKicker = document.querySelector("#prwAuthKicker");
const authDescription = document.querySelector("#prwAuthDescription");
const authModeCode = document.querySelector("#prwAuthModeCode");
const authActionLabel = document.querySelector("#prwLoginButton span");
const authCloseButtons = [...document.querySelectorAll("[data-auth-close]")];
const usernameInput = document.querySelector("#prwUsernameInput");

let transitionTimer;
let authMenuTrigger = null;

function readSavedColorMode() {
  try {
    const savedMode = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return savedMode === "light" || savedMode === "dark" ? savedMode : "dark";
  } catch {
    return "dark";
  }
}

function applyColorMode(mode, { persist = true } = {}) {
  const nextMode = mode === "light" ? "light" : "dark";
  const isLight = nextMode === "light";

  body.dataset.mode = nextMode;
  colorModeButton.setAttribute("aria-pressed", String(isLight));
  colorModeButton.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} mode`);
  colorModeButton.title = `Switch to ${isLight ? "dark" : "light"} mode`;
  colorModeIcon.textContent = isLight ? "☾" : "☀";
  colorModeLabel.textContent = isLight ? "Dark" : "Light";

  if (persist) {
    try {
      window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, nextMode);
    } catch {
      // The mode still works when browser storage is unavailable.
    }
  }
}

function applyTheme(themeName, { animate = true } = {}) {
  const theme = MENU_THEMES[themeName];

  if (!theme) {
    return;
  }

  const isNewTheme = body.dataset.theme !== themeName;

  if (animate && isNewTheme) {
    body.classList.add("theme-changing");
  }

  body.dataset.theme = themeName;
  window.PRWAudio?.setTheme(themeName);
  themeCode.textContent = theme.code;
  themeStatus.textContent = theme.status;
  themeEyebrow.textContent = theme.eyebrow;
  themeCopy.textContent = theme.copy;
  themeUniverse.textContent = theme.universe;
  themeCallout.textContent = theme.callout;
  primaryHero.src = theme.primaryHero;
  secondaryHero.src = theme.secondaryHero;

  themeSwitches.forEach((themeSwitch) => {
    const isSelected = themeSwitch.dataset.themeSwitch === themeName;
    themeSwitch.setAttribute("aria-pressed", String(isSelected));
  });

  window.clearTimeout(transitionTimer);
  transitionTimer = window.setTimeout(() => {
    body.classList.remove("theme-changing");
  }, isNewTheme && animate ? 360 : 0);
}

themeSwitches.forEach((themeSwitch) => {
  themeSwitch.addEventListener("click", () => {
    const selectedTheme = themeSwitch.dataset.themeSwitch;
    applyTheme(body.dataset.theme === selectedTheme ? "default" : selectedTheme);
  });
});

colorModeButton.addEventListener("click", () => {
  applyColorMode(body.dataset.mode === "dark" ? "light" : "dark");
});

function setAuthButtonState(isOpen) {
  signupButton?.setAttribute("aria-expanded", String(isOpen && loginPanel.dataset.authMode === "signup"));
  loginButton?.setAttribute("aria-expanded", String(isOpen && loginPanel.dataset.authMode === "login"));
}

function openAuthMenu(mode, trigger) {
  const isSignup = mode === "signup";

  authMenuTrigger = trigger;
  loginPanel.dataset.authMode = isSignup ? "signup" : "login";
  authKicker.textContent = isSignup ? "New Challenger Registration" : "Account Uplink";
  authTitle.textContent = isSignup ? "Create Your Identity" : "Welcome Back, Hero";
  authDescription.textContent = isSignup
    ? "Create your PalaRivals Watch identity and prepare to enter the multiverse arena."
    : "Enter your credentials to reconnect with your PalaRivals Watch profile.";
  authModeCode.textContent = isSignup ? "SIGNUP // 02" : "LOGIN // 01";
  authActionLabel.textContent = isSignup ? "Create Account" : "Log In";
  loginPanel.hidden = false;
  loginPanel.setAttribute("aria-hidden", "false");
  body.classList.add("auth-menu-open");
  setAuthButtonState(true);
  window.PRWAudio?.play("modalOpen");
  window.requestAnimationFrame(() => usernameInput?.focus());
}

function closeAuthMenu() {
  if (loginPanel.hidden) {
    return;
  }

  loginPanel.hidden = true;
  loginPanel.setAttribute("aria-hidden", "true");
  body.classList.remove("auth-menu-open");
  setAuthButtonState(false);
  window.PRWAudio?.play("modalClose");
  authMenuTrigger?.focus();
  authMenuTrigger = null;
}

signupButton?.addEventListener("click", () => openAuthMenu("signup", signupButton));
loginButton?.addEventListener("click", () => openAuthMenu("login", loginButton));
authCloseButtons.forEach((closeButton) => closeButton.addEventListener("click", closeAuthMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAuthMenu();
  }
});

applyColorMode(readSavedColorMode(), { persist: false });
applyTheme("default", { animate: false });
