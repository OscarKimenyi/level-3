import React, { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import SocketContext from "./SocketContext";
import useAuth from "./useAuth";

const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const socketRef = useRef(null);
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Create new socket connection with better options
    const socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      console.log("Connected to socket server");
      setIsConnected(true);
      setSocketId(socketInstance.id);
      socketInstance.emit("authenticate", token);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected from socket server:", reason);
      setIsConnected(false);
      setSocketId(null);

      if (reason === "io server disconnect") {
        // Reconnect manually if server disconnected
        socketInstance.connect();
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
      setSocketId(null);
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    socketInstance.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Reconnection attempt #${attemptNumber}`);
    });

    socketInstance.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    socketInstance.on("reconnect_failed", () => {
      console.error("Failed to reconnect");
      setIsConnected(false);
    });

    // In the useEffect where socket is created, add:

    socketInstance.on("connect", () => {
      console.log("✅ Connected to socket server with ID:", socketInstance.id);
      setIsConnected(true);
      setSocketId(socketInstance.id);
      socketInstance.emit("authenticate", token);
    });

    socketInstance.on("authenticated", (data) => {
      console.log("🔄 Socket authentication response:", data);
      if (data.success) {
        console.log("Socket authenticated successfully");
      } else {
        console.log("Socket authentication failed:", data.error);
      }
    });

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, token]);

  // Emit event helper
  const emit = useCallback(
    (event, data) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit(event, data);
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

  const value = {
    isConnected,
    socketId,
    emit,
    on,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
