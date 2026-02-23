// Constants placeholder
export const API_BASE_URL = import.meta.env.VITE_API_URL;

export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
};

export const ROLE_REDIRECTS = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
};

export const ATTENDANCE_THRESHOLD = 75;

export const SECTIONS = ["A", "B", "C", "D", "E"];

export const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "English",
  "Biology",
  "History",
];

export const TOKEN_KEY = "attendx_token";
export const USER_KEY = "attendx_user";