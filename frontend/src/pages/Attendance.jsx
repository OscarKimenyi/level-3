import React, { useState, useEffect, useCallback } from "react";
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
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import api from "../services/api";

const Attendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Fetch courses based on user role
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      let response;

      if (user?.role === "teacher") {
        response = await api.get("/courses/my-courses");
      } else if (user?.role === "admin") {
        response = await api.get("/courses");
      } else {
        setCourses([]);
        setLoading(false);
        return;
      }

      setCourses(response.data.data || []);
      if (response.data.data?.length > 0 && !selectedCourse) {
        setSelectedCourse(response.data.data[0]);
      }
      setError("");
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [user?.role, selectedCourse]);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "teacher") {
      fetchCourses();
    } else {
      setLoading(false);
      setError("You do not have permission to view attendance");
    }
  }, [fetchCourses, user?.role]);

  // Fetch course students and attendance
  const fetchAttendanceData = useCallback(async () => {
    if (!selectedCourse) return;

    try {
      setLoading(true);

      // Fetch students in the course
      const studentsRes = await api.get(
        `/courses/${selectedCourse._id}/students`,
      );
      const studentsList = studentsRes.data.data || [];
      setStudents(studentsList);

      // Initialize attendance
      let attendanceList = studentsList.map((student) => ({
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentIdNumber: student.studentId,
        status: "present",
      }));

      // Fetch existing attendance for this date
      try {
        const attendanceRes = await api.get(
          `/attendance/course/${selectedCourse._id}?date=${date}`,
        );
        if (attendanceRes.data.data && attendanceRes.data.data.length > 0) {
          attendanceList = attendanceList.map((item) => {
            const existing = attendanceRes.data.data.find(
              (a) => a.student === item.studentId,
            );
            return existing ? { ...item, status: existing.status } : item;
          });
        }
      } catch {
        console.log("No existing attendance for this date");
      }

      setAttendance(attendanceList);
      setError("");
    } catch (err) {
      console.error("Error fetching attendance data:", err);
      setError("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, date]);

  useEffect(() => {
    if (
      selectedCourse &&
      (user?.role === "admin" || user?.role === "teacher")
    ) {
      fetchAttendanceData();
    }
  }, [selectedCourse, date, fetchAttendanceData, user?.role]);

  // Handle status change
  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, status } : item,
      ),
    );
  };

  // Handle submit attendance
  const handleSubmitAttendance = async () => {
    if (!selectedCourse || students.length === 0) {
      setError("No students to mark attendance for");
      return;
    }

    // Validate that all students have a status
    const invalidRecords = attendance.filter((a) => !a.status);
    if (invalidRecords.length > 0) {
      setError("All students must have a status selected");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const attendanceData = {
        course: selectedCourse._id,
        date: new Date(date).toISOString(),
        records: attendance.map((item) => ({
          student: item.studentId,
          status: item.status,
        })),
      };

      console.log("Submitting attendance:", attendanceData); // For debugging

      const response = await api.post("/attendance/mark", attendanceData);

      if (response.data.success) {
        setSuccess("Attendance marked successfully");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error marking attendance:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to mark attendance";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  // Handle bulk action
  const handleBulkAction = (status) => {
    setAttendance((prev) => prev.map((item) => ({ ...item, status })));
  };

  // Generate report
  const generateReport = () => {
    const summary = {
      present: attendance.filter((a) => a.status === "present").length,
      absent: attendance.filter((a) => a.status === "absent").length,
      late: attendance.filter((a) => a.status === "late").length,
      excused: attendance.filter((a) => a.status === "excused").length,
      total: attendance.length,
    };

    summary.percentage =
      summary.total > 0
        ? (((summary.present + summary.late) / summary.total) * 100).toFixed(1)
        : 0;

    setReportData(summary);
    setShowReportModal(true);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const config = {
      present: { bg: "success", icon: "bi-check-circle", label: "Present" },
      absent: { bg: "danger", icon: "bi-x-circle", label: "Absent" },
      late: { bg: "warning", icon: "bi-clock", label: "Late" },
      excused: { bg: "info", icon: "bi-info-circle", label: "Excused" },
    };
    const { bg, icon, label } = config[status] || config.present;

    return (
      <Badge bg={bg}>
        <i className={`bi ${icon} me-1`}></i>
        {label}
      </Badge>
    );
  };

  // Check permissions
  const canManageAttendance =
    user?.role === "admin" || user?.role === "teacher";

  if (!canManageAttendance) {
    return (
      <div className="container-fluid py-3">
        <Alert variant="warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          You do not have permission to view attendance.
        </Alert>
      </div>
    );
  }

  if (loading && !courses.length) {
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

      {/* Alerts */}
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

      {/* Controls Card */}
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
                  <option value="">Choose a course...</option>
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
                  max={new Date().toISOString().split("T")[0]}
                />
              </Form.Group>
            </Col>

            <Col md={5}>
              <div className="d-flex align-items-end h-100">
                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    onClick={handleSubmitAttendance}
                    disabled={
                      !selectedCourse || students.length === 0 || submitting
                    }
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-2"></i>
                        Save Attendance
                      </>
                    )}
                  </Button>

                  <Dropdown>
                    <Dropdown.Toggle variant="secondary">
                      <i className="bi bi-list me-2"></i>
                      Bulk Actions
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item
                        onClick={() => handleBulkAction("present")}
                      >
                        <i className="bi bi-check-circle text-success me-2"></i>
                        Mark All Present
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleBulkAction("absent")}>
                        <i className="bi bi-x-circle text-danger me-2"></i>
                        Mark All Absent
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleBulkAction("late")}>
                        <i className="bi bi-clock text-warning me-2"></i>
                        Mark All Late
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={generateReport}>
                        <i className="bi bi-file-earmark-text me-2"></i>
                        Generate Report
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Attendance Table */}
      {selectedCourse ? (
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
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" size="sm" />
                <span className="ms-2">Loading students...</span>
              </div>
            ) : students.length > 0 ? (
              <div className="table-responsive">
                <Table hover>
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
                        <td>{item.studentIdNumber}</td>
                        <td>{item.studentName}</td>
                        <td>
                          {students.find((s) => s._id === item.studentId)
                            ?.classGrade || "N/A"}
                        </td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              size="sm"
                              variant={
                                item.status === "present"
                                  ? "success"
                                  : "outline-success"
                              }
                              onClick={() =>
                                handleStatusChange(item.studentId, "present")
                              }
                              title="Present"
                            >
                              P
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                item.status === "absent"
                                  ? "danger"
                                  : "outline-danger"
                              }
                              onClick={() =>
                                handleStatusChange(item.studentId, "absent")
                              }
                              title="Absent"
                            >
                              A
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                item.status === "late"
                                  ? "warning"
                                  : "outline-warning"
                              }
                              onClick={() =>
                                handleStatusChange(item.studentId, "late")
                              }
                              title="Late"
                            >
                              L
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                item.status === "excused"
                                  ? "info"
                                  : "outline-info"
                              }
                              onClick={() =>
                                handleStatusChange(item.studentId, "excused")
                              }
                              title="Excused"
                            >
                              E
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="bi bi-people display-4 d-block text-muted mb-3"></i>
                <p className="text-muted">
                  No students enrolled in this course
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/courses/${selectedCourse._id}`)}
                >
                  Enroll Students
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <i className="bi bi-book display-4 d-block text-muted mb-3"></i>
            <h5>No Course Selected</h5>
            <p className="text-muted">
              Please select a course to manage attendance
            </p>
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
          {selectedCourse && reportData && (
            <div>
              <h5>
                {selectedCourse.courseCode} - {selectedCourse.courseName}
              </h5>
              <p className="text-muted">
                Date: {new Date(date).toLocaleDateString()}
              </p>

              <Row className="mb-4">
                <Col md={3}>
                  <Card className="text-center bg-light">
                    <Card.Body>
                      <h3 className="text-success">{reportData.present}</h3>
                      <small>Present</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center bg-light">
                    <Card.Body>
                      <h3 className="text-danger">{reportData.absent}</h3>
                      <small>Absent</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center bg-light">
                    <Card.Body>
                      <h3 className="text-warning">{reportData.late}</h3>
                      <small>Late</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center bg-light">
                    <Card.Body>
                      <h3 className="text-info">{reportData.excused}</h3>
                      <small>Excused</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Table striped bordered>
                <tbody>
                  <tr>
                    <th>Total Students</th>
                    <td>{reportData.total}</td>
                  </tr>
                  <tr>
                    <th>Attendance Rate</th>
                    <td>
                      <Badge
                        bg={
                          reportData.percentage >= 90
                            ? "success"
                            : reportData.percentage >= 75
                              ? "warning"
                              : "danger"
                        }
                      >
                        {reportData.percentage}%
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReportModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <i className="bi bi-printer me-2"></i>
            Print Report
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Attendance;
