import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import SocketProvider from "./context/SocketProvider";
import { NotificationProvider } from "./context/NotificationProvider";
import { ThemeProvider } from "./context/ThemeProvider";
import PrivateRoute from "./components/common/PrivateRoute";
import Layout from "./components/layout/Layout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";
import StudentDetails from "./pages/StudentDetails";
import Teachers from "./pages/Teachers";
import TeacherProfile from "./pages/TeacherProfile";
import AdminProfile from "./pages/AdminProfile";
import ParentProfile from "./pages/ParentProfile";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import Attendance from "./pages/Attendance";
import Assignments from "./pages/Assignments";
import Chat from "./pages/Chat";

import "./styles/global.css";

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                  path="/reset-password/:token"
                  element={<ResetPassword />}
                />

                {/* Protected Routes */}
                <Route
                  element={
                    <PrivateRoute>
                      <Layout />
                    </PrivateRoute>
                  }
                >
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Student Routes */}
                  <Route path="/students" element={<Students />} />
                  <Route path="/students/:id" element={<StudentDetails />} />
                  <Route path="/profile/student" element={<StudentProfile />} />

                  {/* Teacher Routes */}
                  <Route path="/teachers" element={<Teachers />} />
                  <Route path="/profile/teacher" element={<TeacherProfile />} />

                  {/* Admin Route */}
                  <Route path="/profile/admin" element={<AdminProfile />} />

                  {/* Parent Route */}
                  <Route path="/profile/parent" element={<ParentProfile />} />

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

                {/* Catch all route */}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
