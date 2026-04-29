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

export const SECTIONS = ["PA", "PB"];


export const SEMESTERS = [1];

export const SUBJECTS = [
  "Math",
  "C Language",
  "DBMS",
  "English",
  "Networking",
];

export const TOKEN_KEY = "attendx_token";
export const USER_KEY = "attendx_user";