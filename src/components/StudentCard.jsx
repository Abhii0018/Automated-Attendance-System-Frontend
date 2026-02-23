import { Link } from "react-router-dom";
import { ATTENDANCE_THRESHOLD } from "../utils/constants";

const AVATAR_COLORS = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

const StudentCard = ({ student, onDelete }) => {
  const colorIdx =
    (student.rollNumber?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const attendancePct = student.attendancePercentage ?? null;
  const isLow =
    attendancePct !== null && attendancePct < ATTENDANCE_THRESHOLD;

  return (
    <div className="bg-[#151820] border border-white/5 hover:border-blue-500/20 rounded-2xl p-5 transition-all duration-300 group relative overflow-hidden">
      {/* Low attendance top bar */}
      {isLow && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-rose-500/70" />
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${AVATAR_COLORS[colorIdx]} flex items-center justify-center flex-shrink-0`}
        >
          <span className="text-white font-bold text-lg">
            {student.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white truncate">
                {student.name}
              </h3>
              <p className="text-slate-500 text-sm font-mono">
                {student.rollNumber}
              </p>
            </div>
            {attendancePct !== null && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium border flex-shrink-0 ${
                  isLow
                    ? "bg-rose-400/10 text-rose-400 border-rose-400/20"
                    : "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                }`}
              >
                {attendancePct}%
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {student.section && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                Section {student.section}
              </span>
            )}
            {student.email && (
              <span className="text-xs text-slate-500 truncate max-w-[150px]">
                {student.email}
              </span>
            )}
          </div>

          {/* Attendance bar */}
          {attendancePct !== null && (
            <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isLow ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${attendancePct}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
        <Link
          to={`/admin/students/${student._id}/analytics`}
          className="flex-1 text-center text-xs py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
        >
          View Analytics
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(student._id)}
            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentCard;