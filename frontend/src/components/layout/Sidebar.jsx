import React from "react";
import { NavLink } from "react-router-dom";
import { Nav, Navbar } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, closeSidebar }) => {
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

    const studentItems = [
      { path: "/profile/student", icon: "bi-person", label: "My Profile" },
    ];

    const teacherItems = [
      { path: "/profile/teacher", icon: "bi-person", label: "My Profile" },
    ];

    let items = [...commonItems];

    if (user?.role === "admin") {
      items = [...items, ...adminItems];
    } else if (user?.role === "teacher") {
      items = [
        ...items,
        ...teacherItems,
        { path: "/attendance", icon: "bi-calendar-check", label: "Attendance" },
      ];
    } else if (user?.role === "student") {
      items = [...items, ...studentItems];
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <div
      className={`bg-dark text-white sidebar ${isOpen ? "open" : "closed"}`}
      style={{
        width: isOpen ? "250px" : "0",
        minHeight: "calc(100vh - 56px)",
        overflow: "hidden",
        transition: "width 0.3s",
        position: isOpen ? "relative" : "absolute",
        zIndex: 1000,
      }}
    >
      <Navbar
        bg="dark"
        variant="dark"
        className="flex-column align-items-start p-3"
      >
        <div className="d-flex justify-content-between align-items-center w-100 mb-4">
          <h5 className="mb-0">Menu</h5>
          <button
            className="btn btn-sm btn-outline-light d-lg-none"
            onClick={closeSidebar}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <Nav className="flex-column w-100">
          {navItems.map((item, index) => (
            <Nav.Link
              key={index}
              as={NavLink}
              to={item.path}
              className="text-white mb-2 rounded"
              activeClassName="active"
              onClick={closeSidebar}
              style={({ isActive }) => ({
                backgroundColor: isActive ? "#0d6efd" : "transparent",
                padding: "10px 15px",
              })}
            >
              <i className={`${item.icon} me-2`}></i>
              {item.label}
            </Nav.Link>
          ))}
        </Nav>

        <div className="mt-auto w-100">
          <div className="text-center text-muted small mt-4">
            <div>
              Role:{" "}
              <span className="text-info">{user?.role?.toUpperCase()}</span>
            </div>
            <div className="mt-2">v1.0.0</div>
          </div>
        </div>
      </Navbar>
    </div>
  );
};

export default Sidebar;
