import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Container,
  Table,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // In a real app, you'd have dedicated dashboard endpoints
      const [studentsRes, coursesRes, teachersRes] = await Promise.all([
        axios.get("/students?limit=5"),
        axios.get("/courses?limit=5"),
        axios.get("/teachers?limit=5"),
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

  const getRoleBasedContent = () => {
    switch (user?.role) {
      case "admin":
        return adminDashboard();
      case "teacher":
        return teacherDashboard();
      case "student":
        return studentDashboard();
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
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center shadow-sm">
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
            <Card className="text-center shadow-sm">
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
            <Card className="text-center shadow-sm">
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
            <Card className="text-center shadow-sm">
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
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Student Growth</Card.Title>
                <Bar data={barData} options={{ responsive: true }} />
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Student Status</Card.Title>
                <Pie data={pieData} options={{ responsive: true }} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={8}>
            <Card className="shadow-sm">
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
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Quick Actions</Card.Title>
                <div className="d-grid gap-2">
                  <button className="btn btn-outline-primary text-start">
                    <i className="bi bi-plus-circle me-2"></i>
                    Add New Student
                  </button>
                  <button className="btn btn-outline-success text-start">
                    <i className="bi bi-calendar-plus me-2"></i>
                    Create Course
                  </button>
                  <button className="btn btn-outline-warning text-start">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Generate Report
                  </button>
                  <button className="btn btn-outline-info text-start">
                    <i className="bi bi-envelope me-2"></i>
                    Send Notification
                  </button>
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
                  <li>
                    <strong>2:00 PM</strong>
                    <br />
                    Office Hours
                  </li>
                </ul>
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
