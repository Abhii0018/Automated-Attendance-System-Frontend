import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import useAuth from "../../hooks/useAuth";
import attendanceService from "../../services/attendanceService";
import AttendanceTable from "../../components/AttendanceTable";
import Loader from "../../components/Loader";
import { ATTENDANCE_THRESHOLD } from "../../utils/constants";

const MOCK_RECORDS = [
  { _id: "1", date: "2024-03-10", subject: "Mathematics",     status: "present" },
  { _id: "2", date: "2024-03-09", subject: "Physics",         status: "absent"  },
  { _id: "3", date: "2024-03-08", subject: "Chemistry",       status: "present" },
  { _id: "4", date: "2024-03-07", subject: "Computer Science",status: "late"    },
  { _id: "5", date: "2024-03-06", subject: "English",         status: "present" },
  { _id: "6", date: "2024-03-05", subject: "Mathematics",     status: "absent"  },
];

const MOCK_SUBJECT_STATS = [
  { subject: "Mathematics",     present: 14, total: 18, percentage: 78 },
  { subject: "Physics",         present: 10, total: 16, percentage: 63 },
  { subject: "Chemistry",       present: 15, total: 18, percentage: 83 },
  { subject: "Computer Science",present: 16, total: 18, percentage: 89 },
  { subject: "English",         present: 13, total: 16, percentage: 81 },
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const [records, setRecords]           = useState([]);
  const [subjectStats, setSubjectStats] = useState([]);
  const [overallPct, setOverallPct]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const circleRef = useRef(null);
  const pctRef    = useRef({ val: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await attendanceService.getMyAttendance();
        setRecords(res.records || []);
        setSubjectStats(res.subjectStats || MOCK_SUBJECT_STATS);
        setOverallPct(res.overallPercentage || 72);
      } catch {
        setRecords(MOCK_RECORDS);
        setSubjectStats(MOCK_SUBJECT_STATS);
        setOverallPct(72);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      // Stagger cards in
      gsap.fromTo(
        ".s-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power3.out" }
      );

      // Animate percentage counter
      gsap.to(pctRef.current, {
        val: overallPct,
        duration: 1.5,
        ease: "power2.out",
        onUpdate() {
          if (circleRef.current) {
            circleRef.current.textContent = `${Math.round(pctRef.current.val)}%`;
          }
        },
      });
    }
  }, [loading, overallPct]);

  if (loading) return <Loader fullScreen />;

  const isLow          = overallPct < ATTENDANCE_THRESHOLD;
  const circumference  = 2 * Math.PI * 54;
  const strokeDash     = (overallPct / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#06070a] pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-2">
            Student Dashboard
          </p>
          <h1 className="font-bold text-3xl text-white">
            Hey,{" "}
            <span className="text-blue-400">
              {user?.name?.split(" ")[0]}
            </span>
          </h1>
        </div>

        {/* Low Attendance Warning */}
        {isLow && (
          <div className="s-card opacity-0 mb-6 px-5 py-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-rose-400 font-semibold text-sm">
                Low Attendance Warning
              </p>
              <p className="text-rose-400/70 text-sm mt-0.5">
                Your attendance is{" "}
                <strong className="text-rose-400">{overallPct}%</strong>,
                below the required 75%. You may be barred from exams.
              </p>
            </div>
          </div>
        )}

        {/* Top Row */}
        <div className="grid lg:grid-cols-3 gap-5 mb-6">

          {/* Circular Gauge */}
          <div className="s-card opacity-0 bg-[#151820] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-5">
              Overall Attendance
            </p>

            {/* SVG Ring */}
            <div className="relative">
              <svg width="128" height="128" className="-rotate-90">
                <circle
                  cx="64" cy="64" r="54"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="8"
                />
                <circle
                  cx="64" cy="64" r="54"
                  fill="none"
                  stroke={isLow ? "#f43f5e" : "#10b981"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  style={{ transition: "stroke-dasharray 1.5s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  ref={circleRef}
                  className={`font-bold text-2xl ${
                    isLow ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  0%
                </span>
              </div>
            </div>

            <p className={`mt-4 text-sm font-medium ${
              isLow ? "text-rose-400" : "text-emerald-400"
            }`}>
              {isLow ? "Below threshold" : "Good standing"}
            </p>
            <p className="text-slate-600 text-xs mt-1">
              Required: {ATTENDANCE_THRESHOLD}%
            </p>
          </div>

          {/* Subject Stats */}
          <div className="s-card opacity-0 lg:col-span-2 bg-[#151820] border border-white/5 rounded-2xl p-6">
            <h2 className="font-bold text-lg text-white mb-5">
              Subject Summary
            </h2>
            <div className="space-y-4">
              {subjectStats.map((stat, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-300">{stat.subject}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs font-mono">
                        {stat.present}/{stat.total}
                      </span>
                      <span className={`text-xs font-mono font-medium w-10 text-right ${
                        stat.percentage >= 75
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}>
                        {stat.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        stat.percentage >= 75 ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                      style={{
                        width: `${stat.percentage}%`,
                        transitionDelay: `${i * 0.1}s`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Classes Attended",
              value: records.filter((r) => r.status === "present").length,
              color: "text-emerald-400",
            },
            {
              label: "Classes Missed",
              value: records.filter((r) => r.status === "absent").length,
              color: "text-rose-400",
            },
            {
              label: "Late Entries",
              value: records.filter((r) => r.status === "late").length,
              color: "text-amber-400",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="s-card opacity-0 bg-[#151820] border border-white/5 rounded-xl p-4 text-center"
            >
              <div className={`font-bold text-2xl mb-1 ${s.color}`}>
                {s.value}
              </div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Records */}
        <div className="s-card opacity-0">
          <h2 className="font-bold text-lg text-white mb-4">
            Recent Attendance
          </h2>
          <AttendanceTable records={records.slice(0, 10)} />
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;