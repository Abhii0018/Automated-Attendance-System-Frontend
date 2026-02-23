// Attendance service placeholder


import api from "./api";

const attendanceService = {
  markAttendance: async (attendanceData) => {
    const response = await api.post("/attendance/mark", attendanceData);
    return response.data;
  },

  getAttendanceBySection: async (section, date, subject) => {
    const response = await api.get("/attendance/section", {
      params: { section, date, subject },
    });
    return response.data;
  },

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