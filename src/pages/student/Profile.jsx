import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import useAuth from "../../hooks/useAuth";
import studentService from "../../services/studentService";
import { ATTENDANCE_THRESHOLD } from "../../utils/constants";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await studentService.getMyProfile();
        setProfile(res.student || res);
      } catch {
        // Mock fallback
        setProfile({
          name:                user?.name  || "Student",
          email:               user?.email || "student@school.edu",
          rollNumber:          "CS2024001",
          section:             "A",
          phone:               "+91 9876543210",
          attendancePercentage: 72,
          joinedAt:            new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!loading && cardRef.current) {
      gsap.fromTo(
        ".profile-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06070a] pt-16 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const info  = profile || {};
  const pct   = info.attendancePercentage ?? 0;
  const isLow = pct < ATTENDANCE_THRESHOLD;

  const fields = [
    {
      label: "Full Name",
      value: info.name,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      label: "Email",
      value: info.email,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      label: "Roll Number",
      value: info.rollNumber,
      mono:  true,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
          />
        </svg>
      ),
    },
    {
      label: "Section",
      value: info.section ? `Section ${info.section}` : "—",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      label: "Phone",
      value: info.phone || "Not provided",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      ),
    },
    {
      label: "Member Since",
      value: info.joinedAt
        ? new Date(info.joinedAt).toLocaleDateString("en-IN", {
            day:   "2-digit",
            month: "long",
            year:  "numeric",
          })
        : "—",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#06070a] pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-1">
            Student
          </p>
          <h1 className="font-bold text-3xl text-white">My Profile</h1>
        </div>

        <div ref={cardRef} className="space-y-5">

          {/* Avatar Card */}
          <div className="profile-card opacity-0 bg-[#151820] border border-white/5 rounded-2xl p-6 flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-3xl text-white">
                {info.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <h2 className="font-bold text-2xl text-white">{info.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-400/20">
                  Student
                </span>
                {info.section && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Section {info.section}
                  </span>
                )}
                {pct !== undefined && (
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-mono ${
                    isLow
                      ? "bg-rose-400/10 text-rose-400 border-rose-400/20"
                      : "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                  }`}>
                    {pct}% Attendance
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Attendance Card */}
          <div className="profile-card opacity-0 bg-[#151820] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-white">Attendance</span>
              <span className={`font-mono text-lg font-bold ${
                isLow ? "text-rose-400" : "text-emerald-400"
              }`}>
                {pct}%
              </span>
            </div>

            {/* Bar */}
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isLow ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Labels */}
            <div className="flex items-center justify-between mt-2 text-xs font-mono text-slate-600">
              <span>0%</span>
              <span className="text-slate-500">
                Required: {ATTENDANCE_THRESHOLD}%
              </span>
              <span>100%</span>
            </div>

            {/* Warning */}
            {isLow && (
              <div className="mt-4 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
                <svg className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-rose-400/80 text-xs">
                  Your attendance is below the 75% threshold. Please attend
                  more classes to avoid being barred from exams.
                </p>
              </div>
            )}
          </div>

          {/* Info Fields */}
          <div className="profile-card opacity-0 bg-[#151820] border border-white/5 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">
              Personal Information
            </h3>
            <div className="divide-y divide-white/5">
              {fields.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 text-slate-500">
                    {f.icon}
                    <span className="text-sm">{f.label}</span>
                  </div>
                  <span className={`text-sm ${
                    f.mono
                      ? "font-mono text-blue-400"
                      : "text-slate-200"
                  }`}>
                    {f.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;