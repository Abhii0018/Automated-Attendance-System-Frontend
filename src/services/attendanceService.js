// Attendance service placeholder


import api from "./api";

const attendanceService = {
  // Public: real counts for landing / login pages (no login needed)
  getPublicStats: async () => {
    const response = await api.get("/attendance/public/stats");
    return response.data;
  },

  // Teacher/Admin: submit section attendance
  markAttendance: async (attendanceData) => {
    const response = await api.post("/attendance", attendanceData);
    return response.data;
  },

  // Admin: get aggregated attendance for a section
  getAttendanceBySection: async (section, date, subject, semester) => {
    const response = await api.get("/attendance/section", {
      params: { section, date, subject, semester },
    });
    return response.data;
  },

  // Teacher/Admin: get students for a semester + section
  getSectionStudents: async (semester, section, subject) => {
    const response = await api.get("/attendance/section/students", {
      params: { semester, section, subject },
    });
    return response.data;
  },

  // Teacher: dashboard overview (sections, stats, history)
  getTeacherOverview: async () => {
    const response = await api.get("/attendance/teacher/overview");
    return response.data;
  },

  getTeacherPunchToday: async () => {
    const response = await api.get("/attendance/teacher/punch/today");
    return response.data;
  },

  teacherCheckIn: async () => {
    const response = await api.post("/attendance/teacher/punch/check-in");
    return response.data;
  },

  teacherCheckOut: async () => {
    const response = await api.post("/attendance/teacher/punch/check-out");
    return response.data;
  },

  getTodayTeacherSchedule: async () => {
    const response = await api.get("/attendance/teacher/schedule/today");
    return response.data;
  },

  upsertTimetableSlot: async (payload) => {
    const response = await api.post("/attendance/admin/timetable-slot", payload);
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

  // Student: AI-written attendance tip
  getMyAttendanceTip: async () => {
    const response = await api.get("/attendance/me/ai-tip");
    return response.data;
  },

  // Student: ask the AI a question about their own attendance
  askAttendanceQuestion: async (question, history = []) => {
    const response = await api.post("/attendance/me/ask", { question, history });
    return response.data;
  },

  // Admin: email today's absence summary to parents now
  sendDailyParentSummaries: async (date) => {
    const response = await api.post("/attendance/admin/notify-daily-absences", { date });
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