import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Form,
  Button,
  Card,
  Container,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import api from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      setMessage("Password reset link has been sent to your email.");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="min-vh-100 d-flex align-items-center justify-content-center">
      <Row className="w-100 justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold">
                  <i className="bi bi-key-fill text-primary me-2"></i>
                  Forgot Password
                </h2>
                <p className="text-muted">
                  Enter your email to receive a password reset link
                </p>
              </div>

              {error && (
                <Alert
                  variant="danger"
                  onClose={() => setError("")}
                  dismissible
                >
                  {error}
                </Alert>
              )}

              {message && (
                <Alert
                  variant="success"
                  onClose={() => setMessage("")}
                  dismissible
                >
                  {message}
                </Alert>
              )}

              {!sent ? (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <div className="text-center">
                    <Link to="/login" className="text-decoration-none">
                      <i className="bi bi-arrow-left me-1"></i>
                      Back to Login
                    </Link>
                  </div>
                </Form>
              ) : (
                <div className="text-center">
                  <i className="bi bi-envelope-check text-success display-1 mb-3"></i>
                  <h5>Check Your Email</h5>
                  <p className="text-muted mb-3">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <Link to="/login" className="btn btn-primary">
                    Return to Login
                  </Link>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPassword;
