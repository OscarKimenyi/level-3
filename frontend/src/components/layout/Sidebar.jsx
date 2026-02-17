import React from "react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { Nav } from "react-bootstrap";
import useAuth from "../../context/useAuth";

const Sidebar = ({ isOpen, closeSidebar, isMobile }) => {
  const { user } = useAuth();

  const getNavItems = () => {
    const commonItems = [
      { path: "/dashboard", icon: "bi-speedometer2", label: "Dashboard" },
      { path: "/courses", icon: "bi-book", label: "Courses" },
      { path: "/assignments", icon: "bi-journal-text", label: "Assignments" },
      { path: "/chat", icon: "bi-chat", label: "Chat" },
    ];

    const adminItems = [
      { path: "/students", icon: "bi-people", label: "Students" },
      { path: "/teachers", icon: "bi-person-badge", label: "Teachers" },
      { path: "/attendance", icon: "bi-calendar-check", label: "Attendance" },
    ];

    const teacherItems = [
      { path: "/profile/teacher", icon: "bi-person", label: "My Profile" },
      { path: "/attendance", icon: "bi-calendar-check", label: "Attendance" },
    ];

    const studentItems = [
      { path: "/profile/student", icon: "bi-person", label: "My Profile" },
    ];

    const parentItems = [
      { path: "/profile/parent", icon: "bi-person", label: "My Profile" },
      { path: "/students/children", icon: "bi-people", label: "My Children" },
    ];

    let items = [...commonItems];

    if (user?.role === "admin") {
      items = [...items, ...adminItems];
    } else if (user?.role === "teacher") {
      items = [...items, ...teacherItems];
    } else if (user?.role === "student") {
      items = [...items, ...studentItems];
    } else if (user?.role === "parent") {
      items = [...items, ...parentItems];
    }

    return items;
  };

  const navItems = getNavItems();

  // Close sidebar when clicking a link on mobile
  const handleLinkClick = () => {
    if (isMobile) {
      closeSidebar();
    }
  };

  if (!isOpen && isMobile) {
    return null; // Don't render on mobile when closed
  }

  return (
    <div
      className="bg-dark text-white sidebar"
      style={{
        width: isOpen ? "250px" : isMobile ? "0" : "250px",
        minHeight: "calc(100vh - 56px)",
        overflowY: "auto",
        transition: "width 0.3s ease",
        position: isMobile ? "fixed" : "fixed",
        left: 0,
        top: "56px",
        zIndex: 1000,
        display: isOpen ? "block" : isMobile ? "none" : "block",
        boxShadow: isOpen ? "2px 0 5px rgba(0,0,0,0.1)" : "none",
      }}
    >
      <div className="p-3">
        <div className="d-flex justify-content-between align-items-center w-100 mb-4">
          <h5 className="mb-0 text-white">Menu</h5>
          {isMobile && isOpen && (
            <button
              className="btn btn-sm btn-outline-light"
              onClick={closeSidebar}
              aria-label="Close sidebar"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>

        <Nav className="flex-column">
          {navItems.map((item, index) => (
            <Nav.Link
              key={index}
              as={RouterNavLink}
              to={item.path}
              className="text-white mb-2 rounded"
              onClick={handleLinkClick}
              style={({ isActive }) => ({
                backgroundColor: isActive ? "#0d6efd" : "transparent",
                padding: "10px 15px",
                textDecoration: "none",
                color: "white",
                display: "block",
              })}
            >
              <i className={`bi ${item.icon} me-2`}></i>
              {item.label}
            </Nav.Link>
          ))}
        </Nav>

        <div className="mt-auto w-100">
          <div className="text-center text-muted small mt-4">
            <div>
              Role:{" "}
              <span className="text-info text-uppercase">{user?.role}</span>
            </div>
            <div className="mt-2">v1.0.0</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
