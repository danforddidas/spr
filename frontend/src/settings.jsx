import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "spr-settings";

const DICT = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.browse": "Browse Projects",
    "nav.submit": "Submit Project",
    "nav.mine": "My Projects",
    "nav.groups": "Group Projects",
    "nav.supervisors": "Supervisors",
    "nav.notifications": "Notifications",
    "nav.profile": "Profile & Settings",
    welcome: "Welcome back",
    overview: "Here’s an overview of your projects and supervisors.",
    recent: "Recent Projects",
    viewAll: "View all →",
    open: "Open →",
    explore: "Explore →",
    "set.title": "Personal settings",
    "set.sub": "Update your profile, security, and accessibility preferences.",
    "set.profile": "Profile",
    "set.security": "Security",
    "set.preferences": "Preferences",
    "set.accessibility": "Accessibility",
    "set.notifications": "Notifications",
    "set.collapse": "Collapse",
    "set.theme": "Theme",
    "set.themeSub": "Pick how SPR adapts to your light or dark preference.",
    "set.device": "Use device",
    "set.deviceSub": "Follow your OS appearance automatically.",
    "set.light": "Light",
    "set.lightSub": "Bright surface with calm contrast.",
    "set.dark": "Dark",
    "set.darkSub": "Dimmed surface for low-light work.",
    "set.language": "Language",
    "set.languageSub": "Switch between supported interface languages.",
    "set.browser": "Match browser",
    "set.browserSub": "Follow your browser language automatically.",
    "set.english": "English",
    "set.englishSub": "Use the English UI.",
    "set.swahili": "Kiswahili",
    "set.swahiliSub": "Use the Swahili UI.",
    "set.current": "now",
    "set.cancel": "Cancel",
    "set.save": "Save",
    "set.saved": "Saved ✔",
    "set.reduce": "Reduce motion",
    "set.reduceSub": "Stop the sliding banner and moving ticker animations.",
    "set.large": "Larger text",
    "set.largeSub": "Increase the base text size across the app.",
    "set.name": "Full name",
    "set.reg": "Registration number",
    "set.email": "Email",
    "set.curPass": "Current password",
    "set.newPass": "New password",
    "set.notifSup": "Supervisor comments and approvals",
    "set.notifGroup": "Group activity (members joining, submissions)",
    "auth.login": "Log in",
    "auth.register": "Register",
    "auth.welcome": "Welcome to SPR",
    "auth.createTitle": "Create your account",
    "auth.tag": "Share and discover Ardhi University student projects.",
    "auth.id": "Registration number or email",
    "auth.pass": "Password",
    "auth.confirm": "Confirm password",
    "auth.show": "Show",
    "auth.hide": "Hide",
    "auth.loginBtn": "Log in",
    "auth.regBtn": "Create account",
    "auth.noAcc": "No account yet?",
    "auth.haveAcc": "Already registered?",
    "auth.school": "School",
    "auth.dept": "Department",
    "auth.course": "Course",
    "auth.select": "Select",
    "auth.logout": "Log out",
    "auth.err.cred": "Wrong details. Check your registration number/email and password.",
    "auth.err.match": "Passwords do not match.",
    "auth.err.short": "Password must be at least 8 characters.",
    "auth.err.exists": "An account with this registration number or email already exists.",
    "auth.demo": "Demo mode: accounts are saved only in this browser until the backend is connected.",
  },
  sw: {
    "nav.dashboard": "Dashibodi",
    "nav.browse": "Tafuta Miradi",
    "nav.submit": "Wasilisha Mradi",
    "nav.mine": "Miradi Yangu",
    "nav.groups": "Miradi ya Kikundi",
    "nav.supervisors": "Wasimamizi",
    "nav.notifications": "Arifa",
    "nav.profile": "Wasifu na Mipangilio",
    welcome: "Karibu tena",
    overview: "Muhtasari wa miradi na wasimamizi wako.",
    recent: "Miradi ya Hivi Karibuni",
    viewAll: "Tazama yote →",
    open: "Fungua →",
    explore: "Angalia →",
    "set.title": "Mipangilio binafsi",
    "set.sub": "Sasisha wasifu, usalama na mapendeleo yako ya ufikivu.",
    "set.profile": "Wasifu",
    "set.security": "Usalama",
    "set.preferences": "Mapendeleo",
    "set.accessibility": "Ufikivu",
    "set.notifications": "Arifa",
    "set.collapse": "Punguza",
    "set.theme": "Mandhari",
    "set.themeSub": "Chagua jinsi SPR inavyofuata hali ya mwanga au giza.",
    "set.device": "Tumia kifaa",
    "set.deviceSub": "Fuata mwonekano wa mfumo wa kifaa chako.",
    "set.light": "Mwanga",
    "set.lightSub": "Uso angavu wenye utofautishaji laini.",
    "set.dark": "Giza",
    "set.darkSub": "Uso hafifu kwa kazi ya mwanga mdogo.",
    "set.language": "Lugha",
    "set.languageSub": "Badilisha kati ya lugha za kiolesura zinazopatikana.",
    "set.browser": "Fuata kivinjari",
    "set.browserSub": "Fuata lugha ya kivinjari chako moja kwa moja.",
    "set.english": "English",
    "set.englishSub": "Tumia kiolesura cha Kiingereza.",
    "set.swahili": "Kiswahili",
    "set.swahiliSub": "Tumia kiolesura cha Kiswahili.",
    "set.current": "sasa",
    "set.cancel": "Ghairi",
    "set.save": "Hifadhi",
    "set.saved": "Imehifadhiwa ✔",
    "set.reduce": "Punguza mwendo",
    "set.reduceSub": "Zima mwendo wa banner na ticker inayosogea.",
    "set.large": "Maandishi makubwa",
    "set.largeSub": "Ongeza ukubwa wa maandishi kwenye programu nzima.",
    "set.name": "Jina kamili",
    "set.reg": "Namba ya usajili",
    "set.email": "Barua pepe",
    "set.curPass": "Nenosiri la sasa",
    "set.newPass": "Nenosiri jipya",
    "set.notifSup": "Maoni na idhini za wasimamizi",
    "set.notifGroup": "Shughuli za kikundi (wanachama kujiunga, uwasilishaji)",
    "auth.login": "Ingia",
    "auth.register": "Jisajili",
    "auth.welcome": "Karibu SPR",
    "auth.createTitle": "Fungua akaunti yako",
    "auth.tag": "Shiriki na gundua miradi ya wanafunzi wa Chuo Kikuu cha Ardhi.",
    "auth.id": "Namba ya usajili au barua pepe",
    "auth.pass": "Nenosiri",
    "auth.confirm": "Thibitisha nenosiri",
    "auth.show": "Onyesha",
    "auth.hide": "Ficha",
    "auth.loginBtn": "Ingia",
    "auth.regBtn": "Fungua akaunti",
    "auth.noAcc": "Huna akaunti bado?",
    "auth.haveAcc": "Umeshajisajili?",
    "auth.school": "Shule",
    "auth.dept": "Idara",
    "auth.course": "Kozi",
    "auth.select": "Chagua",
    "auth.logout": "Toka",
    "auth.err.cred": "Taarifa si sahihi. Angalia namba ya usajili/barua pepe na nenosiri.",
    "auth.err.match": "Manenosiri hayalingani.",
    "auth.err.short": "Nenosiri liwe na angalau herufi 8.",
    "auth.err.exists": "Akaunti yenye namba ya usajili au barua pepe hii tayari ipo.",
    "auth.demo": "Hali ya majaribio: akaunti zinahifadhiwa kwenye browser hii tu hadi backend iunganishwe.",
  },
};

const DEFAULTS = { theme: "device", language: "browser", reduceMotion: false, largeText: false };

function load() {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY)) || {}) };
  } catch {
    return DEFAULTS;
  }
}

const Ctx = createContext(null);
export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }) {
  const [saved, setSaved] = useState(load);
  const [sysDark, setSysDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const h = (e) => setSysDark(e.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);

  const browserLang = (navigator.language || "en").toLowerCase().startsWith("sw") ? "sw" : "en";
  const resolveTheme = (s) => (s.theme === "device" ? (sysDark ? "dark" : "light") : s.theme);
  const resolveLang = (s) => (s.language === "browser" ? browserLang : s.language);

  const theme = resolveTheme(saved);
  const lang = resolveLang(saved);

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = theme;
    el.dataset.motion = saved.reduceMotion ? "reduce" : "full";
    el.dataset.text = saved.largeText ? "large" : "normal";
    el.lang = lang;
  }, [theme, lang, saved.reduceMotion, saved.largeText]);

  const save = useCallback((next) => {
    setSaved(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: setting still applies for this session */
    }
  }, []);

  const t = useCallback((k) => DICT[lang][k] ?? DICT.en[k] ?? k, [lang]);

  const value = useMemo(
    () => ({ saved, save, t, lang, theme, sysDark, browserLang }),
    [saved, save, t, lang, theme, sysDark, browserLang]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
