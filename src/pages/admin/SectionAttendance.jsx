import { useState } from "react";
import { gsap } from "gsap";
import attendanceService from "../../services/attendanceService";
import AttendanceTable from "../../components/AttendanceTable";
import { SECTIONS, SUBJECTS } from "../../utils/constants";

const SectionAttendance = () => {
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!section) return;
    setLoading(true);
    setSearched(true);
    setError("");
    try {
      const res = await attendanceService.getAttendanceBySection(section, date, subject);
      const recs = res.records || res || [];
      setRecords(recs);
      const present = recs.filter(
        (r) => r.status === "present" || r.status === "late"
      ).length;
      setSummary({ total: recs.length, present, absent: recs.length - present });

      // Animate summary cards in
      setTimeout(() => {
        gsap.fromTo(
          ".summary-card",
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, stagger: 0.08, duration: 0.4, ease: "back.out(1.5)" }
        );
      }, 50);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to load attendance.";
      setError(msg);
      setRecords([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white/90 border border-slate-200 focus:border-blue-400 text-slate-800 placeholder-slate-500 rounded-lg px-4 py-3 outline-none transition-all duration-200 text-sm appearance-none shadow-[0_6px_14px_rgba(10,22,40,0.06)]";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_10%,#c7d2fe_0%,#eaf1ff_30%,#e9eefc_64%,#eef2ff_100%)] pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-blue-700 text-xs font-mono uppercase tracking-widest mb-2">
            Admin
          </p>
          <h1 className="font-bold text-3xl text-slate-900">Section Attendance</h1>
          <p className="text-slate-600 mt-1 text-sm">
            View attendance records for any section.
          </p>
        </div>

        {/* Filter Card */}
        <div className="bg-white/80 border border-white/60 rounded-2xl p-6 mb-6 backdrop-blur-md shadow-[0_12px_24px_rgba(10,22,40,0.08)]">
          <h2 className="font-semibold text-slate-900 mb-5">Filter Records</h2>
          <form onSubmit={handleSearch}>
            <div className="grid sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Section <span className="text-rose-400">*</span>
                </label>
                <select
                  className={inputClass}
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {SECTIONS.map((s) => (
                    <option key={s} value={s}>
                      Section {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Subject
                </label>
                <select
                  className={inputClass}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  <option value="">All subjects</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Date
                </label>
                <input
                  className={inputClass}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-6 text-rose-600 text-sm">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {
                label: "Total",
                value: summary.total,
                color: "text-white",
                bg: "bg-slate-100",
              },
              {
                label: "Present",
                value: summary.present,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                label: "Absent",
                value: summary.absent,
                color: "text-rose-400",
                bg: "bg-rose-500/10",
              },
            ].map((s, i) => (
              <div
                key={i}
                className={`summary-card opacity-0 ${s.bg} border border-slate-200 rounded-xl p-5 text-center`}
              >
                <div className={`font-bold text-3xl mb-1 ${s.color}`}>
                  {s.value}
                </div>
                <div className="text-slate-600 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Attendance rate bar */}
        {summary && summary.total > 0 && (
          <div className="bg-white/80 border border-white/60 rounded-xl p-5 mb-6 backdrop-blur-md shadow-[0_10px_22px_rgba(10,22,40,0.08)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Attendance Rate</span>
              <span className={`text-sm font-mono font-medium ${(summary.present / summary.total) * 100 >= 75
                ? "text-emerald-400"
                : "text-rose-400"
                }`}>
                {Math.round((summary.present / summary.total) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${(summary.present / summary.total) * 100 >= 75
                  ? "bg-emerald-500"
                  : "bg-rose-500"
                  }`}
                style={{
                  width: `${Math.round((summary.present / summary.total) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Table */}
        {searched && (
          <AttendanceTable
            records={records}
            showStudent
            loading={loading}
          />
        )}

        {/* Empty state before search */}
        {!searched && (
          <div className="bg-white/80 border border-white/60 rounded-2xl flex flex-col items-center py-16 text-center backdrop-blur-md shadow-[0_12px_24px_rgba(10,22,40,0.08)]">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-slate-600 text-sm">
              Select a section and click Search to view records.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default SectionAttendance;