import { useEffect, useMemo, useState } from "react";
import ProjectCard from "../components/ProjectCard.jsx";

const API = "/api";

function adaptProject(project) {
  return {
    ...project,
    course: project.course_name || "Course not specified",
    type: project.submission_type === "group" ? "Group" : "Individual",
    status: project.status || "pending",
    tech: (project.technologies || []).map((item) => item.name),
    supervisors: (project.supervisors || []).map((item) => item.full_name),
    document_url: project.document_url || null,
    attachments: project.attachments || [],
  };
}

export default function Browse() {
  const [projects, setProjects] = useState([]);
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [tech, setTech] = useState("");
  const [year, setYear] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const headers = {
          Authorization: `Token ${localStorage.getItem("spr-token")}`,
        };

        const [meRes, response] = await Promise.all([
          fetch(`${API}/auth/me/`, { headers }),
          fetch(`${API}/projects/`, { headers }),
        ]);

        if (!response.ok) {
          throw new Error("Unable to load projects from the repository.");
        }

        const me = await meRes.json().catch(() => ({}));
        const data = await response.json();
        const results = Array.isArray(data) ? data : data.results || [];

        if (active) {
          setRole(me.role || "");
          setProjects(results.map(adaptProject));
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const isSupervisor = role === "supervisor";

  const technologies = useMemo(
    () => [...new Set(projects.flatMap((p) => p.tech))].sort(),
    [projects]
  );

  const years = useMemo(
    () => [...new Set(projects.map((p) => p.year))].sort((a, b) => b - a),
    [projects]
  );

  const list = useMemo(
    () =>
      projects.filter((project) => {
        const searchText = [
          project.title,
          project.course,
          project.tech.join(" "),
          project.leader?.full_name,
          project.leader?.reg_number,
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!q || searchText.includes(q.toLowerCase())) &&
          (!tech || project.tech.includes(tech)) &&
          (!year || String(project.year) === year)
        );
      }),
    [projects, q, tech, year]
  );

  return (
    <div className="page">
      <div className="welcome">
        <h1>{isSupervisor ? "My Assigned Projects" : "Browse Projects"}</h1>
        <p className="muted">
          {isSupervisor
            ? "Search the projects of students assigned to you."
            : "Search all projects in the ARU repository by technology, course, topic or year."}
        </p>
      </div>

      <div className="filters card">
        <input
          placeholder={
            isSupervisor
              ? "Quick search: student, reg number, title…"
              : "Search title, course, topic…"
          }
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select value={tech} onChange={(e) => setTech(e.target.value)}>
          <option value="">All technologies</option>
          {technologies.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">All years</option>
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="welcome">
        <p className="muted">
          {loading
            ? "Loading projects..."
            : `${list.length} project(s) found`}
        </p>
      </div>

      {error && (
        <div className="card">
          <p className="muted">{error}</p>
        </div>
      )}

      {loading && <p className="muted">Please wait...</p>}

      {!loading && !error && (
        <div className="cards-grid">
          {list.map((project) => (
            <ProjectCard key={project.id} p={project} />
          ))}

          {list.length === 0 && (
            <p className="muted">No projects match your search.</p>
          )}
        </div>
      )}
    </div>
  );
}