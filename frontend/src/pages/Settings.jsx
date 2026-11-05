import { useEffect, useState } from "react";
import { useSettings } from "../settings.jsx";
import { useAuth } from "../auth.jsx";

const API = "/api";

const SECTIONS = [
  { id: "profile", icon: "☺" },
  { id: "security", icon: "⛉" },
  { id: "preferences", icon: "◉" },
  { id: "accessibility", icon: "♿" },
  { id: "notifications", icon: "✉" },
];

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Token ${localStorage.getItem("spr-token")}`,
  };
}

function errorText(data) {
  if (data?.detail) return data.detail;
  if (data && typeof data === "object") {
    const first = Object.values(data)[0];
    if (Array.isArray(first)) return first[0];
    if (typeof first === "string") return first;
  }
  return "Something went wrong. Please try again.";
}

function Option({ icon, title, sub, note, selected, onClick, badge }) {
  return (
    <button
      type="button"
      className={selected ? "opt on" : "opt"}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className={badge ? "opt-icon badge-txt" : "opt-icon"}>{icon}</span>
      <strong>{title}</strong>
      <small>{sub}</small>
      {note && <em>{note}</em>}
    </button>
  );
}

function Toggle({ label, sub, checked, onChange }) {
  return (
    <label className="toggle-row">
      <div>
        <strong>{label}</strong>
        <small>{sub}</small>
      </div>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch" />
    </label>
  );
}

export default function Settings() {
  const { saved, save, t, sysDark, browserLang } = useSettings();
  const { user } = useAuth();

  const [section, setSection] = useState("preferences");
  const [draft, setDraft] = useState(saved);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [pw, setPw] = useState({ cur: "", next: "" });

  useEffect(() => setDraft(saved), [saved]);

  const prefsDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const profileDirty =
    profile.name.trim() !== (user?.name || "") ||
    profile.email.trim() !== (user?.email || "");
  const pwDirty = pw.cur.length > 0 || pw.next.length > 0;
  const dirty = prefsDirty || profileDirty || pwDirty;

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const onSave = async () => {
    setError("");
    setBusy(true);

    try {
      // 1. Mapendeleo (theme, lugha, ufikivu)
      if (prefsDirty) save(draft);

      // 2. Wasifu
      if (profileDirty) {
        const parts = profile.name.trim().split(/\s+/);
        const first = parts.shift() || "";
        const last = parts.join(" ");

        const res = await fetch(`${API}/auth/me/`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify({
            first_name: first,
            last_name: last,
            email: profile.email.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(errorText(data));
      }

      // 3. Nenosiri
      if (pwDirty) {
        if (!pw.cur || pw.next.length < 6) {
          throw new Error(
            "Enter your current password and a new one (at least 6 characters)."
          );
        }

        const res = await fetch(`${API}/auth/password/`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            old_password: pw.cur,
            new_password: pw.next,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(errorText(data));
        setPw({ cur: "", next: "" });
      }

      setFlash(t("set.saved"));
      setTimeout(() => setFlash(""), 1800);

      if (profileDirty) setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onCancel = () => {
    setDraft(saved);
    setProfile({ name: user?.name || "", email: user?.email || "" });
    setPw({ cur: "", next: "" });
    setError("");
  };

  // Onyesha theme ya draft moja kwa moja kabla ya Save
  useEffect(() => {
    const eff =
      draft.theme === "device" ? (sysDark ? "dark" : "light") : draft.theme;
    document.documentElement.dataset.theme = eff;
    return () => {
      const cur =
        saved.theme === "device" ? (sysDark ? "dark" : "light") : saved.theme;
      document.documentElement.dataset.theme = cur;
    };
  }, [draft.theme, saved.theme, sysDark]);

  return (
    <div className="page settings-page">
      <div className={collapsed ? "settings collapsed" : "settings"}>
        <aside className="set-nav">
          <div className="set-head">
            <h2>{t("set.title")}</h2>
            <p>{t("set.sub")}</p>
          </div>
          <nav>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={section === s.id ? "set-item active" : "set-item"}
                onClick={() => setSection(s.id)}
                title={t(`set.${s.id}`)}
              >
                <span>{s.icon}</span>
                <b>{t(`set.${s.id}`)}</b>
              </button>
            ))}
          </nav>
          <button
            className="set-collapse"
            onClick={() => setCollapsed((c) => !c)}
          >
            « <b>{t("set.collapse")}</b>
          </button>
        </aside>

        <div className="set-body">
          <div className="set-content">
            {section === "preferences" && (
              <>
                <h3>{t("set.theme")}</h3>
                <p className="muted">{t("set.themeSub")}</p>
                <div className="opts">
                  <Option
                    icon="▭"
                    title={t("set.device")}
                    sub={t("set.deviceSub")}
                    note={sysDark ? "dark" : "light"}
                    selected={draft.theme === "device"}
                    onClick={() => set({ theme: "device" })}
                  />
                  <Option
                    icon="☀"
                    title={t("set.light")}
                    sub={t("set.lightSub")}
                    selected={draft.theme === "light"}
                    onClick={() => set({ theme: "light" })}
                  />
                  <Option
                    icon="☾"
                    title={t("set.dark")}
                    sub={t("set.darkSub")}
                    selected={draft.theme === "dark"}
                    onClick={() => set({ theme: "dark" })}
                  />
                </div>

                <h3 className="gap">{t("set.language")}</h3>
                <p className="muted">{t("set.languageSub")}</p>
                <div className="opts">
                  <Option
                    icon="文"
                    title={t("set.browser")}
                    sub={t("set.browserSub")}
                    note={browserLang}
                    selected={draft.language === "browser"}
                    onClick={() => set({ language: "browser" })}
                  />
                  <Option
                    badge
                    icon="EN"
                    title={t("set.english")}
                    sub={t("set.englishSub")}
                    selected={draft.language === "en"}
                    onClick={() => set({ language: "en" })}
                  />
                  <Option
                    badge
                    icon="SW"
                    title={t("set.swahili")}
                    sub={t("set.swahiliSub")}
                    selected={draft.language === "sw"}
                    onClick={() => set({ language: "sw" })}
                  />
                </div>
              </>
            )}

            {section === "accessibility" && (
              <>
                <h3>{t("set.accessibility")}</h3>
                <div className="toggles">
                  <Toggle
                    label={t("set.reduce")}
                    sub={t("set.reduceSub")}
                    checked={draft.reduceMotion}
                    onChange={(v) => set({ reduceMotion: v })}
                  />
                  <Toggle
                    label={t("set.large")}
                    sub={t("set.largeSub")}
                    checked={draft.largeText}
                    onChange={(v) => set({ largeText: v })}
                  />
                </div>
              </>
            )}

            {section === "profile" && (
              <>
                <h3>{t("set.profile")}</h3>
                <div className="form flat">
                  <label>
                    {t("set.name")}
                    <input
                      value={profile.name}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    {t("set.reg")}
                    <input value={user?.regNo || ""} readOnly />
                  </label>
                  <label>
                    {t("set.email")}
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, email: e.target.value }))
                      }
                    />
                  </label>
                </div>
              </>
            )}

            {section === "security" && (
              <>
                <h3>{t("set.security")}</h3>
                <div className="form flat">
                  <label>
                    {t("set.curPass")}
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={pw.cur}
                      onChange={(e) =>
                        setPw((p) => ({ ...p, cur: e.target.value }))
                      }
                    />
                  </label>
                  <label>
                    {t("set.newPass")}
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={pw.next}
                      onChange={(e) =>
                        setPw((p) => ({ ...p, next: e.target.value }))
                      }
                    />
                  </label>
                </div>
              </>
            )}

            {section === "notifications" && (
              <>
                <h3>{t("set.notifications")}</h3>
                <div className="toggles">
                  <Toggle
                    label={t("set.notifSup")}
                    sub=""
                    checked
                    onChange={() => {}}
                  />
                  <Toggle
                    label={t("set.notifGroup")}
                    sub=""
                    checked
                    onChange={() => {}}
                  />
                </div>
              </>
            )}
          </div>

          <footer className="set-foot">
            {error && <span className="auth-err">{error}</span>}
            {flash && <span className="saved-msg">{flash}</span>}
            <button
              className="btn-ghost"
              onClick={onCancel}
              disabled={!dirty || busy}
            >
              {t("set.cancel")}
            </button>
            <button
              className="btn-save"
              onClick={onSave}
              disabled={!dirty || busy}
            >
              {busy ? "..." : t("set.save")}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}