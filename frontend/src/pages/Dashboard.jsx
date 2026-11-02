import { useEffect, useState } from "react";
import BannerSlider from "../components/BannerSlider.jsx";
import Ticker from "../components/Ticker.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import { useSettings } from "../settings.jsx";
import { useAuth } from "../auth.jsx";
import SupervisorDashboard from "./SupervisorDashboard.jsx";

const API = "/api";

function headers() {
  return { Authorization: `Token ${localStorage.getItem("spr-token")}` };
}

async function getData(endpoint) {
  const response = await fetch(`${API}${endpoint}`, { headers: headers() });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.results || [];
}

function adaptProject(project) {
  return {
    ...project,
    course: project.course_name || "Course not specified",
    type: project.submission_type === "group" ? "Group" : "Individual",
    status: project.status || "pending",
    tech: (project.technologies || []).map((item) => item.name),
    supervisors: (project.supervisors || []).map((item) => item.full_name),
  };
}

function StudentDashboard({ setPage }) {
  const { t } = useSettings();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [list, notes, sups] = await Promise.all([
          getData("/projects/?mine=1"),
          getData("/notifications/"),
          getData("/supervisors/"),
        ]);

        setProjects(list.map(adaptProject));
        setNotifications(notes);
        setSupervisors(sups);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const count = (s) => projects.filter((p) => p.status === s).length;
  const unread = notifications.filter((n) => !n.is_read).length;
  const firstName = (user?.name || user?.first_name || "").split(" ")[0];

  const stats = [
    { label: "My Projects", value: projects.length, tone: "blue", icon: "▤" },
    { label: "Pending Review", value: count("pending"), tone: "orange", icon: "◔" },
    { label: "Approved", value: count("approved"), tone: "green", icon: "✔" },
    { label: "Unread Alerts", value: unread, tone: "navy", icon: "✉" },
  ];

  const latest = projects[0];

  return (
    <div className="page">
      <Ticker />
      <BannerSlider />

      <div className="welcome">
        <h1>
          {t("welcome")}, {firstName}!
        </h1>
        <p className="muted">{t("overview")}</p>
      </div>

      <div className="summary">
        <div className="summary-icon">✦</div>
        <div>
          <strong>
            Quick summary <span className="badge blue">Live</span>
          </strong>
          <p>
            {loading
              ? "Loading your projects..."
              : projects.length === 0
              ? "You have not submitted any project yet."
              : `You have ${projects.length} project(s) in the repository. Latest: “${latest.title}” (${latest.status}).`}
          </p>
          <div className="chips">
            <span className="chip blue">{count("pending")} pending review</span>
            <span className="chip green">{count("approved")} approved</span>
            <span className="chip orange">{unread} new alerts</span>
          </div>
        </div>
      </div>

      {error && <p className="muted">{error}</p>}

      <div className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div>
              <span className="muted">{s.label}</span>
              <b>{s.value}</b>
            </div>
            <div className={`stat-icon ${s.tone}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid3">
        <section className="card">
          <header>
            <h3>{t("recent")}</h3>
            <button className="link" onClick={() => setPage("browse")}>
              {t("viewAll")}
            </button>
          </header>
          <div className="stack">
            {!loading && projects.length === 0 && (
              <p className="muted">No projects yet.</p>
            )}
            {projects.slice(0, 2).map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        <section className="card">
          <header>
            <h3>{t("nav.notifications")}</h3>
            <button
              className="link"
              onClick={() => setPage("notifications")}
            >
              {t("open")}
            </button>
          </header>
          <ul className="notif-list">
            {!loading && notifications.length === 0 && (
              <li>
                <p className="muted">No notifications yet.</p>
              </li>
            )}
            {notifications.slice(0, 5).map((n) => (
              <li key={n.id}>
                <i className={`dot-s ${n.is_read ? "" : "blue"}`} />
                <div>
                  <p>{n.message}</p>
                  <small className="muted">
                    {n.created_at
                      ? new Date(n.created_at).toLocaleString()
                      : ""}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <header>
            <h3>{t("nav.supervisors")}</h3>
            <button
              className="link"
              onClick={() => setPage("supervisors")}
            >
              {t("explore")}
            </button>
          </header>
          <ul className="sup-list">
            {supervisors.slice(0, 4).map((s, i) => {
              const name =
                s.full_name ||
                `${s.first_name || ""} ${s.last_name || ""}`.trim();

              return (
                <li key={s.id}>
                  <div className={`avatar c${i % 3}`}>{name.charAt(0)}</div>
                  <div>
                    <strong>{name}</strong>
                    <small className="muted">{s.email}</small>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="cta">
        <div>
          <h3>Ready to share your project?</h3>
          <p>
            Submit once — your two supervisors are alerted the moment you hit
            submit.
          </p>
        </div>
        <button className="btn light" onClick={() => setPage("submit")}>
          Submit a project
        </button>
      </section>
    </div>
  );
}

export default function Dashboard(props) {
  const [role, setRole] = useState(null);

  useEffect(() => {
    fetch(`${API}/auth/me/`, { headers: headers() })
      .then((r) => r.json())
      .then((d) => setRole(d.role || "student"))
      .catch(() => setRole("student"));
  }, []);

  if (role === null) {
    return (
      <div className="page">
        <p className="muted">Loading...</p>
      </div>
    );
  }

  if (role === "supervisor") {
    return <SupervisorDashboard setPage={props.setPage} />;
  }

  return <StudentDashboard {...props} />;
}