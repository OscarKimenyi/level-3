import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Button,
  Tabs,
  Tab,
  Table,
  Badge,
  Spinner,
  Alert,
  Modal,
} from "react-bootstrap";
import api from "../services/api";
import { formatDate } from "../utils/helpers";

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [courses, setCourses] = useState([]);

  // Use useCallback to memoize the fetch function
  const fetchStudentDetails = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch student details
      const studentRes = await api.get(`/students/${id}`);
      setStudent(studentRes.data.data);

      // Fetch attendance
      const attendanceRes = await api.get(`/attendance/student/${id}`);
      setAttendance(attendanceRes.data.data || []);

      // Mock courses and grades for demo
      setCourses([
        { code: "CS101", name: "Mathematics", teacher: "John Doe" },
        { code: "CS102", name: "Physics", teacher: "Jane Smith" },
        { code: "CS103", name: "Chemistry", teacher: "Bob Johnson" },
      ]);

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
      console.error("Error fetching student details:", error);
      setError("Failed to load student details");
    } finally {
      setLoading(false);
    }
  }, [id]); // Add id as dependency since it's used inside

  // Now useEffect can include fetchStudentDetails in dependencies
  useEffect(() => {
    fetchStudentDetails();
  }, [fetchStudentDetails]); // Include fetchStudentDetails in dependencies

  const handleDelete = async () => {
    try {
      await api.delete(`/students/${id}`);
      navigate("/students");
    } catch {
      setError("Failed to delete student");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: "success",
      inactive: "secondary",
      graduated: "info",
      transferred: "warning",
    };
    return <Badge bg={statusMap[status] || "secondary"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading student details...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <Alert variant="danger" className="m-3">
        {error || "Student not found"}
        <div className="mt-2">
          <Button variant="link" onClick={() => navigate("/students")}>
            Go back to students
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button
            variant="link"
            className="text-decoration-none p-0 me-3"
            onClick={() => navigate("/students")}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Back to Students
          </Button>
          <h2 className="d-inline-block mb-0">
            {student.firstName} {student.lastName}
          </h2>
          <Badge bg="secondary" className="ms-3">
            {student.studentId}
          </Badge>
        </div>
        <div>
          <Button
            variant="outline-warning"
            className="me-2"
            onClick={() => {
              /* Implement edit */
            }}
          >
            <i className="bi bi-pencil me-2"></i>
            Edit
          </Button>
          <Button
            variant="outline-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <i className="bi bi-trash me-2"></i>
            Delete
          </Button>
        </div>
      </div>

      <Row>
        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <div className="text-center mb-3">
                <div
                  className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{
                    width: "100px",
                    height: "100px",
                    fontSize: "2.5rem",
                  }}
                >
                  {student.firstName?.[0]}
                  {student.lastName?.[0]}
                </div>
                <h5 className="mt-3">
                  {student.classGrade} - {student.section}
                </h5>
                {getStatusBadge(student.status)}
              </div>

              <hr />

              <div>
                <h6>Contact Information</h6>
                <p className="mb-1">
                  <i className="bi bi-envelope me-2"></i>
                  {student.userId?.email || "N/A"}
                </p>
                <p className="mb-1">
                  <i className="bi bi-telephone me-2"></i>
                  {student.phone || "N/A"}
                </p>
                <p>
                  <i className="bi bi-calendar me-2"></i>
                  DOB: {formatDate(student.dateOfBirth)}
                </p>
              </div>

              {student.emergencyContact && (
                <>
                  <hr />
                  <div>
                    <h6>Emergency Contact</h6>
                    <p className="mb-1">
                      <strong>{student.emergencyContact.name}</strong>
                    </p>
                    <p className="mb-1">
                      <i className="bi bi-telephone me-2"></i>
                      {student.emergencyContact.phone}
                    </p>
                    <p>
                      <i className="bi bi-person me-2"></i>
                      {student.emergencyContact.relationship}
                    </p>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Body>
              <h6>Quick Stats</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>Courses:</strong> {courses.length}
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
          <Card className="shadow-sm">
            <Card.Body>
              <Tabs defaultActiveKey="courses" className="mb-3">
                <Tab eventKey="courses" title="Courses">
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Teacher</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course, index) => (
                        <tr key={index}>
                          <td>{course.code}</td>
                          <td>{course.name}</td>
                          <td>{course.teacher}</td>
                          <td>
                            <Badge bg="success">Active</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab>

                <Tab eventKey="attendance" title="Attendance">
                  <Table hover responsive>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Marked By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.length > 0 ? (
                        attendance.map((record, index) => (
                          <tr key={index}>
                            <td>{formatDate(record.date)}</td>
                            <td>{record.course?.courseName || "N/A"}</td>
                            <td>
                              <Badge
                                bg={
                                  record.status === "present"
                                    ? "success"
                                    : record.status === "late"
                                      ? "warning"
                                      : record.status === "excused"
                                        ? "info"
                                        : "danger"
                                }
                              >
                                {record.status}
                              </Badge>
                            </td>
                            <td>
                              {record.markedBy?.firstName}{" "}
                              {record.markedBy?.lastName}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center text-muted">
                            No attendance records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Tab>

                <Tab eventKey="grades" title="Grades">
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
                      {grades.map((grade, index) => (
                        <tr key={index}>
                          <td>{grade.course}</td>
                          <td>{grade.assignment}</td>
                          <td>
                            <Badge
                              bg={
                                grade.grade.startsWith("A")
                                  ? "success"
                                  : grade.grade.startsWith("B")
                                    ? "info"
                                    : grade.grade.startsWith("C")
                                      ? "warning"
                                      : "danger"
                              }
                            >
                              {grade.grade}
                            </Badge>
                          </td>
                          <td>{grade.score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{" "}
          <strong>
            {student.firstName} {student.lastName}
          </strong>
          ? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudentDetails;
