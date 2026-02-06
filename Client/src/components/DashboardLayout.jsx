import { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import PulseStreamLogo from "./PulseStreamLogo.jsx";
import UserMenu from "./UserMenu.jsx";

const SIDEBAR_COLLAPSED_KEY = "pulsestream_sidebar_collapsed";

const navItems = [
  { to: "/", label: "Dashboard", icon: "grid" },
  { to: "/upload", label: "Upload", icon: "upload" },
  { to: "/library", label: "Library", icon: "library" },
];

const adminItems = [{ to: "/admin", label: "Admin", icon: "shield" }];

const navSvgProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function NavIcon({ icon }) {
  const icons = {
    grid: (
      <svg {...navSvgProps}>
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
    upload: (
      <svg {...navSvgProps}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" x2="12" y1="3" y2="15" />
      </svg>
    ),
    library: (
      <svg {...navSvgProps}>
        <path d="m16 6 4 14" />
        <path d="M12 6v14" />
        <path d="M8 8v12" />
        <path d="M4 4v16" />
      </svg>
    ),
    shield: (
      <svg {...navSvgProps}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      </svg>
    ),
  };
  return <span className="nav-icon">{icons[icon] ?? null}</span>;
}

export default function DashboardLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) ?? "false");
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem(
      SIDEBAR_COLLAPSED_KEY,
      JSON.stringify(sidebarCollapsed),
    );
  }, [sidebarCollapsed]);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function toggleCollapse() {
    setSidebarCollapsed((c) => !c);
  }

  return (
    <div
      className={`dashboard-layout ${sidebarOpen ? "sidebar-open" : ""} ${
        sidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={closeSidebar}
      />
      <aside
        className={`dashboard-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
      >
        <div className="sidebar-brand">
          <PulseStreamLogo />
          <span className="sidebar-brand-text">PulseStream</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                "sidebar-link" + (isActive ? " active" : "")
              }
              onClick={closeSidebar}
              title={label}
            >
              <NavIcon icon={icon} />
              <span className="sidebar-link-text">{label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <span className="sidebar-label">ADMIN</span>
              {adminItems.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    "sidebar-link" + (isActive ? " active" : "")
                  }
                  onClick={closeSidebar}
                  title={label}
                >
                  <NavIcon icon={icon} />
                  <span className="sidebar-link-text">{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div
          type="button"
          className="sidebar-collapse-btn"
          onClick={toggleCollapse}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {sidebarCollapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </div>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-menu w-5 h-5 text-foreground"
            >
              <line x1="4" x2="20" y1="12" y2="12"></line>
              <line x1="4" x2="20" y1="6" y2="6"></line>
              <line x1="4" x2="20" y1="18" y2="18"></line>
            </svg>
          </div>
          <p className="dashboard-welcome">
            Welcome back, {user?.name ?? user?.email ?? "User"}.
          </p>
          <UserMenu />
        </header>
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
