import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import useAuth from "../../hooks/useAuth";
import studentService from "../../services/studentService";
import attendanceService from "../../services/attendanceService";
import Loader from "../../components/Loader";

const MOCK_STUDENTS = [
  { _id: "1", name: "Arjun Sharma",  rollNumber: "CS2024001", section: "A", attendancePercentage: 72 },
  { _id: "2", name: "Priya Mehta",   rollNumber: "CS2024002", section: "B", attendancePercentage: 91 },
  { _id: "3", name: "Rohan Singh",   rollNumber: "CS2024003", section: "A", attendancePercentage: 65 },
  { _id: "4", name: "Ananya Rao",    rollNumber: "CS2024004", section: "C", attendancePercentage: 88 },
  { _id: "5", name: "Dev Patel",     rollNumber: "CS2024005", section: "B", attendancePercentage: 78 },
];

const StatCard = ({ label, value, sub, iconBg, icon }) => (
  <div className="bg-[#151820] border border-white/5 hover:border-blue-500/20 rounded-xl p-6 transition-all duration-300">
    <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <div className="font-bold text-3xl text-white mb-1">{value}</div>
    <div className="text-slate-500 text-sm">{label}</div>
    {sub && <div className="text-slate-600 text-xs mt-1 font-mono">{sub}</div>}
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, lowAttendance: 0, avgAttendance: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const headerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      ".dash-card",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: "power3.out" }
    );
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, lowRes] = await Promise.all([
          studentService.getAllStudents(),
          attendanceService.getLowAttendanceStudents(),
        ]);
        const students = studentsRes.students || studentsRes || [];
        const low      = lowRes.students || lowRes || [];
        setStats({
          students: students.length,
          lowAttendance: low.length,
          avgAttendance:
            students.length > 0
              ? Math.round(
                  students.reduce((a, s) => a + (s.attendancePercentage || 0), 0) /
                  students.length
                )
              : 0,
        });
        setRecentStudents(students.slice(0, 5));
      } catch {
        setStats({ students: 247, lowAttendance: 18, avgAttendance: 82 });
        setRecentStudents(MOCK_STUDENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader fullScreen />;

  const quickActions = [
    {
      label: "Create Student",
      to: "/admin/create-student",
      color: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-400",
      emoji: "👤",
    },
    {
      label: "View All Students",
      to: "/admin/students",
      color: "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400",
      emoji: "📋",
    },
    {
      label: "Section Attendance",
      to: "/admin/section-attendance",
      color: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-amber-400",
      emoji: "📊",
    },
  ];

  return (
    <div className="min-h-screen bg-[#06070a] pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div ref={headerRef} className="mb-8">
          <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-2">
            Admin Dashboard
          </p>
          <h1 className="font-bold text-3xl text-white">
            Good morning,{" "}
            <span className="text-blue-400">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Here's what's happening today.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="dash-card opacity-0">
            <StatCard
              label="Total Students"
              value={stats.students}
              sub="Enrolled this semester"
              iconBg="bg-blue-500/10"
              icon={
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
            />
          </div>
          <div className="dash-card opacity-0">
            <StatCard
              label="Avg Attendance"
              value={`${stats.avgAttendance}%`}
              sub="Across all sections"
              iconBg="bg-emerald-500/10"
              icon={
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
            />
          </div>
          <div className="dash-card opacity-0">
            <StatCard
              label="Low Attendance"
              value={stats.lowAttendance}
              sub="Students below 75%"
              iconBg="bg-rose-500/10"
              icon={
                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dash-card opacity-0 bg-[#151820] border border-white/5 rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-lg text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickActions.map((a, i) => (
              <Link
                key={i}
                to={a.to}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${a.color}`}
              >
                <span className="text-xl">{a.emoji}</span>
                <span className="font-medium text-sm">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Students */}
        <div className="dash-card opacity-0 bg-[#151820] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg text-white">Recent Students</h2>
            <Link
              to="/admin/students"
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentStudents.map((student) => (
              <div
                key={student._id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <span className="font-bold text-blue-400 text-sm">
                      {student.name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">
                      {student.name}
                    </p>
                    <p className="text-slate-500 text-xs font-mono">
                      {student.rollNumber} · Section {student.section}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium border ${
                      student.attendancePercentage >= 75
                        ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                        : "bg-rose-400/10 text-rose-400 border-rose-400/20"
                    }`}
                  >
                    {student.attendancePercentage}%
                  </span>
                  <Link
                    to={`/admin/students/${student._id}/analytics`}
                    className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-blue-400 transition-all text-xs"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;