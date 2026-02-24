import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Navbar as BootstrapNavbar,
  Nav,
  NavDropdown,
  Badge,
  Button,
} from "react-bootstrap";
import useAuth from "../../context/useAuth";
import useSocket from "../../context/useSocket";
import { useNotifications } from "../../context/useNotifications";
import NotificationsPanel from "../notifications/NotificationsPanel";

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { unreadCount, panelOpen, setPanelOpen } = useNotifications();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true",
  );
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const cleanUsername = (username) => {
    if (!username) return "User";
    return username.replace(/[0-9_]+$/, "");
  };

  return (
    <BootstrapNavbar
      expand="lg"
      className={`navbar-modern sticky-top py-2 ${scrolled ? "navbar-scrolled" : ""} ${darkMode ? "navbar-dark" : "navbar-light"}`}
      style={{
        background: darkMode
          ? "linear-gradient(135deg, #1e1e2f 0%, #2d2d44 100%)"
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        transition: "all 0.3s ease",
        boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.1)" : "none",
      }}
    >
      <Container fluid>
        <div className="d-flex align-items-center">
          <Button
            variant="link"
            className="sidebar-toggle p-0 me-3 d-lg-none"
            onClick={toggleSidebar}
            style={{ color: "#fff", fontSize: "1.5rem" }}
          >
            <i className="bi bi-list"></i>
          </Button>

          <BootstrapNavbar.Brand
            as={Link}
            to="/dashboard"
            className="fw-bold d-flex align-items-center"
          >
            <div className="brand-icon me-2">
              <i
                className="bi bi-mortarboard-fill"
                style={{ fontSize: "1.8rem" }}
              ></i>
            </div>
            <span
              className="brand-text"
              style={{ fontSize: "1.4rem", fontWeight: "600" }}
            >
              SMS
            </span>
          </BootstrapNavbar.Brand>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Dark Mode Toggle */}
          <Button
            variant="link"
            className="theme-toggle p-0"
            onClick={toggleDarkMode}
            style={{ color: "#fff", fontSize: "1.3rem" }}
          >
            <i
              className={`bi ${darkMode ? "bi-sun-fill" : "bi-moon-fill"}`}
            ></i>
          </Button>

          {/* Connection Status - Hidden on mobile */}
          <div className="connection-status d-none d-md-flex align-items-center">
            <span
              className={`status-dot ${isConnected ? "connected" : "disconnected"}`}
            ></span>
            <span
              className="status-text ms-2"
              style={{ color: "#fff", fontSize: "0.9rem" }}
            >
              {isConnected ? "Online" : "Offline"}
            </span>
          </div>

          {/* Notifications */}
          <div className="notifications-wrapper position-relative">
            <Button
              variant="link"
              className="p-0 position-relative"
              onClick={() => setPanelOpen(!panelOpen)}
              style={{ color: "#fff", fontSize: "1.3rem" }}
            >
              <i className="bi bi-bell"></i>
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            {panelOpen && (
              <NotificationsPanel onClose={() => setPanelOpen(false)} />
            )}
          </div>

          {/* User Menu */}
          <div className="user-menu">
            <div className="dropdown">
              <Button
                variant="link"
                className="p-0 d-flex align-items-center"
                data-bs-toggle="dropdown"
                style={{ color: "#fff", textDecoration: "none" }}
              >
                <div className="user-avatar me-2">
                  <i
                    className="bi bi-person-circle"
                    style={{ fontSize: "1.8rem" }}
                  ></i>
                </div>
                <div className="user-info d-none d-md-block">
                  <div className="user-name" style={{ fontWeight: "500" }}>
                    {cleanUsername(user?.username)}
                  </div>
                  <div
                    className="user-role"
                    style={{ fontSize: "0.8rem", opacity: 0.8 }}
                  >
                    {user?.role}
                  </div>
                </div>
                <i className="bi bi-chevron-down ms-1 d-none d-md-block"></i>
              </Button>

              <div className="dropdown-menu dropdown-menu-end modern-dropdown">
                <Link className="dropdown-item" to={`/profile/${user?.role}`}>
                  <i className="bi bi-person me-2"></i>My Profile
                </Link>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item text-danger"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
