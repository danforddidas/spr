
import { useEffect, useState } from "react";
import BannerSlider from "../components/BannerSlider.jsx";
import Ticker from "../components/Ticker.jsx";
import { useAuth } from "../auth.jsx";
import { useSettings } from "../settings.jsx";

const API = "/api";

async function getOptions(endpoint) {
  const response = await fetch(`${API}${endpoint}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error("Unable to load registration options.");
  }

  return data;
}

function PasswordField({ label, value, onChange, autoComplete }) {
  const { t } = useSettings();
  const [show, setShow] = useState(false);

  return (
    <label>
      {label}
      <div className="pw">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
        />
        <button type="button" onClick={() => setShow((s) => !s)}>
          {show ? t("auth.hide") : t("auth.show")}
        </button>
      </div>
    </label>
  );
}

function LoginForm({ goRegister }) {
  const { login } = useAuth();
  const { t } = useSettings();

  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);

    const r = await login(id, pw);

    setBusy(false);

    if (!r.ok) setErr(r.error);
  };

  return (
    <form onSubmit={submit} className="auth-form">
      <label>
        {t("auth.id")}
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          autoComplete="username"
          required
        />
      </label>

      <PasswordField
        label={t("auth.pass")}
        value={pw}
        onChange={setPw}
        autoComplete="current-password"
      />

      {err && <p className="auth-err" role="alert">{err}</p>}

      <button className="btn wide" disabled={busy}>
        {busy ? "Please wait..." : t("auth.loginBtn")}
      </button>

      <p className="auth-switch">
        {t("auth.noAcc")}{" "}
        <button type="button" onClick={goRegister}>
          {t("auth.register")}
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ goLogin }) {
  const { register } = useAuth();
  const { t } = useSettings();

  const [f, setF] = useState({
    first_name: "",
    last_name: "",
    reg_number: "",
    email: "",
    phone: "",
    school: "",
    department: "",
    course: "",
    password: "",
    confirm: "",
  });

  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(true);

  const set = (patch) => setF((old) => ({ ...old, ...patch }));

  // Load schools
  useEffect(() => {
    let active = true;

    getOptions("/schools/")
      .then((data) => {
        if (active) setSchools(data);
      })
      .catch((error) => {
        if (active) setErr(error.message);
      })
      .finally(() => {
        if (active) setLoadingSchools(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Load departments when school changes
  useEffect(() => {
    if (!f.school) {
      setDepartments([]);
      return;
    }

    let active = true;
    setDepartments([]);
    setCourses([]);

    getOptions(`/departments/?school=${f.school}`)
      .then((data) => {
        if (active) setDepartments(data);
      })
      .catch((error) => {
        if (active) setErr(error.message);
      });

    return () => {
      active = false;
    };
  }, [f.school]);

  // Load courses when department changes
  useEffect(() => {
    if (!f.department) {
      setCourses([]);
      return;
    }

    let active = true;
    setCourses([]);

    getOptions(`/courses/?department=${f.department}`)
      .then((data) => {
        if (active) setCourses(data);
      })
      .catch((error) => {
        if (active) setErr(error.message);
      });

    return () => {
      active = false;
    };
  }, [f.department]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (f.password.length < 6) {
      setErr("Password must contain at least 6 characters.");
      return;
    }

    if (f.password !== f.confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setBusy(true);

    const r = await register(f);

    setBusy(false);

    if (!r.ok) setErr(r.error);
  };

  return (
    <form onSubmit={submit} className="auth-form">
      <div className="row">
        <label>
          First Name
          <input
            value={f.first_name}
            onChange={(e) => set({ first_name: e.target.value })}
            autoComplete="given-name"
            required
          />
        </label>

        <label>
          Last Name
          <input
            value={f.last_name}
            onChange={(e) => set({ last_name: e.target.value })}
            autoComplete="family-name"
            required
          />
        </label>
      </div>

      <label>
        {t("set.reg")}
        <input
          value={f.reg_number}
          onChange={(e) => set({ reg_number: e.target.value })}
          placeholder="12345/T.2023"
          required
        />
      </label>

      <label>
        {t("set.email")}
        <input
          type="email"
          value={f.email}
          onChange={(e) => set({ email: e.target.value })}
          placeholder="you@aru.ac.tz"
          autoComplete="email"
          required
        />
      </label>

      <label>
        Phone (Optional)
        <input
          type="tel"
          value={f.phone}
          onChange={(e) => set({ phone: e.target.value })}
          placeholder="+255..."
        />
      </label>

      <label>
        {t("auth.school")}
        <select
          value={f.school}
          onChange={(e) =>
            set({
              school: e.target.value,
              department: "",
              course: "",
            })
          }
          required
        >
          <option value="">
            {loadingSchools ? "Loading schools..." : t("auth.select")}
          </option>

          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </label>

      <div className="row">
        <label>
          {t("auth.dept")}
          <select
            value={f.department}
            onChange={(e) =>
              set({
                department: e.target.value,
                course: "",
              })
            }
            disabled={!f.school}
            required
          >
            <option value="">{t("auth.select")}</option>

            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("auth.course")}
          <select
            value={f.course}
            onChange={(e) => set({ course: e.target.value })}
            disabled={!f.department}
            required
          >
            <option value="">{t("auth.select")}</option>

            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="row">
        <PasswordField
          label={t("auth.pass")}
          value={f.password}
          onChange={(v) => set({ password: v })}
          autoComplete="new-password"
        />

        <PasswordField
          label={t("auth.confirm")}
          value={f.confirm}
          onChange={(v) => set({ confirm: v })}
          autoComplete="new-password"
        />
      </div>

      {err && <p className="auth-err" role="alert">{err}</p>}

      <button className="btn wide" disabled={busy || loadingSchools}>
        {busy ? "Creating account..." : t("auth.regBtn")}
      </button>

      <p className="auth-switch">
        {t("auth.haveAcc")}{" "}
        <button type="button" onClick={goLogin}>
          {t("auth.login")}
        </button>
      </p>
    </form>
  );
}

export default function Auth() {
  const { t, lang, saved, save } = useSettings();
  const [mode, setMode] = useState("login");

  return (
    <div className="auth">
      <section className="auth-left">
        <div className="auth-brand">
          <img src="/assets/aru-logo.jpg" alt="Ardhi University" />
          <div>
            <strong>Student Project Repository</strong>
            <span>Ardhi University · Weledi na Ustawi</span>
          </div>
        </div>

        <Ticker />
        <BannerSlider />
        <p className="auth-tag">{t("auth.tag")}</p>
      </section>

      <section className="auth-right">
        <div className="auth-top">
          <button
            className="lang-btn"
            onClick={() =>
              save({
                ...saved,
                language: lang === "en" ? "sw" : "en",
              })
            }
            aria-label="Switch language"
          >
            {lang === "en" ? "Kiswahili" : "English"}
          </button>
        </div>

        <div className="auth-card">
          <h1>
            {mode === "login"
              ? t("auth.welcome")
              : t("auth.createTitle")}
          </h1>

          <div className="seg full">
            <button
              type="button"
              className={mode === "login" ? "seg-btn active" : "seg-btn"}
              onClick={() => setMode("login")}
            >
              {t("auth.login")}
            </button>

            <button
              type="button"
              className={mode === "register" ? "seg-btn active" : "seg-btn"}
              onClick={() => setMode("register")}
            >
              {t("auth.register")}
            </button>
          </div>

          {mode === "login" ? (
            <LoginForm goRegister={() => setMode("register")} />
          ) : (
            <RegisterForm goLogin={() => setMode("login")} />
          )}

          <p className="demo-note">{t("auth.demo")}</p>
        </div>
      </section>
    </div>
  );
}
