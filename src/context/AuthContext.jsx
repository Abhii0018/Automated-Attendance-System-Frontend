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
    Just initialize from storage.
    Do NOT auto-call backend /auth/me.
  */
  useEffect(() => {
    setInitializing(false);
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

    console.log("AuthContext received login data:", data);

    if (!data || !data.token || !data.user) {
      throw new Error("Invalid login response structure");
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    return data;

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
      const response = await authService.register(userData);

      const tokenValue = response.data.token;
      const normalizedUser = normalizeUser(response.data.user);

      localStorage.setItem(TOKEN_KEY, tokenValue);
      localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));

      setToken(tokenValue);
      setUser(normalizedUser);

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

