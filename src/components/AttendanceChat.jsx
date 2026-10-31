import { useEffect, useRef, useState } from "react";
import useAuth from "../hooks/useAuth";
import attendanceService from "../services/attendanceService";
import { ATTENDANCE_THRESHOLD } from "../utils/constants";
import { Icon, ProgressBar } from "./ui";

const STARTERS = [
  "How many classes do I need to reach 75%?",
  "Which subject needs the most attention?",
  "How many classes can I safely miss?",
  "What's my overall attendance?",
];

const welcomeMessage = (name) => ({
  id: "welcome",
  role: "assistant",
  content: `Hi${name ? ` ${name.split(" ")[0]}` : ""}! I'm your attendance assistant. Ask me anything about your classes — like how many you need to reach ${ATTENDANCE_THRESHOLD}% in each subject.`,
  suggestions: STARTERS,
});

// Reveals text a few characters at a time, like someone typing
const prefersReducedMotion = () => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

const TypingText = ({ text, onDone }) => {
  const [reduced] = useState(prefersReducedMotion);
  const [shown, setShown] = useState(reduced ? text.length : 0);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(() => doneRef.current?.(), 0);
      return () => clearTimeout(t);
    }
    let i = 0;
    const step = Math.max(1, Math.round(text.length / 60));
    const timer = setInterval(() => {
      i = Math.min(text.length, i + step);
      setShown(i);
      if (i >= text.length) {
        clearInterval(timer);
        doneRef.current?.();
      }
    }, 16);
    return () => clearInterval(timer);
  }, [text, reduced]);

  return <>{text.slice(0, shown)}</>;
};

// One subject row inside an answer: name, %, bar and what to do
const SubjectFact = ({ s }) => {
  const low = s.percentage < ATTENDANCE_THRESHOLD;
  const badge = low
    ? { cls: "ax-badge-danger", text: `Attend ${s.classesNeededToReach75} more` }
    : s.classesSafeToSkip > 0
      ? { cls: "ax-badge-success", text: `Can miss ${s.classesSafeToSkip}` }
      : { cls: "ax-badge-warning", text: "At the limit" };

  return (
    <div style={{ background: "#fff", border: "1px solid var(--ax-border)", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 7 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ax-text)" }}>{s.subject}</span>
        <span className={`ax-badge ${badge.cls}`} style={{ height: 22, fontSize: 11 }}>{badge.text}</span>
      </div>
      <ProgressBar value={s.percentage} threshold={ATTENDANCE_THRESHOLD} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "var(--ax-muted)" }}>
        <span>{s.present}/{s.total} classes</span>
        <span style={{ fontWeight: 700, color: low ? "var(--ax-danger)" : "var(--ax-success)" }}>{s.percentage}%</span>
      </div>
    </div>
  );
};

/*
  Floating "Ask AI" chat for students.
  Answers come from the backend, which uses the student's real attendance numbers.
*/
const AttendanceChat = () => {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => [welcomeMessage(user?.name)]);
  const [typingId, setTypingId] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const nextId = useRef(1);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  });

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!isAuthenticated || user?.role !== "student") return null;

  const ask = async (text) => {
    const question = text.trim();
    if (!question || sending) return;

    // Earlier turns (without the welcome message) give the AI context for follow-ups
    const history = messages.filter((m) => m.id !== "welcome" && !m.error).map(({ role, content }) => ({ role, content }));
    setMessages((list) => [...list, { id: nextId.current++, role: "user", content: question }]);
    setInput("");
    setSending(true);

    try {
      const res = await attendanceService.askAttendanceQuestion(question, history);
      const data = res.data || {};
      const id = nextId.current++;
      setMessages((list) => [...list, { id, role: "assistant", content: data.answer, source: data.source, subjects: data.subjects || [], suggestions: data.suggestions || [] }]);
      setTypingId(id);
    } catch (err) {
      setMessages((list) => [
        ...list,
        { id: nextId.current++, role: "assistant", content: err.response?.data?.message || "Sorry, I couldn't answer that right now. Please try again.", error: true, suggestions: STARTERS.slice(0, 2) },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    ask(input);
  };

  const resetChat = () => {
    setMessages([welcomeMessage(user?.name)]);
    setTypingId(null);
  };

  const lastId = messages[messages.length - 1]?.id;

  return (
    <>
      <style>{`
        @keyframes ax-chat-pulse { 0% { box-shadow: 0 0 0 0 rgba(201,168,76,0.55); } 70% { box-shadow: 0 0 0 14px rgba(201,168,76,0); } 100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); } }
        @keyframes ax-chat-pop { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: none; } }
        @keyframes ax-chat-dot { 0%, 80%, 100% { opacity: 0.25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
        .ax-chat-fab { animation: ax-fade-up 0.4s var(--ax-ease) both, ax-chat-pulse 2.4s ease-out 1s 3; }
        .ax-chat-panel { animation: ax-chat-pop 0.28s var(--ax-ease) both; transform-origin: bottom right; }
        .ax-chat-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ax-muted); animation: ax-chat-dot 1.2s infinite ease-in-out; }
        .ax-chat-chip { border: 1px solid #ecdcae; background: var(--ax-gold-soft); color: #6b5012; border-radius: 999px; padding: 7px 12px; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; text-align: left; line-height: 1.35; transition: background-color .15s ease, transform .12s ease, border-color .15s ease; }
        .ax-chat-chip:hover { background: #f1e4bf; border-color: #e0c983; }
        .ax-chat-chip:active { transform: scale(0.97); }
      `}</style>

      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ax-btn ax-btn-primary ax-chat-fab"
          style={{ position: "fixed", right: 20, bottom: 20, zIndex: 70, height: 54, padding: "0 22px 0 16px", borderRadius: 999, boxShadow: "0 10px 30px rgba(11,21,48,0.3)", gap: 10, fontSize: 15 }}
          aria-label="Ask AI about your attendance"
        >
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(201,168,76,0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="sparkles" size={17} style={{ color: "var(--ax-gold-2)" }} />
          </span>
          Ask AI
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Attendance assistant"
          className="ax-card ax-chat-panel"
          style={{ position: "fixed", right: 20, bottom: 20, zIndex: 70, width: "min(410px, calc(100vw - 32px))", height: "min(620px, calc(100vh - 96px))", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--ax-shadow-lg)" }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 14px 14px 16px", background: "linear-gradient(120deg, var(--ax-navy), var(--ax-navy-2))", color: "#fff" }}>
            <span style={{ position: "relative", width: 38, height: 38, borderRadius: 12, background: "rgba(201,168,76,0.18)", color: "var(--ax-gold-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="sparkles" size={19} />
              <span style={{ position: "absolute", right: -2, bottom: -2, width: 11, height: 11, borderRadius: "50%", background: "#22c55e", border: "2px solid var(--ax-navy)" }} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>AttendX Assistant</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>Answers from your real attendance</div>
            </div>
            <button type="button" onClick={resetChat} title="New chat" aria-label="Start a new chat" className="ax-btn ax-btn-ghost ax-btn-sm" style={{ color: "rgba(255,255,255,0.8)", width: 32, padding: 0 }}>
              <Icon name="refresh" size={16} />
            </button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="ax-btn ax-btn-ghost ax-btn-sm" style={{ color: "#fff", width: 32, padding: 0 }}>
              <Icon name="x" size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} aria-live="polite" style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14, background: "var(--ax-surface-2)" }}>
            {messages.map((m) => {
              const mine = m.role === "user";
              const isTyping = m.id === typingId;
              const showExtras = !mine && !isTyping;
              return (
                <div key={m.id} className="ax-fade-up" style={{ alignSelf: mine ? "flex-end" : "stretch", maxWidth: mine ? "85%" : "100%", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  {!mine && (
                    <span style={{ width: 28, height: 28, borderRadius: 9, background: "linear-gradient(135deg, var(--ax-navy), var(--ax-navy-2))", color: "var(--ax-gold-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <Icon name="sparkles" size={14} />
                    </span>
                  )}
                  <div style={{ flex: mine ? "initial" : 1, minWidth: 0 }}>
                    <div
                      style={{
                        padding: "10px 13px",
                        borderRadius: mine ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                        background: mine ? "var(--ax-navy)" : m.error ? "var(--ax-danger-soft)" : "#fff",
                        color: mine ? "#fff" : m.error ? "#991b1b" : "var(--ax-text)",
                        border: mine ? "none" : "1px solid var(--ax-border)",
                        boxShadow: mine ? "0 4px 12px rgba(11,21,48,0.18)" : "var(--ax-shadow-sm)",
                        fontSize: 14,
                        lineHeight: 1.55,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {isTyping ? <TypingText text={m.content} onDone={() => setTypingId(null)} /> : m.content}
                    </div>

                    {showExtras && m.subjects?.length > 0 && (
                      <div className="ax-stagger" style={{ display: "grid", gap: 8, marginTop: 8 }}>
                        {m.subjects.map((s) => <SubjectFact key={s.subject} s={s} />)}
                      </div>
                    )}

                    {showExtras && m.source && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--ax-muted)", marginTop: 6 }}>
                        <Icon name={m.source === "ai" ? "sparkles" : "check"} size={12} />
                        {m.source === "ai" ? "Answered by Claude AI" : "Instant answer · calculated from your attendance"}
                      </div>
                    )}

                    {showExtras && m.id === lastId && !sending && m.suggestions?.length > 0 && (
                      <div className="ax-stagger" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                        {m.suggestions.map((q) => (
                          <button key={q} type="button" className="ax-chat-chip" onClick={() => ask(q)}>
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }} aria-label="Assistant is typing">
                <span style={{ width: 28, height: 28, borderRadius: 9, background: "linear-gradient(135deg, var(--ax-navy), var(--ax-navy-2))", color: "var(--ax-gold-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="sparkles" size={14} />
                </span>
                <div style={{ display: "flex", gap: 4, padding: "12px 14px", borderRadius: "4px 16px 16px 16px", background: "#fff", border: "1px solid var(--ax-border)" }}>
                  <span className="ax-chat-dot" />
                  <span className="ax-chat-dot" style={{ animationDelay: "0.15s" }} />
                  <span className="ax-chat-dot" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--ax-border)", background: "#fff" }}>
            <label htmlFor="ax-chat-input" className="sr-only">Ask about your attendance</label>
            <input
              id="ax-chat-input"
              ref={inputRef}
              className="ax-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Can I miss a DBMS class?"
              maxLength={500}
              disabled={sending}
              autoComplete="off"
              style={{ borderRadius: 999, paddingLeft: 16 }}
            />
            <button type="submit" className="ax-btn ax-btn-primary" disabled={sending || !input.trim()} aria-label="Send" style={{ width: 42, padding: 0, flexShrink: 0, borderRadius: "50%" }}>
              <Icon name="send" size={17} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AttendanceChat;
