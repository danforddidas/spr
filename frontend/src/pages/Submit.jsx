
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

  if (status === 413) return "Files are too large. Use smaller files.";

  if (status === 401 || status === 403) {
    return "Your session expired. Please log in again.";
  }

  if (status >= 500) {
    return "Server error. Please try again, or use smaller files.";
  }

  return "Project submission failed. Please try again.";
}

function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      return resolve(file);
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");

      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      canvas.getContext("2d").drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);

          resolve(
            blob
              ? new File(
                  [blob],
                  file.name.replace(/\.\w+$/, ".jpg"),
                  { type: "image/jpeg" }
                )
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

// Upload progress based on actual bytes sent by the browser
function uploadWithProgress(url, headers, body, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url);
    xhr.timeout = 180000;

    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const percent = Math.min(
          100,
          Math.floor((event.loaded / event.total) * 100)
        );

        onProgress(percent, event.loaded, event.total);
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

    xhr.onerror = () => {
      reject(new Error("Network error. Check your connection."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Upload took too long. Try smaller files."));
    };

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
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState("");

  const shownPercent = stage === "save" ? 100 : progress;

  const fail = (message) => {
    setError(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Load university information
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [schoolData, techData, supervisorData] =
          await Promise.all([
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

  // Load departments
  useEffect(() => {
    if (!school) {
      setDepartments([]);
      return;
    }

    apiGet(`/departments/?school=${school}`)
      .then(setDepartments)
      .catch((err) => setError(err.message));
  }, [school]);

  // Load courses
  useEffect(() => {
    if (!dept) {
      setCourses([]);
      return;
    }

    apiGet(`/courses/?department=${dept}`)
      .then(setCourses)
      .catch((err) => setError(err.message));
  }, [dept]);

  // Search registered students automatically
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

  // Select technology
  const toggleTechnology = (id) => {
    setPicked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  // Select exactly two supervisors
  const toggleSupervisor = (id) => {
    setPickedSupervisors((current) => {
      if (current.includes(id)) {
        setError("");
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

  // Add group member
  const addMember = (student) => {
    setMembers((current) => {
      const exists = current.some(
        (item) => String(item.id) === String(student.id)
      );

      if (exists) return current;

      return [...current, student];
    });

    setStudentSearch("");
    setStudentResults([]);
    setError("");
  };

  // Remove group member
  const removeMember = (id) => {
    setMembers((current) =>
      current.filter(
        (student) => String(student.id) !== String(id)
      )
    );
  };

  // Submit project
  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!school || !dept || !course) {
      fail("Please select your school, department and course.");
      return;
    }

    if (!title.trim() || !desc.trim()) {
      fail("Please enter the project title and description.");
      return;
    }

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

    if (
      documentFile &&
      documentFile.size > MAX_DOC_MB * 1024 * 1024
    ) {
      fail(`Document must be smaller than ${MAX_DOC_MB}MB.`);
      return;
    }

    const payload = {
      title: title.trim(),
      description: desc.trim(),
      year: Number(year),
      course: Number(course),
      technologies: picked,
      submission_type: type,
      members:
        type === "group"
          ? members.map((member) => member.id)
          : [],
      supervisors: pickedSupervisors,
      repo_url: repoUrl,
      demo_url: demoUrl,
    };

    setLoading(true);
    setProgress(0);
    setUploadedBytes(0);
    setTotalBytes(0);
    setStage("compress");

    try {
      const headers = {
        Authorization: `Token ${token()}`,
      };

      const smallCover = cover
        ? await compressImage(cover)
        : null;

      const hasFiles =
        smallCover ||
        documentFile ||
        attachments.length > 0;

      let body;

      if (hasFiles) {
        body = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((item) => {
              body.append(key, item);
            });
          } else {
            body.append(key, value);
          }
        });

        if (smallCover) {
          body.append("cover", smallCover);
        }

        if (documentFile) {
          body.append("document", documentFile);
        }

        attachments.forEach((file) => {
          body.append("attachments", file);
        });
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(payload);
      }

      setStage("upload");

      const { ok, data, status } = await uploadWithProgress(
        `${API}/projects/`,
        headers,
        body,
        (percent, loaded, total) => {
          setProgress(percent);
          setUploadedBytes(loaded);
          setTotalBytes(total);
        }
      );

      if (!ok) {
        throw new Error(getError(data, status));
      }

      setProgress(100);
      setStage("save");

      setSubmittedTitle(data.title || title);
      setDone(true);
    } catch (err) {
      fail(err.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
      setStage("");
    }
  };

  // Success screen
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

          <button
            className="btn"
            onClick={() => window.location.reload()}
          >
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

        {/* Submission type */}
        <div className="seg">
          {["individual", "group"].map((item) => (
            <button
              type="button"
              key={item}
              className={type === item ? "seg-btn active" : "seg-btn"}
              onClick={() => {
                setType(item);
                setError("");
              }}
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

        {/* School */}
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

        {/* Department and course */}
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

        {/* Year */}
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

        {/* Title */}
        <label>
          Project title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hostel Booking System"
            required
          />
        </label>

        {/* Description */}
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

        {/* Technologies */}
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

        {/* Supervisors */}
        <div>
          <span className="label">Select exactly two supervisors</span>
          <div className="tech-pick">
            {supervisors.map((item) => {
              const name =
                item.full_name ||
                `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
                item.username;

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

        {/* Group members */}
        {type === "group" && (
          <div
            style={{
              marginTop: "15px",
              padding: "15px",
              border: "1px solid #dce5ec",
              borderRadius: "12px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Group Members</h3>

            <p className="muted">
              Search for registered students and add them to your project.
            </p>

            <label>
              Search registered students
              <input
                type="search"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Name or registration number"
              />
            </label>

            {studentSearch.trim().length >= 2 && (
              <div style={{ marginTop: "12px" }}>
                {studentResults.length > 0 ? (
                  studentResults.map((student) => {
                    const alreadyAdded = members.some(
                      (member) => String(member.id) === String(student.id)
                    );

                    return (
                      <div
                        className="card"
                        key={student.id}
                        style={{
                          padding: "14px",
                          marginBottom: "12px",
                          borderRadius: "10px",
                        }}
                      >
                        <strong>
                          {student.full_name || student.username}
                        </strong>

                        <p className="muted">
                          Registration Number: {student.reg_number || "Not available"}
                        </p>

                        <button
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => addMember(student)}
                          style={{
                            width: "100%",
                            padding: "13px",
                            marginTop: "8px",
                            border: "none",
                            borderRadius: "8px",
                            background: alreadyAdded ? "#777" : "#198754",
                            color: "#fff",
                            fontWeight: "700",
                            fontSize: "15px",
                            cursor: alreadyAdded ? "not-allowed" : "pointer",
                          }}
                        >
                          {alreadyAdded ? "✓ Member Added" : "+ Add Member"}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="muted">No registered students found.</p>
                )}
              </div>
            )}

            <div style={{ marginTop: "20px" }}>
              <h4>Selected Members ({members.length})</h4>

              {members.length === 0 ? (
                <p className="muted">No group members added yet.</p>
              ) : (
                members.map((student) => (
                  <div
                    className="card"
                    key={student.id}
                    style={{
                      padding: "12px",
                      marginBottom: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <strong>
                        {student.full_name || student.username}
                      </strong>
                      <p className="muted">{student.reg_number || ""}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeMember(student.id)}
                      style={{
                        padding: "9px 13px",
                        border: "none",
                        borderRadius: "7px",
                        background: "#dc3545",
                        color: "#fff",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Repository URL */}
        <label>
          Repository URL (optional)
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/..."
          />
        </label>

        {/* Demo URL */}
        <label>
          Demo URL (optional)
          <input
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>

        {/* Cover image */}
        <label>
          Project cover image (optional)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] || null)}
          />
        </label>

        {/* Document */}
        <label>
          Project document (PDF, DOC, DOCX, max {MAX_DOC_MB}MB)
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
          />
        </label>

        {/* Attachments */}
        <label>
          Additional files (ZIP, etc.) (optional)
          <input
            type="file"
            multiple
            onChange={(e) =>
              setAttachments(Array.from(e.target.files || []))
            }
          />
        </label>

        {/* Actual upload progress */}
        {loading && (
          <div
            style={{
              margin: "18px 0",
              padding: "16px",
              border: "1px solid #dce5ec",
              borderRadius: "12px",
              background: "#f8fbff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
                gap: "10px",
              }}
            >
              <strong>
                {stage === "compress"
                  ? "Preparing files..."
                  : stage === "save"
                  ? "Saving project..."
                  : "Uploading project files..."}
              </strong>

              <strong
                style={{
                  color: "#198754",
                  fontSize: "20px",
                  whiteSpace: "nowrap",
                }}
              >
                {shownPercent}%
              </strong>
            </div>

            <div
              style={{
                width: "100%",
                height: "14px",
                background: "#dce5ec",
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${shownPercent}%`,
                  height: "100%",
                  background: "#198754",
                  borderRadius: "20px",
                  transition: "width 0.15s linear",
                }}
              />
            </div>

            <small
              style={{
                color: "#64748b",
                display: "block",
                marginTop: "8px",
              }}
            >
              {stage === "compress"
                ? "Preparing your image before upload."
                : stage === "save"
                ? "Upload complete. Waiting for server confirmation..."
                : totalBytes > 0
                ? `${(uploadedBytes / (1024 * 1024)).toFixed(2)} MB / ${(totalBytes / (1024 * 1024)).toFixed(2)} MB sent`
                : "Waiting for upload progress information..."}
            </small>
          </div>
        )}

        {error && <div className="hint">{error}</div>}

        {/* Submit button */}
        <button
          className="btn"
          type="submit"
          disabled={loading || initialLoading}
          style={{
            position: "relative",
            overflow: "hidden",
            ...(loading
              ? {
                  background: "#5b6b7a",
                  color: "#fff",
                  opacity: 1,
                  cursor: "wait",
                }
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
                transition: "width .15s linear",
              }}
            />
          )}

          <span
            style={{
              position: "relative",
              zIndex: 1,
              fontWeight: 700,
            }}
          >
            {loading
              ? stage === "compress"
                ? "Preparing files..."
                : stage === "save"
                ? "Saving... 100%"
                : `Uploading... ${shownPercent}%`
              : "Submit project"}
          </span>
        </button>
      </form>
    </div>
  );
}
