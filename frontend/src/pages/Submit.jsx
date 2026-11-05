import { useEffect, useState } from "react";

const API = "/api";
const MAX_DOC_MB = 10;

function token() {
  return localStorage.getItem("spr-token");
}

async function apiGet(endpoint) {
  const response = await fetch(`${API}${endpoint}`, {
    headers: { Authorization: `Token ${token()}` },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to load information.");
  }

  return Array.isArray(data) ? data : data.results || [];
}

function getError(data, status) {
  if (data?.detail) return data.detail;

  if (data && typeof data === "object") {
    const text = Object.entries(data)
      .map(([key, value]) =>
        `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
      )
      .join(" | ");
    if (text) return text;
  }

  if (status >= 500) {
    return "Server error. Please try again, or use a smaller file.";
  }
  if (status === 413) return "Files are too large. Use smaller files.";
  if (status === 401 || status === 403) {
    return "Your session expired. Please log in again.";
  }
  return "Project submission failed. Please try again.";
}

// Punguza picha: upana wa juu 1200px, ubora 0.75
function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) return resolve(file);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(
            blob
              ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                  type: "image/jpeg",
                })
              : file
          );
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

// Tuma kwa XMLHttpRequest ili tupate progress
function uploadWithProgress(url, headers, body, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = 180000; // dakika 3

    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = {};
      }
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        data,
        status: xhr.status,
      });
    };

    xhr.onerror = () =>
      reject(new Error("Network error. Check your connection."));
    xhr.ontimeout = () =>
      reject(new Error("Upload took too long. Try smaller files."));

    xhr.send(body);
  });
}

export default function Submit() {
  const [type, setType] = useState("individual");

  const [schools, setSchools] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [supervisors, setSupervisors] = useState([]);

  const [school, setSchool] = useState("");
  const [dept, setDept] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");

  // Files
  const [cover, setCover] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [attachments, setAttachments] = useState([]);

  const [picked, setPicked] = useState([]);
  const [pickedSupervisors, setPickedSupervisors] = useState([]);
  const [members, setMembers] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState([]);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState("");

  // Asilimia kwenye kitufe: 1% mwanzoni hadi 100%
  const shownPercent =
    stage === "save" ? 100 : stage === "upload" ? Math.max(1, progress) : 1;

  const fail = (message) => {
    setError(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [schoolData, techData, supervisorData] = await Promise.all([
          apiGet("/schools/"),
          apiGet("/technologies/"),
          apiGet("/supervisors/"),
        ]);

        setSchools(schoolData);
        setTechnologies(techData);
        setSupervisors(supervisorData);
      } catch (err) {
        setError(err.message);
      } finally {
        setInitialLoading(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!school) {
      setDepartments([]);
      return;
    }

    apiGet(`/departments/?school=${school}`)
      .then(setDepartments)
      .catch((err) => setError(err.message));
  }, [school]);

  useEffect(() => {
    if (!dept) {
      setCourses([]);
      return;
    }

    apiGet(`/courses/?department=${dept}`)
      .then(setCourses)
      .catch((err) => setError(err.message));
  }, [dept]);

  useEffect(() => {
    const query = studentSearch.trim();

    if (type !== "group" || query.length < 2) {
      setStudentResults([]);
      return;
    }

    let active = true;

    apiGet(`/students/?search=${encodeURIComponent(query)}`)
      .then((data) => {
        if (active) setStudentResults(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
    };
  }, [studentSearch, type]);

  const toggleTechnology = (id) => {
    setPicked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleSupervisor = (id) => {
    setPickedSupervisors((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= 2) {
        setError("You can select exactly two supervisors.");
        return current;
      }

      setError("");
      return [...current, id];
    });
  };

  const addMember = (student) => {
    if (members.some((item) => item.id === student.id)) return;

    setMembers((current) => [...current, student]);
    setStudentSearch("");
    setStudentResults([]);
  };

  const removeMember = (id) => {
    setMembers((current) => current.filter((student) => student.id !== id));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (picked.length === 0) {
      fail("Please select at least one technology.");
      return;
    }

    if (pickedSupervisors.length !== 2) {
      fail("Please select exactly two supervisors.");
      return;
    }

    if (type === "group" && members.length === 0) {
      fail("Please add at least one group member.");
      return;
    }

    if (documentFile && documentFile.size > MAX_DOC_MB * 1024 * 1024) {
      fail(`Document must be smaller than ${MAX_DOC_MB}MB.`);
      return;
    }

    const payload = {
      title,
      description: desc,
      year: Number(year),
      course: Number(course),
      technologies: picked,
      submission_type: type,
      members: type === "group" ? members.map((m) => m.id) : [],
      supervisors: pickedSupervisors,
      repo_url: repoUrl,
      demo_url: demoUrl,
    };

    setLoading(true);
    setProgress(0);
    setStage("compress");

    try {
      const headers = { Authorization: `Token ${token()}` };
      let body;

      const smallCover = cover ? await compressImage(cover) : null;
      const hasFiles = smallCover || documentFile || attachments.length > 0;

      setStage("upload");

      if (hasFiles) {
        body = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((item) => body.append(key, item));
          } else {
            body.append(key, value);
          }
        });

        if (smallCover) body.append("cover", smallCover);
        if (documentFile) body.append("document", documentFile);
        attachments.forEach((file) => body.append("attachments", file));
        // USIWEKE Content-Type hapa, browser inaweka yenyewe
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(payload);
      }

      const { ok, data, status } = await uploadWithProgress(
        `${API}/projects/`,
        headers,
        body,
        (p) => {
          setProgress(p);
          if (p >= 100) setStage("save");
        }
      );

      if (!ok) throw new Error(getError(data, status));

      setSubmittedTitle(data.title || title);
      setDone(true);
    } catch (err) {
      fail(err.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
      setStage("");
    }
  };

  if (done) {
    return (
      <div className="page">
        <div className="success card">
          <div className="check">✔</div>
          <h2>Project submitted</h2>
          <p className="muted">
            Your project has been saved successfully.
            Your two supervisors have been notified.
          </p>
          <p>
            <b>{submittedTitle}</b>
          </p>
          <span className="badge orange">Pending Review</span>
          <br />
          <br />
          <button className="btn" onClick={() => window.location.reload()}>
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="welcome">
        <h1>Submit Project</h1>
        <p className="muted">
          Fill in the details once. Supervisors are alerted on submit.
        </p>
      </div>

      <form className="card form" onSubmit={submit}>
        {error && <div className="hint">{error}</div>}

        {initialLoading && (
          <p className="muted">Loading university information...</p>
        )}

        <div className="seg">
          {["individual", "group"].map((item) => (
            <button
              type="button"
              key={item}
              className={type === item ? "seg-btn active" : "seg-btn"}
              onClick={() => setType(item)}
            >
              {item === "individual" ? "Individual" : "Group"}
            </button>
          ))}
        </div>

        {type === "group" && (
          <p className="hint">
            Every group member must register first.
            The group leader submits the project.
          </p>
        )}

        <label>
          School
          <select
            value={school}
            onChange={(e) => {
              setSchool(e.target.value);
              setDept("");
              setCourse("");
            }}
            required
          >
            <option value="">Select school</option>
            {schools.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="row">
          <label>
            Department
            <select
              value={dept}
              onChange={(e) => {
                setDept(e.target.value);
                setCourse("");
              }}
              disabled={!school}
              required
            >
              <option value="">Select department</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Course
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              disabled={!dept}
              required
            >
              <option value="">Select course</option>
              {courses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Project year
          <input
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />
        </label>

        <label>
          Project title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hostel Booking System"
            required
          />
        </label>

        <label>
          Description
          <textarea
            rows="4"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="What does your project do?"
            required
          />
        </label>

        <div>
          <span className="label">Technologies used</span>
          <div className="tech-pick">
            {technologies.map((item) => (
              <button
                type="button"
                key={item.id}
                className={picked.includes(item.id) ? "pick on" : "pick"}
                onClick={() => toggleTechnology(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">Select exactly two supervisors</span>

          <div className="tech-pick">
            {supervisors.map((item) => {
              const name =
                item.full_name ||
                `${item.first_name || ""} ${item.last_name || ""}`.trim();

              return (
                <button
                  type="button"
                  key={item.id}
                  className={
                    pickedSupervisors.includes(item.id) ? "pick on" : "pick"
                  }
                  onClick={() => toggleSupervisor(item.id)}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <small className="muted">
            Selected: {pickedSupervisors.length}/2
          </small>
        </div>

        {type === "group" && (
          <div>
            <label>
              Search registered group members
              <input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name or registration number"
              />
            </label>

            {studentResults.map((student) => (
              <div className="card" key={student.id}>
                <strong>{student.full_name || student.username}</strong>
                <p className="muted">{student.reg_number}</p>
                <button
                  type="button"
                  className="link"
                  onClick={() => addMember(student)}
                >
                  Add member
                </button>
              </div>
            ))}

            <p className="label">Selected members: {members.length}</p>

            {members.map((student) => (
              <div className="card" key={student.id}>
                {student.full_name || student.username}
                <button
                  type="button"
                  className="link"
                  onClick={() => removeMember(student.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <label>
          Repository URL (optional)
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/..."
          />
        </label>

        <label>
          Demo URL (optional)
          <input
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>

        <label>
          Project cover image (optional)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] || null)}
          />
        </label>

        <label>
          Project document (PDF, DOC, DOCX, max {MAX_DOC_MB}MB)
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
          />
        </label>

        <label>
          Additional files (ZIP, etc.) (optional)
          <input
            type="file"
            multiple
            onChange={(e) => setAttachments(Array.from(e.target.files || []))}
          />
        </label>

        {error && <div className="hint">{error}</div>}

        <button
          className="btn"
          type="submit"
          disabled={loading}
          style={{
            position: "relative",
            overflow: "hidden",
            ...(loading
              ? { background: "#5b6b7a", color: "#fff", opacity: 1, cursor: "wait" }
              : {}),
          }}
        >
          {loading && (
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${shownPercent}%`,
                background: "#22a559",
                transition: "width .25s ease",
              }}
            />
          )}
          <span style={{ position: "relative", zIndex: 1, fontWeight: 700 }}>
            {loading
              ? stage === "save"
                ? "Saving... 100%"
                : `Uploading... ${shownPercent}%`
              : "Submit project"}
          </span>
        </button>
      </form>
    </div>
  );
}