import React, { useState, useEffect } from "react";
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
} from "react-bootstrap";
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
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

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
    section: "",
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
    academicYear: "2023-2024",
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

  useEffect(() => {
    fetchDashboardData();
    if (user?.role === "admin") {
      fetchTeachers();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, coursesRes, teachersRes] = await Promise.all([
        api.get("/students?limit=5"),
        api.get("/courses?limit=5"),
        api.get("/teachers?limit=5"),
      ]);

      setStats({
        totalStudents: studentsRes.data.pagination?.total || 0,
        totalCourses: coursesRes.data.pagination?.total || 0,
        totalTeachers: teachersRes.data.pagination?.total || 0,
        recentStudents: studentsRes.data.data || [],
        recentCourses: coursesRes.data.data || [],
        recentTeachers: teachersRes.data.data || [],
      });

      // Mock recent activity
      setRecentActivity([
        {
          id: 1,
          user: "John Doe",
          action: "Submitted assignment",
          time: "2 minutes ago",
        },
        {
          id: 2,
          user: "Jane Smith",
          action: "Marked attendance",
          time: "15 minutes ago",
        },
        {
          id: 3,
          user: "Admin",
          action: "Added new course",
          time: "1 hour ago",
        },
        {
          id: 4,
          user: "Robert Johnson",
          action: "Updated profile",
          time: "2 hours ago",
        },
        {
          id: 5,
          user: "Sarah Williams",
          action: "Sent message",
          time: "3 hours ago",
        },
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get("/teachers?limit=100");
      setTeachers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  // Handle Add Student
  const handleAddStudent = async () => {
    try {
      setSubmitting(true);
      setError("");

      // Validate form
      if (
        !studentForm.firstName ||
        !studentForm.lastName ||
        !studentForm.email ||
        !studentForm.phone
      ) {
        setError("Please fill in all required fields");
        return;
      }

      // First create user account
      const userResponse = await api.post("/auth/register", {
        username: studentForm.email.split("@")[0],
        email: studentForm.email,
        password: "student123", // Default password
        role: "student",
      });

      // Then create student profile
      await api.post("/students", {
        userId: userResponse.data.user.id,
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        phone: studentForm.phone,
        classGrade: studentForm.classGrade,
        section: studentForm.section,
        gender: studentForm.gender,
        dateOfBirth: studentForm.dateOfBirth || new Date(),
      });

      setSuccess("Student added successfully! Default password: student123");
      setShowStudentModal(false);
      resetStudentForm();
      fetchDashboardData(); // Refresh stats

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add student");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Create Course
  const handleCreateCourse = async () => {
    try {
      setSubmitting(true);
      setError("");

      // Validate form
      if (
        !courseForm.courseCode ||
        !courseForm.courseName ||
        !courseForm.teacher
      ) {
        setError("Please fill in all required fields");
        return;
      }

      await api.post("/courses", courseForm);

      setSuccess("Course created successfully!");
      setShowCourseModal(false);
      resetCourseForm();
      fetchDashboardData(); // Refresh stats

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Send Notification
  const handleSendNotification = async () => {
    try {
      setSubmitting(true);
      setError("");

      // Validate form
      if (!notificationForm.title || !notificationForm.message) {
        setError("Please fill in all required fields");
        return;
      }

      // In a real app, you'd send to your notification API
      // For now, we'll show a success message
      setSuccess("Notification sent successfully!");
      setShowNotificationModal(false);
      resetNotificationForm();

      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to send notification");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Generate Report
  const handleGenerateReport = () => {
    // Create a sample report
    const reportData = {
      title: "Student Management Report",
      generatedAt: new Date().toLocaleString(),
      totalStudents: stats?.totalStudents || 0,
      totalTeachers: stats?.totalTeachers || 0,
      totalCourses: stats?.totalCourses || 0,
      recentActivities: recentActivity,
    };

    // Convert to CSV
    const csv = convertToCSV(reportData);

    // Download as file
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

  // Helper function to convert to CSV
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

  // Reset forms
  const resetStudentForm = () => {
    setStudentForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      classGrade: "",
      section: "",
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
      academicYear: "2023-2024",
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

  const getRoleBasedContent = () => {
    switch (user?.role) {
      case "admin":
        return adminDashboard();
      case "teacher":
        return teacherDashboard();
      case "student":
        return studentDashboard();
      case "parent":
        return parentDashboard();
      default:
        return <div>Welcome!</div>;
    }
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

        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center shadow-sm stats-card">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-people fs-1 text-primary"></i>
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">
                  {stats?.totalStudents || 0}
                </Card.Text>
                <Card.Subtitle className="text-muted">
                  Total Students
                </Card.Subtitle>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm stats-card">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-person-badge fs-1 text-success"></i>
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">
                  {stats?.totalTeachers || 0}
                </Card.Text>
                <Card.Subtitle className="text-muted">
                  Total Teachers
                </Card.Subtitle>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm stats-card">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-book fs-1 text-warning"></i>
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">
                  {stats?.totalCourses || 0}
                </Card.Text>
                <Card.Subtitle className="text-muted">
                  Total Courses
                </Card.Subtitle>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm stats-card">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-calendar-check fs-1 text-info"></i>
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">95%</Card.Text>
                <Card.Subtitle className="text-muted">
                  Attendance Rate
                </Card.Subtitle>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={6}>
            <Card className="shadow-sm chart-card">
              <Card.Body>
                <Card.Title>Student Growth</Card.Title>
                <Bar data={barData} options={{ responsive: true }} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm chart-card">
              <Card.Body>
                <Card.Title>Student Status</Card.Title>
                <Pie data={pieData} options={{ responsive: true }} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={8}>
            <Card className="shadow-sm activity-card">
              <Card.Body>
                <Card.Title>Recent Activity</Card.Title>
                <Table hover responsive>
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
                        <td>{activity.user}</td>
                        <td>{activity.action}</td>
                        <td>
                          <Badge bg="secondary">{activity.time}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm quick-actions-card">
              <Card.Body>
                <Card.Title>Quick Actions</Card.Title>
                <div className="d-grid gap-2">
                  <Button
                    variant="outline-primary"
                    className="text-start d-flex align-items-center"
                    onClick={() => setShowStudentModal(true)}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Add New Student
                  </Button>
                  <Button
                    variant="outline-success"
                    className="text-start d-flex align-items-center"
                    onClick={() => setShowCourseModal(true)}
                  >
                    <i className="bi bi-calendar-plus me-2"></i>
                    Create Course
                  </Button>
                  <Button
                    variant="outline-warning"
                    className="text-start d-flex align-items-center"
                    onClick={() => setShowReportModal(true)}
                  >
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Generate Report
                  </Button>
                  <Button
                    variant="outline-info"
                    className="text-start d-flex align-items-center"
                    onClick={() => setShowNotificationModal(true)}
                  >
                    <i className="bi bi-envelope me-2"></i>
                    Send Notification
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

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
                      value={studentForm.yearOfStudy}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          yearOfStudy: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select Year</option>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                      <option value="5">Year 5</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                {/* <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Section</Form.Label>
                    <Form.Control
                      type="text"
                      value={studentForm.section}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          section: e.target.value,
                        })
                      }
                      placeholder="e.g., A"
                    />
                  </Form.Group>
                </Col> */}
              </Row>

              <Row>
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
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

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
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowCourseModal(false)}
            >
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
            <Button
              variant="secondary"
              onClick={() => setShowReportModal(false)}
            >
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
      </>
    );
  };

  const teacherDashboard = () => {
    const lineData = {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
      datasets: [
        {
          label: "Class Average",
          data: [65, 70, 75, 80, 85],
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
        },
      ],
    };

    return (
      <>
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-journal-text fs-1 text-primary"></i>
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">12</Card.Text>
                <Card.Subtitle className="text-muted">
                  Active Courses
                </Card.Subtitle>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-clock fs-1 text-warning"></i>
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">8</Card.Text>
                <Card.Subtitle className="text-muted">
                  Pending Grading
                </Card.Subtitle>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-chat-left-text fs-1 text-success"></i>
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">24</Card.Text>
                <Card.Subtitle className="text-muted">
                  Unread Messages
                </Card.Subtitle>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-calendar-event fs-1 text-info"></i>
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">3</Card.Text>
                <Card.Subtitle className="text-muted">
                  Today's Classes
                </Card.Subtitle>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Class Performance Trend</Card.Title>
                <Line data={lineData} options={{ responsive: true }} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Today's Schedule</Card.Title>
                <ul className="list-unstyled">
                  <li className="mb-3">
                    <strong>9:00 AM</strong>
                    <br />
                    Mathematics - Room 101
                  </li>
                  <li className="mb-3">
                    <strong>11:00 AM</strong>
                    <br />
                    Physics - Room 203
                  </li>
                  <li className="mb-3">
                    <strong>2:00 PM</strong>
                    <br />
                    Office Hours
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Upcoming Assignments</Card.Title>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Assignment</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Mathematics</td>
                      <td>Calculus Homework</td>
                      <td>Tomorrow</td>
                    </tr>
                    <tr>
                      <td>Physics</td>
                      <td>Lab Report</td>
                      <td>In 3 days</td>
                    </tr>
                    <tr>
                      <td>English</td>
                      <td>Essay Writing</td>
                      <td>Next Week</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Recent Submissions</Card.Title>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Assignment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>John Doe</td>
                      <td>Math Quiz</td>
                      <td>
                        <Badge bg="success">Submitted</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td>Jane Smith</td>
                      <td>Physics Lab</td>
                      <td>
                        <Badge bg="warning">Late</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td>Bob Johnson</td>
                      <td>Essay</td>
                      <td>
                        <Badge bg="secondary">Not Submitted</Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
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
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-book fs-1 text-primary"></i>
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">5</Card.Text>
                <Card.Subtitle className="text-muted">
                  Enrolled Courses
                </Card.Subtitle>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-check-circle fs-1 text-success"></i>
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">92%</Card.Text>
                <Card.Subtitle className="text-muted">Attendance</Card.Subtitle>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-file-earmark-text fs-1 text-warning"></i>
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">3</Card.Text>
                <Card.Subtitle className="text-muted">
                  Pending Assignments
                </Card.Subtitle>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title>
                  <i className="bi bi-award fs-1 text-info"></i>
                </Card.Title>
                <Card.Text className="fs-4 fw-bold">85%</Card.Text>
                <Card.Subtitle className="text-muted">
                  Average Grade
                </Card.Subtitle>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Upcoming Assignments</Card.Title>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Assignment</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Mathematics</td>
                      <td>Calculus Homework</td>
                      <td>Tomorrow</td>
                    </tr>
                    <tr>
                      <td>Physics</td>
                      <td>Lab Report</td>
                      <td>In 3 days</td>
                    </tr>
                    <tr>
                      <td>English</td>
                      <td>Essay Writing</td>
                      <td>Next Week</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Recent Grades</Card.Title>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Assignment</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Mathematics</td>
                      <td>Mid-term Exam</td>
                      <td>
                        <Badge bg="success">A</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td>Physics</td>
                      <td>Quiz 2</td>
                      <td>
                        <Badge bg="warning">B+</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td>Chemistry</td>
                      <td>Lab Experiment</td>
                      <td>
                        <Badge bg="info">A-</Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>
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
                      <td>Grade 10 - A</td>
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
                      <td>Grade 8 - B</td>
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
            Welcome back, {user?.username || "User"}!
          </p>
        </div>
        <Badge bg="info" className="fs-6">
          {user?.role?.toUpperCase()}
        </Badge>
      </div>

      {getRoleBasedContent()}
    </Container>
  );
};

export default Dashboard;
