import React, { useState, useEffect, useCallback } from "react";
import NotificationContext from "./NotificationContext";
import { useAuth } from "./useAuth";
import { useSocket } from "./useSocket";
import api from "../services/api";

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { socket, on } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (unreadOnly = false) => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const response = await api.get(
          `/notifications?unreadOnly=${unreadOnly}&limit=50`,
        );
        setNotifications(response.data.data);
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated],
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get("/notifications/unread-count");
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        await api.put(`/notifications/${notificationId}/read`);

        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Emit socket event
        if (socket) {
          socket.emit("notification_read", { notificationId });
        }
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [socket],
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.put("/notifications/read-all");

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId) => {
      try {
        await api.delete(`/notifications/${notificationId}`);

        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId),
        );
        // Update unread count if the deleted notification was unread
        const deleted = notifications.find((n) => n._id === notificationId);
        if (deleted && !deleted.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    [notifications],
  );

  // Send notification (admin only)
  const sendNotification = useCallback(async (data) => {
    try {
      const response = await api.post("/notifications/send", data);
      return response.data;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNewNotification = (data) => {
      // Add to notifications list
      const newNotification = {
        _id: Date.now().toString(), // Temporary ID
        ...data,
        read: false,
        createdAt: new Date(),
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Play sound (optional)
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});

      // Show browser notification if permitted
      if (Notification.permission === "granted") {
        new Notification(data.title, {
          body: data.message,
          icon: "/logo192.png",
        });
      }
    };

    const unsubscribe = on("new_notification", handleNewNotification);

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return unsubscribe;
  }, [socket, isAuthenticated, on]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();

      // Set up polling for unread count (fallback)
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    panelOpen,
    setPanelOpen,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
