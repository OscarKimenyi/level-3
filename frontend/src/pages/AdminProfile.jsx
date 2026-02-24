import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import useAuth from "../context/useAuth";
// api is not used in this file, so we don't import it

const AdminProfile = () => {
  const { user, updateProfile } = useAuth();
  const [loading] = useState(false); // Keep but don't use setLoading
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    profilePicture: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        profilePicture: user.profilePicture || "",
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      setSubmitting(true);
      setError("");

      const response = await updateProfile({
        username: formData.username,
        profilePicture: formData.profilePicture,
      });

      if (response.success) {
        setSuccess("Profile updated successfully");
        setEditing(false);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    } finally {
      setSubmitting(false);
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
        Admin Profile
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
                className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <h4>{user?.username}</h4>
              <p className="text-muted">{user?.email}</p>
              <Badge bg="danger">Administrator</Badge>

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
          <Card className="shadow-sm">
            <Card.Body>
              {editing ? (
                <>
                  <h5>Edit Profile</h5>
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.email}
                        disabled
                      />
                      <Form.Text className="text-muted">
                        Email cannot be changed
                      </Form.Text>
                    </Form.Group>

                    <Button
                      variant="primary"
                      onClick={handleUpdateProfile}
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
                  </Form>
                </>
              ) : (
                <>
                  <h5>Profile Information</h5>
                  <table className="table">
                    <tbody>
                      <tr>
                        <th>Username:</th>
                        <td>{user?.username}</td>
                      </tr>
                      <tr>
                        <th>Email:</th>
                        <td>{user?.email}</td>
                      </tr>
                      <tr>
                        <th>Role:</th>
                        <td>
                          <Badge bg="danger">Administrator</Badge>
                        </td>
                      </tr>
                      <tr>
                        <th>Account Status:</th>
                        <td>
                          <Badge bg="success">Active</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminProfile;
