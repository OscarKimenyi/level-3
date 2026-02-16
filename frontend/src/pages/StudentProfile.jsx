import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Tab,
  Nav,
  Table,
  Badge,
  Button,
  Form,
  Alert,
  Spinner,
  Image,
} from "react-bootstrap";
import useAuth from "../context/useAuth";
import axios from "axios";

const StudentProfile = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchStudentProfile();
    }
  }, [user]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, coursesRes] = await Promise.all([
        axios.get("/students/profile"),
        axios.get("/courses"),
      ]);

      setStudent(profileRes.data.data);
      setFormData(profileRes.data.data);
      setCourses(coursesRes.data.data?.slice(0, 5) || []);

      // Mock attendance data
      setAttendance([
        { course: "Mathematics", present: 45, absent: 5, percentage: 90 },
        { course: "Physics", present: 42, absent: 8, percentage: 84 },
        { course: "Chemistry", present: 48, absent: 2, percentage: 96 },
      ]);

      // Mock grades data
      setGrades([
        {
          course: "Mathematics",
          assignment: "Mid-term",
          grade: "A",
          score: 95,
        },
        { course: "Physics", assignment: "Lab Report", grade: "B+", score: 87 },
        {
          course: "Chemistry",
          assignment: "Final Exam",
          grade: "A-",
          score: 90,
        },
      ]);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await axios.put("/auth/profile", formData);
      setStudent(formData);
      setSuccess("Profile updated successfully");
      setEditing(false);
    } catch {
      setError("Failed to update profile");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getGradeBadge = (grade) => {
    const gradeMap = {
      A: "success",
      B: "warning",
      C: "info",
      D: "secondary",
      F: "danger",
    };
    const firstLetter = grade.charAt(0);
    return <Badge bg={gradeMap[firstLetter] || "secondary"}>{grade}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      <Row>
        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Body className="text-center">
              <Image
                src={`https://ui-avatars.com/api/?name=${student?.firstName}+${student?.lastName}&background=007bff&color=fff&size=150`}
                roundedCircle
                className="mb-3"
                style={{ width: "150px", height: "150px" }}
              />
              <h4>
                {student?.firstName} {student?.lastName}
              </h4>
              <p className="text-muted">{student?.studentId}</p>

              <div className="d-grid gap-2">
                <Button
                  variant={editing ? "secondary" : "primary"}
                  onClick={() =>
                    editing ? setEditing(false) : setEditing(true)
                  }
                >
                  <i className={`bi bi-${editing ? "x" : "pencil"} me-2`}></i>
                  {editing ? "Cancel Edit" : "Edit Profile"}
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Quick Stats</Card.Title>
              <ul className="list-unstyled">
                <li className="mb-3">
                  <strong>Enrolled Courses:</strong> {courses.length}
                </li>
                <li className="mb-3">
                  <strong>Attendance Rate:</strong> 92%
                </li>
                <li className="mb-3">
                  <strong>Average Grade:</strong> 88%
                </li>
                <li>
                  <strong>Status:</strong>{" "}
                  <Badge
                    bg={student?.status === "active" ? "success" : "secondary"}
                  >
                    {student?.status}
                  </Badge>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Tab.Container defaultActiveKey="personal">
            <Card className="shadow-sm">
              <Card.Header>
                <Nav variant="tabs" className="border-bottom-0">
                  <Nav.Item>
                    <Nav.Link eventKey="personal">Personal Info</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="courses">Courses</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="attendance">Attendance</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="grades">Grades</Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>

              <Card.Body>
                {success && (
                  <Alert
                    variant="success"
                    onClose={() => setSuccess("")}
                    dismissible
                  >
                    {success}
                  </Alert>
                )}

                {error && (
                  <Alert
                    variant="danger"
                    onClose={() => setError("")}
                    dismissible
                  >
                    {error}
                  </Alert>
                )}

                <Tab.Content>
                  <Tab.Pane eventKey="personal">
                    {editing ? (
                      <Form>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>First Name</Form.Label>
                              <Form.Control
                                type="text"
                                name="firstName"
                                value={formData.firstName || ""}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Last Name</Form.Label>
                              <Form.Control
                                type="text"
                                name="lastName"
                                value={formData.lastName || ""}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone || ""}
                            onChange={handleChange}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Class/Grade</Form.Label>
                          <Form.Control
                            type="text"
                            name="classGrade"
                            value={formData.classGrade || ""}
                            onChange={handleChange}
                          />
                        </Form.Group>

                        <Button variant="primary" onClick={handleUpdateProfile}>
                          Save Changes
                        </Button>
                      </Form>
                    ) : (
                      <div>
                        <Row>
                          <Col md={6}>
                            <p>
                              <strong>First Name:</strong> {student?.firstName}
                            </p>
                          </Col>
                          <Col md={6}>
                            <p>
                              <strong>Last Name:</strong> {student?.lastName}
                            </p>
                          </Col>
                        </Row>
                        <p>
                          <strong>Student ID:</strong> {student?.studentId}
                        </p>
                        <p>
                          <strong>Email:</strong> {user?.email}
                        </p>
                        <p>
                          <strong>Phone:</strong> {student?.phone}
                        </p>
                        <p>
                          <strong>Class/Grade:</strong> {student?.classGrade} -{" "}
                          {student?.section}
                        </p>
                        <p>
                          <strong>Date of Birth:</strong>{" "}
                          {new Date(student?.dateOfBirth).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Gender:</strong> {student?.gender}
                        </p>
                      </div>
                    )}
                  </Tab.Pane>

                  <Tab.Pane eventKey="courses">
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>Course Code</th>
                          <th>Course Name</th>
                          <th>Teacher</th>
                          <th>Schedule</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course, index) => (
                          <tr key={index}>
                            <td>{course.courseCode}</td>
                            <td>{course.courseName}</td>
                            <td>
                              {course.teacher?.firstName}{" "}
                              {course.teacher?.lastName}
                            </td>
                            <td>
                              {course.schedule?.map((s, i) => (
                                <div key={i}>
                                  {s.day} {s.startTime}-{s.endTime}
                                </div>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Tab.Pane>

                  <Tab.Pane eventKey="attendance">
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>Course</th>
                          <th>Present</th>
                          <th>Absent</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((item, index) => (
                          <tr key={index}>
                            <td>{item.course}</td>
                            <td>{item.present}</td>
                            <td>{item.absent}</td>
                            <td>
                              <Badge
                                bg={
                                  item.percentage >= 90
                                    ? "success"
                                    : item.percentage >= 75
                                      ? "warning"
                                      : "danger"
                                }
                              >
                                {item.percentage}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Tab.Pane>

                  <Tab.Pane eventKey="grades">
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>Course</th>
                          <th>Assignment</th>
                          <th>Grade</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.map((item, index) => (
                          <tr key={index}>
                            <td>{item.course}</td>
                            <td>{item.assignment}</td>
                            <td>{getGradeBadge(item.grade)}</td>
                            <td>{item.score}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Tab.Container>
        </Col>
      </Row>
    </div>
  );
};

export default StudentProfile;
