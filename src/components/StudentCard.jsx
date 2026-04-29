import { Link } from "react-router-dom";
import { ATTENDANCE_THRESHOLD } from "../utils/constants";

const AVATAR_COLORS = [
  "from-blue-600 to-indigo-600",
  "from-emerald-600 to-teal-600",
  "from-violet-600 to-purple-600",
  "from-amber-600 to-orange-600",
  "from-rose-600 to-pink-600",
];

const StudentCard = ({ student, onDelete, onLinkUser }) => {
  const colorIdx =
    (student.rollNumber?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const attendancePct = student.attendancePercentage ?? null;
  const isLow =
    attendancePct !== null && attendancePct < ATTENDANCE_THRESHOLD;

  return (
    <div className="bg-white/80 border border-white/60 hover:border-blue-300 rounded-2xl p-5 transition-all duration-300 group relative overflow-hidden backdrop-blur-md shadow-[0_12px_28px_rgba(10,22,40,0.10)] hover:-translate-y-1">
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
              <h3 className="font-semibold text-slate-900 truncate">
                {student.name}
              </h3>
              <p className="text-slate-500 text-sm font-mono">
                {student.rollNumber || student.registrationNumber}
              </p>
            </div>
            {attendancePct !== null && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium border flex-shrink-0 ${
                  isLow
                    ? "bg-rose-100 text-rose-700 border-rose-200"
                    : "bg-emerald-100 text-emerald-700 border-emerald-200"
                }`}
              >
                {attendancePct}%
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {student.section && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
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
            <div className="mt-3 h-1 bg-slate-200 rounded-full overflow-hidden">
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
      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2">
        {onLinkUser && !student.userId && (
          <button
            onClick={() => onLinkUser(student)}
            className="text-xs px-3 py-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
          >
            Link User
          </button>
        )}
        <Link
          to={`/admin/students/${student._id}/analytics`}
          className="flex-1 text-center text-xs py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
        >
          View Analytics
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(student._id)}
            className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-100 transition-all"
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