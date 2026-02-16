import React from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Navbar as BootstrapNavbar,
  Nav,
  NavDropdown,
  Badge,
  Button,
} from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (socket) {
      socket.on("new_notification", (data) => {
        setNotificationCount((prev) => prev + 1);
        // Show toast notification
        console.log("New notification:", data);
      });
    }
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="shadow">
      <Container fluid>
        <Button
          variant="outline-light"
          className="me-3 d-lg-none"
          onClick={toggleSidebar}
        >
          <i className="bi bi-list"></i>
        </Button>

        <BootstrapNavbar.Brand as={Link} to="/dashboard" className="fw-bold">
          <i className="bi bi-mortarboard-fill me-2"></i>
          Student Management System
        </BootstrapNavbar.Brand>

        <div className="d-flex align-items-center ms-auto">
          {/* Connection Status */}
          <Badge bg={isConnected ? "success" : "danger"} className="me-3">
            <i className={`bi bi-circle-fill me-1`}></i>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>

          {/* Notifications */}
          <div className="dropdown me-3">
            <Button
              variant="outline-light"
              id="notificationDropdown"
              className="position-relative"
            >
              <i className="bi bi-bell"></i>
              {notificationCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {notificationCount}
                </span>
              )}
            </Button>
          </div>

          {/* User Dropdown */}
          <NavDropdown
            title={
              <span>
                <i className="bi bi-person-circle me-1"></i>
                {user?.username || "User"}
              </span>
            }
            align="end"
            className="text-white"
          >
            <NavDropdown.Item as={Link} to="/profile">
              <i className="bi bi-person me-2"></i>
              My Profile
            </NavDropdown.Item>
            <NavDropdown.Item as={Link} to="/settings">
              <i className="bi bi-gear me-2"></i>
              Settings
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
