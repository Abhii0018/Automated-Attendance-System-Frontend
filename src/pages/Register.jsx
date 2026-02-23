import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import useAuth from "../hooks/useAuth";
import { ROLE_REDIRECTS, SECTIONS } from "../utils/constants";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    section: "",
  });
  const [error, setError] = useState("");
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const orbRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }
    );
    gsap.to(orbRef.current, {
      x: -30, y: 20, duration: 7,
      repeat: -1, yoyo: true, ease: "sine.inOut",
    });
  }, []);


const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  // 🔐 Frontend validation (match backend rules)
  if (form.password.length < 8) {
    setError("Password must be at least 8 characters.");
    return;
  }

  if (!/[A-Z]/.test(form.password)) {
    setError("Password must contain at least one uppercase letter.");
    return;
  }

  if (form.role === "student" && !form.section) {
    setError("Please select a section.");
    return;
  }

  try {
    const payload = { ...form };

    if (form.role !== "student") {
      delete payload.section;
    }

    console.log("📤 Sending payload:", payload);

    const data = await register(payload);

    console.log("✅ Register success:", data);

    // Safe navigation
    const role = data?.user?.role?.toLowerCase();
    navigate(ROLE_REDIRECTS[role] || "/", { replace: true });

  } catch (err) {
    console.error("❌ Full register error:", err);

    if (err.response) {
      console.error("📥 Server response:", err.response.data);

      if (err.response.data?.errors) {
        setError(
          err.response.data.errors.map(e => e.msg).join(", ")
        );
      } else {
        setError(
          err.response.data?.message ||
          "Registration failed due to server validation."
        );
      }
    } else {
      // Network error or server unreachable
      setError(
        err.message ||
        "Unexpected network error during registration."
      );
    }
  }
};

  return (
    <div className="min-h-screen bg-[#06070a] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Orb */}
      <div
        ref={orbRef}
        className="absolute top-1/3 right-1/4 w-80 h-80 bg-violet-500/8 rounded-full blur-[100px] pointer-events-none"
      />

      <div ref={cardRef} className="w-full max-w-md opacity-0">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <span className="font-bold text-xl text-white">AttendX</span>
          </Link>
          <h1 className="font-bold text-2xl text-white">Create account</h1>
          <p className="text-slate-500 mt-2 text-sm">Join AttendX today</p>
        </div>

        {/* Card */}
        <div className="bg-[#151820] border border-white/5 rounded-2xl p-8">

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Full name
              </label>
              <input
                type="text"
                className="w-full bg-[#0d0f14] border border-slate-700 focus:border-blue-500 text-slate-100 placeholder-slate-600 rounded-lg px-4 py-3 outline-none transition-all duration-200 text-sm"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full bg-[#0d0f14] border border-slate-700 focus:border-blue-500 text-slate-100 placeholder-slate-600 rounded-lg px-4 py-3 outline-none transition-all duration-200 text-sm"
                placeholder="you@school.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full bg-[#0d0f14] border border-slate-700 focus:border-blue-500 text-slate-100 placeholder-slate-600 rounded-lg px-4 py-3 outline-none transition-all duration-200 text-sm"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Role
              </label>
              <select
                className="w-full bg-[#0d0f14] border border-slate-700 focus:border-blue-500 text-slate-100 rounded-lg px-4 py-3 outline-none transition-all duration-200 text-sm appearance-none"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Section — only for students */}
            {form.role === "student" && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Section
                </label>
                <select
                  className="w-full bg-[#0d0f14] border border-slate-700 focus:border-blue-500 text-slate-100 rounded-lg px-4 py-3 outline-none transition-all duration-200 text-sm appearance-none"
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  required
                >
                  <option value="">Select section</option>
                  {SECTIONS.map((s) => (
                    <option key={s} value={s}>
                      Section {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;