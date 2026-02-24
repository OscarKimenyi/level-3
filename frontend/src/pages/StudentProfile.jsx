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
} from "react-bootstrap";
import useAuth from "../context/useAuth";
import api from "../services/api";

const StudentProfile = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [attendance] = useState([
    // Remove setAttendance
    { course: "Mathematics", present: 45, absent: 5, percentage: 90 },
    { course: "Physics", present: 42, absent: 8, percentage: 84 },
    { course: "Chemistry", present: 48, absent: 2, percentage: 96 },
  ]);
  const [grades] = useState([
    // Remove setGrades
    { course: "Mathematics", assignment: "Mid-term", grade: "A", score: 95 },
    { course: "Physics", assignment: "Lab Report", grade: "B+", score: 87 },
    { course: "Chemistry", assignment: "Final Exam", grade: "A-", score: 90 },
  ]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

      const profileRes = await api.get("/students/profile");
      const studentData = profileRes.data.data;
      setStudent(studentData);
      setFormData({
        firstName: studentData.firstName || "",
        lastName: studentData.lastName || "",
        phone: studentData.phone || "",
        classGrade: studentData.classGrade || "",
        gender: studentData.gender || "Male",
        dateOfBirth: studentData.dateOfBirth
          ? new Date(studentData.dateOfBirth).toISOString().split("T")[0]
          : "",
        address: studentData.address || "",
        emergencyContact: studentData.emergencyContact || {
          name: "",
          phone: "",
          relationship: "",
        },
      });

      // Get enrolled courses
      const coursesRes = await api.get("/courses");
      const enrolledCourses =
        coursesRes.data.data?.filter((course) =>
          course.students?.some((s) => s._id === studentData._id),
        ) || [];
      setCourses(enrolledCourses);

      setError("");
    } catch (err) {
      console.error("Error fetching profile:", err);
      if (err.response?.status === 404) {
        setError("Student profile not found. Please contact administrator.");
      } else {
        setError("Failed to load profile data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setSubmitting(true);
      setError("");

      if (!formData.firstName || !formData.lastName || !formData.phone) {
        setError("Please fill in all required fields");
        setSubmitting(false);
        return;
      }

      const response = await api.put(`/students/${student._id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        classGrade: formData.classGrade,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
      });

      if (response.data.success) {
        setStudent(response.data.data);
        setSuccess("Profile updated successfully");
        setEditing(false);
        fetchStudentProfile();

        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      if (err.response?.status === 403) {
        setError("You do not have permission to update this profile.");
      } else if (err.response?.status === 404) {
        setError("Student profile not found.");
      } else {
        setError(err.response?.data?.message || "Failed to update profile");
      }
    } finally {
      setSubmitting(false);
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
      <h2 className="mb-4">
        <i className="bi bi-person-badge me-2"></i>
        Student Profile
      </h2>

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess("")} dismissible>
          {success}
        </Alert>
      )}

      <Row>
        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Body className="text-center">
              <div
                className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}
              >
                {student?.firstName?.[0]}
                {student?.lastName?.[0]}
              </div>
              <h4>
                {student?.firstName} {student?.lastName}
              </h4>
              <p className="text-muted">{student?.studentId}</p>
              <Badge
                bg={student?.status === "active" ? "success" : "secondary"}
              >
                {student?.status}
              </Badge>

              <Button
                variant="outline-primary"
                className="mt-3 w-100"
                onClick={() => setEditing(!editing)}
              >
                <i className={`bi bi-${editing ? "x" : "pencil"} me-2`}></i>
                {editing ? "Cancel Edit" : "Edit Profile"}
              </Button>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Body>
              <h6>Quick Stats</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>Enrolled Courses:</strong> {courses.length}
                </li>
                <li className="mb-2">
                  <strong>Attendance Rate:</strong> 92%
                </li>
                <li>
                  <strong>Average Grade:</strong> 88%
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
                          <Form.Label>Year of Study</Form.Label>
                          <Form.Select
                            name="classGrade"
                            value={formData.classGrade || ""}
                            onChange={handleChange}
                          >
                            <option value="">Select Year</option>
                            <option value="First Year">First Year</option>
                            <option value="Second Year">Second Year</option>
                            <option value="Third Year">Third Year</option>
                            <option value="Fourth Year">Fourth Year</option>
                          </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Gender</Form.Label>
                          <Form.Select
                            name="gender"
                            value={formData.gender || "Male"}
                            onChange={handleChange}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </Form.Select>
                        </Form.Group>

                        <Button
                          variant="primary"
                          onClick={handleUpdateProfile}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
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
                          <strong>Phone:</strong> {student?.phone || "N/A"}
                        </p>
                        <p>
                          <strong>Year of Study:</strong>{" "}
                          {student?.classGrade || "N/A"}
                        </p>
                        <p>
                          <strong>Date of Birth:</strong>{" "}
                          {student?.dateOfBirth
                            ? new Date(student.dateOfBirth).toLocaleDateString()
                            : "N/A"}
                        </p>
                        <p>
                          <strong>Gender:</strong> {student?.gender || "N/A"}
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
                        {courses.length === 0 && (
                          <tr>
                            <td colSpan="4" className="text-center text-muted">
                              No courses enrolled
                            </td>
                          </tr>
                        )}
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
