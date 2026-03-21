// Attendance service placeholder


import api from "./api";

const attendanceService = {
  // Teacher/Admin: submit section attendance
  markAttendance: async (attendanceData) => {
    const response = await api.post("/attendance", attendanceData);
    return response.data;
  },

  // Admin: get aggregated attendance for a section
  getAttendanceBySection: async (section, date, subject) => {
    const response = await api.get("/attendance/section", {
      params: { section, date, subject },
    });
    return response.data;
  },

  // Teacher/Admin: get students for a semester + section
  getSectionStudents: async (semester, section) => {
    const response = await api.get("/attendance/section/students", {
      params: { semester, section },
    });
    return response.data;
  },

  // Teacher: dashboard overview (sections, stats, history)
  getTeacherOverview: async () => {
    const response = await api.get("/attendance/teacher/overview");
    return response.data;
  },

  // Admin: dashboard overview (real stats, recent submissions)
  getAdminOverview: async () => {
    const response = await api.get("/attendance/admin/overview");
    return response.data;
  },

  // Student/Admin analytics (placeholders kept for future use)
  getStudentAttendance: async (studentId, params = {}) => {
    const response = await api.get(`/attendance/student/${studentId}`, {
      params,
    });
    return response.data;
  },

  getMyAttendance: async (params = {}) => {
    const response = await api.get("/attendance/me", { params });
    return response.data;
  },

  getSectionAnalytics: async (section, params = {}) => {
    const response = await api.get(
      `/attendance/analytics/section/${section}`,
      { params }
    );
    return response.data;
  },

  getOverallAnalytics: async () => {
    const response = await api.get("/attendance/analytics/overall");
    return response.data;
  },

  getLowAttendanceStudents: async (threshold = 75) => {
    const response = await api.get("/attendance/low", {
      params: { threshold },
    });
    return response.data;
  },
};

export default attendanceService;