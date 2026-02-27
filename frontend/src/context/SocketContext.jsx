import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import SocketContext from "./SocketContextObject";

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io("https://level-3-backend.onrender.com");

    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      setSocket(newSocket);
      setIsConnected(true);
      console.log("Socket connected");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
