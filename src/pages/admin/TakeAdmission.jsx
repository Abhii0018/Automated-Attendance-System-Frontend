import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import studentService from "../../services/studentService";
import { PageHeader, Alert, Icon, Avatar } from "../../components/ui";
import useToast from "../../hooks/useToast";
import { SECTIONS, SEMESTERS } from "../../utils/constants";

// ─── Form model & validation ────────────────────────────────────────────────
const EMPTY_FORM = {
  name: "",
  department: "Computer Science",
  parentEmail: "",
  parentPhone: "",
};

const FIELD_ORDER = ["name", "department", "parentEmail", "parentPhone"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirrors the backend validator: name & department required, valid email, phone ≥ 10 characters.
const validate = (f) => {
  const e = {};
  if (!f.name.trim()) e.name = "Enter the student's full name.";
  if (!f.department.trim()) e.department = "Department is required.";
  const email = f.parentEmail.trim();
  if (!email) e.parentEmail = "Parent email is required for attendance notifications.";
  else if (!EMAIL_RE.test(email)) e.parentEmail = "Enter a valid email address, e.g. name@example.com.";
  const phone = f.parentPhone.trim();
  if (!phone) e.parentPhone = "Parent phone is required.";
  else if (phone.length < 10) e.parentPhone = `Phone number must be at least 10 digits (${phone.length}/10).`;
  return e;
};

const apiErrorMessage = (err) =>
  err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message || "Something went wrong.";

// ─── Small local building blocks ────────────────────────────────────────────
const Field = ({ id, label, required, hint, error, children }) => (
  <div style={{ minWidth: 0 }}>
    <label htmlFor={id} className="ax-label">
      {label}
      {required && (
        <span aria-hidden="true" style={{ color: "var(--ax-danger)", marginLeft: 3 }}>*</span>
      )}
    </label>
    {children}
    {error ? (
      <p id={`${id}-error`} className="ax-help ax-fade-up" style={{ color: "var(--ax-danger)", display: "flex", gap: 6, alignItems: "flex-start" }}>
        <Icon name="alert" size={13} style={{ marginTop: 1 }} />
        <span>{error}</span>
      </p>
    ) : hint ? (
      <p id={`${id}-hint`} className="ax-help">{hint}</p>
    ) : null}
  </div>
);

const IconInput = ({ icon, valid, ...props }) => (
  <div style={{ position: "relative" }}>
    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ax-muted)", display: "inline-flex", pointerEvents: "none" }}>
      <Icon name={icon} size={16} />
    </span>
    <input className="ax-input" style={{ paddingLeft: 38, paddingRight: valid ? 36 : 12 }} {...props} />
    {valid && (
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ax-success)", display: "inline-flex", pointerEvents: "none" }}>
        <Icon name="check" size={16} />
      </span>
    )}
  </div>
);

const FormSection = ({ step, icon, title, subtitle, children }) => (
  <section className="ax-card ax-card-pad" aria-labelledby={`section-${step}`}>
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 18 }}>
      <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--ax-blue-soft)", color: "var(--ax-blue)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={icon} size={18} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ax-muted)" }}>Step {step}</div>
        <h2 id={`section-${step}`} className="ax-section-title">{title}</h2>
        {subtitle && <p className="ax-section-sub">{subtitle}</p>}
      </div>
    </div>
    {children}
  </section>
);

const SummaryRow = ({ label, value, placeholder, mono }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, padding: "9px 0", borderBottom: "1px solid var(--ax-border)", fontSize: 13 }}>
    <span style={{ color: "var(--ax-muted)", flexShrink: 0 }}>{label}</span>
    {value ? (
      <span style={{ color: "var(--ax-text)", fontWeight: 600, textAlign: "right", overflowWrap: "anywhere", minWidth: 0, fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined, letterSpacing: mono ? "0.06em" : undefined }}>
        {value}
      </span>
    ) : (
      <span style={{ color: "var(--ax-muted)", fontStyle: "italic", textAlign: "right" }}>{placeholder}</span>
    )}
  </div>
);

const PlacementTile = ({ icon, label, value, note }) => (
  <div style={{ border: "1px solid var(--ax-border)", background: "var(--ax-surface-2)", borderRadius: 12, padding: 14, minWidth: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ax-muted)", fontSize: 12, fontWeight: 600 }}>
      <Icon name={icon} size={14} /> {label}
    </div>
    <div style={{ marginTop: 6, fontWeight: 700, color: "var(--ax-text)", fontSize: 15 }}>{value}</div>
    {note && <div style={{ marginTop: 2, fontSize: 12, color: "var(--ax-muted)" }}>{note}</div>}
  </div>
);

// ─── Page ───────────────────────────────────────────────────────────────────
const TakeAdmission = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const formRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null); // holds result object
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const errors = useMemo(() => validate(form), [form]);
  const validCount = FIELD_ORDER.filter((k) => !errors[k]).length;
  const isReady = validCount === FIELD_ORDER.length;

  const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));
  const touch = (k) => () => setTouched((prev) => ({ ...prev, [k]: true }));
  const showError = (k) => ((touched[k] || attempted) && errors[k]) || "";

  const inputProps = (k, id) => {
    const err = showError(k);
    return {
      id,
      name: k,
      value: form[k],
      onChange: set(k),
      onBlur: touch(k),
      required: true,
      "aria-required": "true",
      "aria-invalid": err ? "true" : "false",
      "aria-describedby": err ? `${id}-error` : `${id}-hint`,
      valid: !errors[k] && (touched[k] || attempted),
      disabled: submitting,
    };
  };

  const resetForm = () => {
    setSuccess(null);
    setForm(EMPTY_FORM);
    setTouched({});
    setAttempted(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttempted(true);

    const firstInvalid = FIELD_ORDER.find((k) => errors[k]);
    if (firstInvalid) {
      formRef.current?.querySelector(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setError(""); setSubmitting(true);

    try {
      // Step 1 — Create student record
      const createRes = await studentService.createStudent({
        name: form.name.trim(),
        department: form.department.trim(),
        parentEmail: form.parentEmail.trim(),
        parentPhone: form.parentPhone.trim(),
      });

      const student = createRes.data;

      setSuccess({
        name: student.name,
        registrationNumber: student.registrationNumber,
        section: student.assignedSection,
        semester: student.assignedSemester,
        rollNumber: student.assignedRollNumber,
        department: student.department,
        parentEmail: student.parentEmail,
      });
      toast.success(`${student.name} admitted · Reg. No. ${student.registrationNumber}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg = apiErrorMessage(err);
      setError(msg);
      toast.error("Admission failed. Please review the error and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyRegNo = async () => {
    try {
      await navigator.clipboard.writeText(String(success.registrationNumber));
      toast.success("Registration number copied");
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  const backLink = (
    <nav aria-label="Breadcrumb" className="ax-fade-up" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ax-muted)", marginBottom: 14, flexWrap: "wrap" }}>
      <Link to="/admin/dashboard" className="ax-btn ax-btn-ghost ax-btn-sm" style={{ paddingLeft: 8, marginLeft: -8 }}>
        <Icon name="arrowLeft" size={15} /> Dashboard
      </Link>
      <Icon name="chevronRight" size={14} />
      <span aria-current="page" style={{ color: "var(--ax-text-2)", fontWeight: 600 }}>Student admission</span>
    </nav>
  );

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) return (
    <div className="ax-page">
      <div className="ax-container">
        {backLink}
        <div className="ax-card ax-fade-up" style={{ maxWidth: 560, margin: "8px auto 0", overflow: "hidden" }}>
          <div className="ax-hero" style={{ borderRadius: 0, textAlign: "center", padding: "32px 24px" }}>
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, margin: "0 auto 14px", background: "rgba(201,168,76,0.16)", border: "1px solid rgba(201,168,76,0.4)", color: "var(--ax-gold-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="checkCircle" size={30} />
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" }}>Admission successful</h1>
              <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                {success.name} has been admitted and assigned to a section.
              </p>
            </div>
          </div>

          <div className="ax-card-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ border: "1px dashed var(--ax-gold)", background: "var(--ax-gold-soft)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7a5c12" }}>Registration number</div>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "0.12em", color: "var(--ax-navy)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", overflowWrap: "anywhere" }}>
                  {success.registrationNumber}
                </div>
              </div>
              <button type="button" onClick={copyRegNo} className="ax-btn ax-btn-secondary ax-btn-sm">
                <Icon name="clipboard" size={15} /> Copy
              </button>
            </div>

            <div>
              <SummaryRow label="Student name" value={success.name} />
              {success.department && <SummaryRow label="Department" value={success.department} />}
              <SummaryRow label="Semester" value={success.semester != null ? `Semester ${success.semester}` : ""} placeholder="—" />
              <SummaryRow label="Section" value={success.section} placeholder="—" />
              <SummaryRow label="Roll number" value={success.rollNumber != null ? String(success.rollNumber) : ""} placeholder="—" />
              {success.parentEmail && <SummaryRow label="Parent email" value={success.parentEmail} />}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <button type="button" onClick={resetForm} className="ax-btn ax-btn-primary ax-btn-lg" style={{ width: "100%" }}>
                <Icon name="userPlus" size={17} /> Admit another student
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                <button type="button" onClick={() => navigate("/admin/students")} className="ax-btn ax-btn-secondary">
                  <Icon name="users" size={16} /> View students
                </button>
                <Link to="/admin/dashboard" className="ax-btn ax-btn-ghost">
                  Back to dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Main form ───────────────────────────────────────────────────────────────
  const pct = Math.round((validCount / FIELD_ORDER.length) * 100);

  return (
    <div className="ax-page">
      <div className="ax-container">
        {backLink}
        <PageHeader
          eyebrow="Admin workspace"
          title="Student admission"
          subtitle="Fill in the details below. A unique registration number, section and roll number are generated automatically."
          actions={
            <Link to="/admin/students" className="ax-btn ax-btn-secondary">
              <Icon name="users" size={16} /> View students
            </Link>
          }
        />

        {error && (
          <div style={{ marginBottom: 20 }}>
            <Alert tone="danger" title="Couldn't complete admission" onClose={() => setError("")}>
              {error}
            </Alert>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
          <form id="admission-form" ref={formRef} onSubmit={handleSubmit} noValidate className="ax-stagger" style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>

            <FormSection step={1} icon="user" title="Student details" subtitle="Basic identity of the student being admitted.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="adm-name" label="Full name" required hint="As it should appear on attendance records." error={showError("name")}>
                  <IconInput icon="user" type="text" placeholder="e.g. Arjun Sharma" autoComplete="off" {...inputProps("name", "adm-name")} />
                </Field>
                <Field id="adm-dept" label="Department" required hint="Defaults to Computer Science." error={showError("department")}>
                  <IconInput icon="building" type="text" placeholder="e.g. Computer Science" {...inputProps("department", "adm-dept")} />
                </Field>
              </div>
            </FormSection>

            <FormSection step={2} icon="shield" title="Parent / guardian contact" subtitle="Used for automatic attendance notifications.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="adm-email" label="Parent email" required hint="Attendance alerts are emailed here." error={showError("parentEmail")}>
                  <IconInput icon="mail" type="email" inputMode="email" placeholder="parent@example.com" autoComplete="off" {...inputProps("parentEmail", "adm-email")} />
                </Field>
                <Field id="adm-phone" label="Parent phone" required hint="At least 10 digits." error={showError("parentPhone")}>
                  <IconInput icon="phone" type="tel" inputMode="tel" placeholder="9876543210" minLength={10} autoComplete="off" {...inputProps("parentPhone", "adm-phone")} />
                </Field>
              </div>
            </FormSection>

            <FormSection step={3} icon="layers" title="Academic placement" subtitle="Section and roll number are assigned automatically by system policy.">
              <div className="grid gap-3 sm:grid-cols-3">
                <PlacementTile icon="hash" label="Registration no." value="Auto-generated" note="1 + year (YY) + 5-digit sequence" />
                <PlacementTile icon="calendar" label="Semester" value={`Semester ${SEMESTERS[0]}`} note="New admissions" />
                <PlacementTile icon="users" label="Section" value={SECTIONS.join(" / ")} note="Next free roll number" />
              </div>
              <div style={{ marginTop: 14 }}>
                <Alert tone="warning">
                  First 20 admissions go to <strong>{SECTIONS[0]}</strong>, then new admissions are balanced between <strong>{SECTIONS[0]}</strong> and <strong>{SECTIONS[1]}</strong>.
                </Alert>
              </div>
            </FormSection>
          </form>

          {/* ── Live summary ─────────────────────────────────────────────── */}
          <aside className="ax-card ax-card-pad ax-fade-up lg:sticky lg:top-[88px]" aria-labelledby="admission-summary-title" style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
              <h2 id="admission-summary-title" className="ax-section-title">Admission preview</h2>
              <span className={`ax-badge ${isReady ? "ax-badge-success" : "ax-badge-gold"}`}>
                {isReady ? "Ready" : "Draft"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, minWidth: 0 }}>
              <Avatar name={form.name || "?"} size={46} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: form.name.trim() ? "var(--ax-text)" : "var(--ax-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {form.name.trim() || "New student"}
                </div>
                <div style={{ fontSize: 13, color: "var(--ax-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {form.department.trim() || "No department"}
                </div>
              </div>
            </div>

            <div>
              <SummaryRow label="Parent email" value={form.parentEmail.trim()} placeholder="Not entered" />
              <SummaryRow label="Parent phone" value={form.parentPhone.trim()} placeholder="Not entered" />
              <SummaryRow label="Registration no." placeholder="Generated on submit" />
              <SummaryRow label="Section / roll" placeholder="Assigned on submit" />
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ax-muted)", marginBottom: 6 }}>
                <span>Required fields</span>
                <span style={{ fontWeight: 600, color: "var(--ax-text-2)" }}>{validCount}/{FIELD_ORDER.length} complete</span>
              </div>
              <div className="ax-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Form completion">
                <span style={{ width: `${pct}%`, background: isReady ? "var(--ax-success)" : "linear-gradient(90deg, var(--ax-gold-2), var(--ax-gold))" }} />
              </div>
            </div>

            <button type="submit" form="admission-form" disabled={submitting} aria-busy={submitting} className="ax-btn ax-btn-primary ax-btn-lg" style={{ width: "100%", marginTop: 18, whiteSpace: "normal" }}>
              {submitting ? (
                <><span className="ax-spinner" aria-hidden="true" /> Processing…</>
              ) : (
                <>Admit student &amp; assign section <Icon name="arrowRight" size={16} /></>
              )}
            </button>
            <p className="ax-help" style={{ textAlign: "center", marginTop: 10 }}>
              The registration number is shown once the record is saved.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TakeAdmission;
