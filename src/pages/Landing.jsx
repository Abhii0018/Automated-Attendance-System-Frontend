import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useAuth from "../hooks/useAuth";
import { ROLE_REDIRECTS } from "../utils/constants";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: "Real-time Tracking",
    desc: "Mark and monitor attendance instantly with live updates across all dashboards.",
    color: "text-blue-400 bg-blue-400/10",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
    title: "Smart Analytics",
    desc: "Subject-wise breakdowns, trend analysis and low attendance alerts at a glance.",
    color: "text-emerald-400 bg-emerald-400/10",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    title: "Role-based Access",
    desc: "Secure JWT-powered system with tailored dashboards for Admins, Teachers and Students.",
    color: "text-amber-400 bg-amber-400/10",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    title: "Instant Alerts",
    desc: "Automatic warnings when attendance drops below the critical 75% threshold.",
    color: "text-rose-400 bg-rose-400/10",
  },
];

const ROLES = [
  {
    role: "Admin",
    border: "border-rose-500/30 hover:border-rose-500/50",
    dot: "bg-rose-500",
    badge: "bg-rose-400/10 text-rose-400 border-rose-400/20",
    perks: [
      "Manage all students",
      "View section analytics",
      "Monitor low attendance",
      "Create student accounts",
    ],
  },
  {
    role: "Teacher",
    border: "border-emerald-500/30 hover:border-emerald-500/50",
    dot: "bg-emerald-500",
    badge: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    perks: [
      "Mark attendance by section",
      "Filter by subject and date",
      "Track present / absent / late",
      "View class summary",
    ],
  },
  {
    role: "Student",
    border: "border-blue-500/30 hover:border-blue-500/50",
    dot: "bg-blue-500",
    badge: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    perks: [
      "View attendance percentage",
      "Subject-wise breakdown",
      "Low attendance warnings",
      "Personal profile",
    ],
  },
];

const Landing = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const taglineRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const ctaRef = useRef(null);
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);
  const featuresRef = useRef(null);

  // Redirect logged-in users straight to their dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      navigate(ROLE_REDIRECTS[user.role] || "/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    // Floating orbs
    gsap.to(orb1Ref.current, {
      x: 40, y: -30, duration: 8,
      repeat: -1, yoyo: true, ease: "sine.inOut",
    });
    gsap.to(orb2Ref.current, {
      x: -30, y: 40, duration: 10,
      repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1,
    });

    // Hero entrance
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(taglineRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 })
      .fromTo(titleRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.3")
      .fromTo(subRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.4")
      .fromTo(ctaRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.3");

    // Feature cards on scroll
    gsap.fromTo(
      ".feature-card",
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out",
        scrollTrigger: { trigger: featuresRef.current, start: "top 80%" },
      }
    );

    // Role cards on scroll
    gsap.fromTo(
      ".role-card",
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power3.out",
        scrollTrigger: { trigger: ".roles-section", start: "top 80%" },
      }
    );

    // Stats
    gsap.fromTo(
      ".stat-item",
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.7)",
        scrollTrigger: { trigger: ".stats-row", start: "top 85%" },
      }
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#06070a] overflow-hidden">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d0f14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <span className="font-bold text-lg text-white">AttendX</span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={ROLE_REDIRECTS[user?.role] || "/"}
                className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all duration-200"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:border-blue-500/50 text-slate-300 hover:text-white text-sm transition-all duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6 flex flex-col items-center text-center">
        {/* Orbs */}
        <div ref={orb1Ref} className="absolute top-24 left-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div ref={orb2Ref} className="absolute top-32 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div ref={taglineRef} className="opacity-0 mb-6">
          <span className="text-xs px-3 py-1.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-400/20 tracking-widest uppercase font-medium">
            ✦ Smart Attendance System
          </span>
        </div>

        <h1
          ref={titleRef}
          className="opacity-0 max-w-4xl font-extrabold text-5xl sm:text-6xl lg:text-7xl text-white leading-tight tracking-tight mb-6"
        >
          Attendance,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-violet-400">
            reimagined
          </span>
          <br />
          for modern schools.
        </h1>

        <p
          ref={subRef}
          className="opacity-0 max-w-xl text-slate-400 text-lg leading-relaxed mb-10"
        >
          A unified platform for admins, teachers and students. Track every
          session, spot trends early, and act before attendance becomes a problem.
        </p>

        <div ref={ctaRef} className="opacity-0 flex flex-col sm:flex-row items-center gap-4">
          {isAuthenticated ? (
            <Link
              to={ROLE_REDIRECTS[user?.role] || "/"}
              className="flex items-center gap-2 px-8 py-3.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 group"
            >
              Go to Dashboard
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="flex items-center gap-2 px-8 py-3.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 group"
              >
                Start for free
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                to="/login"
                className="px-8 py-3.5 rounded-lg border border-slate-700 hover:border-blue-500/50 text-slate-300 hover:text-white text-base transition-all duration-200"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="stats-row mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl w-full">
          {[
            { value: "99.9%", label: "Uptime" },
            { value: "<75ms", label: "Response" },
            { value: "3 Roles", label: "Access Tiers" },
            { value: "∞", label: "Students" },
          ].map((stat, i) => (
            <div key={i} className="stat-item opacity-0 bg-[#151820] border border-white/5 rounded-xl py-5 px-4 text-center">
              <div className="font-bold text-2xl text-white mb-1">{stat.value}</div>
              <div className="text-slate-500 text-xs uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-mono uppercase tracking-widest mb-4">
              Features
            </p>
            <h2 className="font-bold text-4xl text-white mb-4">
              Everything you need
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Built for institutions that take attendance seriously.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="feature-card opacity-0 bg-[#151820] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-5`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="roles-section py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-bold text-4xl text-white mb-4">
              One platform, three perspectives
            </h2>
            <p className="text-slate-400">
              Tailored experiences for every role in your institution.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {ROLES.map((r, i) => (
              <div
                key={i}
                className={`role-card opacity-0 bg-[#151820] border rounded-2xl p-7 transition-all duration-300 ${r.border}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-2.5 h-2.5 rounded-full ${r.dot}`} />
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${r.badge}`}>
                    {r.role}
                  </span>
                </div>
                <ul className="space-y-3">
                  {r.perks.map((p, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-slate-400">
                      <svg className="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="font-bold text-4xl text-white mb-5">
            Ready to take control?
          </h2>
          <p className="text-slate-400 mb-10">
            Join institutions already using AttendX to transform how they track attendance.
          </p>
          {isAuthenticated ? (
            <Link
              to={ROLE_REDIRECTS[user?.role] || "/"}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base transition-all duration-200 group"
            >
              Go to Dashboard
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base transition-all duration-200 group"
            >
              Create your account
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <span className="font-bold text-white text-sm">AttendX</span>
          </div>
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} AttendX. Smart Attendance System.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Landing;