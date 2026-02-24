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
  Form,
  ListGroup,
} from "react-bootstrap";
import api from "../services/api";
import { formatDate } from "../utils/helpers";
import useAuth from "../context/useAuth";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");

  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data.data);

      // Fetch students enrolled in this course
      const studentsRes = await api.get(`/courses/${id}/students`);
      setStudents(studentsRes.data.data || []);

      // Fetch assignments for this course
      const assignmentsRes = await api.get(`/assignments?courseId=${id}`);
      setAssignments(assignmentsRes.data.data || []);

      setError("");
    } catch (err) {
      console.error("Error fetching course details:", err);
      setError("Failed to load course details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  const fetchAvailableStudents = async () => {
    try {
      const response = await api.get("/students?limit=100");
      // Filter out students already enrolled
      const enrolledIds = students.map((s) => s._id);
      const available = response.data.data.filter(
        (s) => !enrolledIds.includes(s._id),
      );
      setAvailableStudents(available);
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to load available students");
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudent) return;

    try {
      await api.post(`/courses/${id}/enroll`, { studentId: selectedStudent });
      setSuccess("Student enrolled successfully");
      setShowEnrollModal(false);
      setSelectedStudent("");
      fetchCourseDetails();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to enroll student");
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this student from the course?",
      )
    )
      return;

    try {
      // This endpoint would need to be implemented in the backend
      await api.delete(`/courses/${id}/students/${studentId}`);
      setSuccess("Student removed successfully");
      fetchCourseDetails();
    } catch (error) {
      console.error("Error removing student:", error);
      setError("Failed to remove student");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading course details...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <Alert variant="danger" className="m-3">
        {error || "Course not found"}
        <div className="mt-2">
          <Button variant="link" onClick={() => navigate("/courses")}>
            Go back to courses
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="container-fluid py-3">
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

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button
            variant="link"
            className="text-decoration-none p-0 me-3"
            onClick={() => navigate("/courses")}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Back to Courses
          </Button>
          <h2 className="d-inline-block mb-0">
            {course.courseCode}: {course.courseName}
          </h2>
        </div>
        {(user?.role === "admin" || user?.role === "teacher") && (
          <Button
            variant="primary"
            onClick={() => {
              fetchAvailableStudents();
              setShowEnrollModal(true);
            }}
          >
            <i className="bi bi-person-plus me-2"></i>
            Enroll Student
          </Button>
        )}
      </div>

      <Row className="mb-4">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Course Information</h5>
              <Row>
                <Col md={6}>
                  <p>
                    <strong>Course Code:</strong> {course.courseCode}
                  </p>
                  <p>
                    <strong>Course Name:</strong> {course.courseName}
                  </p>
                  <p>
                    <strong>Credits:</strong> {course.credits}
                  </p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>Semester:</strong> {course.semester}
                  </p>
                  <p>
                    <strong>Academic Year:</strong> {course.academicYear}
                  </p>
                  <p>
                    <strong>Teacher:</strong> {course.teacher?.firstName}{" "}
                    {course.teacher?.lastName}
                  </p>
                </Col>
              </Row>
              {course.description && (
                <>
                  <h6 className="mt-3">Description</h6>
                  <p>{course.description}</p>
                </>
              )}
              <h6 className="mt-3">Schedule</h6>
              <ListGroup>
                {course.schedule?.map((s, index) => (
                  <ListGroup.Item key={index}>
                    <i className="bi bi-calendar-event me-2"></i>
                    {s.day}: {s.startTime} - {s.endTime} in {s.room}
                  </ListGroup.Item>
                ))}
                {(!course.schedule || course.schedule.length === 0) && (
                  <ListGroup.Item className="text-muted">
                    No schedule set
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5>Quick Stats</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="bi bi-people me-2"></i>
                  <strong>Enrolled Students:</strong> {students.length} /{" "}
                  {course.maxStudents}
                </li>
                <li className="mb-2">
                  <i className="bi bi-journal-text me-2"></i>
                  <strong>Assignments:</strong> {assignments.length}
                </li>
                <li>
                  <i className="bi bi-clock me-2"></i>
                  <strong>Status:</strong>{" "}
                  <Badge
                    bg={
                      students.length >= course.maxStudents
                        ? "warning"
                        : "success"
                    }
                  >
                    {students.length >= course.maxStudents
                      ? "Full"
                      : "Available"}
                  </Badge>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Body>
          <Tabs defaultActiveKey="students" className="mb-3">
            <Tab eventKey="students" title="Enrolled Students">
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Contact</th>
                    {(user?.role === "admin" || user?.role === "teacher") && (
                      <th>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td>{student.studentId}</td>
                      <td>
                        <Button
                          variant="link"
                          className="p-0 text-decoration-none"
                          onClick={() => navigate(`/students/${student._id}`)}
                        >
                          {student.firstName} {student.lastName}
                        </Button>
                      </td>
                      <td>
                        {student.classGrade} - {student.section}
                      </td>
                      <td>{student.phone}</td>
                      {(user?.role === "admin" || user?.role === "teacher") && (
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveStudent(student._id)}
                          >
                            <i className="bi bi-person-x"></i>
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted">
                        No students enrolled yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Tab>

            <Tab eventKey="assignments" title="Assignments">
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Due Date</th>
                    <th>Max Points</th>
                    <th>Submissions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment._id}>
                      <td>{assignment.title}</td>
                      <td>{formatDate(assignment.dueDate)}</td>
                      <td>{assignment.maxPoints}</td>
                      <td>
                        <Badge bg="info">
                          {assignment.submissions?.length || 0} /{" "}
                          {students.length}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          bg={
                            assignment.status === "published"
                              ? "success"
                              : assignment.status === "draft"
                                ? "secondary"
                                : "warning"
                          }
                        >
                          {assignment.status}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() =>
                            navigate(`/assignments?id=${assignment._id}`)
                          }
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted">
                        No assignments yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Enroll Student Modal */}
      <Modal show={showEnrollModal} onHide={() => setShowEnrollModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Enroll Student</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Select Student</Form.Label>
              <Form.Select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <option value="">Choose a student...</option>
                {availableStudents.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.firstName} {student.lastName} - {student.studentId}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEnrollStudent}
            disabled={!selectedStudent}
          >
            Enroll
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CourseDetails;
