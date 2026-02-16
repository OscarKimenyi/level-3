import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  Card,
  Row,
  Col,
  Alert,
  Spinner,
  Badge,
  Modal,
  Dropdown,
  DropdownButton,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { formatDate } from "../utils/helpers";

const Attendance = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (user?.role === "teacher") {
      fetchTeacherCourses();
    } else if (user?.role === "admin") {
      fetchAllCourses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse && date) {
      fetchCourseStudents();
      fetchAttendanceData();
    }
  }, [selectedCourse, date, fetchCourseStudents, fetchAttendanceData]);

  const fetchTeacherCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/courses/my-courses");
      setCourses(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedCourse(response.data.data[0]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/courses");
      setCourses(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedCourse(response.data.data[0]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchCourseStudents = async () => {
    try {
      const response = await axios.get(
        `/courses/${selectedCourse._id}/students`,
      );
      setStudents(response.data.data);

      // Initialize attendance status for each student
      const initialAttendance = response.data.data.map((student) => ({
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        status: "present",
      }));
      setAttendance(initialAttendance);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchAttendanceData = async () => {
    try {
      const response = await axios.get(
        `/attendance/course/${selectedCourse._id}?date=${date}`,
      );
      if (response.data.data && response.data.data.length > 0) {
        // Update attendance status based on existing data
        const updatedAttendance = attendance.map((item) => {
          const existing = response.data.data.find(
            (a) => a.student === item.studentId,
          );
          return existing ? { ...item, status: existing.status } : item;
        });
        setAttendance(updatedAttendance);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, status } : item,
      ),
    );
  };

  const handleSubmitAttendance = async () => {
    try {
      const attendanceData = {
        course: selectedCourse._id,
        date: new Date(date),
        records: attendance.map((item) => ({
          student: item.studentId,
          status: item.status,
        })),
      };

      await axios.post("/attendance/mark", attendanceData);

      // Emit WebSocket event for real-time update
      if (socket) {
        socket.emit("attendance_updated", {
          courseId: selectedCourse._id,
          date: date,
        });
      }

      setSuccess("Attendance marked successfully");

      // Show success message for 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to mark attendance");
    }
  };

  const handleBulkAction = (status) => {
    setAttendance((prev) => prev.map((item) => ({ ...item, status })));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { color: "success", icon: "bi-check-circle" },
      absent: { color: "danger", icon: "bi-x-circle" },
      late: { color: "warning", icon: "bi-clock" },
      excused: { color: "info", icon: "bi-info-circle" },
    };

    const config = statusConfig[status] || statusConfig.present;

    return (
      <Badge bg={config.color} className="d-flex align-items-center">
        <i className={`bi ${config.icon} me-1`}></i>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading attendance data...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      <h2 className="mb-4">
        <i className="bi bi-calendar-check me-2"></i>
        Attendance Management
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

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Select Course</Form.Label>
                <Form.Select
                  value={selectedCourse?._id || ""}
                  onChange={(e) => {
                    const course = courses.find(
                      (c) => c._id === e.target.value,
                    );
                    setSelectedCourse(course);
                  }}
                >
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={5}>
              <div className="d-flex align-items-end h-100">
                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    onClick={handleSubmitAttendance}
                    disabled={!selectedCourse || students.length === 0}
                  >
                    <i className="bi bi-save me-2"></i>
                    Save Attendance
                  </Button>

                  <DropdownButton variant="secondary" title="Bulk Actions">
                    <Dropdown.Item onClick={() => handleBulkAction("present")}>
                      Mark All Present
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleBulkAction("absent")}>
                      Mark All Absent
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleBulkAction("late")}>
                      Mark All Late
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => setShowReportModal(true)}>
                      Generate Report
                    </Dropdown.Item>
                  </DropdownButton>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {selectedCourse && (
        <Card className="shadow-sm">
          <Card.Header className="bg-light">
            <h5 className="mb-0">
              {selectedCourse.courseCode} - {selectedCourse.courseName}
              <span className="text-muted ms-2">
                ({students.length} students)
              </span>
            </h5>
          </Card.Header>

          <Card.Body>
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((item) => (
                  <tr key={item.studentId}>
                    <td>
                      {students.find((s) => s._id === item.studentId)
                        ?.studentId || "N/A"}
                    </td>
                    <td>{item.studentName}</td>
                    <td>
                      {students.find((s) => s._id === item.studentId)
                        ?.classGrade || "N/A"}
                    </td>
                    <td>
                      <div className="d-inline-block">
                        {getStatusBadge(item.status)}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant={
                            item.status === "present"
                              ? "success"
                              : "outline-success"
                          }
                          size="sm"
                          onClick={() =>
                            handleStatusChange(item.studentId, "present")
                          }
                        >
                          Present
                        </Button>
                        <Button
                          variant={
                            item.status === "absent"
                              ? "danger"
                              : "outline-danger"
                          }
                          size="sm"
                          onClick={() =>
                            handleStatusChange(item.studentId, "absent")
                          }
                        >
                          Absent
                        </Button>
                        <Button
                          variant={
                            item.status === "late"
                              ? "warning"
                              : "outline-warning"
                          }
                          size="sm"
                          onClick={() =>
                            handleStatusChange(item.studentId, "late")
                          }
                        >
                          Late
                        </Button>
                        <Button
                          variant={
                            item.status === "excused" ? "info" : "outline-info"
                          }
                          size="sm"
                          onClick={() =>
                            handleStatusChange(item.studentId, "excused")
                          }
                        >
                          Excused
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Report Modal */}
      <Modal
        show={showReportModal}
        onHide={() => setShowReportModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Attendance Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCourse && (
            <div>
              <h5>
                {selectedCourse.courseCode} - {selectedCourse.courseName}
              </h5>
              <p>Date: {formatDate(date)}</p>

              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {["present", "absent", "late", "excused"].map((status) => {
                    const count = attendance.filter(
                      (a) => a.status === status,
                    ).length;
                    const percentage =
                      students.length > 0
                        ? ((count / students.length) * 100).toFixed(1)
                        : 0;

                    return (
                      <tr key={status}>
                        <td>{getStatusBadge(status)}</td>
                        <td>{count}</td>
                        <td>{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Close
          </Button>
          <Button variant="primary">
            <i className="bi bi-download me-2"></i>
            Download Report
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Attendance;
