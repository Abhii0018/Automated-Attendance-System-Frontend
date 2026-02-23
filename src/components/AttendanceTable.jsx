import { ATTENDANCE_THRESHOLD } from "../utils/constants";

const STATUS_STYLES = {
  present: "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20",
  absent: "bg-rose-500/10 text-rose-400 border border-rose-400/20",
  late: "bg-amber-500/10 text-amber-400 border border-amber-400/20",
};

const AttendanceTable = ({
  records = [],
  showStudent = false,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-[#151820] border border-white/5 rounded-2xl p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-slate-800/50 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="bg-[#151820] border border-white/5 rounded-2xl flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-slate-400 text-sm">No attendance records found</p>
      </div>
    );
  }

  return (
    <div className="bg-[#151820] border border-white/5 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Date
              </th>
              {showStudent && (
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Student
                </th>
              )}
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              {records[0]?.percentage !== undefined && (
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Attendance %
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => (
              <tr
                key={record._id || idx}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors duration-150"
              >
                <td className="px-6 py-4 font-mono text-sm text-slate-400">
                  {record.date
                    ? new Date(record.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                {showStudent && (
                  <td className="px-6 py-4 text-sm text-slate-200">
                    {record.studentName || record.student?.name || "—"}
                  </td>
                )}
                <td className="px-6 py-4 text-sm text-slate-300">
                  {record.subject || "—"}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[record.status] || STATUS_STYLES.absent}`}>
                    {record.status || "absent"}
                  </span>
                </td>
                {record.percentage !== undefined && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            record.percentage >= ATTENDANCE_THRESHOLD
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${record.percentage}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-medium ${
                        record.percentage >= ATTENDANCE_THRESHOLD
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}>
                        {record.percentage}%
                      </span>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;