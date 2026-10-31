import { useCallback, useMemo, useRef, useState } from "react";
import Icon from "../components/ui/Icon";
import { ToastContext } from "./toastContextValue";

const STYLES = {
  success: { icon: "checkCircle", color: "var(--ax-success)" },
  error: { icon: "alert", color: "var(--ax-danger)" },
  info: { icon: "info", color: "var(--ax-blue)" },
};

/*
  Small toast notifications.
  const toast = useToast();  toast.success("Saved");  toast.error("Failed");
*/
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((type, message) => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((list) => [...list.slice(-3), { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const api = useMemo(() => ({
    success: (m) => show("success", m),
    error: (m) => show("error", m),
    info: (m) => show("info", m),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" style={{ position: "fixed", right: 16, top: "calc(var(--ax-nav-h) + 12px)", zIndex: 100, display: "flex", flexDirection: "column", gap: 10, maxWidth: "calc(100vw - 32px)" }}>
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.info;
          return (
            <div
              key={t.id}
              className="ax-fade-up"
              style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 260, maxWidth: 380, padding: "12px 14px", background: "#fff", border: "1px solid var(--ax-border)", borderLeft: `4px solid ${s.color}`, borderRadius: 12, boxShadow: "var(--ax-shadow-lg)", fontSize: 14, color: "var(--ax-text)" }}
            >
              <Icon name={s.icon} size={18} style={{ color: s.color }} />
              <span style={{ flex: 1 }}>{t.message}</span>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="ax-btn ax-btn-ghost ax-btn-sm" style={{ height: 24, padding: "0 6px" }}>
                <Icon name="x" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
