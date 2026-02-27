import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (token && !socket) {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
        withCredentials: true,
        auth: { token },
      });

      newSocket.on("connect", () => {
        console.log("Connected to socket server");
        newSocket.emit("authenticate", token);
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from socket server");
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token, socket]);

  const value = {
    socket,
    isConnected: socket?.connected || false,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
