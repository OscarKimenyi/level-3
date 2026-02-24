import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../context/useAuth";
import useSocket from "../../context/useSocket";
import useNotifications from "../../context/useNotifications";
import useTheme from "../../context/useTheme";
import NotificationsPanel from "../notifications/NotificationsPanel";

const Navbar = ({ toggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { unreadCount, panelOpen, setPanelOpen } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const cleanUsername = (username) => {
    if (!username) return "User";
    return username.replace(/[0-9_]+$/, "");
  };

  return (
    <nav className={`navbar-modern ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-container">
        <div className="navbar-left">
          <button
            className="navbar-action-btn d-lg-none"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <i className={`bi bi-${sidebarOpen ? "x" : "list"}`}></i>
          </button>

          <Link to="/dashboard" className="navbar-brand">
            <div className="brand-icon">
              <i className="bi bi-mortarboard-fill"></i>
            </div>
            <span>SMS</span>
          </Link>
        </div>

        <div className="navbar-right">
          <div className="navbar-actions">
            {/* Theme Toggle */}
            <button
              className="navbar-action-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <i
                className={`bi bi-${theme === "light" ? "moon-fill" : "sun-fill"}`}
              ></i>
            </button>

            {/* Connection Status */}
            <button className="navbar-action-btn">
              <i
                className={`bi bi-circle-fill ${isConnected ? "text-success" : "text-danger"}`}
              ></i>
            </button>

            {/* Notifications */}
            <div className="position-relative">
              <button
                className="navbar-action-btn"
                onClick={() => setPanelOpen(!panelOpen)}
              >
                <i className="bi bi-bell-fill"></i>
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {panelOpen && (
                <NotificationsPanel onClose={() => setPanelOpen(false)} />
              )}
            </div>
          </div>

          {/* User Menu */}
          <div
            className="user-menu"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {cleanUsername(user?.username).charAt(0)}
            </div>
            <div className="user-info">
              <span className="user-name">{cleanUsername(user?.username)}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <i
              className="bi bi-chevron-down"
              style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}
            ></i>
          </div>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div
              className="dropdown-menu show"
              style={{
                position: "absolute",
                top: "60px",
                right: "1.5rem",
                minWidth: "200px",
                background: "var(--card-bg)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-lg)",
                padding: "0.5rem",
                zIndex: 1000,
              }}
            >
              <Link
                to={`/profile/${user?.role}`}
                className="dropdown-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onClick={() => setShowUserMenu(false)}
              >
                <i className="bi bi-person"></i>
                <span>My Profile</span>
              </Link>
              <div
                className="dropdown-divider"
                style={{
                  height: "1px",
                  background: "var(--border-light)",
                  margin: "0.5rem 0",
                }}
              ></div>
              <button
                className="dropdown-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "var(--radius-md)",
                  color: "var(--danger)",
                  background: "none",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
