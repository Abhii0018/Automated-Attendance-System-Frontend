import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import studentService from "../../services/studentService";
import attendanceService from "../../services/attendanceService";
import AttendanceTable from "../../components/AttendanceTable";
import Loader from "../../components/Loader";
import { ATTENDANCE_THRESHOLD } from "../../utils/constants";

const MOCK_STUDENT = {
  _id: "1",
  name: "Arjun Sharma",
  rollNumber: "CS2024001",
  section: "A",
  email: "arjun@school.edu",
  attendancePercentage: 72,
};

const MOCK_RECORDS = [
  { _id: "1", date: "2024-03-01", subject: "Mathematics",     status: "present" },
  { _id: "2", date: "2024-03-02", subject: "Physics",         status: "absent"  },
  { _id: "3", date: "2024-03-03", subject: "Chemistry",       status: "present" },
  { _id: "4", date: "2024-03-04", subject: "Computer Science",status: "late"    },
  { _id: "5", date: "2024-03-05", subject: "English",         status: "present" },
  { _id: "6", date: "2024-03-06", subject: "Mathematics",     status: "absent"  },
  { _id: "7", date: "2024-03-07", subject: "Physics",         status: "present" },
];

const StudentAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const pctRef   = useRef({ val: 0 });
  const numRef   = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, aRes] = await Promise.all([
          studentService.getStudentById(id),
          attendanceService.getStudentAttendance(id),
        ]);
        setStudent(sRes.student || sRes);
        setRecords(aRes.records || aRes || []);
      } catch {
        setStudent(MOCK_STUDENT);
        setRecords(MOCK_RECORDS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!loading && student) {
      gsap.fromTo(
        ".analytics-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power3.out" }
      );

      // Animate percentage counter
      const pct = student.attendancePercentage ?? 0;
      gsap.to(pctRef.current, {
        val: pct,
        duration: 1.5,
        ease: "power2.out",
        onUpdate() {
          if (numRef.current) {
            numRef.current.textContent = `${Math.round(pctRef.current.val)}%`;
          }
        },
      });
    }
  }, [loading, student]);

  if (loading) return <Loader fullScreen />;

  if (!student) {
    return (
      <div className="min-h-screen bg-[#06070a] pt-16 flex items-center justify-center">
        <p className="text-slate-400">Student not found.</p>
      </div>
    );
  }

  const pct   = student.attendancePercentage ?? 0;
  const isLow = pct < ATTENDANCE_THRESHOLD;

  // Build subject stats from records
  const subjectMap = records.reduce((acc, r) => {
    if (!acc[r.subject]) acc[r.subject] = { total: 0, present: 0 };
    acc[r.subject].total++;
    if (r.status === "present" || r.status === "late") acc[r.subject].present++;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_10%,#c7d2fe_0%,#eaf1ff_30%,#e9eefc_64%,#eef2ff_100%)] pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16l-4-4m0 0l4-4m-4 4h18"
            />
          </svg>
          Back
        </button>

        {/* Student Info Card */}
        <div className="analytics-card opacity-0 bg-white/85 border border-white/60 rounded-2xl p-6 mb-5 shadow-[0_16px_30px_rgba(10,22,40,0.11)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-2xl text-white">
                {student.name?.charAt(0)}
              </span>
            </div>

            {/* Details */}
            <div className="flex-1">
              <h1 className="font-bold text-2xl text-slate-900">{student.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-slate-600 font-mono text-sm">
                  {student.rollNumber || student.registrationNumber}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-400/20">
                  Section {student.section}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-mono ${
                  isLow
                    ? "bg-rose-400/10 text-rose-400 border-rose-400/20"
                    : "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                }`}>
                  {pct}% attendance
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Overall Attendance</span>
              <span className={`text-sm font-mono font-medium ${
                isLow ? "text-rose-400" : "text-emerald-400"
              }`}>
                {pct}%
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isLow ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {isLow && (
              <p className="text-rose-400 text-xs mt-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Below the minimum 75% threshold
              </p>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="analytics-card opacity-0 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label: "Total Classes", value: records.length },
            { label: "Present",       value: records.filter(r => r.status === "present").length, color: "text-emerald-400" },
            { label: "Absent",        value: records.filter(r => r.status === "absent").length,  color: "text-rose-400"    },
            { label: "Late",          value: records.filter(r => r.status === "late").length,    color: "text-amber-400"   },
          ].map((s, i) => (
            <div key={i} className="bg-white/85 border border-white/60 rounded-xl p-4 text-center shadow-[0_10px_20px_rgba(10,22,40,0.08)]">
              <div className={`font-bold text-2xl mb-1 ${s.color || "text-white"}`}>
                {s.value}
              </div>
              <div className="text-slate-600 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Subject Breakdown */}
        {Object.keys(subjectMap).length > 0 && (
          <div className="analytics-card opacity-0 bg-white/85 border border-white/60 rounded-2xl p-6 mb-5 shadow-[0_16px_30px_rgba(10,22,40,0.11)]">
            <h2 className="font-bold text-lg text-slate-900 mb-5">
              Subject-wise Breakdown
            </h2>
            <div className="space-y-4">
              {Object.entries(subjectMap).map(([subject, data]) => {
                const subPct = Math.round((data.present / data.total) * 100);
                return (
                  <div key={subject}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-800">{subject}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600 text-xs font-mono">
                          {data.present}/{data.total}
                        </span>
                        <span className={`text-xs font-mono font-medium w-10 text-right ${
                          subPct >= 75 ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {subPct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          subPct >= 75 ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${subPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Attendance Records Table */}
        <div className="analytics-card opacity-0">
          <h2 className="font-bold text-lg text-slate-900 mb-4">
            Attendance Records
          </h2>
          <AttendanceTable records={records} />
        </div>

      </div>
    </div>
  );
};

export default StudentAnalytics;