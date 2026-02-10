import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import PrivateRoute from "./components/Common/PrivateRoute";

// Layout
import Layout from "./components/layout/Layout";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Dashboard Pages
import Dashboard from "./pages/Dashboard";

// Student Pages
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import StudentDetails from "./pages/StudentDetails";

// Teacher Pages
import Teachers from "./pages/Teachers";
import TeacherProfile from "./pages/TeacherProfile";

// Course Pages
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";

// Attendance Pages
import Attendance from "./pages/Attendance";

// Assignment Pages
import Assignments from "./pages/Assignments";

// Chat Page
import Chat from "./pages/Chat";

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Student Routes */}
              <Route path="/students" element={<Students />} />
              <Route path="/students/:id" element={<StudentProfile />} />
              <Route
                path="/students/:id/details"
                element={<StudentDetails />}
              />

              {/* Teacher Routes */}
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/profile/teacher" element={<TeacherProfile />} />

              {/* Course Routes */}
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetails />} />

              {/* Attendance Routes */}
              <Route path="/attendance" element={<Attendance />} />

              {/* Assignment Routes */}
              <Route path="/assignments" element={<Assignments />} />

              {/* Chat Route */}
              <Route path="/chat" element={<Chat />} />
            </Route>

            {/* catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
