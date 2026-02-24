import React, { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import SocketContext from "./SocketContext";
import useAuth from "./useAuth";

const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const socketRef = useRef(null);
  const { isAuthenticated, token, user } = useAuth();

  // 👇 PLACE THIS HERE - Debug auth state changes
  useEffect(() => {
    console.log("Auth state changed:", {
      isAuthenticated,
      token: token ? "exists" : "none",
    });
  }, [isAuthenticated, token]);

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
    });

    socketRef.current = socketInstance;

    // 👇 THESE EVENT HANDLERS GO HERE - Inside the useEffect, after creating socketInstance
    socketInstance.on("connect", () => {
      console.log("✅ Connected to socket server with ID:", socketInstance.id);
      setIsConnected(true);
      setSocketId(socketInstance.id);
      socketInstance.emit("authenticate", token);
    });

    socketInstance.on("authenticated", (data) => {
      if (data.success) {
        console.log(
          "✅ Socket authenticated successfully for user:",
          user?.email,
        );
      } else {
        console.log("❌ Socket authentication failed:", data.error);
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
      setSocketId(null);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Disconnected from socket server. Reason:", reason);
      setIsConnected(false);
      setSocketId(null);
    });

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up socket connection");
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, token, user?.email]);

  // Separate effect to handle authentication state changes
  useEffect(() => {
    if (!isAuthenticated && socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [isAuthenticated]);

  const emit = useCallback(
    (event, data, callback) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit(event, data, callback);
        return true;
      }
      console.warn("Socket not connected, cannot emit:", event);
      return false;
    },
    [isConnected],
  );

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => socketRef.current?.off(event, callback);
    }
    return () => {};
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  const value = {
    isConnected,
    socketId,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
