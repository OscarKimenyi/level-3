import React, { useEffect, useRef } from "react";
import { Card, ListGroup, Badge, Button, Spinner } from "react-bootstrap";
import useNotifications from "../../context/useNotifications"; // Changed to default import
import { useNavigate } from "react-router-dom";

// Custom date formatter function
const formatDistanceToNow = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
};

const NotificationsPanel = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(); // This works with default import

  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    if (notification.link) {
      navigate(notification.link);
    }
    onClose();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "success":
        return "bi-check-circle-fill text-success";
      case "warning":
        return "bi-exclamation-triangle-fill text-warning";
      case "danger":
        return "bi-x-circle-fill text-danger";
      default:
        return "bi-info-circle-fill text-info";
    }
  };

  const formatTime = (date) => {
    try {
      return formatDistanceToNow(date);
    } catch {
      return "recently";
    }
  };

  return (
    <div
      ref={panelRef}
      className="position-absolute top-100 end-0 mt-2"
      style={{ width: "380px", maxWidth: "90vw", zIndex: 1050 }}
    >
      <Card className="shadow-lg">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <div>
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <Badge bg="danger" className="ms-2">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div>
            {unreadCount > 0 && (
              <Button
                variant="link"
                size="sm"
                onClick={markAllAsRead}
                className="text-decoration-none me-2"
              >
                Mark all read
              </Button>
            )}
            <Button variant="link" size="sm" onClick={onClose}>
              <i className="bi bi-x-lg"></i>
            </Button>
          </div>
        </Card.Header>

        <Card.Body
          className="p-0"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" />
              <p className="text-muted small mt-2">Loading...</p>
            </div>
          ) : notifications.length > 0 ? (
            <ListGroup variant="flush">
              {notifications.map((notification) => (
                <ListGroup.Item
                  key={notification._id}
                  action
                  onClick={() => handleNotificationClick(notification)}
                  className={`d-flex align-items-start gap-3 ${!notification.read ? "bg-light" : ""}`}
                  style={{ cursor: "pointer" }}
                >
                  <i
                    className={`bi ${getTypeIcon(notification.type)} fs-4`}
                  ></i>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <strong>{notification.title}</strong>
                      <small className="text-muted">
                        {formatTime(notification.createdAt)}
                      </small>
                    </div>
                    <p className="mb-1 small">{notification.message}</p>
                    {!notification.read && (
                      <Badge bg="primary" pill className="mt-1">
                        New
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-muted p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                  >
                    <i className="bi bi-x"></i>
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-bell-slash display-4 text-muted"></i>
              <p className="text-muted mt-3">No notifications</p>
            </div>
          )}
        </Card.Body>

        <Card.Footer className="bg-light text-center">
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              navigate("/notifications");
              onClose();
            }}
            className="text-decoration-none"
          >
            View all notifications
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default NotificationsPanel;
