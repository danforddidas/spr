import { useEffect, useMemo, useState } from "react";
import ProjectCard from "../components/ProjectCard.jsx";

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

export default function SupervisorDashboard({ setPage }) {
  const [me, setMe] = useState({});
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [meRes, list, notes] = await Promise.all([
          fetch(`${API}/auth/me/`, { headers: headers() }).then((r) =>
            r.json()
          ),
          getData("/projects/?mine=1"),
          getData("/notifications/"),
        ]);

        setMe(meRes);
        setProjects(list.map(adaptProject));
        setNotifications(notes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const count = (s) => projects.filter((p) => p.status === s).length;
  const unread = notifications.filter((n) => !n.is_read);

  const list = useMemo(
    () =>
      projects.filter((p) => {
        const text = [
          p.title,
          p.leader?.full_name,
          p.leader?.reg_number,
          p.course,
          p.tech.join(" "),
        ]
          .join(" ")
          .toLowerCase();

        return (
          (filter === "all" || p.status === filter) &&
          (!q || text.includes(q.toLowerCase()))
        );
      }),
    [projects, filter, q]
  );

  const tabs = [
    ["all", `All (${projects.length})`],
    ["pending", `Pending (${count("pending")})`],
    ["approved", `Approved (${count("approved")})`],
    ["rejected", `Rejected (${count("rejected")})`],
  ];

  return (
    <div className="page">
      <div className="welcome">
        <h1>Welcome, {me.first_name || me.full_name || "Supervisor"}!</h1>
        <p className="muted">
          Students assigned to you. Open a project to read the document,
          comment, approve or reject.
        </p>
      </div>

      <div className="stats">
        <div className="stat">
          <div>
            <span className="muted">Assigned projects</span>
            <b>{projects.length}</b>
          </div>
        </div>
        <div className="stat">
          <div>
            <span className="muted">Pending review</span>
            <b>{count("pending")}</b>
          </div>
        </div>
        <div className="stat">
          <div>
            <span className="muted">Approved</span>
            <b>{count("approved")}</b>
          </div>
        </div>
        <div className="stat">
          <div>
            <span className="muted">Unread alerts</span>
            <b>{unread.length}</b>
          </div>
        </div>
      </div>

      {unread.length > 0 && (
        <section className="card">
          <header>
            <h3>New notifications</h3>
            {setPage && (
              <button
                className="link"
                onClick={() => setPage("notifications")}
              >
                Open all
              </button>
            )}
          </header>
          <ul className="notif-list">
            {unread.slice(0, 5).map((n) => (
              <li key={n.id}>
                <i className="dot-s blue" />
                <div>
                  <p>{n.message}</p>
                  <small className="muted">
                    {n.project_title}
                    {" · "}
                    {new Date(n.created_at).toLocaleString()}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="filters card">
        <input
          placeholder="Quick search: student name, reg number, title, technology…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="seg">
        {tabs.map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={filter === key ? "seg-btn active" : "seg-btn"}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="muted">Loading your projects...</p>}
      {error && <p className="muted">{error}</p>}

      {!loading && !error && list.length === 0 && (
        <div className="card">
          <h3>No projects found</h3>
          <p className="muted">
            No assigned project matches this filter.
          </p>
        </div>
      )}

      <div className="cards-grid">
        {list.map((p) => (
          <div key={p.id}>
            <p className="muted">
              Student: <b>{p.leader?.full_name}</b>{" "}
              {p.leader?.reg_number && `(${p.leader.reg_number})`}
            </p>
            <ProjectCard p={p} />
          </div>
        ))}
      </div>
    </div>
  );
}