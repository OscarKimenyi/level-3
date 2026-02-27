import { useContext } from "react";
import { AuthContext } from "./AuthContext";

// Custom hook to access AuthContext
export const useAuth = () => useContext(AuthContext);
