import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  ListGroup,
  Badge,
  Spinner,
  Alert,
  InputGroup,
} from "react-bootstrap";
import useAuth from "../context/useAuth";
import useSocket from "../context/useSocket";
import api from "../services/api";
import { formatTime } from "../utils/helpers";

const Chat = () => {
  const { user } = useAuth();
  const { isConnected, emit, on, socketId } = useSocket();

  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [contactTyping, setContactTyping] = useState(false);

  const messagesEndRef = useRef(null);
  //const fileInputRef = useRef(null);

  // Log connection status
  useEffect(() => {
    console.log(
      "Socket connection status:",
      isConnected ? "Connected" : "Disconnected",
    );
    console.log("Socket ID:", socketId);
  }, [isConnected, socketId]);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);

      let contactsData = [];

      if (user?.role === "student") {
        const coursesRes = await api.get("/courses/my-courses");
        const teachers = new Set();

        for (const course of coursesRes.data.data || []) {
          if (course.teacher?.userId) {
            // IMPORTANT: Store _id as a string, not an object
            teachers.add(
              JSON.stringify({
                _id: course.teacher.userId.toString(), // Ensure string
                name: `${course.teacher.firstName} ${course.teacher.lastName}`,
                role: "teacher",
                course: course.courseName,
              }),
            );
          }
        }
        contactsData = Array.from(teachers).map((t) => JSON.parse(t));
      } else if (user?.role === "teacher") {
        const coursesRes = await api.get("/courses/my-courses");
        const students = new Set();

        for (const course of coursesRes.data.data || []) {
          if (course.students) {
            for (const student of course.students) {
              if (student.userId) {
                students.add(
                  JSON.stringify({
                    _id: student.userId.toString(), // Ensure string
                    name: `${student.firstName} ${student.lastName}`,
                    role: "student",
                    course: course.courseName,
                  }),
                );
              }
            }
          }
        }
        contactsData = Array.from(students).map((s) => JSON.parse(s));
      } else if (user?.role === "admin") {
        const [teachersRes, studentsRes] = await Promise.all([
          api.get("/teachers?limit=50"),
          api.get("/students?limit=50"),
        ]);

        contactsData = [
          ...(teachersRes.data.data || []).map((t) => ({
            _id: t.userId?.toString() || t._id?.toString(), // Ensure string
            name: `${t.firstName} ${t.lastName}`,
            role: "teacher",
            department: t.department,
          })),
          ...(studentsRes.data.data || []).map((s) => ({
            _id: s.userId?.toString() || s._id?.toString(), // Ensure string
            name: `${s.firstName} ${s.lastName}`,
            role: "student",
            class: s.classGrade,
          })),
        ].filter((contact) => contact._id); // Filter out invalid contacts
      }

      console.log("Contacts loaded:", contactsData); // Debug log
      setContacts(contactsData);

      if (contactsData.length > 0 && !selectedContact) {
        setSelectedContact(contactsData[0]);
      }
      setError("");
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setError("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [user, selectedContact]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Set up message listeners
  useEffect(() => {
    if (!isConnected || !selectedContact) {
      console.log(
        "Not setting up listeners - connected:",
        isConnected,
        "selected:",
        !!selectedContact,
      );
      return;
    }

    console.log(
      "Setting up message listeners for contact:",
      selectedContact.name,
    );

    const handleReceiveMessage = (data) => {
      console.log("Received message:", data);
      if (data.senderId === selectedContact._id) {
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
        scrollToBottom();
      }
    };

    const handleUserTyping = (data) => {
      if (data.userId === selectedContact._id) {
        setContactTyping(data.isTyping);
        // Auto-hide typing indicator after 2 seconds
        if (data.isTyping) {
          setTimeout(() => setContactTyping(false), 2000);
        }
      }
    };

    const unsubscribeMessage = on("receive_message", handleReceiveMessage);
    const unsubscribeTyping = on("user_typing", handleUserTyping);

    return () => {
      console.log("Cleaning up message listeners");
      unsubscribeMessage();
      unsubscribeTyping();
    };
  }, [isConnected, selectedContact, user?._id, on]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = useCallback(async () => {
    if (!selectedContact) return;

    // Validate that selectedContact has a valid _id
    if (!selectedContact._id || selectedContact._id === "[object Object]") {
      console.error("Invalid contact ID:", selectedContact);
      setError("Invalid contact selected");
      return;
    }

    try {
      console.log(
        "Loading chat history for:",
        selectedContact.name,
        "ID:",
        selectedContact._id,
      );
      const response = await api.get(
        `/messages/conversation/${selectedContact._id}`,
      );
      setMessages(response.data.data || []);
    } catch (err) {
      console.error("Error loading chat history:", err);
      if (err.response?.status === 400) {
        setError("Invalid contact selected");
      } else {
        setError("Failed to load messages");
      }
    }
  }, [selectedContact]);
  useEffect(() => {
    if (selectedContact) {
      loadChatHistory();
    }
  }, [selectedContact, loadChatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedContact) {
      console.log("Cannot send: empty message or no contact");
      return;
    }

    if (!isConnected) {
      console.log("Cannot send: socket not connected");
      setError("Cannot send message: Not connected to server");
      return;
    }

    if (!emit) {
      console.log("Cannot send: emit function not available");
      setError("Cannot send message: Socket not initialized");
      return;
    }

    console.log("Sending message to:", selectedContact.name);

    const messageData = {
      receiverId: selectedContact._id,
      message: newMessage.trim(),
    };

    const success = emit("send_message", messageData);

    if (success) {
      console.log("Message sent successfully");
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          sender: user?._id,
          receiver: selectedContact._id,
          message: newMessage.trim(),
          timestamp: new Date(),
          read: false,
        },
      ]);

      setNewMessage("");

      emit("typing", { receiverId: selectedContact._id, isTyping: false });
    } else {
      console.log("Failed to send message");
      setError("Failed to send message");
    }
  };

  const handleTyping = () => {
    if (!selectedContact || !isConnected || !emit) return;

    if (!isTyping) {
      setIsTyping(true);
      emit("typing", { receiverId: selectedContact._id, isTyping: true });
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    setTypingTimeout(
      setTimeout(() => {
        setIsTyping(false);
        if (emit && isConnected) {
          emit("typing", { receiverId: selectedContact._id, isTyping: false });
        }
      }, 1000),
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading chat...</p>
      </div>
    );
  }

  return (
    <Container fluid className="py-3">
      <h2 className="mb-4">
        <i className="bi bi-chat-dots me-2"></i>
        Messages
        <Badge bg={isConnected ? "success" : "danger"} className="ms-2">
          {isConnected ? "Connected" : "Disconnected"}
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
              <h5 className="mb-0">Contacts ({contacts.length})</h5>
            </Card.Header>
            <ListGroup
              variant="flush"
              style={{ maxHeight: "500px", overflowY: "auto" }}
            >
              {contacts.length > 0 ? (
                contacts.map((contact) => (
                  <ListGroup.Item
                    key={contact._id}
                    action
                    active={selectedContact?._id === contact._id}
                    onClick={() => setSelectedContact(contact)}
                    className="d-flex align-items-center"
                  >
                    <div
                      className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                      style={{
                        width: "40px",
                        height: "40px",
                        fontSize: "1.2rem",
                      }}
                    >
                      {contact.name?.charAt(0)}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <strong>{contact.name}</strong>
                        <Badge
                          bg={contact.role === "teacher" ? "info" : "success"}
                          pill
                        >
                          {contact.role}
                        </Badge>
                      </div>
                      <small className="text-muted">
                        {contact.course || contact.department || contact.class}
                      </small>
                    </div>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item className="text-center text-muted py-4">
                  No contacts available
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-light">
              {selectedContact ? (
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div
                      className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                      style={{
                        width: "40px",
                        height: "40px",
                        fontSize: "1.2rem",
                      }}
                    >
                      {selectedContact.name?.charAt(0)}
                    </div>
                    <div>
                      <h5 className="mb-0">{selectedContact.name}</h5>
                      <small className="text-muted">
                        <Badge
                          bg={
                            selectedContact.role === "teacher"
                              ? "info"
                              : "success"
                          }
                          className="me-2"
                        >
                          {selectedContact.role}
                        </Badge>
                        {contactTyping && (
                          <span className="text-success">
                            <i className="bi bi-chat-dots me-1"></i>typing...
                          </span>
                        )}
                      </small>
                    </div>
                  </div>
                  <Badge bg={isConnected ? "success" : "danger"}>
                    {isConnected ? "Online" : "Offline"}
                  </Badge>
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
              {selectedContact ? (
                <>
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`d-flex mb-3 ${
                          msg.sender === user?._id
                            ? "justify-content-end"
                            : "justify-content-start"
                        }`}
                      >
                        <div
                          className={`p-3 rounded ${
                            msg.sender === user?._id
                              ? "bg-primary text-white"
                              : "bg-white"
                          }`}
                          style={{ maxWidth: "70%" }}
                        >
                          {msg.message}
                          <div
                            className={`text-end small ${
                              msg.sender === user?._id
                                ? "text-white-50"
                                : "text-muted"
                            }`}
                          >
                            {formatTime(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted py-5">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-chat-dots display-1 text-muted"></i>
                  <p className="mt-3">Select a contact to start messaging</p>
                </div>
              )}
            </Card.Body>

            {selectedContact && (
              <Card.Footer>
                <Form onSubmit={handleSendMessage}>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder={
                        isConnected ? "Type a message..." : "Connecting..."
                      }
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        if (isConnected) handleTyping();
                      }}
                      disabled={!isConnected}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!newMessage.trim() || !isConnected}
                    >
                      <i className="bi bi-send"></i>
                    </Button>
                  </InputGroup>
                </Form>
                {!isConnected && (
                  <div className="text-danger small mt-2">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Not connected to chat server. Trying to reconnect...
                  </div>
                )}
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Chat;
