import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import studentService from "../../services/studentService";
import StudentCard from "../../components/StudentCard";
import Loader from "../../components/Loader";
import { SECTIONS } from "../../utils/constants";

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionSearch, setSectionSearch] = useState("");
  const [regSearch, setRegSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await studentService.getAllStudents();
        setStudents(res.data || res.students || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load students.");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!loading) {
      const hasCards = document.querySelectorAll(".student-card-item, .section-card-item").length > 0;
      if (!hasCards) return;
      gsap.fromTo(
        ".section-card-item, .student-card-item",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.06, duration: 0.45, ease: "power3.out" }
      );
    }
  }, [loading, sectionSearch, selectedSection, regSearch]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await studentService.deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch {
      alert("Failed to delete student.");
    }
  };

  const handleLinkUser = async (student) => {
    const email = window.prompt(`Enter verified student account email for ${student.name}:`);
    if (!email) return;
    try {
      await studentService.linkStudentUser(student._id, email.trim());
      const res = await studentService.getAllStudents();
      setStudents(res.data || res.students || []);
      alert("Student linked successfully.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to link student.");
    }
  };

  const sectionMap = students.reduce((acc, s) => {
    const section = (s.section || "UNASSIGNED").toUpperCase();
    acc[section] = (acc[section] || 0) + 1;
    return acc;
  }, {});

  const dynamicSections = Object.entries(sectionMap)
    .map(([section, count]) => ({ section, count }))
    .sort((a, b) => a.section.localeCompare(b.section));

  const allSections = SECTIONS.map((section) => {
    const found = dynamicSections.find((s) => s.section === section);
    return found || { section, count: 0 };
  });

  const visibleSections = allSections.filter((s) =>
    s.section.toLowerCase().includes(sectionSearch.toLowerCase())
  );

  const sectionStudents = selectedSection
    ? students.filter((s) => String(s.section || "").trim().toUpperCase() === selectedSection)
    : [];

  const registrationResults = regSearch.trim()
    ? students.filter((s) => {
        const reg = (s.registrationNumber || "").toLowerCase();
        return reg.includes(regSearch.trim().toLowerCase());
      })
    : [];

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_15%,#dbeafe_0%,#f4f6fa_38%,#eef2ff_100%)] pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-blue-700 text-xs font-semibold uppercase tracking-[0.2em] mb-1">
              Admin
            </p>
            <h1 className="font-bold text-3xl text-slate-900">Students</h1>
            <p className="text-slate-500 text-sm mt-1">Browse by section or search by registration number</p>
          </div>
          <Link
            to="/admin/create-student"
            className="self-start flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white font-semibold text-sm transition-all duration-200 shadow-[0_10px_20px_rgba(10,22,40,0.18)] hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Student
          </Link>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              className="w-full bg-white/80 backdrop-blur-md border border-white/60 focus:border-blue-300 text-slate-900 placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 outline-none transition-all duration-200 text-sm shadow-[0_8px_20px_rgba(10,22,40,0.08)]"
              placeholder="Search section (A, B, C...)"
              value={sectionSearch}
              onChange={(e) => setSectionSearch(e.target.value)}
            />
          </div>
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l6 6M4 11a7 7 0 1114 0A7 7 0 014 11z" />
            </svg>
            <input
              className="w-full bg-white/80 backdrop-blur-md border border-white/60 focus:border-blue-300 text-slate-900 placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 outline-none transition-all duration-200 text-sm shadow-[0_8px_20px_rgba(10,22,40,0.08)]"
              placeholder="Search student by registration number..."
              value={regSearch}
              onChange={(e) => setRegSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Section chips/cards */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-900 font-semibold text-lg">All Sections</h2>
            <span className="text-xs text-slate-500">
              {allSections.length} section{allSections.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="mb-3 text-xs text-slate-600 bg-white/70 border border-white/60 rounded-xl px-3 py-2">
            Auto policy: first 20 students go to PA, then new admissions are balanced between PA and PB.
          </div>
          {visibleSections.length === 0 ? (
            <div className="text-sm text-slate-500 bg-white/70 border border-white/60 rounded-xl px-4 py-3">
              No section matches your search.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {visibleSections.map((item) => {
                const active = selectedSection === item.section;
                return (
                  <button
                    key={item.section}
                    onClick={() => setSelectedSection(item.section)}
                    className={`section-card-item opacity-0 text-left rounded-xl px-4 py-3 border transition-all ${
                      active
                        ? "bg-blue-600 text-white border-blue-600 shadow-[0_10px_20px_rgba(37,99,235,0.35)]"
                        : "bg-white/80 border-white/60 hover:border-blue-300 text-slate-800 shadow-[0_8px_20px_rgba(10,22,40,0.08)]"
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wide opacity-80">Section</div>
                    <div className="font-bold text-xl leading-tight mt-1">{item.section}</div>
                    <div className={`text-xs mt-1 ${active ? "text-blue-100" : "text-slate-500"}`}>
                      {item.count} student{item.count !== 1 ? "s" : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!!regSearch.trim() && (
          <div className="mb-6 bg-white/80 border border-white/60 rounded-2xl p-4 backdrop-blur-md shadow-[0_10px_24px_rgba(10,22,40,0.09)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 text-sm">Registration Search Result</h3>
              <span className="text-xs text-slate-500">
                {registrationResults.length} match{registrationResults.length !== 1 ? "es" : ""}
              </span>
            </div>
            {registrationResults.length === 0 ? (
              <p className="text-sm text-slate-500">No student found for this registration number.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {registrationResults.slice(0, 9).map((student) => (
                  <div key={`reg-${student._id}`} className="student-card-item opacity-0 will-change-transform">
                    <StudentCard student={student} onDelete={handleDelete} onLinkUser={handleLinkUser} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-5 text-sm text-rose-400">{error}</div>
        )}

        {/* Section students */}
        {!selectedSection ? (
          <div className="bg-white/80 border border-white/60 rounded-2xl flex flex-col items-center py-16 text-center backdrop-blur-md shadow-[0_12px_28px_rgba(10,22,40,0.10)]">
            <p className="text-slate-700 text-sm font-semibold">Select a section to view students</p>
            <p className="text-slate-500 text-xs mt-2">This keeps records section-focused instead of one long list.</p>
          </div>
        ) : sectionStudents.length === 0 ? (
          <div className="bg-white/80 border border-white/60 rounded-2xl flex flex-col items-center py-16 text-center backdrop-blur-md shadow-[0_12px_28px_rgba(10,22,40,0.10)]">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-slate-600 text-sm">No students found in Section {selectedSection}.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 text-lg">Section {selectedSection} Students</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  {sectionStudents.length} student{sectionStudents.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setSelectedSection("")}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                >
                  Clear Section
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectionStudents.map((student) => (
              <div key={student._id} className="student-card-item opacity-0 will-change-transform">
                <StudentCard student={student} onDelete={handleDelete} onLinkUser={handleLinkUser} />
              </div>
            ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentsList;