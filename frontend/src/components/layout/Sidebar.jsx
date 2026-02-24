import React from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { Nav } from "react-bootstrap";
import useAuth from "../../context/useAuth";

const Sidebar = ({ isOpen, closeSidebar, isMobile }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getNavItems = () => {
    const commonItems = [
      { path: "/dashboard", icon: "bi-speedometer2", label: "Dashboard" },
      { path: "/courses", icon: "bi-book", label: "Courses" },
      { path: "/assignments", icon: "bi-journal-text", label: "Assignments" },
      { path: "/chat", icon: "bi-chat", label: "Messages" },
    ];

    const adminItems = [
      { path: "/students", icon: "bi-people", label: "Students" },
      { path: "/teachers", icon: "bi-person-badge", label: "Teachers" },
      { path: "/attendance", icon: "bi-calendar-check", label: "Attendance" },
    ];

    const teacherItems = [
      { path: "/attendance", icon: "bi-calendar-check", label: "Attendance" },
      { path: "/profile/teacher", icon: "bi-person", label: "My Profile" },
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

  const handleLinkClick = () => {
    if (isMobile) {
      closeSidebar();
    }
  };

  // Helper function to determine if a path is active
  const isActivePath = (path) => {
    return location.pathname === path;
  };

  if (!isOpen && isMobile) {
    return null;
  }

  return (
    <div
      className="sidebar-modern"
      style={{
        width: isOpen ? "280px" : isMobile ? "0" : "280px",
        transform: `translateX(${isOpen ? "0" : isMobile ? "-100%" : "0"})`,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <i className="bi bi-mortarboard-fill"></i>
          <span>Student MS</span>
        </div>
        {isMobile && isOpen && (
          <button className="sidebar-close" onClick={closeSidebar}>
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="user-details">
          <div className="user-name">{user?.username}</div>
          <div className="user-email">{user?.email}</div>
        </div>
      </div>

      <Nav className="sidebar-nav flex-column">
        {navItems.map((item, index) => {
          const isActive = isActivePath(item.path);

          return (
            <Nav.Link
              key={index}
              as={RouterNavLink}
              to={item.path}
              className={`sidebar-link ${isActive ? "active" : ""}`}
              onClick={handleLinkClick}
            >
              <i className={`bi ${item.icon} sidebar-icon`}></i>
              <span className="sidebar-label">{item.label}</span>
              {item.badge && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </Nav.Link>
          );
        })}
      </Nav>

      <div className="sidebar-footer">
        <div className="sidebar-version">v1.0.0</div>
      </div>
    </div>
  );
};

export default Sidebar;
