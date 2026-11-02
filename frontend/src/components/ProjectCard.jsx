import ProjectDiscussion from "./ProjectDiscussion.jsx";

const TECH_COLORS = ["blue", "orange", "green"];

export function TechTags({ tech }) {
  return (
    <div className="tags">
      {tech.map((t, i) => (
        <span key={t} className={`tag ${TECH_COLORS[i % 3]}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

const fileName = (url) => decodeURIComponent(url.split("/").pop());

export default function ProjectCard({ p }) {
  const status = (p.status || "pending").toLowerCase();
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const tone =
    status === "approved" ? "green" : status === "rejected" ? "red" : "orange";
  const attachments = p.attachments || [];

  return (
    <article className="project-card">
      {p.cover_url && (
        <img
          src={p.cover_url}
          alt={p.title}
          style={{
            width: "100%",
            height: 160,
            objectFit: "cover",
            borderRadius: 10,
            marginBottom: 10,
          }}
        />
      )}

      <div className="pc-head">
        <h4>{p.title}</h4>
        <span className={`badge ${tone}`}>{label}</span>
      </div>

      <p className="muted">
        {p.course} · {p.year} · {p.type}
      </p>

      <TechTags tech={p.tech} />

      <p className="sup">
        <b>Supervisors:</b> {p.supervisors.join(" · ")}
      </p>

      {p.document_url ? (
        <p>
          <b>Document:</b>{" "}
          <a
            className="link"
            href={p.document_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open
          </a>{" "}
          ·{" "}
          <a className="link" href={p.document_url} download>
            Download
          </a>
        </p>
      ) : (
        <p className="muted">No document uploaded.</p>
      )}

      {(p.demo_url || p.repo_url) && (
        <p>
          {p.demo_url && (
            <a
              className="link"
              href={p.demo_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Live demo
            </a>
          )}
          {p.demo_url && p.repo_url && " · "}
          {p.repo_url && (
            <a
              className="link"
              href={p.repo_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Repository
            </a>
          )}
        </p>
      )}

      {attachments.length > 0 && (
        <div>
          <b>Additional files:</b>
          {attachments.map((f) => (
            <div key={f.id}>
              <span className="muted">{fileName(f.file_url)}</span>{" "}
              <a
                className="link"
                href={f.file_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open
              </a>
            </div>
          ))}
        </div>
      )}

      <ProjectDiscussion project={p} />
    </article>
  );
}