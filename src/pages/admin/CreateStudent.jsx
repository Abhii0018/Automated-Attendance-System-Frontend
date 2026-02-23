import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import studentService from "../../services/studentService";
import { SECTIONS } from "../../utils/constants";

const CreateStudent = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    rollNumber: "",
    section: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const cardRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
    );
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await studentService.createStudent(form);
      setSuccess(true);
      gsap.fromTo(
        ".success-box",
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.5)" }
      );
      setTimeout(() => navigate("/admin/students"), 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create student.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-[#0d0f14] border border-slate-700 focus:border-blue-500 text-slate-100 placeholder-slate-600 rounded-lg px-4 py-3 outline-none transition-all duration-200 text-sm";

  if (success) {
    return (
      <div className="min-h-screen bg-[#06070a] pt-16 flex items-center justify-center">
        <div className="success-box bg-[#151820] border border-white/5 rounded-2xl p-12 text-center max-w-sm w-full mx-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-bold text-xl text-white mb-2">Student Created!</h2>
          <p className="text-slate-400 text-sm">Redirecting to student list…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06070a] pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-2">
            Admin
          </p>
          <h1 className="font-bold text-3xl text-white">Create Student</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Add a new student to the system.
          </p>
        </div>

        <div
          ref={cardRef}
          className="opacity-0 bg-[#151820] border border-white/5 rounded-2xl p-8"
        >
          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Row 1 */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  className={inputClass}
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Email <span className="text-rose-400">*</span>
                </label>
                <input
                  className={inputClass}
                  type="email"
                  name="email"
                  placeholder="student@school.edu"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Roll Number <span className="text-rose-400">*</span>
                </label>
                <input
                  className={inputClass}
                  type="text"
                  name="rollNumber"
                  placeholder="CS2024001"
                  value={form.rollNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Section <span className="text-rose-400">*</span>
                </label>
                <select
                  className={`${inputClass} appearance-none`}
                  name="section"
                  value={form.section}
                  onChange={handleChange}
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
            </div>

            {/* Row 3 */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Password <span className="text-rose-400">*</span>
                </label>
                <input
                  className={inputClass}
                  type="password"
                  name="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Phone
                </label>
                <input
                  className={inputClass}
                  type="tel"
                  name="phone"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create Student"
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/students")}
                className="px-6 py-3 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-sm transition-all duration-200"
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateStudent;