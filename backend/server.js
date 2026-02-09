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
    origin: process.env.FRONTEND_URL,
    credentials: true,
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

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Student Management System API" });
});

// Socket.io Connection
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  // Authenticate socket
  socket.on("authenticate", (token) => {
    try {
      const user = authenticateSocket(token);
      if (user) {
        socket.user = user;
        socket.join(user.role);
        socket.join(user._id.toString());
        console.log(`User ${user.email} authenticated for socket`);
      }
    } catch (error) {
      console.log("Socket authentication failed");
    }
  });

  // Handle chat messages
  socket.on("send_message", (data) => {
    const { receiverId, message } = data;
    // Emit to specific user
    io.to(receiverId).emit("receive_message", {
      senderId: socket.user?._id,
      message,
      timestamp: new Date(),
    });
  });

  // Handle notifications
  socket.on("send_notification", (data) => {
    const { userId, title, message } = data;
    io.to(userId).emit("new_notification", {
      title,
      message,
      timestamp: new Date(),
    });
  });

  // Handle attendance updates
  socket.on("attendance_updated", (data) => {
    const { courseId } = data;
    io.to(`course_${courseId}`).emit("attendance_changed", data);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
});
