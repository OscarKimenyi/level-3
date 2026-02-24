import React, { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import SocketContext from "./SocketContext";
import useAuth from "./useAuth";

const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const socketRef = useRef(null);
  const { isAuthenticated, token, user } = useAuth();
  const reconnectAttempts = useRef(0);

  // Initialize socket connection
  const connectSocket = useCallback(() => {
    if (!isAuthenticated || !token) {
      console.log("🔌 Not authenticated, skipping socket connection");
      console.log("Auth state:", isAuthenticated);
      console.log("Token exists:", !!token);
      return;
    }

    // Clean up existing socket
    if (socketRef.current) {
      console.log("🧹 Cleaning up existing socket");
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log("🔌 Attempting to connect to socket server...");

    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    console.log("📡 Connecting to socket URL:", SOCKET_URL);

    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
    });

    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      console.log("✅ Connected to socket server with ID:", socketInstance.id);
      setIsConnected(true);
      setSocketId(socketInstance.id);
      reconnectAttempts.current = 0;

      // Authenticate immediately after connection
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

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Disconnected from socket server:", reason);
      setIsConnected(false);
      setSocketId(null);

      // Try to reconnect if not intentional
      if (reason === "io server disconnect") {
        // Reconnect manually if server disconnected
        setTimeout(() => {
          if (isAuthenticated) {
            socketInstance.connect();
          }
        }, 1000);
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
      setSocketId(null);
      reconnectAttempts.current += 1;
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      // Re-authenticate after reconnect
      socketInstance.emit("authenticate", token);
    });

    socketInstance.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Reconnection attempt #${attemptNumber}`);
    });

    socketInstance.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    socketInstance.on("reconnect_failed", () => {
      console.error("Failed to reconnect");
      setIsConnected(false);
    });

    return socketInstance;
  }, [isAuthenticated, token, user?.email]);

  // Connect when authenticated
  useEffect(() => {
    let socketInstance;

    if (isAuthenticated && token) {
      // Small delay to ensure token is properly set
      const timer = setTimeout(() => {
        socketInstance = connectSocket();
      }, 500);

      return () => {
        clearTimeout(timer);
        if (socketInstance) {
          socketInstance.disconnect();
        }
      };
    } else {
      // Clean up when not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      //setIsConnected(false);
      //setSocketId(null);
    }

    return () => {};
  }, [isAuthenticated, token, connectSocket]);

  // Emit event helper
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

  // On event helper
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => socketRef.current?.off(event, callback);
    }
    return () => {};
  }, []);

  // Off event helper
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
