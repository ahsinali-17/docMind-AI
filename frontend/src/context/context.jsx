import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AppContext = createContext();

export const ContextProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("userData");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    verifyUser();
  }, []);

  const verifyUser = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      logoutUser();
      return;
    }

    try {
      setLoading(true)
      const { data } = await axios.get("http://localhost:3000/auth/verifyToken", {
        headers: { Authorization: `Bearer ${token}` },
      });

      updateUserSession(data.user);
      setLoading(false)
    } catch (error) {
      console.error("Token invalid or expired:", error);
      logoutUser();
      setLoading(false)
    }
  };

  const updateUserSession = (userData) => {
    sessionStorage.setItem("userData", JSON.stringify(userData));
    setUser(userData);
  };

  const logoutUser = () => {
    sessionStorage.removeItem("userData");
    localStorage.removeItem("authToken");
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ user, setUser: updateUserSession, logoutUser, loading }}>
      {children}
    </AppContext.Provider>
  );
};