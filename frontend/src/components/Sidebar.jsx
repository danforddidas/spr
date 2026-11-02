import { useEffect, useState } from "react";
import { NAV } from "../data.js";
import { useSettings } from "../settings.jsx";
import { useAuth } from "../auth.jsx";

const API = "/api";

// Menyu za mwanafunzi tu
const STUDENT_ONLY = ["submit", "mine", "groups"];

export default function Sidebar({ page, setPage, open, close }) {
  const { t } = useSettings();
  const { user, logout } = useAuth();
  const [me, setMe] = useState(null);

  useEffect(() => {
    fetch(`${API}/auth/me/`, {
      headers: {
        Authorization: `Token ${localStorage.getItem("spr-token")}`,
      },
    })
      .then((r) => r.json())
      .then(setMe)
      .catch(() => {});
  }, []);

  const isSupervisor = me?.role === "supervisor";

  const items = isSupervisor
    ? NAV.filter((n) => !STUDENT_ONLY.includes(n.id))
    : NAV;

  const displayName = me?.full_name || user?.name || "User";
  const subtitle = isSupervisor
    ? me?.department_name || "Supervisor"
    : me?.course_name || user?.course || "";

  return (
    <>
      <div className={open ? "backdrop show" : "backdrop"} onClick={close} />
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <img src="/assets/aru-logo.jpg" alt="Ardhi University" />
          <div>
            <strong>SPR</strong>
            <span>Student Project Repository</span>
          </div>
        </div>

        <nav>
          {items.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "nav-item active" : "nav-item"}
              onClick={() => {
                setPage(n.id);
                close();
              }}
            >
              <span className="nav-icon">{n.icon}</span>
              {t(`nav.${n.id}`)}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="avatar">{displayName[0].toUpperCase()}</div>
          <div>
            <strong>{displayName}</strong>
            <span>{subtitle}</span>
          </div>
          <button
            className="logout"
            onClick={logout}
            title={t("auth.logout")}
            aria-label={t("auth.logout")}
          >
            ⏻
          </button>
        </div>
      </aside>
    </>
  );
}