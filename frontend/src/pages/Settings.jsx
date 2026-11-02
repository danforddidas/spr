import { useEffect, useState } from "react";
import { useSettings } from "../settings.jsx";
import { useAuth } from "../auth.jsx";

const SECTIONS = [
  { id: "profile", icon: "☺" },
  { id: "security", icon: "⛉" },
  { id: "preferences", icon: "◉" },
  { id: "accessibility", icon: "♿" },
  { id: "notifications", icon: "✉" },
];

function Option({ icon, title, sub, note, selected, onClick, badge }) {
  return (
    <button type="button" className={selected ? "opt on" : "opt"} onClick={onClick} aria-pressed={selected}>
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
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" />
    </label>
  );
}

export default function Settings() {
  const { saved, save, t, sysDark, browserLang } = useSettings();
  const { user } = useAuth();
  const [section, setSection] = useState("preferences");
  const [draft, setDraft] = useState(saved);
  const [flash, setFlash] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => setDraft(saved), [saved]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const onSave = () => {
    save(draft);
    setFlash(true);
    setTimeout(() => setFlash(false), 1800);
  };

  // Preview the draft theme live so the choice is visible before Save.
  useEffect(() => {
    const eff = draft.theme === "device" ? (sysDark ? "dark" : "light") : draft.theme;
    document.documentElement.dataset.theme = eff;
    return () => {
      const cur = saved.theme === "device" ? (sysDark ? "dark" : "light") : saved.theme;
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
          <button className="set-collapse" onClick={() => setCollapsed((c) => !c)}>
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
                  <label>{t("set.name")}<input defaultValue={user.name} /></label>
                  <label>{t("set.reg")}<input defaultValue={user.regNo} /></label>
                  <label>{t("set.email")}<input type="email" defaultValue={user.email} /></label>
                </div>
              </>
            )}

            {section === "security" && (
              <>
                <h3>{t("set.security")}</h3>
                <div className="form flat">
                  <label>{t("set.curPass")}<input type="password" autoComplete="current-password" /></label>
                  <label>{t("set.newPass")}<input type="password" autoComplete="new-password" /></label>
                </div>
              </>
            )}

            {section === "notifications" && (
              <>
                <h3>{t("set.notifications")}</h3>
                <div className="toggles">
                  <Toggle label={t("set.notifSup")} sub="" checked onChange={() => {}} />
                  <Toggle label={t("set.notifGroup")} sub="" checked onChange={() => {}} />
                </div>
              </>
            )}
          </div>

          <footer className="set-foot">
            {flash && <span className="saved-msg">{t("set.saved")}</span>}
            <button className="btn-ghost" onClick={() => setDraft(saved)} disabled={!dirty}>
              {t("set.cancel")}
            </button>
            <button className="btn-save" onClick={onSave} disabled={!dirty}>
              {t("set.save")}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
