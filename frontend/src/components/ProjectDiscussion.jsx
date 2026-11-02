import { useEffect, useState } from "react";

const API = "/api";

function token() {
  return localStorage.getItem("spr-token");
}

function session() {
  try {
    return JSON.parse(localStorage.getItem("spr-session") || "{}");
  } catch {
    return {};
  }
}

export default function ProjectDiscussion({ project }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [role, setRole] = useState("");

useEffect(() => {
  fetch(`${API}/auth/me/`, {
    headers: { Authorization: `Token ${token()}` },
  })
    .then((r) => r.json())
    .then((d) => setRole(d.role || ""))
    .catch(() => {});
}, []);

const isSupervisor = role === "supervisor";

  const load = async () => {
    try {
      const response = await fetch(
        `${API}/projects/${project.id}/comments/`,
        { headers: { Authorization: `Token ${token()}` } }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load comments.");
      }

      setComments(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/projects/${project.id}/comments/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.text || data.detail || "Failed.");
      }

      setText("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const review = async (status) => {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/projects/${project.id}/review/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, comment: text }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.status || data.detail || "Failed.");
      }

      window.location.reload();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        className="link"
        onClick={() => setOpen(!open)}
      >
        {open ? "Hide comments" : "Comments / Review"}
      </button>

      {open && (
        <div style={{ marginTop: 8 }}>
          {comments.length === 0 && (
            <p className="muted">No comments yet.</p>
          )}

          {comments.map((c) => (
            <p key={c.id}>
              <b>{c.author_name}</b>{" "}
              <small className="muted">({c.author_role})</small>
              <br />
              {c.text}
            </p>
          ))}

          <textarea
            rows="2"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            style={{ width: "100%" }}
          />

          {error && <p className="muted">{error}</p>}

          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={send}
          >
            Send comment
          </button>

          {isSupervisor && (
            <p style={{ marginTop: 8 }}>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => review("approved")}
              >
                Approve
              </button>{" "}
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => review("rejected")}
              >
                Reject
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}