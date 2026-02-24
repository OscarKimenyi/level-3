const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const socketio = require("socket.io");
require("dotenv").config();

const connectDB = require("./src/config/database");
const authRoutes = require("./src/routes/authRoutes");
const studentRoutes = require("./src/routes/studentRoutes");
const teacherRoutes = require("./src/routes/teacherRoutes");
const courseRoutes = require("./src/routes/courseRoutes");
const attendanceRoutes = require("./src/routes/attendanceRoutes");
const assignmentRoutes = require("./src/routes/assignmentRoutes");
const { authenticateSocket } = require("./src/middleware/authMiddleware");
const notificationRoutes = require("./src/routes/notificationRoutes");

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Student Management System API" });
});

// Make io accessible to routes
app.set("io", io);

// Socket.io Connection
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Authenticate socket
  socket.on("authenticate", (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;

      // Join personal room for direct messages
      socket.join(decoded.userId.toString());
      console.log(
        `👤 User ${decoded.userId} joined room: ${decoded.userId.toString()}`,
      );

      // Join role-based room for broadcasts
      socket.join(decoded.role);

      console.log(
        `✅ User ${decoded.userId} (${decoded.role}) authenticated for socket`,
      );
      console.log(
        `   Joined rooms: ${decoded.userId.toString()}, ${decoded.role}`,
      );

      // Acknowledge authentication
      socket.emit("authenticated", { success: true, userId: decoded.userId });
    } catch (error) {
      console.log("❌ Socket authentication failed:", error.message);
      socket.emit("authenticated", { success: false, error: error.message });
    }
  });

  // Handle chat messages
  socket.on("send_message", (data) => {
    const { receiverId, message } = data;
    console.log(
      `📨 Message from ${socket.userId} to ${receiverId}: ${message.substring(0, 30)}...`,
    );

    io.to(receiverId.toString()).emit("receive_message", {
      senderId: socket.userId,
      message,
      timestamp: new Date(),
    });
  });

  // Handle typing indicator
  socket.on("typing", (data) => {
    const { receiverId, isTyping } = data;
    io.to(receiverId.toString()).emit("user_typing", {
      userId: socket.userId,
      isTyping,
    });
  });

  // Handle notification read receipt
  socket.on("notification_read", (data) => {
    const { notificationId } = data;
    io.to("admin").emit("notification_read_receipt", {
      notificationId,
      userId: socket.userId,
      timestamp: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id, "User:", socket.userId);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
});
