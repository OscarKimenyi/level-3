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
import api from "../services/api";

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    qualification: "",
    specialization: "",
    department: "",
    joiningDate: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    qualification: "",
    specialization: "",
    department: "",
    status: "active",
  });

  // Add this function to open edit modal
  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setEditFormData({
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      email: teacher.userId?.email || "",
      phone: teacher.contactNumber || "",
      qualification: teacher.qualification || "",
      specialization: Array.isArray(teacher.specialization)
        ? teacher.specialization.join(", ")
        : teacher.specialization || "",
      department: teacher.department || "",
      status: teacher.status || "active",
    });
    setShowEditModal(true);
  };

  // Add this function to handle edit submission
  const handleEditTeacher = async () => {
    try {
      setSubmitting(true);
      setError("");

      // Validate required fields
      if (
        !editFormData.firstName ||
        !editFormData.lastName ||
        !editFormData.phone
      ) {
        setError("Please fill in all required fields");
        setSubmitting(false);
        return;
      }

      // Parse specialization from comma-separated string to array
      const specializationArray = editFormData.specialization
        ? editFormData.specialization
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s)
        : [];

      const updateData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        contactNumber: editFormData.phone,
        qualification: editFormData.qualification,
        specialization: specializationArray,
        department: editFormData.department,
        status: editFormData.status,
      };

      console.log("Updating teacher with data:", updateData);

      const response = await api.put(
        `/teachers/${editingTeacher._id}`,
        updateData,
      );

      if (response.data.success) {
        setSuccess("Teacher updated successfully");
        setShowEditModal(false);
        fetchTeachers();

        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error updating teacher:", err);
      setError(err.response?.data?.message || "Failed to update teacher");
    } finally {
      setSubmitting(false);
    }
  };

  const navigate = useNavigate();

  // Wrap fetchTeachers in useCallback to include in dependencies
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/teachers?page=${page}&limit=10&search=${search}`,
      );
      setTeachers(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setError("");
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  }, [page, search]);
  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  // Handle Add Teacher
  const handleAddTeacher = async () => {
    try {
      setSubmitting(true);
      setError("");

      // Validate form
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

      // Create a unique username from email (without timestamp for cleaner display)
      const baseUsername = formData.email.split("@")[0];
      // Don't add timestamp to username for cleaner display
      const username = baseUsername;

      console.log("Creating teacher with data:", {
        username,
        email: formData.email,
        role: "teacher",
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        qualification: formData.qualification,
        department: formData.department,
        specialization: formData.specialization,
      });

      // First create user account
      const userResponse = await api.post("/auth/register", {
        username: username,
        email: formData.email,
        password: "teacher123", // Default password
        role: "teacher",
      });

      console.log("User created:", userResponse.data);

      if (!userResponse.data.success) {
        throw new Error(userResponse.data.message || "Failed to create user");
      }

      // THEN create teacher profile with the userId
      const teacherData = {
        userId: userResponse.data.user.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        qualification: formData.qualification,
        specialization: formData.specialization
          ? formData.specialization.split(",").map((s) => s.trim())
          : [],
        contactNumber: formData.phone,
        department: formData.department,
        joiningDate: formData.joiningDate || new Date(),
      };

      console.log("Creating teacher profile with data:", teacherData);

      const teacherResponse = await api.post("/teachers", teacherData);

      console.log("Teacher profile created:", teacherResponse.data);

      setSuccess("Teacher added successfully! Default password: teacher123");
      setShowAddModal(false);
      resetForm();
      fetchTeachers(); // Refresh the list

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error adding teacher:", err);

      // Handle specific error messages
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to add teacher. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async () => {
    try {
      await api.delete(`/teachers/${selectedTeacher._id}`);
      setSuccess("Teacher deleted successfully");
      setShowDeleteModal(false);
      fetchTeachers(); // Refresh the list
    } catch {
      setError("Failed to delete teacher");
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      qualification: "",
      specialization: "",
      department: "",
      joiningDate: "",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: "success",
      inactive: "secondary",
      "on-leave": "warning",
    };
    return <Badge bg={statusMap[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-person-badge me-2"></i>
          Teacher Management
        </h2>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Teacher
        </Button>
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
                    placeholder="Search by name, teacher ID, or department"
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
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading teachers...</p>
            </div>
          ) : (
            <>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Teacher ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Qualification</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher._id}>
                      <td>{teacher.teacherId}</td>
                      <td>
                        {teacher.firstName} {teacher.lastName}
                      </td>
                      <td>{teacher.department}</td>
                      <td>{teacher.qualification}</td>
                      <td>{teacher.contactNumber}</td>
                      <td>{getStatusBadge(teacher.status)}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() =>
                            navigate(`/profile/teacher?id=${teacher._id}`)
                          }
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="me-2"
                          onClick={() => openEditModal(teacher)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setShowDeleteModal(true);
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {teachers.length === 0 && !loading && (
                <div className="text-center py-5">
                  <i className="bi bi-person-badge display-1 text-muted"></i>
                  <p className="mt-3">No teachers found</p>
                </div>
              )}

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
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add Teacher Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Teacher</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
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
                  <Form.Label>Last Name</Form.Label>
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
                  <Form.Label>Phone</Form.Label>
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
                  <Form.Label>Qualification</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.qualification}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        qualification: e.target.value,
                      })
                    }
                    placeholder="e.g., MSc, PhD"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                    <option value="Computer Science">Computer Science</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Specialization (comma separated)</Form.Label>
              <Form.Control
                type="text"
                value={formData.specialization}
                onChange={(e) =>
                  setFormData({ ...formData, specialization: e.target.value })
                }
                placeholder="e.g., Algebra, Calculus, Geometry"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Joining Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.joiningDate}
                onChange={(e) =>
                  setFormData({ ...formData, joiningDate: e.target.value })
                }
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddTeacher}>
            Add Teacher
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete {selectedTeacher?.firstName}{" "}
          {selectedTeacher?.lastName}? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddTeacher}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Adding...
              </>
            ) : (
              "Add Teacher"
            )}
          </Button>
          <Button variant="danger" onClick={handleDeleteTeacher}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Edit Teacher Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Teacher</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.firstName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
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
                    value={editFormData.lastName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
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
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={editFormData.email}
                    disabled
                  />
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
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
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
                  <Form.Label>Qualification</Form.Label>
                  <Form.Control
                    type="text"
                    value={editFormData.qualification}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        qualification: e.target.value,
                      })
                    }
                    placeholder="e.g., MSc, PhD"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    value={editFormData.department}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        department: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Department</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                    <option value="Computer Science">Computer Science</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Specialization (comma separated)</Form.Label>
              <Form.Control
                type="text"
                value={editFormData.specialization}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    specialization: e.target.value,
                  })
                }
                placeholder="e.g., Mathematics, Physics, Chemistry"
              />
              <Form.Text className="text-muted">
                Enter multiple specializations separated by commas
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-leave">On Leave</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleEditTeacher}
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
    </div>
  );
};

export default Teachers;
