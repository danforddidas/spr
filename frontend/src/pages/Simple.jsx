
import { useEffect, useState } from "react";
import ProjectCard from "../components/ProjectCard.jsx";

const API = "/api";

function headers() {
  return {
    Authorization: `Token ${localStorage.getItem("spr-token")}`,
  };
}

async function getData(endpoint) {
  const response = await fetch(`${API}${endpoint}`, {
    headers: headers(),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.results || [];
}

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("spr-session") || "{}");
  } catch {
    return {};
  }
}

function belongsToStudent(project, userId) {
  const id = Number(userId);

  return (
    Number(project.leader?.id) === id ||
    (project.members || []).some(
      (member) => Number(member.id) === id
    )
  );
}

function adaptProject(project) {
  return {
    ...project,
    tech: (project.technologies || []).map((item) =>
      typeof item === "string" ? item : item.name
    ),
    supervisors: (project.supervisors || []).map((item) =>
      typeof item === "string" ? item : item.full_name
    ),
    course: project.course_name || project.course || "Not specified",
    status: project.status || "pending",
  };
}

// MY PROJECTS
export function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const user = currentUser();
        const all = await getData("/projects/");

        setProjects(
          all
            .filter((p) => belongsToStudent(p, user.id))
            .map(adaptProject)
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="page">
      <div className="welcome">
        <h1>My Projects</h1>
        <p className="muted">Projects you submitted or joined.</p>
      </div>

      {loading && <p>Loading projects...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && projects.length === 0 && (
        <div className="card">
          <h3>No projects found</h3>
          <p className="muted">
            You have not submitted or joined any projects yet.
          </p>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="cards-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// GROUP PROJECTS
export function Groups() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const user = currentUser();
        const all = await getData("/projects/");

        const groups = all.filter(
          (p) =>
            p.submission_type === "group" &&
            belongsToStudent(p, user.id)
        );

        setProjects(groups.map(adaptProject));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="page">
      <div className="welcome">
        <h1>Group Projects</h1>
        <p className="muted">
          Projects where you are the leader or a member.
        </p>
      </div>

      {loading && <p>Loading group projects...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && projects.length === 0 && (
        <div className="card">
          <h3>No group projects found</h3>
          <p className="muted">
            You are not participating in any group projects yet.
          </p>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="cards-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// SUPERVISORS
export function Supervisors() {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getData("/supervisors/")
      .then(setSupervisors)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="welcome">
        <h1>Supervisors</h1>
      </div>

      {loading && <p>Loading supervisors...</p>}
      {error && <p>{error}</p>}

      <div className="cards-grid">
        {supervisors.map((s, i) => {
          const name =
            s.full_name ||
            `${s.first_name || ""} ${s.last_name || ""}`.trim();

          return (
            <div className="card sup-card" key={s.id}>
              <div className={`avatar big c${i % 3}`}>
                {name.charAt(0)}
              </div>
              <div>
                <strong>{name}</strong>
                <p className="muted">
                  {s.department_name || s.department || "Supervisor"}
                </p>
                {s.email && <p>{s.email}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// NOTIFICATIONS
export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      const data = await getData("/notifications/");
      setNotifications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(id) {
    try {
      const response = await fetch(
        `${API}/notifications/${id}/read/`,
        {
          method: "POST",
          headers: headers(),
        }
      );

      if (!response.ok) {
        throw new Error("Could not update notification.");
      }

      setNotifications((old) =>
        old.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch(`${API}/notifications/read/`, {
        method: "POST",
        headers: headers(),
      });

      if (!response.ok) {
        throw new Error("Could not update notifications.");
      }

      setNotifications((old) =>
        old.map((n) => ({ ...n, is_read: true }))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="page">
      <div className="welcome">
        <h1>Notifications</h1>
        <p className="muted">{unread} unread notifications</p>

        {unread > 0 && (
          <button onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      {loading && <p>Loading notifications...</p>}
      {error && <p>{error}</p>}

      {!loading && notifications.length === 0 && (
        <div className="card">
          <h3>No notifications</h3>
          <p className="muted">
            Your notifications will appear here.
          </p>
        </div>
      )}

      <div className="card">
        <ul className="notif-list big">
          {notifications.map((n) => (
            <li key={n.id}>
              <i className={`dot-s ${n.is_read ? "" : "blue"}`} />
              <div>
                <p>{n.message}</p>
                <small className="muted">
                  {n.project_title || ""}
                  {" · "}
                  {n.created_at
                    ? new Date(n.created_at).toLocaleString()
                    : ""}
                </small>
                {!n.is_read && (
                  <button onClick={() => markAsRead(n.id)}>
                    Mark as read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
