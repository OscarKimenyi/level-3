import React, { useState, useEffect, useCallback, useRef } from "react";
import io from "socket.io-client";
import SocketContext from "./SocketContext";
import useAuth from "./useAuth";

const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const socketRef = useRef(null);
  const { isAuthenticated, token } = useAuth();

  // Initialize socket connection - using refs for socket instance
  useEffect(() => {
    // Don't set state directly in the effect body for cleanup
    // Instead, set up listeners that will update state when events occur

    if (!isAuthenticated || !token) {
      // If we have an existing socket, clean it up
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return; // Don't set state here - let the initial state (false, null) remain
    }

    // Only create socket if it doesn't exist
    if (!socketRef.current) {
      const socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
        withCredentials: true,
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socketInstance;

      // Set up event listeners that will update state
      socketInstance.on("connect", () => {
        console.log("Connected to socket server");
        setIsConnected(true);
        setSocketId(socketInstance.id);
        socketInstance.emit("authenticate", token);
      });

      socketInstance.on("disconnect", () => {
        console.log("Disconnected from socket server");
        setIsConnected(false);
        setSocketId(null);
      });

      socketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
        setSocketId(null);
      });
    }

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, token]); // Remove setIsConnected/setSocketId from dependencies

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

  // On event helper - returns cleanup function
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => {
        if (socketRef.current) {
          socketRef.current.off(event, callback);
        }
      };
    }
    return () => {};
  }, []);

  // Off event helper
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // Get socket ID - useful for debugging
  const getId = useCallback(() => {
    return socketRef.current?.id || null;
  }, []);

  // Value object - does NOT include socketRef.current directly
  const value = {
    isConnected,
    socketId,
    emit,
    on,
    off,
    getId,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketProvider;
