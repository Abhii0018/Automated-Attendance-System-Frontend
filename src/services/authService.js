import api from "./api";

const authService = {
  login: async (email, password) => {
  const response = await api.post("/auth/login", { email, password });

  if (!response.data.success) {
    throw new Error(response.data.message || "Login failed");
  }

  return response.data.data; // returns { token, user }
},

register: async (userData) => {
  try {
    console.log("📤 Sending registration data:", userData);

    const response = await api.post("/auth/register", userData);

    console.log("📥 Server response:", response.data);

    return response.data;

  } catch (error) {
    console.error("❌ Registration error:", error.response?.data || error.message);
    throw error;
  }
},

  logout: () => {
    localStorage.removeItem("attendx_token");
    localStorage.removeItem("attendx_user");
  },
};

export default authService;