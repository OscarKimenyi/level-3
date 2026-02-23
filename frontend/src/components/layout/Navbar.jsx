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
import { useNotifications } from "../../context/NotificationContext";
import NotificationsPanel from "../notifications/NotificationsPanel";

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { unreadCount, panelOpen, setPanelOpen } = useNotifications();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true",
  );

  useEffect(() => {
    // Apply dark mode class to body
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <BootstrapNavbar
      bg={darkMode ? "dark" : "primary"}
      variant={darkMode ? "dark" : "dark"}
      expand="lg"
      className="shadow-sm sticky-top"
      style={{ transition: "all 0.3s ease" }}
    >
      <Container fluid>
        <Button
          variant="outline-light"
          className="me-3 d-lg-none"
          onClick={toggleSidebar}
          size="sm"
        >
          <i className="bi bi-list"></i>
        </Button>

        <BootstrapNavbar.Brand
          as={Link}
          to="/dashboard"
          className="fw-bold text-white"
        >
          <i className="bi bi-mortarboard-fill me-2"></i>
          SMS
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle
          aria-controls="navbar-nav"
          className="border-light"
        />

        <BootstrapNavbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard" className="text-white">
              <i className="bi bi-speedometer2 me-1"></i>
              Dashboard
            </Nav.Link>
          </Nav>
        </BootstrapNavbar.Collapse>

        <div className="d-flex align-items-center gap-2">
          {/* Dark Mode Toggle */}
          <Button
            variant="outline-light"
            size="sm"
            onClick={toggleDarkMode}
            className="d-flex align-items-center"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <i
              className={`bi ${darkMode ? "bi-sun-fill" : "bi-moon-fill"}`}
            ></i>
          </Button>

          {/* Connection Status */}
          <Badge
            bg={isConnected ? "success" : "danger"}
            className="d-none d-md-inline px-3 py-2"
            pill
          >
            <i
              className={`bi bi-circle-fill me-1`}
              style={{ fontSize: "0.6rem" }}
            ></i>
            {isConnected ? "Online" : "Offline"}
          </Badge>

          {/* Notifications */}
          <div className="position-relative">
            <Button
              variant="link"
              className="text-white p-0 position-relative"
              onClick={() => setPanelOpen(!panelOpen)}
              aria-label="Notifications"
            >
              <i className="bi bi-bell fs-5"></i>
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Panel */}
            {panelOpen && (
              <NotificationsPanel onClose={() => setPanelOpen(false)} />
            )}
          </div>

          {/* User Dropdown */}
          <NavDropdown
            title={
              <span className="text-white d-flex align-items-center">
                <i className="bi bi-person-circle me-1 fs-5"></i>
                <span className="d-none d-md-inline">
                  {user?.username || "User"}
                </span>
              </span>
            }
            align="end"
            className="text-white"
            id="user-dropdown"
          >
            <NavDropdown.Item as={Link} to={`/profile/${user?.role}`}>
              <i className="bi bi-person me-2"></i>
              My Profile
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </NavDropdown.Item>
          </NavDropdown>
        </div>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
