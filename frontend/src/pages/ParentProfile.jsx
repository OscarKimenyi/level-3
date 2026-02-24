import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Badge,
  Spinner,
  Alert,
  Button,
  Form,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import useAuth from "../context/useAuth";
// Remove the unused api import

const ParentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });

  const fetchParentProfile = useCallback(async () => {
    try {
      setLoading(true);

      // Get parent profile from user data
      setProfile({
        firstName: user?.username?.split("_")[0] || "Parent",
        lastName: "",
        phone: "",
        address: "",
        email: user?.email,
      });

      setFormData({
        firstName: user?.username?.split("_")[0] || "Parent",
        lastName: "",
        phone: "",
        address: "",
      });

      // Mock children data
      setChildren([
        {
          _id: "1",
          studentId: "STU001",
          firstName: "John",
          lastName: "Doe Jr.",
          classGrade: "First Year",
          attendance: 95,
          averageGrade: 88,
        },
        {
          _id: "2",
          studentId: "STU002",
          firstName: "Jane",
          lastName: "Doe Jr.",
          classGrade: "Second Year",
          attendance: 92,
          averageGrade: 91,
        },
      ]);

      setError("");
    } catch (err) {
      console.error("Error fetching parent profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchParentProfile();
  }, [fetchParentProfile]);

  const handleUpdateProfile = async () => {
    try {
      // Validate required fields
      if (!formData.firstName || !formData.phone) {
        setError("Please fill in all required fields");
        return;
      }

      // Here you would call your API to update parent profile
      // For now, just update local state
      setProfile((prev) => ({ ...prev, ...formData }));
      setSuccess("Profile updated successfully");
      setEditing(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
        Parent Profile
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
                className="bg-info text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}
              >
                {profile?.firstName?.charAt(0).toUpperCase()}
              </div>
              <h4>
                {profile?.firstName} {profile?.lastName}
              </h4>
              <p className="text-muted">{profile?.email}</p>
              <Badge bg="primary">Parent</Badge>

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
        </Col>

        <Col md={8}>
          {editing ? (
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5>Edit Profile</h5>
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>First Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Phone *</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <Button variant="primary" onClick={handleUpdateProfile}>
                    Save Changes
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          ) : (
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5>Personal Information</h5>
                <table className="table">
                  <tbody>
                    <tr>
                      <th>Name:</th>
                      <td>
                        {profile?.firstName} {profile?.lastName}
                      </td>
                    </tr>
                    <tr>
                      <th>Email:</th>
                      <td>{profile?.email}</td>
                    </tr>
                    <tr>
                      <th>Phone:</th>
                      <td>{profile?.phone || "Not provided"}</td>
                    </tr>
                    <tr>
                      <th>Address:</th>
                      <td>{profile?.address || "Not provided"}</td>
                    </tr>
                  </tbody>
                </table>
              </Card.Body>
            </Card>
          )}

          <Card className="shadow-sm">
            <Card.Body>
              <h5>My Children</h5>
              {children.length > 0 ? (
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Year</th>
                      <th>Attendance</th>
                      <th>Average Grade</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {children.map((child) => (
                      <tr key={child._id}>
                        <td>{child.studentId}</td>
                        <td>
                          {child.firstName} {child.lastName}
                        </td>
                        <td>{child.classGrade}</td>
                        <td>
                          <Badge
                            bg={
                              child.attendance >= 90
                                ? "success"
                                : child.attendance >= 75
                                  ? "warning"
                                  : "danger"
                            }
                          >
                            {child.attendance}%
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            bg={
                              child.averageGrade >= 90
                                ? "success"
                                : child.averageGrade >= 75
                                  ? "info"
                                  : "warning"
                            }
                          >
                            {child.averageGrade}%
                          </Badge>
                        </td>
                        <td>
                          <Button
                            as={Link}
                            to={`/students/${child._id}`}
                            size="sm"
                            variant="outline-primary"
                          >
                            View Progress
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center py-4">
                  No children linked to your account yet.
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ParentProfile;
