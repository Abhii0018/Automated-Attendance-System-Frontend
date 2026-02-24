// Student service placeholder
import api from "./api";

const studentService = {
  getAllStudents: async (params = {}) => {
    const response = await api.get("/students", { params });
    return response.data;
  },

  getStudentById: async (id) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  createStudent: async (studentData) => {
    const response = await api.post("/students", studentData);
    return response.data;
  },

  updateStudent: async (id, studentData) => {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  getStudentAnalytics: async (id) => {
    const response = await api.get(`/students/${id}/analytics`);
    return response.data;
  },

  getMyProfile: async () => {
    const response = await api.get("/students/me");
    return response.data;
  },

  // Admin: assign student to section
  assignSection: async (studentId, semester, section) => {
    const response = await api.post(`/students/${studentId}/assign-section`, {
      semester,
      section,
    });
    return response.data;
  },
};

export default studentService;