import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import Navbar from "./components/Navbar";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateStudent from "./pages/admin/CreateStudent";
import StudentsList from "./pages/admin/StudentsList";
import StudentAnalytics from "./pages/admin/StudentAnalytics";
import SectionAttendance from "./pages/admin/SectionAttendance";
import TakeAdmission from "./pages/admin/TakeAdmission";


// Teacher
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import MarkAttendance from "./pages/teacher/MarkAttendance";

// Student
import StudentDashboard from "./pages/student/StudentDashboard";
import Profile from "./pages/student/Profile";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>

          {/* ── Public ── */}
          <Route path="/" element={<Landing />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Admin ── */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-student"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin"]}>
                  <CreateStudent />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/take-admission"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin"]}>
                  <TakeAdmission />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"

            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin"]}>
                  <StudentsList />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/:id/analytics"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin"]}>
                  <StudentAnalytics />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/section-attendance"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["admin"]}>
                  <SectionAttendance />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* ── Teacher ── */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["teacher"]}>
                  <TeacherDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/mark-attendance"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["teacher"]}>
                  <MarkAttendance />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* ── Student ── */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["student"]}>
                  <Profile />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;