import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Button,
  Badge,
  ListGroup,
  Spinner,
  InputGroup,
  Alert,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";

const Chat = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchUsers();

    if (socket) {
      // Listen for incoming messages
      socket.on("receive_message", handleIncomingMessage);

      return () => {
        socket.off("receive_message", handleIncomingMessage);
      };
    }
  }, [fetchUsers, handleIncomingMessage, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch teachers and students
      const [teachersRes, studentsRes] = await Promise.all([
        axios.get("/teachers?limit=50"),
        axios.get("/students?limit=50"),
      ]);

      const allUsers = [
        ...teachersRes.data.data.map((t) => ({
          _id: t.userId?._id || t._id,
          name: `${t.firstName} ${t.lastName}`,
          role: "teacher",
          status: "online",
        })),
        ...studentsRes.data.data.map((s) => ({
          _id: s.userId?._id || s._id,
          name: `${s.firstName} ${s.lastName}`,
          role: "student",
          status: "online",
        })),
      ].filter((u) => u._id !== user?._id); // Remove current user

      setUsers(allUsers);

      // Select first user by default
      if (allUsers.length > 0 && !selectedUser) {
        setSelectedUser(allUsers[0]);
        fetchMessages(allUsers[0]._id);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      // In a real app, you'd fetch from your messages API
      // For now, we'll use mock data
      const mockMessages = [
        {
          _id: "1",
          sender: userId,
          receiver: user?._id,
          message: "Hello! How are you doing?",
          timestamp: new Date(Date.now() - 3600000),
          read: true,
        },
        {
          _id: "2",
          sender: user?._id,
          receiver: userId,
          message: "I'm doing great! How about you?",
          timestamp: new Date(Date.now() - 1800000),
          read: true,
        },
        {
          _id: "3",
          sender: userId,
          receiver: user?._id,
          message: "I need help with the math assignment.",
          timestamp: new Date(Date.now() - 600000),
          read: true,
        },
        {
          _id: "4",
          sender: user?._id,
          receiver: userId,
          message: "Sure! Which problem are you stuck on?",
          timestamp: new Date(Date.now() - 300000),
          read: false,
        },
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleIncomingMessage = (data) => {
    if (data.senderId === selectedUser?._id) {
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          sender: data.senderId,
          receiver: user?._id,
          message: data.message,
          timestamp: new Date(data.timestamp),
          read: false,
        },
      ]);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser || !socket) return;

    const messageData = {
      receiverId: selectedUser._id,
      message: newMessage.trim(),
    };

    // Send via WebSocket
    socket.emit("send_message", messageData);

    // Add to local messages
    setMessages((prev) => [
      ...prev,
      {
        _id: Date.now().toString(),
        sender: user?._id,
        receiver: selectedUser._id,
        message: newMessage.trim(),
        timestamp: new Date(),
        read: false,
      },
    ]);

    setNewMessage("");
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    fetchMessages(user._id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container-fluid py-3">
      <h2 className="mb-4">
        <i className="bi bi-chat-left-text me-2"></i>
        Chat
        <Badge bg={isConnected ? "success" : "danger"} className="ms-2">
          {isConnected ? "Live" : "Offline"}
        </Badge>
      </h2>

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      <Row className="g-3">
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Contacts</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Loading contacts...</p>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {users.map((contact) => (
                    <ListGroup.Item
                      key={contact._id}
                      action
                      active={selectedUser?._id === contact._id}
                      onClick={() => handleUserSelect(contact)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{contact.name}</strong>
                        <div className="text-muted small">
                          <Badge
                            bg={contact.role === "teacher" ? "info" : "success"}
                            className="me-1"
                          >
                            {contact.role}
                          </Badge>
                          <Badge
                            bg={
                              contact.status === "online"
                                ? "success"
                                : "secondary"
                            }
                          >
                            {contact.status}
                          </Badge>
                        </div>
                      </div>
                      {contact.unreadCount > 0 && (
                        <Badge pill bg="danger">
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-light">
              {selectedUser ? (
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">{selectedUser.name}</h5>
                    <small className="text-muted">
                      <Badge
                        bg={
                          selectedUser.role === "teacher" ? "info" : "success"
                        }
                      >
                        {selectedUser.role}
                      </Badge>
                      <span className="ms-2">
                        {selectedUser.status === "online"
                          ? "Online"
                          : "Offline"}
                      </span>
                    </small>
                  </div>
                  <div>
                    <Badge bg="light" text="dark">
                      <i className="bi bi-circle-fill text-success me-1"></i>
                      Active now
                    </Badge>
                  </div>
                </div>
              ) : (
                <h5 className="mb-0">Select a contact to start chatting</h5>
              )}
            </Card.Header>

            <Card.Body
              style={{
                height: "400px",
                overflowY: "auto",
                backgroundColor: "#f8f9fa",
              }}
            >
              {selectedUser ? (
                <>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`d-flex mb-3 ${msg.sender === user?._id ? "justify-content-end" : "justify-content-start"}`}
                    >
                      <div
                        className={`p-3 rounded ${msg.sender === user?._id ? "bg-primary text-white" : "bg-white"}`}
                        style={{ maxWidth: "70%" }}
                      >
                        <div>{msg.message}</div>
                        <div
                          className={`text-end small ${msg.sender === user?._id ? "text-white-50" : "text-muted"}`}
                        >
                          {formatTime(msg.timestamp)}
                          {msg.sender === user?._id && (
                            <i
                              className={`bi bi-check2-all ms-1 ${msg.read ? "text-info" : ""}`}
                            ></i>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-chat-dots display-1 text-muted"></i>
                  <p className="mt-3">Select a contact to start messaging</p>
                </div>
              )}
            </Card.Body>

            <Card.Footer>
              {selectedUser && (
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                >
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={!isConnected}
                    />
                    <Button
                      variant="primary"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || !isConnected}
                    >
                      <i className="bi bi-send"></i>
                    </Button>
                  </InputGroup>
                  <div className="text-muted small mt-2">
                    {isConnected ? (
                      <span className="text-success">
                        <i className="bi bi-circle-fill me-1"></i>
                        Connected
                      </span>
                    ) : (
                      <span className="text-danger">
                        <i className="bi bi-circle-fill me-1"></i>
                        Disconnected
                      </span>
                    )}
                    <span className="ms-3">Press Enter to send</span>
                  </div>
                </Form>
              )}
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Chat;
