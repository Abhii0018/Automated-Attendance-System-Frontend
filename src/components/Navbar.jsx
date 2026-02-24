import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import useAuth from "../hooks/useAuth";

const NAV_LINKS = {
  admin: [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/take-admission", label: "Take Admission" },
    { to: "/admin/students", label: "Students" },
    { to: "/admin/section-attendance", label: "Section" },
  ],

  teacher: [
    { to: "/teacher/dashboard", label: "Dashboard" },
    { to: "/teacher/mark-attendance", label: "Mark Attendance" },
  ],
  student: [
    { to: "/student/dashboard", label: "Dashboard" },
    { to: "/student/profile", label: "Profile" },
  ],
};

const ROLE_BADGE = {
  admin: "bg-rose-500/10 text-rose-400 border border-rose-400/20",
  teacher: "bg-emerald-500/10 text-emerald-400 border border-emerald-400/20",
  student: "bg-blue-500/10 text-blue-400 border border-blue-400/20",
};

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(
        navRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = user ? NAV_LINKS[user.role] || [] : [];
  const isActive = (path) => location.pathname === path;

  if (!isAuthenticated) return null;

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 bg-[#0d0f14]/80 backdrop-blur-xl border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to={`/${user?.role}/dashboard`}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              AttendX
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(link.to)
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${ROLE_BADGE[user?.role]}`}>
                {user?.role}
              </span>
              <span className="text-slate-400 text-sm truncate max-w-[120px]">
                {user?.name}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-all duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:block">Logout</span>
            </button>

            {/* Mobile Toggle */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 py-3 flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(link.to)
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;