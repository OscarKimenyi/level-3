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
//import { useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
import api from "../services/api";

const Students = () => {
  const { user } = useAuth();
  //const navigate = useNavigate();

  // State management
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    classGrade: "",
    gender: "Male",
    dateOfBirth: "",
    address: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: "",
    },
  });

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/students?page=${page}&limit=10&search=${search}`,
      );
      setStudents(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setError("");
    } catch (err) {
      console.error("Error fetching students:", err);
      if (err.response?.status === 403) {
        setError("You do not have permission to view students");
      } else {
        setError("Failed to load students");
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "teacher") {
      fetchStudents();
    }
  }, [fetchStudents, user?.role]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  // Handle add student
  const handleAddStudent = async () => {
    try {
      setSubmitting(true);
      setError("");

      // Validate required fields
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.phone
      ) {
        setError("Please fill in all required fields");
        setSubmitting(false);
        return;
      }

      if (!formData.classGrade) {
        setError("Please select year of study");
        setSubmitting(false);
        return;
      }

      // Create unique username
      const baseUsername = formData.email.split("@")[0];
      const uniqueUsername = `${baseUsername}_${Date.now()}`;

      console.log("Creating user with data:", {
        username: uniqueUsername,
        email: formData.email,
        role: "student",
      });

      // Create user account FIRST
      const userResponse = await api.post("/auth/register", {
        username: uniqueUsername,
        email: formData.email,
        password: "student123",
        role: "student",
      });

      console.log("User created:", userResponse.data);

      if (!userResponse.data.success) {
        throw new Error(userResponse.data.message || "Failed to create user");
      }

      // THEN create student profile with the userId
      const studentData = {
        userId: userResponse.data.user.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        classGrade: formData.classGrade,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || new Date(),
        address: formData.address || "",
        emergencyContact: formData.emergencyContact,
      };

      console.log("Creating student profile with data:", studentData);

      const studentResponse = await api.post("/students", studentData);

      console.log("Student profile created:", studentResponse.data);

      setSuccess("Student added successfully! Default password: student123");
      setShowAddModal(false);
      resetForm();
      fetchStudents();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error adding student:", err);

      // Handle specific error messages
      if (err.response?.data?.message) {
        if (
          err.response.data.message.includes("already has a student profile")
        ) {
          setError(
            "This email is already associated with a student. Please use a different email.",
          );
        } else if (
          err.response.data.message.includes("email already registered")
        ) {
          setError(
            "This email is already registered. Please use a different email.",
          );
        } else {
          setError(err.response.data.message);
        }
      } else {
        setError("Failed to add student. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };
  // Handle edit student
  const handleEditStudent = async () => {
    if (!selectedStudent) return;

    try {
      setSubmitting(true);
      setError("");

      await api.put(`/students/${selectedStudent._id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        classGrade: formData.classGrade,
        section: formData.section,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
      });

      setSuccess("Student updated successfully");
      setShowEditModal(false);
      fetchStudents();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating student:", err);
      setError("Failed to update student");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete student
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      await api.delete(`/students/${selectedStudent._id}`);
      setSuccess("Student deleted successfully");
      setShowDeleteModal(false);
      fetchStudents();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting student:", err);
      setError("Failed to delete student");
    }
  };

  // Open edit modal
  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      email: student.userId?.email || "",
      phone: student.phone || "",
      classGrade: student.classGrade || "",
      gender: student.gender || "Male",
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
      address: student.address || "",
      emergencyContact: student.emergencyContact || {
        name: "",
        phone: "",
        relationship: "",
      },
    });
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      classGrade: "",
      gender: "Male",
      dateOfBirth: "",
      address: "",
      emergencyContact: {
        name: "",
        phone: "",
        relationship: "",
      },
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      active: "success",
      inactive: "secondary",
      graduated: "info",
      transferred: "warning",
    };
    return (
      <Badge bg={statusMap[status] || "secondary"}>{status || "active"}</Badge>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Check if user can edit/delete
  const canManage = user?.role === "admin";

  if (loading && !students.length) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-people me-2"></i>
          Student Management
        </h2>
        {canManage && (
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-plus-circle me-2"></i>
            Add New Student
          </Button>
        )}
      </div>

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

      {/* Search Bar */}
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
                    placeholder="Search by name, student ID, or email"
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

      {/* Students Table */}
      <Card className="shadow-sm">
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Year of Study</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td>
                    <strong>{student.studentId}</strong>
                  </td>
                  <td>
                    {student.firstName} {student.lastName}
                  </td>
                  <td>{student.classGrade || "N/A"}</td>
                  <td>
                    <div>{student.phone}</div>
                    <small className="text-muted">
                      {student.userId?.email}
                    </small>
                  </td>
                  <td>{getStatusBadge(student.status)}</td>
                  <td>
                    <Button
                      variant="outline-info"
                      size="sm"
                      className="me-2"
                      onClick={() => openViewModal(student)}
                      title="View Details"
                    >
                      <i className="bi bi-eye"></i>
                    </Button>

                    {canManage && (
                      <>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="me-2"
                          onClick={() => openEditModal(student)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowDeleteModal(true);
                          }}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {students.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    <i className="bi bi-people display-4 d-block text-muted mb-3"></i>
                    <p className="text-muted">No students found</p>
                    {canManage && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowAddModal(true)}
                      >
                        Add your first student
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* Pagination */}
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

      {/* Add Student Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
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
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
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
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
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
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
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
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
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
                    value={formData.classGrade}
                    onChange={(e) =>
                      setFormData({ ...formData, classGrade: e.target.value })
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

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
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
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3 mb-2">Emergency Contact</h6>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.emergencyContact.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          name: e.target.value,
                        },
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.emergencyContact.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          phone: e.target.value,
                        },
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Relationship</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          relationship: e.target.value,
                        },
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
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
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

      {/* Edit Student Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Student</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
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
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={formData.email} disabled />
                  <Form.Text className="text-muted">
                    Email cannot be changed
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Year of Study</Form.Label>
                  <Form.Select
                    type="text"
                    value={formData.classGrade}
                    onChange={(e) =>
                      setFormData({ ...formData, classGrade: e.target.value })
                    }
                  >
                    <option value="">Select Year</option>
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Fourth Year">Fourth Year</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              {/* <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Section</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                  />
                </Form.Group>
              </Col> */}
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEditStudent}
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
        </Modal.Footer>
      </Modal>

      {/* View Student Modal */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Student Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <div>
              <div className="text-center mb-4">
                <div
                  className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                  style={{ width: "80px", height: "80px", fontSize: "2rem" }}
                >
                  {selectedStudent.firstName?.[0]}
                  {selectedStudent.lastName?.[0]}
                </div>
                <h4 className="mt-2">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h4>
                <p className="text-muted">{selectedStudent.studentId}</p>
                {getStatusBadge(selectedStudent.status)}
              </div>

              <Row>
                <Col md={6}>
                  <h6>Personal Information</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <th>Email:</th>
                        <td>{selectedStudent.userId?.email}</td>
                      </tr>
                      <tr>
                        <th>Phone:</th>
                        <td>{selectedStudent.phone}</td>
                      </tr>
                      <tr>
                        <th>Date of Birth:</th>
                        <td>{formatDate(selectedStudent.dateOfBirth)}</td>
                      </tr>
                      <tr>
                        <th>Gender:</th>
                        <td>{selectedStudent.gender}</td>
                      </tr>
                    </tbody>
                  </table>
                </Col>
                <Col md={6}>
                  <h6>Academic Information</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <th>Year of Study:</th>
                        <td>{selectedStudent.classGrade || "N/A"}</td>
                      </tr>
                      <tr>
                        <th>Enrollment Date:</th>
                        <td>{formatDate(selectedStudent.enrollmentDate)}</td>
                      </tr>
                    </tbody>
                  </table>
                </Col>
              </Row>

              {selectedStudent.emergencyContact?.name && (
                <>
                  <h6 className="mt-3">Emergency Contact</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <th>Name:</th>
                        <td>{selectedStudent.emergencyContact.name}</td>
                      </tr>
                      <tr>
                        <th>Phone:</th>
                        <td>{selectedStudent.emergencyContact.phone}</td>
                      </tr>
                      <tr>
                        <th>Relationship:</th>
                        <td>{selectedStudent.emergencyContact.relationship}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
          {canManage && (
            <Button
              variant="primary"
              onClick={() => {
                setShowViewModal(false);
                openEditModal(selectedStudent);
              }}
            >
              Edit Student
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{" "}
          <strong>
            {selectedStudent?.firstName} {selectedStudent?.lastName}
          </strong>
          ?
          <br />
          <span className="text-danger">This action cannot be undone.</span>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteStudent}>
            Delete Student
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Students;
