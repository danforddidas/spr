import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Browse from "./pages/Browse.jsx";
import Submit from "./pages/Submit.jsx";
import { MyProjects, Groups, Supervisors, Notifications } from "./pages/Simple.jsx";
import Settings from "./pages/Settings.jsx";
import Auth from "./pages/Auth.jsx";
import { useAuth } from "./auth.jsx";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [menu, setMenu] = useState(false);
  const { user } = useAuth();

  if (!user) return <Auth />;

  const views = {
    dashboard: <Dashboard setPage={setPage} />,
    browse: <Browse />,
    submit: <Submit />,
    mine: <MyProjects />,
    groups: <Groups />,
    supervisors: <Supervisors />,
    notifications: <Notifications />,
    profile: <Settings />,
  };

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} open={menu} close={() => setMenu(false)} />
      <div className="main">
        <Topbar openMenu={() => setMenu(true)} setPage={setPage} />
        {views[page]}
      </div>
    </div>
  );
}
