const SIZES = { sm: 20, md: 32, lg: 48 };

const Spinner = ({ size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      border: `${size > 30 ? 3 : 2}px solid rgba(11,21,48,0.1)`,
      borderTopColor: "var(--ax-gold)",
      animation: "ax-spin 0.8s linear infinite",
    }}
  />
);

const Loader = ({ fullScreen = false, size = "md", text = "" }) => {
  if (fullScreen) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "var(--ax-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <span style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, var(--ax-gold-2), var(--ax-gold))", color: "var(--ax-navy)", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(201,168,76,0.35)" }}>
            AX
          </span>
          <Spinner size={28} />
          <p style={{ margin: 0, color: "var(--ax-muted)", fontSize: 13, fontWeight: 500 }}>{text || "Loading AttendX…"}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <Spinner size={SIZES[size] || SIZES.md} />
      {text && <p style={{ margin: 0, color: "var(--ax-muted)", fontSize: 13 }}>{text}</p>}
    </div>
  );
};

export default Loader;
