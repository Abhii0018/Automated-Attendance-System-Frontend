import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import useAuth from "../hooks/useAuth";
import { ROLE_REDIRECTS } from "../utils/constants";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login, loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered === true;
  const cardRef = useRef(null);
  const orbRef = useRef(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const role = user.role.toLowerCase();
      navigate(ROLE_REDIRECTS[role] || "/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Animation
  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 30, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out" }
    );

    gsap.to(orbRef.current, {
      x: 30,
      y: -20,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      console.log("📤 Attempting login with:", form);

      const data = await login(form.email, form.password);

      console.log("✅ Login success:", data);

      const role = data?.user?.role?.toLowerCase();

      navigate(ROLE_REDIRECTS[role] || "/", { replace: true });

    } catch (err) {
      console.error("❌ Login error:", err);

      if (err.response) {
        setError(
          err.response.data?.message ||
          "Login failed due to server validation."
        );
      } else {
        setError(
          err.message ||
          "Network error. Please check your connection."
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#06070a] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background Orb */}
      <div
        ref={orbRef}
        className="absolute top-1/4 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"
      />

      <div ref={cardRef} className="w-full max-w-md opacity-0">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
                />
              </svg>
            </div>
            <span className="font-bold text-xl text-white">AttendX</span>
          </Link>

          <h1 className="font-bold text-2xl text-white">Welcome back</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#151820] border border-white/5 rounded-2xl p-8">

          {/* Success banner after registration */}
          {justRegistered && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Account created! Please sign in to continue.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Email address
              </label>
              <input
                type="email"
                className="w-full bg-[#0d0f14] border border-slate-700 focus:border-blue-500 text-slate-100 rounded-lg px-4 py-3 outline-none text-sm"
                placeholder="you@school.edu"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full bg-[#0d0f14] border border-slate-700 focus:border-blue-500 text-slate-100 rounded-lg px-4 py-3 outline-none text-sm"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold transition-all duration-200"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-400 hover:text-blue-300"
              >
                Create one
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;