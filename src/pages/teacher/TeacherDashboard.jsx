import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import useAuth from "../../hooks/useAuth";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const headerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      ".t-card",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power3.out" }
    );
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#06070a] pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div ref={headerRef} className="mb-8">
          <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-2">
            Teacher Dashboard
          </p>
          <h1 className="font-bold text-3xl text-white">
            Hello,{" "}
            <span className="text-emerald-400">
              {user?.name?.split(" ")[0]}
            </span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">{today}</p>
        </div>

        {/* Main Cards */}
        <div className="grid sm:grid-cols-2 gap-5 mb-6">

          {/* Mark Attendance CTA */}
          <Link
            to="/teacher/mark-attendance"
            className="t-card opacity-0 bg-[#151820] border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5 rounded-2xl p-7 transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-white mb-2">
              Mark Attendance
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Record today's attendance for your section quickly and efficiently.
            </p>
            <div className="mt-5 flex items-center gap-2 text-emerald-400 text-sm">
              Start marking
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </Link>

          {/* Today's Summary */}
          <div className="t-card opacity-0 bg-[#151820] border border-white/5 rounded-2xl p-7">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center mb-5">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-white mb-4">
              Today's Summary
            </h3>
            <div className="space-y-3">
              {[
                { label: "Sessions Marked", value: "2 / 4",           color: "text-blue-400"    },
                { label: "Total Students",  value: "42",               color: "text-white"       },
                { label: "Avg Attendance",  value: "86%",              color: "text-emerald-400" },
                { label: "Subjects Today",  value: "Math, Physics",    color: "text-slate-300"   },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
                >
                  <span className="text-slate-500 text-sm">{item.label}</span>
                  <span className={`text-sm font-medium ${item.color}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Classes Today",  value: "4",   color: "text-white"       },
            { label: "Present",        value: "36",  color: "text-emerald-400" },
            { label: "Absent",         value: "6",   color: "text-rose-400"    },
          ].map((s, i) => (
            <div
              key={i}
              className="t-card opacity-0 bg-[#151820] border border-white/5 rounded-xl p-4 text-center"
            >
              <div className={`font-bold text-2xl mb-1 ${s.color}`}>
                {s.value}
              </div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tip Card */}
        <div className="t-card opacity-0 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">Pro Tip</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Mark attendance within the first 10 minutes of class for
                accurate records. Students can be marked as present, absent,
                or late.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;