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
        setProfile(res.data || res.student || res);
      } catch {
        setProfile({
          name: user?.name || "Student",
          email: user?.email || "",
          rollNumber: "",
          section: "",
          phone: "",
          attendancePercentage: 0,
          joinedAt: null,
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
      gsap.fromTo(
        ".profile-chip",
        { opacity: 0, scale: 0.92 },
        { opacity: 1, scale: 1, stagger: 0.06, delay: 0.12, duration: 0.35, ease: "power2.out" }
      );
    }
  }, [loading]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 12% 15%, #dbeafe 0%, #f4f6fa 38%, #eef2ff 100%)", paddingTop: "64px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "34px", height: "34px", border: "3px solid #bfdbfe", borderTopColor: "#1d4ed8", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
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
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 12% 15%, #dbeafe 0%, #f4f6fa 38%, #eef2ff 100%)", paddingTop: "64px", fontFamily: "'Segoe UI','Inter',Arial,sans-serif" }}>
      <div style={{ width: "min(95vw, 1120px)", margin: "0 auto", padding: "32px 22px 44px" }}>

        {/* Header */}
        <div style={{ marginBottom: "22px" }}>
          <p style={{ color: "#1d4ed8", fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px" }}>
            Student
          </p>
          <h1 style={{ fontWeight: 900, fontSize: "42px", color: "#0a1628", margin: 0 }}>My Profile</h1>
        </div>

        <div ref={cardRef} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Avatar Card */}
          <div className="profile-card profile-hover-card" style={{ opacity: 0, background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "16px", padding: "22px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
            <div style={{ width: "76px", height: "76px", borderRadius: "16px", background: "linear-gradient(135deg, #0a1628, #102040)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontWeight: 800, fontSize: "30px", color: "#c9a84c" }}>
                {info.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "28px", color: "#0a1628", margin: 0 }}>{info.name}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                <span className="profile-chip" style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "999px", background: "#e0e7ff", color: "#1e40af", border: "1px solid #c7d2fe", fontWeight: 600 }}>
                  Student
                </span>
                {info.section && (
                  <span className="profile-chip" style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "999px", background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", fontWeight: 600 }}>
                    Section {info.section}
                  </span>
                )}
                {pct !== undefined && (
                  <span className="profile-chip" style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "999px", border: `1px solid ${isLow ? "#fecaca" : "#bbf7d0"}`, background: isLow ? "#fef2f2" : "#ecfdf5", color: isLow ? "#b91c1c" : "#166534", fontWeight: 700, fontFamily: "monospace" }}>
                    {pct}% Attendance
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Attendance Card */}
          <div className="profile-card profile-hover-card" style={{ opacity: 0, background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "16px", padding: "22px", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontWeight: 700, color: "#0a1628" }}>Attendance</span>
              <span style={{ fontFamily: "monospace", fontSize: "22px", fontWeight: 800, color: isLow ? "#dc2626" : "#16a34a" }}>
                {pct}%
              </span>
            </div>

            {/* Bar */}
            <div style={{ height: "11px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
              <div
                style={{ height: "100%", borderRadius: "999px", transition: "width 1s ease", background: isLow ? "#ef4444" : "#22c55e", width: `${pct}%` }}
              />
            </div>

            {/* Labels */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", fontSize: "11px", fontFamily: "monospace", color: "#64748b" }}>
              <span>0%</span>
              <span style={{ color: "#475569" }}>
                Required: {ATTENDANCE_THRESHOLD}%
              </span>
              <span>100%</span>
            </div>

            {/* Warning */}
            {isLow && (
              <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <svg style={{ width: "16px", height: "16px", color: "#dc2626", flexShrink: 0, marginTop: "2px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p style={{ color: "#b91c1c", fontSize: "12px", margin: 0 }}>
                  Your attendance is below {ATTENDANCE_THRESHOLD}%. Attend more classes to avoid exam restrictions.
                </p>
              </div>
            )}
          </div>

          {/* Info Fields */}
          <div className="profile-card profile-hover-card" style={{ opacity: 0, background: "rgba(255,255,255,0.82)", border: "1px solid rgba(255,255,255,0.65)", borderRadius: "16px", padding: "22px", boxShadow: "0 12px 28px rgba(10,22,40,0.1)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
            <h3 style={{ fontWeight: 700, color: "#0a1628", margin: "0 0 12px" }}>
              Personal Information
            </h3>
            <div style={{ borderTop: "1px solid #e2e8f0" }}>
              {fields.map((f, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i === fields.length - 1 ? "none" : "1px solid #e2e8f0" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#64748b" }}>
                    {f.icon}
                    <span style={{ fontSize: "14px" }}>{f.label}</span>
                  </div>
                  <span style={{ fontSize: "14px", color: f.mono ? "#1e40af" : "#0f172a", fontFamily: f.mono ? "monospace" : "inherit", fontWeight: f.mono ? 700 : 500 }}>
                    {f.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .profile-hover-card { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
        .profile-hover-card:hover { transform: translateY(-4px); box-shadow: 0 20px 36px rgba(10,22,40,.16); border-color: #93c5fd; }
      `}</style>
    </div>
  );
};

export default Profile;