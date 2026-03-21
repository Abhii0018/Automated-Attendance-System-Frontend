import { createContext, useState, useEffect, useCallback } from "react";
import { TOKEN_KEY, USER_KEY } from "../utils/constants";
import authService from "../services/authService";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  /*
    Safe JSON parse helper
  */
  const safeParse = (value) => {
    try {
      if (!value || value === "undefined") return null;
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const [user, setUser] = useState(() =>
    safeParse(localStorage.getItem(USER_KEY))
  );

  const [token, setToken] = useState(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  /*
    On startup, validate the stored token by checking its expiry.
    If valid, set a timeout to automatically log out when it expires.
  */
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    let logoutTimer;
    
    if (storedToken) {
      try {
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        const nowSecs = Math.floor(Date.now() / 1000);
        
        if (!payload.exp || payload.exp < nowSecs) {
          // Token is expired — clear everything
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        } else {
          // Token is valid — set a timer to auto-logout exactly when it expires
          const timeUntilExpiryMs = (payload.exp - nowSecs) * 1000;
          logoutTimer = setTimeout(() => {
            console.log("Session expired. Auto-logging out...");
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
            window.location.href = "/login?expired=true";
          }, timeUntilExpiryMs);
        }
      } catch {
        // Malformed token — clear it
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      }
    }
    
    setInitializing(false);
    
    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
    };
  }, []);

  /*
    Normalize role to lowercase
  */
  const normalizeUser = (rawUser) => {
    if (!rawUser) return null;

    return {
      ...rawUser,
      role: rawUser.role?.toLowerCase(),
    };
  };

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);

      if (!data || !data.token || !data.user) {
        throw new Error("Invalid login response structure");
      }

      // Normalize role to lowercase so RoleRoute comparisons always work
      const normalizedUser = normalizeUser(data.user);

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));

      setToken(data.token);
      setUser(normalizedUser);

      // Return normalized user so Login.jsx redirect also uses lowercase role
      return { ...data, user: normalizedUser };

    } catch (error) {
      console.error("AuthContext login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      // Just create the account — do NOT auto-login.
      // User will be redirected to /login and must sign in manually.
      const response = await authService.register(userData);
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);


  const value = {
    user,
    token,
    loading,
    initializing,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === "admin",
    isTeacher: user?.role === "teacher",
    isStudent: user?.role === "student",
  };

  return (
    <AuthContext.Provider value={value}>
      {!initializing && children}
    </AuthContext.Provider>
  );
};

