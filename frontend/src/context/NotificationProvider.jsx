import React, { useState, useEffect, useCallback, useRef } from "react";
import NotificationContext from "./NotificationContext";
import useAuth from "./useAuth";
import useSocket from "./useSocket";
import api from "../services/api";

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { isConnected, on } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const listenerAttached = useRef(false);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (unreadOnly = false) => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const response = await api.get(
          `/notifications?unreadOnly=${unreadOnly}&limit=50`,
        );
        setNotifications(response.data.data || []);
        setUnreadCount(response.data.unreadCount || 0);
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
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);

      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

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
    if (!isAuthenticated) {
      console.log("🔒 User not authenticated, skipping notification listener");
      return;
    }

    if (!isConnected) {
      console.log("🔌 Socket not connected, waiting for connection...");
      // Set up a retry mechanism
      const retryTimer = setTimeout(() => {
        if (isConnected) {
          console.log("📡 Socket now connected, setting up listener");
        }
      }, 2000);
      return () => clearTimeout(retryTimer);
    }

    console.log(
      "📡 Setting up real-time notification listener for user:",
      user?.email,
    );

    const handleNewNotification = (data) => {
      console.log("📨 New notification received:", data);

      const newNotification = {
        _id: data._id || Date.now().toString(),
        title: data.title,
        message: data.message,
        type: data.type || "info",
        read: false,
        link: data.link,
        createdAt: data.timestamp || new Date(),
        metadata: data.metadata,
      };

      setNotifications((prev) => {
        // Don't add duplicates
        if (prev.some((n) => n._id === newNotification._id)) {
          return prev;
        }
        return [newNotification, ...prev];
      });

      setUnreadCount((prev) => prev + 1);

      // Play sound
      try {
        const audio = new Audio("/notification.mp3");
        audio.play().catch((e) => console.log("🔇 Audio play failed:", e));
      } catch {
        console.log("🔇 Audio not supported");
      }

      // Show browser notification
      if (Notification.permission === "granted") {
        try {
          new Notification(data.title, {
            body: data.message,
            icon: "/vite.svg",
            silent: true,
          });
        } catch (e) {
          console.log("🔔 Browser notification failed:", e);
        }
      }
    };

    // Attach listener
    const unsubscribe = on("new_notification", handleNewNotification);
    listenerAttached.current = true;
    console.log("✅ Notification listener attached successfully");

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("🔔 Notification permission:", permission);
      });
    }

    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    return () => {
      console.log("📡 Cleaning up notification listener");
      unsubscribe();
      listenerAttached.current = false;
    };
  }, [
    isAuthenticated,
    isConnected,
    user?.email,
    on,
    fetchNotifications,
    fetchUnreadCount,
  ]);

  // Poll for unread count as fallback (every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

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
