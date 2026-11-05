import { useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";

const API = "/api";

export default function Topbar({ openMenu, setPage }) {
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

  const fullName = me?.full_name || user?.name || "User";
  const firstName = me?.first_name || fullName.split(" ")[0];
  const role = me?.role
    ? me.role.charAt(0).toUpperCase() + me.role.slice(1)
    : "";

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={openMenu} aria-label="Open menu">
        ☰
      </button>

      <div className="topbar-title">
        Ardhi University · <b>Weledi na Ustawi</b>
      </div>

      <div className="topbar-right">
        <button
          className="icon-btn"
          onClick={() => setPage("notifications")}
          aria-label="Notifications"
        >
          🔔<i className="pulse" />
        </button>

        <div className="user-chip">
          <div className="avatar sm">
            {(firstName[0] || "U").toUpperCase()}
          </div>
          <div className="user-meta">
            <strong>{firstName}</strong>
            <span>{role}</span>
          </div>
        </div>

        <button
          className="topbar-logout"
          onClick={logout}
          title="Log out"
          aria-label="Log out"
        >
          ⏻
        </button>
      </div>
    </header>
  );
}