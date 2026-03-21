import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import studentService from "../../services/studentService";
import StudentCard from "../../components/StudentCard";
import Loader from "../../components/Loader";
import { SECTIONS } from "../../utils/constants";

const MOCK_STUDENTS = [
  { _id: "1", name: "Arjun Sharma",  rollNumber: "CS2024001", section: "A", email: "arjun@school.edu",  attendancePercentage: 72 },
  { _id: "2", name: "Priya Mehta",   rollNumber: "CS2024002", section: "B", email: "priya@school.edu",  attendancePercentage: 91 },
  { _id: "3", name: "Rohan Singh",   rollNumber: "CS2024003", section: "A", email: "rohan@school.edu",  attendancePercentage: 65 },
  { _id: "4", name: "Ananya Rao",    rollNumber: "CS2024004", section: "C", email: "ananya@school.edu", attendancePercentage: 88 },
  { _id: "5", name: "Dev Patel",     rollNumber: "CS2024005", section: "B", email: "dev@school.edu",    attendancePercentage: 78 },
  { _id: "6", name: "Sneha Kumar",   rollNumber: "CS2024006", section: "A", email: "sneha@school.edu",  attendancePercentage: 55 },
];

const StudentsList = () => {
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await studentService.getAllStudents();
        setStudents(res.data || res.students || []);
      } catch {
        setStudents(MOCK_STUDENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!loading) {
      gsap.fromTo(
        ".student-card-item",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.07, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [loading, search, sectionFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await studentService.deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch {
      alert("Failed to delete student.");
    }
  };

  const filtered = students.filter((s) => {
    const searchLow = search.toLowerCase();
    const rNo = (s.rollNumber || s.registrationNumber || "").toLowerCase();
    const sName = (s.name || "").toLowerCase();
    
    const matchSearch = !search || sName.includes(searchLow) || rNo.includes(searchLow);
    const matchSection = !sectionFilter || s.section === sectionFilter;
    return matchSearch && matchSection;
  });

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-[#06070a] pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-1">
              Admin
            </p>
            <h1 className="font-bold text-3xl text-white">Students</h1>
          </div>
          <Link
            to="/admin/create-student"
            className="self-start flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Student
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
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
              className="w-full bg-[#151820] border border-white/5 focus:border-blue-500/50 text-slate-100 placeholder-slate-600 rounded-xl pl-10 pr-4 py-3 outline-none transition-all duration-200 text-sm"
              placeholder="Search by name or roll number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Section Filter */}
          <select
            className="bg-[#151820] border border-white/5 focus:border-blue-500/50 text-slate-300 rounded-xl px-4 py-3 outline-none transition-all duration-200 text-sm sm:w-48 appearance-none"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
          >
            <option value="">All Sections</option>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>
        </div>

        {/* Count row */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-slate-500 text-sm">
            {filtered.length} student{filtered.length !== 1 ? "s" : ""}
          </span>
          {sectionFilter && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-400/20">
              Section {sectionFilter}
            </span>
          )}
          {search && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              "{search}"
            </span>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="bg-[#151820] border border-white/5 rounded-2xl flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">No students found.</p>
            {(search || sectionFilter) && (
              <button
                onClick={() => { setSearch(""); setSectionFilter(""); }}
                className="mt-3 text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((student) => (
              <div key={student._id} className="student-card-item opacity-0">
                <StudentCard student={student} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentsList;