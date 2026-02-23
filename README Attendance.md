# AttendX — Smart Attendance System

A full-stack attendance management system built with React + Vite, featuring role-based access for Admins, Teachers, and Students.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| Animations | GSAP |
| Styling | Tailwind CSS v3 |
| Auth | JWT (stored in localStorage) |

---

## Getting Started

### 1. Install dependencies
```bash
npm install
npm install react-router-dom axios gsap
```

### 2. Create `.env` file in root
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run dev server
```bash
npm run dev
```

App runs at → `http://localhost:5173`

---

## Project Structure

```
src/
├── pages/
│   ├── Landing.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── CreateStudent.jsx
│   │   ├── StudentsList.jsx
│   │   ├── StudentAnalytics.jsx
│   │   └── SectionAttendance.jsx
│   ├── teacher/
│   │   ├── TeacherDashboard.jsx
│   │   └── MarkAttendance.jsx
│   └── student/
│       ├── StudentDashboard.jsx
│       └── Profile.jsx
├── components/
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   ├── RoleRoute.jsx
│   ├── AttendanceTable.jsx
│   ├── StudentCard.jsx
│   └── Loader.jsx
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── studentService.js
│   └── attendanceService.js
├── context/
│   └── AuthContext.jsx
├── hooks/
│   └── useAuth.js
└── utils/
    └── constants.js
```

---

## All Routes

### Public Routes
| Route | Page | Description |
|---|---|---|
| `/` | Landing | Home page with features and CTA |
| `/login` | Login | Sign in with email + password |
| `/register` | Register | Create account with role selection |

---

### Admin Routes
> Accessible only when logged in as **role: admin**

| Route | Page | Description |
|---|---|---|
| `/admin/dashboard` | AdminDashboard | Stats overview — total students, avg attendance, low attendance count + recent students list |
| `/admin/students` | StudentsList | Full paginated list of students with search by name/roll number and filter by section |
| `/admin/create-student` | CreateStudent | Form to create a new student account with name, email, roll number, section, password, phone |
| `/admin/students/:id/analytics` | StudentAnalytics | Per-student deep dive — overall attendance %, subject-wise breakdown bars, full attendance records table |
| `/admin/section-attendance` | SectionAttendance | Filter attendance records by section + subject + date, view present/absent summary |

---

### Teacher Routes
> Accessible only when logged in as **role: teacher**

| Route | Page | Description |
|---|---|---|
| `/teacher/dashboard` | TeacherDashboard | Overview of today's sessions, quick stats, link to mark attendance |
| `/teacher/mark-attendance` | MarkAttendance | 2-step flow — Step 1: select section, subject, date → Step 2: mark each student present/absent/late with bulk actions |

---

### Student Routes
> Accessible only when logged in as **role: student**

| Route | Page | Description |
|---|---|---|
| `/student/dashboard` | StudentDashboard | Circular attendance gauge, subject-wise progress bars, quick stats (present/absent/late count), recent records table. Shows red warning if attendance < 75% |
| `/student/profile` | Profile | Personal info card, attendance progress bar, low attendance warning if below threshold |

---

## Role-Based Access Flow

```
User visits any route
        │
        ▼
   ProtectedRoute
   (checks JWT token)
        │
   ┌────┴────┐
   │         │
No token   Token exists
   │         │
   ▼         ▼
/login    RoleRoute
          (checks user.role)
               │
        ┌──────┼──────┐
        │      │      │
      admin teacher student
        │      │      │
        ▼      ▼      ▼
   /admin/* /teacher/* /student/*
```

If a user tries to access a route for a different role, they are automatically redirected to their own dashboard.

---

## Authentication Flow

```
Login / Register
      │
      ▼
API returns { token, user }
      │
      ▼
localStorage.setItem("attendx_token", token)
localStorage.setItem("attendx_user", user)
      │
      ▼
AuthContext updates state
      │
      ▼
Axios interceptor auto-attaches
Authorization: Bearer <token>
to every API request
      │
      ▼
On 401 response → clear token → redirect to /login
```

---

## API Endpoints Expected

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login → returns `{ token, user }` |
| POST | `/api/auth/register` | Register → returns `{ token, user }` |
| GET | `/api/auth/me` | Get current user from token |

### Students
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students` | Get all students (supports `?section=A`) |
| POST | `/api/students` | Create new student |
| GET | `/api/students/:id` | Get student by ID |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |
| GET | `/api/students/:id/analytics` | Get student analytics |
| GET | `/api/students/me` | Get logged-in student profile |

### Attendance
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/attendance/mark` | Mark attendance for a session |
| GET | `/api/attendance/section` | Get records by section + date + subject |
| GET | `/api/attendance/student/:id` | Get records for a specific student |
| GET | `/api/attendance/me` | Get logged-in student's own attendance |
| GET | `/api/attendance/analytics/section/:section` | Section-level analytics |
| GET | `/api/attendance/analytics/overall` | Overall system analytics |
| GET | `/api/attendance/low` | Students below attendance threshold |

---

## Demo Credentials

```
Admin:   admin@school.com   / admin123
Teacher: teacher@school.com / teacher123
Student: student@school.com / student123
```

> All pages include mock data fallbacks so the UI works even without a backend connected.

---

## Key Features

- JWT authentication with auto token refresh protection
- Role-based protected routes (Admin / Teacher / Student)
- GSAP animations — hero entrance, card stagger, orb float, percentage counter
- Circular SVG attendance gauge on student dashboard
- Subject-wise attendance breakdown with animated progress bars
- Low attendance warning (< 75% threshold) on student pages
- 2-step attendance marking flow for teachers
- Searchable + filterable student list for admins
- Mock data fallbacks on every page for offline/demo use
- Responsive design — works on mobile, tablet, desktop


frontend/
│
├── src/
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CreateStudent.jsx
│   │   │   ├── StudentsList.jsx
│   │   │   ├── StudentAnalytics.jsx
│   │   │   └── SectionAttendance.jsx
│   │   ├── teacher/
│   │   │   ├── TeacherDashboard.jsx
│   │   │   └── MarkAttendance.jsx
│   │   ├── student/
│   │   │   ├── StudentDashboard.jsx
│   │   │   └── Profile.jsx
│   │
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── RoleRoute.jsx
│   │   ├── AttendanceTable.jsx
│   │   ├── StudentCard.jsx
│   │   └── Loader.jsx
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── studentService.js
│   │   └── attendanceService.js
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── hooks/
│   │   └── useAuth.js
│   │
│   └── utils/
│       └── constants.js
