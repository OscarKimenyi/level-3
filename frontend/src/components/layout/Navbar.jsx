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

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { socket, isConnected, on } = useSocket();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (socket) {
      const unsubscribe = on("new_notification", (data) => {
        setNotificationCount((prev) => prev + 1);
        console.log("New notification:", data);
      });

      return unsubscribe;
    }
  }, [socket, on]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <BootstrapNavbar
      bg="dark"
      variant="dark"
      expand="lg"
      className="shadow sticky-top"
    >
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
          SMS
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle />

        <BootstrapNavbar.Collapse>
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">
              <i className="bi bi-speedometer2 me-1"></i>
              Dashboard
            </Nav.Link>
          </Nav>
        </BootstrapNavbar.Collapse>

        <div className="d-flex align-items-center">
          <Badge bg={isConnected ? "success" : "danger"} className="me-3">
            <i className={`bi bi-circle-fill me-1`}></i>
            {isConnected ? "Online" : "Offline"}
          </Badge>

          <div className="position-relative me-3">
            <i className="bi bi-bell fs-5 text-white"></i>
            {notificationCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {notificationCount}
              </span>
            )}
          </div>

          <NavDropdown
            title={
              <span className="text-white">
                <i className="bi bi-person-circle me-1"></i>
                {user?.username || "User"}
              </span>
            }
            align="end"
          >
            <NavDropdown.Item as={Link} to={`/profile/${user?.role}`}>
              <i className="bi bi-person me-2"></i>
              Profile
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
