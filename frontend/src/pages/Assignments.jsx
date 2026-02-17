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
  Tabs,
  Tab,
  InputGroup,
} from "react-bootstrap";
import useAuth from "../context/useAuth";
import api from "../services/api";
import { formatDate } from "../utils/helpers";

const Assignments = () => {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course: "",
    dueDate: "",
    maxPoints: 100,
    status: "draft",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch assignments
      const assignmentsRes = await api.get("/assignments");
      setAssignments(assignmentsRes.data.data || []);

      // Fetch courses for dropdown
      let coursesRes;
      if (user?.role === "teacher") {
        coursesRes = await api.get("/courses/my-courses");
      } else {
        coursesRes = await api.get("/courses");
      }
      setCourses(coursesRes.data.data || []);

      setError("");
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddAssignment = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.course || !formData.dueDate) {
        setError("Please fill in all required fields");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("course", formData.course);
      formDataToSend.append(
        "dueDate",
        new Date(formData.dueDate).toISOString(),
      );
      formDataToSend.append("maxPoints", formData.maxPoints || 100);
      formDataToSend.append("status", formData.status || "draft");

      await api.post("/assignments", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Assignment created successfully");
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Error creating assignment:", err);
      setError(err.response?.data?.message || "Failed to create assignment");
    }
  };

  const handleSubmitAssignment = async () => {
    if (!submissionFile) {
      setError("Please select a file to submit");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("submission", submissionFile);

      await api.post(
        `/assignments/${selectedAssignment._id}/submit`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      setSuccess("Assignment submitted successfully");
      setShowSubmitModal(false);
      setSubmissionFile(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit assignment");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      course: "",
      dueDate: "",
      maxPoints: 100,
      status: "draft",
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { bg: "secondary", label: "Draft" },
      published: { bg: "success", label: "Published" },
      closed: { bg: "danger", label: "Closed" },
    };
    const { bg, label } = config[status] || config.draft;
    return <Badge bg={bg}>{label}</Badge>;
  };

  const checkSubmission = (assignment) => {
    if (!assignment.submissions || user?.role !== "student") return null;
    const submission = assignment.submissions.find(
      (s) => s.student?._id === user?.id,
    );
    return submission;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-journal-text me-2"></i>
          Assignments
        </h2>
        {user?.role === "teacher" && (
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <i className="bi bi-plus-circle me-2"></i>
            Create Assignment
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

      <Tabs defaultActiveKey="all" className="mb-3">
        <Tab eventKey="all" title="All Assignments">
          <Card className="shadow-sm">
            <Card.Body>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Course</th>
                    <th>Due Date</th>
                    <th>Max Points</th>
                    <th>Status</th>
                    <th>Submissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => {
                    const submission = checkSubmission(assignment);
                    return (
                      <tr key={assignment._id}>
                        <td>{assignment.title}</td>
                        <td>{assignment.course?.courseCode}</td>
                        <td>
                          <Badge
                            bg={
                              new Date(assignment.dueDate) < new Date()
                                ? "danger"
                                : "warning"
                            }
                          >
                            {formatDate(assignment.dueDate)}
                          </Badge>
                        </td>
                        <td>{assignment.maxPoints}</td>
                        <td>{getStatusBadge(assignment.status)}</td>
                        <td>
                          <Badge bg="info">
                            {assignment.submissions?.length || 0}
                          </Badge>
                        </td>
                        <td>
                          {user?.role === "student" &&
                            assignment.status === "published" &&
                            (submission ? (
                              <Badge bg="success">
                                Submitted
                                {submission.grade &&
                                  ` - Grade: ${submission.grade}`}
                              </Badge>
                            ) : (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setShowSubmitModal(true);
                                }}
                              >
                                Submit
                              </Button>
                            ))}
                          {user?.role === "teacher" && (
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => {
                                /* View submissions */
                              }}
                            >
                              View Submissions
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">
                        No assignments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Add Assignment Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create New Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </Form.Group>

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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course</Form.Label>
                  <Form.Select
                    value={formData.course}
                    onChange={(e) =>
                      setFormData({ ...formData, course: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.courseCode} - {course.courseName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Points</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.maxPoints}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxPoints: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    max="100"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Attachment (Optional)</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => {
                  setFormData({ ...formData, attachment: e.target.files[0] });
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddAssignment}>
            Create Assignment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Submit Assignment Modal */}
      <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Submit Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAssignment && (
            <>
              <h6>{selectedAssignment.title}</h6>
              <p className="text-muted">
                Due: {formatDate(selectedAssignment.dueDate)}
              </p>
              <Form.Group>
                <Form.Label>Upload File</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setSubmissionFile(e.target.files[0])}
                  required
                />
                <Form.Text className="text-muted">
                  Accepted formats: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitAssignment}
            disabled={!submissionFile}
          >
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Assignments;
