import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Badge,
  Spinner,
  Alert,
  Button,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import useAuth from "../context/useAuth";
import api from "../services/api";

const ParentProfile = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);

        const response = await api.get("/students?parent=" + user?.id);
        setChildren(response.data.data || []);
      } catch (err) {
        console.error("Error fetching children:", err);
        setError("Failed to load children data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchChildren();
    }
  }, [user?.id]);

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
        Parent Dashboard
      </h2>

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
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
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <h4>{user?.username}</h4>
              <p className="text-muted">{user?.email}</p>
              <Badge bg="primary">Parent</Badge>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <h5>My Children</h5>
              {children.length > 0 ? (
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Attendance</th>
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
                        <td>
                          {child.classGrade} - {child.section}
                        </td>
                        <td>
                          <Badge bg="success">92%</Badge>
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
