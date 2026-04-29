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

verifyEmail: async (email, otp) => {
  const response = await api.post("/auth/verify-email", { email, otp });
  return response.data;
},

resendVerification: async (email) => {
  const response = await api.post("/auth/resend-verification", { email });
  return response.data;
},

sendSuperAdminLoginOtp: async (email) => {
  const response = await api.post("/auth/superadmin/send-login-otp", { email });
  return response.data;
},

verifySuperAdminLoginOtp: async (email, otp) => {
  const response = await api.post("/auth/superadmin/verify-login-otp", { email, otp });
  return response.data;
},

getPendingTeacherApplications: async () => {
  const response = await api.get("/auth/teachers/pending");
  return response.data;
},

getReviewedTeacherApplications: async () => {
  const response = await api.get("/auth/teachers/reviewed");
  return response.data;
},

reviewTeacherApplication: async (teacherId, action, reason = "") => {
  const response = await api.post(`/auth/teachers/${teacherId}/review`, { action, reason });
  return response.data;
},

getPendingAdminRequests: async () => {
  const response = await api.get("/auth/admins/pending");
  return response.data;
},

getReviewedAdminRequests: async () => {
  const response = await api.get("/auth/admins/reviewed");
  return response.data;
},

reviewAdminRequest: async (adminId, action, reason = "") => {
  const response = await api.post(`/auth/admins/${adminId}/review`, { action, reason });
  return response.data;
},

  logout: () => {
    localStorage.removeItem("attendx_token");
    localStorage.removeItem("attendx_user");
  },
};

export default authService;