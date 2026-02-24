import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Container,
  Table,
  Spinner,
  Badge,
  Button,
  Modal,
  Form,
  Alert,
  ListGroup,
} from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import api from "../services/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
);

const Dashboard = () => {
  const { user } = useAuth();
  // const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Teacher dashboard state
  const [teacherData, setTeacherData] = useState({
    stats: {
      activeCourses: 0,
      pendingGrading: 0,
      unreadMessages: 0,
      todayClasses: 0,
    },
    performanceTrend: [],
    todaySchedule: [],
    upcomingAssignments: [],
    recentSubmissions: [],
  });

  // Student dashboard state
  const [studentData, setStudentData] = useState({
    stats: {
      enrolledCourses: 0,
      attendanceRate: 0,
      pendingAssignments: 0,
      averageGrade: 0,
    },
    upcomingAssignments: [],
    recentGrades: [],
  });

  // Modal states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Form states
  const [studentForm, setStudentForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    classGrade: "",
    gender: "Male",
    dateOfBirth: "",
  });

  const [courseForm, setCourseForm] = useState({
    courseCode: "",
    courseName: "",
    description: "",
    credits: 3,
    teacher: "",
    semester: "Fall 2024",
    academicYear: "2024-2025",
    maxStudents: 30,
    schedule: [
      {
        day: "Monday",
        startTime: "09:00",
        endTime: "10:30",
        room: "",
      },
    ],
  });

  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info",
    recipients: "all",
  });

  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch teacher dashboard data
  const fetchTeacherDashboard = useCallback(async () => {
    try {
      const response = await api.get("/dashboard/teacher");
      if (response.data.success) {
        setTeacherData(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching teacher dashboard:", err);
    }
  }, []);

  // Fetch student dashboard data
  const fetchStudentDashboard = useCallback(async () => {
    try {
      const response = await api.get("/dashboard/student");
      if (response.data.success) {
        setStudentData(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching student dashboard:", err);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      if (user?.role === "admin") {
        const [studentsRes, coursesRes, teachersRes] = await Promise.all([
          api
            .get("/students?limit=5")
            .catch(() => ({ data: { pagination: { total: 0 }, data: [] } })),
          api
            .get("/courses?limit=5")
            .catch(() => ({ data: { pagination: { total: 0 }, data: [] } })),
          api
            .get("/teachers?limit=5")
            .catch(() => ({ data: { pagination: { total: 0 }, data: [] } })),
        ]);

        setStats({
          totalStudents: studentsRes.data.pagination?.total || 0,
          totalCourses: coursesRes.data.pagination?.total || 0,
          totalTeachers: teachersRes.data.pagination?.total || 0,
          recentStudents: studentsRes.data.data || [],
          recentCourses: coursesRes.data.data || [],
          recentTeachers: teachersRes.data.data || [],
        });
      } else if (user?.role === "teacher") {
        await fetchTeacherDashboard();
      } else if (user?.role === "student") {
        await fetchStudentDashboard();
      } else if (user?.role === "parent") {
        setStats({
          totalStudents: 2,
          totalCourses: 5,
          totalTeachers: 3,
        });
      }

      setRecentActivity([
        {
          id: 1,
          user: "System",
          action: "Welcome to the dashboard",
          time: "just now",
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.role, fetchTeacherDashboard, fetchStudentDashboard]);

  // Fetch teachers for admin
  const fetchTeachers = useCallback(async () => {
    if (user?.role === "admin") {
      try {
        const response = await api.get("/teachers?limit=100");
        setTeachers(response.data.data || []);
      } catch (error) {
        console.error("Error fetching teachers:", error);
      }
    }
  }, [user?.role]);

  useEffect(() => {
    fetchDashboardData();
    fetchTeachers();
  }, [fetchDashboardData, fetchTeachers]);

  const handleAddStudent = async () => {
    try {
      setSubmitting(true);
      setError("");

      if (
        !studentForm.firstName ||
        !studentForm.lastName ||
        !studentForm.email ||
        !studentForm.phone
      ) {
        setError("Please fill in all required fields");
        setSubmitting(false);
        return;
      }

      if (!studentForm.classGrade) {
        setError("Please select year of study");
        setSubmitting(false);
        return;
      }

      const baseUsername = studentForm.email.split("@")[0];
      const uniqueUsername = `${baseUsername}_${Date.now()}`;

      const userResponse = await api.post("/auth/register", {
        username: uniqueUsername,
        email: studentForm.email,
        password: "student123",
        role: "student",
      });

      if (!userResponse.data.success) {
        throw new Error(userResponse.data.message || "Failed to create user");
      }

      const studentData = {
        userId: userResponse.data.user.id,
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        phone: studentForm.phone,
        classGrade: studentForm.classGrade,
        gender: studentForm.gender,
        dateOfBirth: studentForm.dateOfBirth || new Date(),
      };

      await api.post("/students", studentData);

      setSuccess("Student added successfully! Default password: student123");
      setShowStudentModal(false);
      resetStudentForm();
      fetchDashboardData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error adding student:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to add student");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      setSubmitting(true);
      setError("");

      if (
        !courseForm.courseCode ||
        !courseForm.courseName ||
        !courseForm.teacher
      ) {
        setError("Please fill in all required fields");
        setSubmitting(false);
        return;
      }

      await api.post("/courses", courseForm);

      setSuccess("Course created successfully!");
      setShowCourseModal(false);
      resetCourseForm();
      fetchDashboardData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error creating course:", err);
      setError(err.response?.data?.message || "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendNotification = async () => {
    try {
      setSubmitting(true);
      setError("");

      if (!notificationForm.title || !notificationForm.message) {
        setError("Please fill in all required fields");
        setSubmitting(false);
        return;
      }

      await api.post("/notifications/send", notificationForm);

      setSuccess("Notification sent successfully!");
      setShowNotificationModal(false);
      resetNotificationForm();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error sending notification:", err);
      setError(err.response?.data?.message || "Failed to send notification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateReport = () => {
    const reportData = {
      title: "Student Management Report",
      generatedAt: new Date().toLocaleString(),
      totalStudents: stats?.totalStudents || 0,
      totalTeachers: stats?.totalTeachers || 0,
      totalCourses: stats?.totalCourses || 0,
      recentActivities: recentActivity,
    };

    const csv = convertToCSV(reportData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    setShowReportModal(false);
    setSuccess("Report generated and downloaded!");
    setTimeout(() => setSuccess(""), 3000);
  };

  const convertToCSV = (data) => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Generated At", data.generatedAt],
      ["Total Students", data.totalStudents],
      ["Total Teachers", data.totalTeachers],
      ["Total Courses", data.totalCourses],
      ["", ""],
      ["Recent Activities", ""],
      ...data.recentActivities.map((a) => [a.action, `${a.user} - ${a.time}`]),
    ];

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const resetStudentForm = () => {
    setStudentForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      classGrade: "",
      gender: "Male",
      dateOfBirth: "",
    });
  };

  const resetCourseForm = () => {
    setCourseForm({
      courseCode: "",
      courseName: "",
      description: "",
      credits: 3,
      teacher: "",
      semester: "Fall 2024",
      academicYear: "2024-2025",
      maxStudents: 30,
      schedule: [
        {
          day: "Monday",
          startTime: "09:00",
          endTime: "10:30",
          room: "",
        },
      ],
    });
  };

  const resetNotificationForm = () => {
    setNotificationForm({
      title: "",
      message: "",
      type: "info",
      recipients: "all",
    });
  };

  const addScheduleRow = () => {
    setCourseForm({
      ...courseForm,
      schedule: [
        ...courseForm.schedule,
        { day: "Monday", startTime: "09:00", endTime: "10:30", room: "" },
      ],
    });
  };

  const removeScheduleRow = (index) => {
    const newSchedule = courseForm.schedule.filter((_, i) => i !== index);
    setCourseForm({ ...courseForm, schedule: newSchedule });
  };

  const updateScheduleRow = (index, field, value) => {
    const newSchedule = [...courseForm.schedule];
    newSchedule[index][field] = value;
    setCourseForm({ ...courseForm, schedule: newSchedule });
  };

  const cleanUsername = (username) => {
    if (!username) return "User";
    return username.replace(/[0-9_]+$/, "");
  };

  const adminDashboard = () => {
    const barData = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "New Students",
          data: [65, 59, 80, 81, 56, 55],
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };

    const pieData = {
      labels: ["Active", "Inactive", "Graduated"],
      datasets: [
        {
          data: [300, 50, 100],
          backgroundColor: [
            "rgba(75, 192, 192, 0.5)",
            "rgba(255, 99, 132, 0.5)",
            "rgba(255, 205, 86, 0.5)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(255, 205, 86, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };

    return (
      <>
        {success && (
          <Alert
            variant="success"
            onClose={() => setSuccess("")}
            dismissible
            className="mb-3"
          >
            {success}
          </Alert>
        )}

        {error && (
          <Alert
            variant="danger"
            onClose={() => setError("")}
            dismissible
            className="mb-3"
          >
            {error}
          </Alert>
        )}

        <Row className="g-4 mb-4">
          <Col lg={3} md={6}>
            <Card
              className="stats-card h-100 border-0"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Subtitle
                      className="text-white-50 mb-2"
                      style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}
                    >
                      TOTAL STUDENTS
                    </Card.Subtitle>
                    <Card.Text className="display-4 fw-bold text-white mb-0">
                      {stats?.totalStudents || 0}
                    </Card.Text>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-people-fill fs-1 text-white-50"></i>
                  </div>
                </div>
                <div className="mt-3 d-flex align-items-center text-white-50 small">
                  <i className="bi bi-arrow-up-short me-1 text-success"></i>
                  <span className="text-white me-1">12%</span> increase from
                  last month
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card
              className="stats-card h-100 border-0"
              style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Subtitle
                      className="text-white-50 mb-2"
                      style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}
                    >
                      TOTAL TEACHERS
                    </Card.Subtitle>
                    <Card.Text className="display-4 fw-bold text-white mb-0">
                      {stats?.totalTeachers || 0}
                    </Card.Text>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-person-badge-fill fs-1 text-white-50"></i>
                  </div>
                </div>
                <div className="mt-3 d-flex align-items-center text-white-50 small">
                  <i className="bi bi-arrow-up-short me-1 text-success"></i>
                  <span className="text-white me-1">8%</span> increase from last
                  month
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card
              className="stats-card h-100 border-0"
              style={{
                background: "linear-gradient(135deg, #5f2c82 0%, #49a09d 100%)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Subtitle
                      className="text-white-50 mb-2"
                      style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}
                    >
                      TOTAL COURSES
                    </Card.Subtitle>
                    <Card.Text className="display-4 fw-bold text-white mb-0">
                      {stats?.totalCourses || 0}
                    </Card.Text>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-book-fill fs-1 text-white-50"></i>
                  </div>
                </div>
                <div className="mt-3 d-flex align-items-center text-white-50 small">
                  <i className="bi bi-arrow-up-short me-1 text-success"></i>
                  <span className="text-white me-1">5%</span> increase from last
                  month
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card
              className="stats-card h-100 border-0"
              style={{
                background: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Subtitle
                      className="text-white-50 mb-2"
                      style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}
                    >
                      ATTENDANCE RATE
                    </Card.Subtitle>
                    <Card.Text className="display-4 fw-bold text-white mb-0">
                      95%
                    </Card.Text>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-calendar-check-fill fs-1 text-white-50"></i>
                  </div>
                </div>
                <div className="mt-3 d-flex align-items-center text-white-50 small">
                  <i className="bi bi-arrow-down-short me-1 text-danger"></i>
                  <span className="text-white me-1">2%</span> decrease from last
                  month
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4 mb-4">
          <Col md={6}>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                <Card.Title className="d-flex align-items-center mb-4">
                  <div
                    className="title-icon me-2"
                    style={{
                      width: "35px",
                      height: "35px",
                      background: "rgba(102, 126, 234, 0.1)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#667eea",
                    }}
                  >
                    <i className="bi bi-graph-up"></i>
                  </div>
                  <span style={{ fontWeight: "600" }}>Student Growth</span>
                </Card.Title>
                <div style={{ height: "300px" }}>
                  <Bar
                    key={`bar-${JSON.stringify(barData)}`}
                    data={barData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                <Card.Title className="d-flex align-items-center mb-4">
                  <div
                    className="title-icon me-2"
                    style={{
                      width: "35px",
                      height: "35px",
                      background: "rgba(102, 126, 234, 0.1)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#667eea",
                    }}
                  >
                    <i className="bi bi-pie-chart"></i>
                  </div>
                  <span style={{ fontWeight: "600" }}>Student Status</span>
                </Card.Title>
                <div style={{ height: "300px" }}>
                  <Pie
                    key={`pie-${JSON.stringify(pieData)}`}
                    data={pieData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                        },
                      },
                    }}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4">
          <Col md={8}>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                <Card.Title className="d-flex align-items-center mb-4">
                  <div
                    className="title-icon me-2"
                    style={{
                      width: "35px",
                      height: "35px",
                      background: "rgba(102, 126, 234, 0.1)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#667eea",
                    }}
                  >
                    <i className="bi bi-activity"></i>
                  </div>
                  <span style={{ fontWeight: "600" }}>Recent Activity</span>
                </Card.Title>
                <Table hover responsive className="align-middle">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Action</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((activity) => (
                      <tr key={activity.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="user-avatar-sm me-2"
                              style={{
                                width: "32px",
                                height: "32px",
                                background: "#667eea",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "0.8rem",
                                fontWeight: "600",
                              }}
                            >
                              {activity.user.charAt(0)}
                            </div>
                            {activity.user}
                          </div>
                        </td>
                        <td>{activity.action}</td>
                        <td>
                          <Badge bg="light" text="dark" className="px-3 py-2">
                            {activity.time}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="p-4">
                <Card.Title className="d-flex align-items-center mb-4">
                  <div
                    className="title-icon me-2"
                    style={{
                      width: "35px",
                      height: "35px",
                      background: "rgba(102, 126, 234, 0.1)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#667eea",
                    }}
                  >
                    <i className="bi bi-lightning-charge"></i>
                  </div>
                  <span style={{ fontWeight: "600" }}>Quick Actions</span>
                </Card.Title>
                <div className="d-grid gap-3">
                  <Button
                    variant="outline-primary"
                    className="d-flex align-items-center justify-content-start p-3 border-0"
                    style={{
                      background: "rgba(102, 126, 234, 0.05)",
                      borderRadius: "10px",
                    }}
                    onClick={() => setShowStudentModal(true)}
                  >
                    <div
                      className="action-icon me-3"
                      style={{
                        width: "40px",
                        height: "40px",
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <i className="bi bi-person-plus"></i>
                    </div>
                    <div className="flex-grow-1 text-start">
                      <div style={{ fontWeight: "600" }}>Add New Student</div>
                      <small className="text-muted">
                        Create a new student account
                      </small>
                    </div>
                    <i className="bi bi-chevron-right text-muted"></i>
                  </Button>

                  <Button
                    variant="outline-success"
                    className="d-flex align-items-center justify-content-start p-3 border-0"
                    style={{
                      background: "rgba(16, 185, 129, 0.05)",
                      borderRadius: "10px",
                    }}
                    onClick={() => setShowCourseModal(true)}
                  >
                    <div
                      className="action-icon me-3"
                      style={{
                        width: "40px",
                        height: "40px",
                        background:
                          "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <i className="bi bi-calendar-plus"></i>
                    </div>
                    <div className="flex-grow-1 text-start">
                      <div style={{ fontWeight: "600" }}>Create Course</div>
                      <small className="text-muted">Add a new course</small>
                    </div>
                    <i className="bi bi-chevron-right text-muted"></i>
                  </Button>

                  <Button
                    variant="outline-warning"
                    className="d-flex align-items-center justify-content-start p-3 border-0"
                    style={{
                      background: "rgba(245, 158, 11, 0.05)",
                      borderRadius: "10px",
                    }}
                    onClick={() => setShowReportModal(true)}
                  >
                    <div
                      className="action-icon me-3"
                      style={{
                        width: "40px",
                        height: "40px",
                        background:
                          "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <i className="bi bi-file-earmark-text"></i>
                    </div>
                    <div className="flex-grow-1 text-start">
                      <div style={{ fontWeight: "600" }}>Generate Report</div>
                      <small className="text-muted">
                        Download analytics report
                      </small>
                    </div>
                    <i className="bi bi-chevron-right text-muted"></i>
                  </Button>

                  <Button
                    variant="outline-info"
                    className="d-flex align-items-center justify-content-start p-3 border-0"
                    style={{
                      background: "rgba(59, 130, 246, 0.05)",
                      borderRadius: "10px",
                    }}
                    onClick={() => setShowNotificationModal(true)}
                  >
                    <div
                      className="action-icon me-3"
                      style={{
                        width: "40px",
                        height: "40px",
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <i className="bi bi-envelope"></i>
                    </div>
                    <div className="flex-grow-1 text-start">
                      <div style={{ fontWeight: "600" }}>Send Notification</div>
                      <small className="text-muted">Broadcast to users</small>
                    </div>
                    <i className="bi bi-chevron-right text-muted"></i>
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  const teacherDashboard = () => {
    const lineData = {
      labels: teacherData.performanceTrend.map((w) => w.week),
      datasets: [
        {
          label: "Class Average",
          data: teacherData.performanceTrend.map((w) => w.average),
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.4,
        },
      ],
    };

    return (
      <>
        <Row className="g-4 mb-4">
          <Col lg={3} md={6}>
            <Card
              className="stats-card h-100 border-0"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Subtitle
                      className="text-white-50 mb-2"
                      style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}
                    >
                      ACTIVE COURSES
                    </Card.Subtitle>
                    <Card.Text className="display-4 fw-bold text-white mb-0">
                      {teacherData.stats.activeCourses}
                    </Card.Text>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-journal-bookmark-fill fs-1 text-white-50"></i>
                  </div>
                </div>
                <div className="mt-3 text-white-50 small">
                  <i className="bi bi-book me-1"></i> Teaching{" "}
                  {teacherData.stats.activeCourses} courses
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card
              className="stats-card h-100 border-0"
              style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Subtitle
                      className="text-white-50 mb-2"
                      style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}
                    >
                      PENDING GRADING
                    </Card.Subtitle>
                    <Card.Text className="display-4 fw-bold text-white mb-0">
                      {teacherData.stats.pendingGrading}
                    </Card.Text>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-clock-history fs-1 text-white-50"></i>
                  </div>
                </div>
                <div className="mt-3 text-white-50 small">
                  <i className="bi bi-exclamation-triangle me-1"></i>{" "}
                  {teacherData.stats.pendingGrading} assignments to grade
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card
              className="stats-card h-100 border-0"
              style={{
                background: "linear-gradient(135deg, #5f2c82 0%, #49a09d 100%)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Subtitle
                      className="text-white-50 mb-2"
                      style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}
                    >
                      UNREAD MESSAGES
                    </Card.Subtitle>
                    <Card.Text className="display-4 fw-bold text-white mb-0">
                      {teacherData.stats.unreadMessages}
                    </Card.Text>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-chat-dots-fill fs-1 text-white-50"></i>
                  </div>
                </div>
                <div className="mt-3 text-white-50 small">
                  <i className="bi bi-envelope me-1"></i>{" "}
                  {teacherData.stats.unreadMessages} unread messages
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card
              className="stats-card h-100 border-0"
              style={{
                background: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Subtitle
                      className="text-white-50 mb-2"
                      style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}
                    >
                      TODAY'S CLASSES
                    </Card.Subtitle>
                    <Card.Text className="display-4 fw-bold text-white mb-0">
                      {teacherData.stats.todayClasses}
                    </Card.Text>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-calendar-event-fill fs-1 text-white-50"></i>
                  </div>
                </div>
                <div className="mt-3 text-white-50 small">
                  <i className="bi bi-clock me-1"></i>{" "}
                  {teacherData.stats.todayClasses} classes scheduled
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Class Performance Trend</Card.Title>
                <div style={{ height: "300px" }}>
                  <Line
                    key={`line-${JSON.stringify(lineData)}`}
                    data={lineData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    }}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Today's Schedule</Card.Title>
                {teacherData.todaySchedule.length > 0 ? (
                  <ListGroup variant="flush">
                    {teacherData.todaySchedule.map((item, index) => (
                      <ListGroup.Item key={index}>
                        <strong>
                          {item.schedule.startTime} - {item.schedule.endTime}
                        </strong>
                        <br />
                        {item.courseCode} - {item.courseName}
                        <br />
                        <small className="text-muted">
                          Room {item.schedule.room} • {item.studentCount}{" "}
                          students
                        </small>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <p className="text-muted text-center py-3">
                    No classes today
                  </p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Upcoming Assignments</Card.Title>
                {teacherData.upcomingAssignments.length > 0 ? (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Assignment</th>
                        <th>Due Date</th>
                        <th>Submissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherData.upcomingAssignments.map((assignment) => (
                        <tr key={assignment._id}>
                          <td>{assignment.courseCode}</td>
                          <td>{assignment.title}</td>
                          <td>
                            <Badge
                              bg={
                                new Date(assignment.dueDate) < new Date()
                                  ? "danger"
                                  : "warning"
                              }
                            >
                              {new Date(
                                assignment.dueDate,
                              ).toLocaleDateString()}
                            </Badge>
                          </td>
                          <td>
                            {assignment.submissionsCount}/
                            {assignment.totalStudents}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted text-center py-3">
                    No upcoming assignments
                  </p>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Recent Submissions</Card.Title>
                {teacherData.recentSubmissions.length > 0 ? (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Assignment</th>
                        <th>Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherData.recentSubmissions.map((sub) => (
                        <tr key={sub._id}>
                          <td>{sub.studentName}</td>
                          <td>{sub.assignmentTitle}</td>
                          <td>
                            {new Date(sub.submittedAt).toLocaleTimeString()}
                          </td>
                          <td>
                            <Badge
                              bg={
                                sub.status === "graded" ? "success" : "warning"
                              }
                            >
                              {sub.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted text-center py-3">
                    No recent submissions
                  </p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  const studentDashboard = () => {
    return (
      <>
        <Row className="g-4 mb-4">
          <Col lg={3} md={6}>
            <Card
              className="stats-card h-100 border-0"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Subtitle
                      className="text-white-50 mb-2"
                      style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}
                    >
                      ENROLLED COURSES
                    </Card.Subtitle>
                    <Card.Text className="display-4 fw-bold text-white mb-0">
                      {studentData.stats.enrolledCourses}
                    </Card.Text>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-book-fill fs-1 text-white-50"></i>
                  </div>
                </div>
                <div className="mt-3 text-white-50 small">
                  <i className="bi bi-check-circle me-1"></i> Actively enrolled
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card
              className="stats-card h-100 border-0"
              style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Subtitle
                      className="text-white-50 mb-2"
                      style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}
                    >
                      ATTENDANCE
                    </Card.Subtitle>
                    <Card.Text className="display-4 fw-bold text-white mb-0">
                      {studentData.stats.attendanceRate}%
                    </Card.Text>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-calendar-check-fill fs-1 text-white-50"></i>
                  </div>
                </div>
                <div className="mt-3 text-white-50 small">
                  <i className="bi bi-graph-up me-1"></i> Above average
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card
              className="stats-card h-100 border-0"
              style={{
                background: "linear-gradient(135deg, #5f2c82 0%, #49a09d 100%)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Subtitle
                      className="text-white-50 mb-2"
                      style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}
                    >
                      PENDING ASSIGNMENTS
                    </Card.Subtitle>
                    <Card.Text className="display-4 fw-bold text-white mb-0">
                      {studentData.stats.pendingAssignments}
                    </Card.Text>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-file-earmark-text-fill fs-1 text-white-50"></i>
                  </div>
                </div>
                <div className="mt-3 text-white-50 small">
                  <i className="bi bi-exclamation-circle me-1"></i> Need
                  attention
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card
              className="stats-card h-100 border-0"
              style={{
                background: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Subtitle
                      className="text-white-50 mb-2"
                      style={{ fontSize: "0.85rem", letterSpacing: "0.5px" }}
                    >
                      AVERAGE GRADE
                    </Card.Subtitle>
                    <Card.Text className="display-4 fw-bold text-white mb-0">
                      {studentData.stats.averageGrade}%
                    </Card.Text>
                  </div>
                  <div className="stats-icon">
                    <i className="bi bi-award-fill fs-1 text-white-50"></i>
                  </div>
                </div>
                <div className="mt-3 text-white-50 small">
                  <i className="bi bi-star-fill me-1"></i> Good performance
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Upcoming Assignments</Card.Title>
                {studentData.upcomingAssignments.length > 0 ? (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Assignment</th>
                        <th>Due Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentData.upcomingAssignments.map((assignment) => (
                        <tr key={assignment._id}>
                          <td>{assignment.courseCode}</td>
                          <td>{assignment.title}</td>
                          <td>
                            <Badge
                              bg={
                                new Date(assignment.dueDate) < new Date()
                                  ? "danger"
                                  : "warning"
                              }
                            >
                              {new Date(
                                assignment.dueDate,
                              ).toLocaleDateString()}
                            </Badge>
                          </td>
                          <td>
                            {assignment.submitted ? (
                              <Badge bg="success">Submitted</Badge>
                            ) : (
                              <Badge bg="secondary">Pending</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted text-center py-3">
                    No upcoming assignments
                  </p>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Recent Grades</Card.Title>
                {studentData.recentGrades.length > 0 ? (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Assignment</th>
                        <th>Grade</th>
                        <th>Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentData.recentGrades.map((grade, index) => (
                        <tr key={index}>
                          <td>{grade.courseCode}</td>
                          <td>{grade.assignmentTitle}</td>
                          <td>
                            <Badge
                              bg={
                                grade.grade >= 90
                                  ? "success"
                                  : grade.grade >= 80
                                    ? "info"
                                    : grade.grade >= 70
                                      ? "warning"
                                      : "danger"
                              }
                            >
                              {grade.grade}%
                            </Badge>
                          </td>
                          <td>{grade.feedback || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted text-center py-3">No grades yet</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  const parentDashboard = () => {
    return (
      <>
        <Row className="mb-4">
          <Col md={12}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>My Children</Card.Title>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Attendance</th>
                      <th>Average Grade</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>John Doe Jr.</td>
                      <td>First Year</td>
                      <td>
                        <Badge bg="success">95%</Badge>
                      </td>
                      <td>
                        <Badge bg="info">88%</Badge>
                      </td>
                      <td>
                        <Button size="sm" variant="outline-primary">
                          View Details
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td>Jane Doe</td>
                      <td>Second Year</td>
                      <td>
                        <Badge bg="warning">82%</Badge>
                      </td>
                      <td>
                        <Badge bg="success">91%</Badge>
                      </td>
                      <td>
                        <Button size="sm" variant="outline-primary">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Upcoming Parent-Teacher Meetings</Card.Title>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>Mathematics</strong> - Mr. Smith
                    <br />
                    <small className="text-muted">
                      Friday, March 15, 2024 at 3:00 PM
                    </small>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Science</strong> - Mrs. Johnson
                    <br />
                    <small className="text-muted">
                      Monday, March 18, 2024 at 4:30 PM
                    </small>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Recent Announcements</Card.Title>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>School Closed</strong> - Spring Break
                    <br />
                    <small className="text-muted">2 days ago</small>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Science Fair</strong> - Registration Open
                    <br />
                    <small className="text-muted">5 days ago</small>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading dashboard...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Dashboard</h2>
          <p className="text-muted mb-0">
            Welcome back, {cleanUsername(user?.username)}!
          </p>
        </div>
        <Badge bg="info" className="fs-6">
          {user?.role?.toUpperCase()}
        </Badge>
      </div>

      {user?.role === "admin" && adminDashboard()}
      {user?.role === "teacher" && teacherDashboard()}
      {user?.role === "student" && studentDashboard()}
      {user?.role === "parent" && parentDashboard()}

      {/* Add Student Modal */}
      <Modal
        show={showStudentModal}
        onHide={() => setShowStudentModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Student</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={studentForm.firstName}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        firstName: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={studentForm.lastName}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        lastName: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={studentForm.email}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={studentForm.phone}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        phone: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Year of Study *</Form.Label>
                  <Form.Select
                    value={studentForm.classGrade}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        classGrade: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Fourth Year">Fourth Year</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    value={studentForm.gender}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        gender: e.target.value,
                      })
                    }
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    value={studentForm.dateOfBirth}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        dateOfBirth: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Alert variant="info" className="mb-0">
              <i className="bi bi-info-circle me-2"></i>
              Default password will be: <strong>student123</strong>
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowStudentModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddStudent}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Adding...
              </>
            ) : (
              "Add Student"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Course Modal */}
      <Modal
        show={showCourseModal}
        onHide={() => setShowCourseModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create New Course</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Code *</Form.Label>
                  <Form.Control
                    type="text"
                    value={courseForm.courseCode}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        courseCode: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g., CS101"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={courseForm.courseName}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        courseName: e.target.value,
                      })
                    }
                    placeholder="e.g., Introduction to Programming"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={courseForm.description}
                onChange={(e) =>
                  setCourseForm({
                    ...courseForm,
                    description: e.target.value,
                  })
                }
                placeholder="Course description"
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Credits</Form.Label>
                  <Form.Select
                    value={courseForm.credits}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        credits: parseInt(e.target.value),
                      })
                    }
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} credits
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Teacher *</Form.Label>
                  <Form.Select
                    value={courseForm.teacher}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        teacher: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Students</Form.Label>
                  <Form.Control
                    type="number"
                    value={courseForm.maxStudents}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        maxStudents: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="100"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Semester</Form.Label>
                  <Form.Select
                    value={courseForm.semester}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        semester: e.target.value,
                      })
                    }
                  >
                    <option>Fall 2024</option>
                    <option>Spring 2025</option>
                    <option>Summer 2025</option>
                    <option>Fall 2025</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Academic Year</Form.Label>
                  <Form.Control
                    type="text"
                    value={courseForm.academicYear}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        academicYear: e.target.value,
                      })
                    }
                    placeholder="e.g., 2024-2025"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <Form.Label className="mb-0 fw-bold">Schedule</Form.Label>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={addScheduleRow}
              >
                <i className="bi bi-plus-circle me-1"></i> Add Time Slot
              </Button>
            </div>

            {courseForm.schedule.map((slot, index) => (
              <Row key={index} className="mb-2 align-items-end">
                <Col md={3}>
                  <Form.Select
                    size="sm"
                    value={slot.day}
                    onChange={(e) =>
                      updateScheduleRow(index, "day", e.target.value)
                    }
                  >
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                    <option>Saturday</option>
                  </Form.Select>
                </Col>

                <Col md={2}>
                  <Form.Control
                    size="sm"
                    type="time"
                    value={slot.startTime}
                    onChange={(e) =>
                      updateScheduleRow(index, "startTime", e.target.value)
                    }
                  />
                </Col>

                <Col md={2}>
                  <Form.Control
                    size="sm"
                    type="time"
                    value={slot.endTime}
                    onChange={(e) =>
                      updateScheduleRow(index, "endTime", e.target.value)
                    }
                  />
                </Col>

                <Col md={3}>
                  <Form.Control
                    size="sm"
                    type="text"
                    placeholder="Room"
                    value={slot.room}
                    onChange={(e) =>
                      updateScheduleRow(index, "room", e.target.value)
                    }
                  />
                </Col>

                <Col md={2}>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => removeScheduleRow(index)}
                    disabled={courseForm.schedule.length === 1}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </Col>
              </Row>
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCourseModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateCourse}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Creating...
              </>
            ) : (
              "Create Course"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Generate Report Modal */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Generate Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            This will generate a comprehensive report with the following data:
          </p>
          <ul>
            <li>Total Students: {stats?.totalStudents || 0}</li>
            <li>Total Teachers: {stats?.totalTeachers || 0}</li>
            <li>Total Courses: {stats?.totalCourses || 0}</li>
            <li>Recent Activities: {recentActivity.length} entries</li>
          </ul>
          <p>The report will be downloaded as a CSV file.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleGenerateReport}>
            Generate & Download
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Send Notification Modal */}
      <Modal
        show={showNotificationModal}
        onHide={() => setShowNotificationModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Send Notification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                value={notificationForm.title}
                onChange={(e) =>
                  setNotificationForm({
                    ...notificationForm,
                    title: e.target.value,
                  })
                }
                placeholder="Notification title"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={notificationForm.message}
                onChange={(e) =>
                  setNotificationForm({
                    ...notificationForm,
                    message: e.target.value,
                  })
                }
                placeholder="Enter your notification message"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={notificationForm.type}
                    onChange={(e) =>
                      setNotificationForm({
                        ...notificationForm,
                        type: e.target.value,
                      })
                    }
                  >
                    <option value="info">Information</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="danger">Alert</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Recipients</Form.Label>
                  <Form.Select
                    value={notificationForm.recipients}
                    onChange={(e) =>
                      setNotificationForm({
                        ...notificationForm,
                        recipients: e.target.value,
                      })
                    }
                  >
                    <option value="all">All Users</option>
                    <option value="students">Students Only</option>
                    <option value="teachers">Teachers Only</option>
                    <option value="parents">Parents Only</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowNotificationModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSendNotification}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Sending...
              </>
            ) : (
              "Send Notification"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Dashboard;
