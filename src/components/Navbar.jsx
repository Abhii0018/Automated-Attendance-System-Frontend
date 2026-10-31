import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { Avatar, Icon } from "./ui";

const NAV_LINKS = {
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/admin/take-admission", label: "Admission", icon: "userPlus" },
    { to: "/admin/students", label: "Students", icon: "users" },
    { to: "/admin/teachers", label: "Teachers", icon: "teacher" },
    { to: "/admin/teacher-applications", label: "Applications", icon: "briefcase" },
    { to: "/admin/section-attendance", label: "Attendance", icon: "clipboard" },
  ],
  teacher: [
    { to: "/teacher/dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/teacher/mark-attendance", label: "Mark Attendance", icon: "clipboard" },
  ],
  student: [
    { to: "/student/dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/student/profile", label: "Profile", icon: "user" },
  ],
};

const ROLE_BADGE = {
  admin: "ax-badge-gold",
  teacher: "ax-badge-success",
  student: "ax-badge-info",
};

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMobileOpen(false);
    setMenuOpen(false);
  }

  // Close the profile menu when clicking outside it
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = user ? NAV_LINKS[user.role] || [] : [];
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const roleLabel = user?.isSuperAdmin ? "Super Admin" : user?.role;

  if (!isAuthenticated) return null;

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: "var(--ax-nav-h)",
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "saturate(180%) blur(14px)",
        WebkitBackdropFilter: "saturate(180%) blur(14px)",
        borderBottom: "1px solid var(--ax-border)",
        boxShadow: scrolled ? "0 4px 20px rgba(15,23,42,0.06)" : "none",
        transition: "box-shadow 0.2s ease",
      }}
    >
      <div style={{ width: "min(1280px, 100%)", margin: "0 auto", padding: "0 20px", height: "100%", display: "flex", alignItems: "center", gap: 16 }}>
        {/* Logo */}
        <Link to={`/${user?.role}/dashboard`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, var(--ax-gold-2), var(--ax-gold))", color: "var(--ax-navy)", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(201,168,76,0.35)" }}>
            AX
          </span>
          <span style={{ fontWeight: 800, fontSize: 17, color: "var(--ax-navy)", letterSpacing: "-0.02em" }}>AttendX</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex" style={{ alignItems: "center", gap: 2, marginLeft: 12, flex: 1, minWidth: 0 }}>
          {links.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 12px",
                  borderRadius: 9,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  color: active ? "var(--ax-navy)" : "var(--ax-muted)",
                  background: active ? "#eef1f8" : "transparent",
                  transition: "background-color 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "var(--ax-navy)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "var(--ax-muted)"; }}
              >
                <Icon name={link.icon} size={16} style={{ color: active ? "var(--ax-gold)" : "currentColor" }} />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {/* Profile menu */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="ax-btn ax-btn-ghost"
              style={{ height: 44, padding: "0 8px 0 6px", gap: 10 }}
            >
              <Avatar name={user?.name} size={32} />
              <span className="hidden sm:flex" style={{ flexDirection: "column", alignItems: "flex-start", lineHeight: 1.2 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ax-text)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</span>
                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ax-muted)", textTransform: "capitalize" }}>{roleLabel}</span>
              </span>
              <Icon name="chevronDown" size={16} style={{ color: "var(--ax-muted)", transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} />
            </button>

            {menuOpen && (
              <div role="menu" className="ax-card ax-fade-up" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 260, padding: 8, boxShadow: "var(--ax-shadow-lg)" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 8px 12px", borderBottom: "1px solid var(--ax-border)", marginBottom: 6 }}>
                  <Avatar name={user?.name} size={38} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ax-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ax-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
                    <span className={`ax-badge ${ROLE_BADGE[user?.role] || ""}`} style={{ marginTop: 6, height: 20, fontSize: 11, textTransform: "capitalize" }}>{roleLabel}</span>
                  </div>
                </div>
                <button type="button" role="menuitem" onClick={handleLogout} className="ax-btn ax-btn-ghost" style={{ width: "100%", justifyContent: "flex-start", color: "var(--ax-danger)" }}>
                  <Icon name="logout" size={16} /> Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="ax-btn ax-btn-ghost lg:hidden"
            style={{ width: 40, padding: 0 }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <Icon name={mobileOpen ? "x" : "menu"} size={20} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden ax-fade-up" style={{ background: "#fff", borderBottom: "1px solid var(--ax-border)", boxShadow: "var(--ax-shadow)", padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          {links.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: "none", color: active ? "var(--ax-navy)" : "var(--ax-text-2)", background: active ? "#eef1f8" : "transparent" }}
              >
                <Icon name={link.icon} size={18} style={{ color: active ? "var(--ax-gold)" : "var(--ax-muted)" }} />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
