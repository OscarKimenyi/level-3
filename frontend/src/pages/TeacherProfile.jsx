import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Tabs,
  Tab,
  Table,
  Badge,
  Spinner,
  Alert,
  Button,
  Form,
} from "react-bootstrap";
import api from "../services/api";
import { formatDate } from "../utils/helpers";

const TeacherProfile = () => {
  const [searchParams] = useSearchParams();
  const teacherId = searchParams.get("id");

  const [teacher, setTeacher] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // Added missing state
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Wrap fetchTeacherProfile in useCallback
  const fetchTeacherProfile = useCallback(async () => {
    try {
      setLoading(true);

      let response;
      if (teacherId) {
        // Fetch specific teacher by ID
        response = await api.get(`/teachers/${teacherId}`);
      } else {
        // Fetch current user's teacher profile
        response = await api.get("/teachers/profile");
      }

      setTeacher(response.data.data);
      setFormData(response.data.data);

      // Fetch assigned courses
      const coursesRes = await api.get(
        `/courses?teacher=${response.data.data._id}`,
      );
      setCourses(coursesRes.data.data || []);
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching teacher profile:", err);
      setError("Failed to load teacher profile");
    } finally {
      setLoading(false);
    }
  }, [teacherId]); // Add teacherId as dependency

  useEffect(() => {
    fetchTeacherProfile();
  }, [fetchTeacherProfile]); // Now fetchTeacherProfile is stable and can be included

  const handleUpdateProfile = async () => {
    try {
      const response = await api.put(`/teachers/${teacher._id}`, formData);
      setTeacher(response.data.data);
      setSuccess("Profile updated successfully");
      setEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
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

  const getStatusBadge = (status) => {
    const statusMap = {
      active: "success",
      inactive: "secondary",
      "on-leave": "warning",
    };
    return <Badge bg={statusMap[status] || "secondary"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading teacher profile...</p>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <Alert variant="danger" className="m-3">
        {error || "Teacher not found"}
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

      <Row>
        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Body className="text-center">
              <div
                className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "120px", height: "120px", fontSize: "3rem" }}
              >
                {teacher.firstName?.[0]}
                {teacher.lastName?.[0]}
              </div>
              <h3>
                {teacher.firstName} {teacher.lastName}
              </h3>
              <p className="text-muted">{teacher.teacherId}</p>
              {getStatusBadge(teacher.status)}

              <hr />

              <div className="text-start mt-3">
                <h6>Contact Information</h6>
                <p>
                  <i className="bi bi-envelope me-2"></i>{" "}
                  {teacher.userId?.email || "N/A"}
                </p>
                <p>
                  <i className="bi bi-telephone me-2"></i>{" "}
                  {teacher.contactNumber || "N/A"}
                </p>
                <p>
                  <i className="bi bi-building me-2"></i>{" "}
                  {teacher.department || "N/A"}
                </p>
              </div>

              <hr />

              <div className="text-start">
                <h6>Professional Info</h6>
                <p>
                  <strong>Qualification:</strong> {teacher.qualification}
                </p>
                <p>
                  <strong>Specialization:</strong>{" "}
                  {teacher.specialization?.join(", ")}
                </p>
                <p>
                  <strong>Joined:</strong> {formatDate(teacher.joiningDate)}
                </p>
              </div>

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
                  <strong>Courses Teaching:</strong> {courses.length}
                </li>
                <li className="mb-2">
                  <strong>Total Students:</strong>{" "}
                  {courses.reduce(
                    (acc, course) => acc + (course.students?.length || 0),
                    0,
                  )}
                </li>
                <li>
                  <strong>Experience:</strong>{" "}
                  {teacher.joiningDate
                    ? `${new Date().getFullYear() - new Date(teacher.joiningDate).getFullYear()} years`
                    : "N/A"}
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
                        <th>Credits</th>
                        <th>Students</th>
                        <th>Schedule</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course._id}>
                          <td>{course.courseCode}</td>
                          <td>{course.courseName}</td>
                          <td>{course.credits}</td>
                          <td>
                            <Badge bg="info">
                              {course.students?.length || 0} students
                            </Badge>
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
                </Tab>

                <Tab eventKey="edit" title="Edit Profile" disabled={!editing}>
                  {editing && (
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
                        <Form.Label>Contact Number</Form.Label>
                        <Form.Control
                          type="tel"
                          name="contactNumber"
                          value={formData.contactNumber || ""}
                          onChange={handleChange}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Qualification</Form.Label>
                        <Form.Control
                          type="text"
                          name="qualification"
                          value={formData.qualification || ""}
                          onChange={handleChange}
                        />
                      </Form.Group>

                      <Button variant="primary" onClick={handleUpdateProfile}>
                        Save Changes
                      </Button>
                    </Form>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherProfile;
