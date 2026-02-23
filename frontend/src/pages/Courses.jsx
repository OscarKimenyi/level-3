import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Form,
  InputGroup,
  Row,
  Col,
  Card,
  Modal,
  Alert,
  Spinner,
  Badge,
  Pagination,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import api from "../services/api";

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [formData, setFormData] = useState({
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

  const navigate = useNavigate();

  // Fetch courses based on user role
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      let response;

      // Different endpoints based on user role
      if (user?.role === "teacher") {
        // Teachers see only their assigned courses
        response = await api.get(
          `/courses/my-courses?page=${page}&limit=10&search=${search}`,
        );
      } else if (user?.role === "student") {
        // Students see only courses they're enrolled in
        response = await api.get(
          `/courses?page=${page}&limit=10&search=${search}`,
        );
        // Filter to show only enrolled courses on frontend if backend doesn't support it
      } else {
        // Admins see all courses
        response = await api.get(
          `/courses?page=${page}&limit=10&search=${search}`,
        );
      }

      setCourses(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setError("");
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [page, search, user?.role]);

  // Fetch teachers (only for admin)
  const fetchTeachers = useCallback(async () => {
    if (user?.role === "admin") {
      try {
        const response = await api.get("/teachers?limit=100");
        setTeachers(response.data.data || []);
      } catch (err) {
        console.error("Error fetching teachers:", err);
      }
    }
  }, [user?.role]);

  // Fetch available students for enrollment (only for admin/teacher)
  const fetchAvailableStudents = useCallback(
    async (courseId) => {
      if (user?.role === "admin" || user?.role === "teacher") {
        try {
          const response = await api.get("/students?limit=100");
          // Get current course students
          const courseResponse = await api.get(`/courses/${courseId}/students`);
          const enrolledIds = courseResponse.data.data.map((s) => s._id);
          // Filter out already enrolled students
          const available = response.data.data.filter(
            (s) => !enrolledIds.includes(s._id),
          );
          setAvailableStudents(available);
        } catch (err) {
          console.error("Error fetching students:", err);
        }
      }
    },
    [user?.role],
  );

  useEffect(() => {
    fetchCourses();
    fetchTeachers();
  }, [fetchCourses, fetchTeachers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCourses();
  };

  // Handle Add Course (Admin only)
  const handleAddCourse = async () => {
    if (user?.role !== "admin") {
      setError("Only administrators can create courses");
      return;
    }

    try {
      if (!formData.courseCode || !formData.courseName || !formData.teacher) {
        setError("Please fill in all required fields");
        return;
      }

      await api.post("/courses", formData);

      setSuccess("Course created successfully");
      setShowAddModal(false);
      resetForm();
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create course");
    }
  };

  // Handle Edit Course (Admin only)
  const handleEditCourse = async () => {
    if (user?.role !== "admin") {
      setError("Only administrators can edit courses");
      return;
    }

    try {
      await api.put(`/courses/${selectedCourse._id}`, formData);
      setSuccess("Course updated successfully");
      setShowEditModal(false);
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update course");
    }
  };

  // Handle Delete Course (Admin only)
  const handleDeleteCourse = async () => {
    if (user?.role !== "admin") {
      setError("Only administrators can delete courses");
      return;
    }

    try {
      await api.delete(`/courses/${selectedCourse._id}`);
      setSuccess("Course deleted successfully");
      setShowDeleteModal(false);
      fetchCourses();
    } catch {
      setError("Failed to delete course");
    }
  };

  // Handle Enroll Student (Admin/Teacher only)
  const handleEnrollStudent = async () => {
    if (!selectedStudent || !selectedCourse) return;

    if (user?.role !== "admin" && user?.role !== "teacher") {
      setError("You do not have permission to enroll students");
      return;
    }

    try {
      await api.post(`/courses/${selectedCourse._id}/enroll`, {
        studentId: selectedStudent,
      });
      setSuccess("Student enrolled successfully");
      setShowEnrollModal(false);
      setSelectedStudent("");
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to enroll student");
    }
  };

  // Open edit modal (Admin only)
  const openEditModal = (course) => {
    if (user?.role !== "admin") return;

    setSelectedCourse(course);
    setFormData({
      courseCode: course.courseCode,
      courseName: course.courseName,
      description: course.description || "",
      credits: course.credits,
      teacher: course.teacher?._id || course.teacher,
      semester: course.semester,
      academicYear: course.academicYear,
      maxStudents: course.maxStudents,
      schedule: course.schedule || [
        {
          day: "Monday",
          startTime: "09:00",
          endTime: "10:30",
          room: "",
        },
      ],
    });
    setShowEditModal(true);
  };

  // Open enroll modal (Admin/Teacher only)
  const openEnrollModal = async (course) => {
    if (user?.role !== "admin" && user?.role !== "teacher") return;

    setSelectedCourse(course);
    await fetchAvailableStudents(course._id);
    setShowEnrollModal(true);
  };

  const resetForm = () => {
    setFormData({
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

  const addScheduleRow = () => {
    setFormData({
      ...formData,
      schedule: [
        ...formData.schedule,
        { day: "Monday", startTime: "09:00", endTime: "10:30", room: "" },
      ],
    });
  };

  const removeScheduleRow = (index) => {
    const newSchedule = formData.schedule.filter((_, i) => i !== index);
    setFormData({ ...formData, schedule: newSchedule });
  };

  const updateScheduleRow = (index, field, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[index][field] = value;
    setFormData({ ...formData, schedule: newSchedule });
  };

  const getTeacherName = (teacher) => {
    if (!teacher) return "Not Assigned";
    if (typeof teacher === "object") {
      return (
        `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() ||
        "Not Assigned"
      );
    }
    const foundTeacher = teachers.find((t) => t._id === teacher);
    return foundTeacher
      ? `${foundTeacher.firstName} ${foundTeacher.lastName}`
      : "Not Assigned";
  };

  // Check if current user is enrolled in a course (for students)
  const isStudentEnrolled = (course) => {
    if (user?.role !== "student") return false;
    return course.students?.some((s) => {
      const studentId = s._id || s;
      return studentId.toString() === user._id.toString();
    });
  };

  if (loading && !courses.length) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-book me-2"></i>
          {user?.role === "student"
            ? "My Enrolled Courses"
            : "Course Management"}
        </h2>
        {/* Only Admin can create new courses */}
        {user?.role === "admin" && (
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-plus-circle me-2"></i>
            Create New Course
          </Button>
        )}
      </div>

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

      {/* Search - Available to all users */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="g-3">
              <Col md={8}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by course code or name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={4}>
                <Button
                  type="submit"
                  variant="outline-primary"
                  className="w-100"
                >
                  Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Teacher</th>
                <th>Credits</th>
                <th>Schedule</th>
                {/* Only show student count to admin/teacher */}
                {(user?.role === "admin" || user?.role === "teacher") && (
                  <th>Students</th>
                )}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id}>
                  <td>
                    <strong>{course.courseCode}</strong>
                  </td>
                  <td>{course.courseName}</td>
                  <td>{getTeacherName(course.teacher)}</td>
                  <td>
                    <Badge bg="info">{course.credits} credits</Badge>
                  </td>
                  <td>
                    {course.schedule && course.schedule.length > 0 ? (
                      <div>
                        {course.schedule.map((s, idx) => (
                          <div key={idx} className="small">
                            {s.day} {s.startTime}-{s.endTime}
                            {s.room && (
                              <span className="text-muted"> ({s.room})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">No schedule</span>
                    )}
                  </td>
                  {/* Show student count only to admin/teacher */}
                  {(user?.role === "admin" || user?.role === "teacher") && (
                    <td>
                      <Badge bg="secondary">
                        {course.students?.length || 0} /{" "}
                        {course.maxStudents || 30}
                      </Badge>
                    </td>
                  )}
                  <td>
                    {/* View details - Available to all */}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => navigate(`/courses/${course._id}`)}
                    >
                      <i className="bi bi-eye"></i>
                    </Button>

                    {/* Enroll students - Only admin/teacher */}
                    {(user?.role === "admin" || user?.role === "teacher") && (
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="me-2"
                        onClick={() => openEnrollModal(course)}
                        title="Enroll Student"
                      >
                        <i className="bi bi-person-plus"></i>
                      </Button>
                    )}

                    {/* Edit - Only admin */}
                    {user?.role === "admin" && (
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="me-2"
                        onClick={() => openEditModal(course)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                    )}

                    {/* Delete - Only admin */}
                    {user?.role === "admin" && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          setSelectedCourse(course);
                          setShowDeleteModal(true);
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    )}

                    {/* Show enrolled status for students */}
                    {user?.role === "student" &&
                      (isStudentEnrolled(course) ? (
                        <Badge bg="success">Enrolled</Badge>
                      ) : (
                        <Badge bg="secondary">Not Enrolled</Badge>
                      ))}
                  </td>
                </tr>
              ))}
              {courses.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <i className="bi bi-book display-4 d-block text-muted mb-3"></i>
                    <p className="text-muted">
                      {user?.role === "student"
                        ? "You are not enrolled in any courses yet"
                        : "No courses found"}
                    </p>
                    {user?.role === "admin" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowAddModal(true)}
                      >
                        Create your first course
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.Prev
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                />
                {[...Array(totalPages).keys()].map((p) => (
                  <Pagination.Item
                    key={p + 1}
                    active={p + 1 === page}
                    onClick={() => setPage(p + 1)}
                  >
                    {p + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Course Modal - Admin Only */}
      {user?.role === "admin" && (
        <Modal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New Course</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Form fields (same as before) */}
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Course Code *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.courseCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
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
                      value={formData.courseName}
                      onChange={(e) =>
                        setFormData({ ...formData, courseName: e.target.value })
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
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Course description"
                />
              </Form.Group>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Credits</Form.Label>
                    <Form.Select
                      value={formData.credits}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
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
                      value={formData.teacher}
                      onChange={(e) =>
                        setFormData({ ...formData, teacher: e.target.value })
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
                      value={formData.maxStudents}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
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
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: e.target.value })
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
                      value={formData.academicYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
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

              {formData.schedule.map((slot, index) => (
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
                      disabled={formData.schedule.length === 1}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </Col>
                </Row>
              ))}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddCourse}>
              Create Course
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Edit Course Modal - Admin Only */}
      {user?.role === "admin" && (
        <Modal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Edit Course</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Same form fields as Add Modal */}
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Course Code *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.courseCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          courseCode: e.target.value.toUpperCase(),
                        })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Course Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.courseName}
                      onChange={(e) =>
                        setFormData({ ...formData, courseName: e.target.value })
                      }
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
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </Form.Group>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Credits</Form.Label>
                    <Form.Select
                      value={formData.credits}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
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
                      value={formData.teacher}
                      onChange={(e) =>
                        setFormData({ ...formData, teacher: e.target.value })
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
                      value={formData.maxStudents}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxStudents: parseInt(e.target.value),
                        })
                      }
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

              {formData.schedule.map((slot, index) => (
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
                      disabled={formData.schedule.length === 1}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </Col>
                </Row>
              ))}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditCourse}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Enroll Student Modal - Admin/Teacher only */}
      {(user?.role === "admin" || user?.role === "teacher") && (
        <Modal show={showEnrollModal} onHide={() => setShowEnrollModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              Enroll Student in {selectedCourse?.courseCode}
            </Modal.Title>
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
                      {student.firstName} {student.lastName} -{" "}
                      {student.studentId}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowEnrollModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEnrollStudent}
              disabled={!selectedStudent}
            >
              Enroll Student
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Delete Confirmation Modal - Admin Only */}
      {user?.role === "admin" && (
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete{" "}
            <strong>
              {selectedCourse?.courseCode} - {selectedCourse?.courseName}
            </strong>
            ?
            <br />
            <span className="text-danger">This action cannot be undone.</span>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCourse}>
              Delete Course
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default Courses;
