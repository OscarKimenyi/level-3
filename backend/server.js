const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
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
const messageRoutes = require("./src/routes/messageRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");

// Import createAdmin function
const createAdmin = require("./createAdmin");

// Initialize app
const app = express();
const server = http.createServer(app);

// Connect to Database and initialize admin
connectDB().then(async () => {
  console.log("✅ Database connected");

  try {
    await createAdmin(); // Create admin if not exists
  } catch (err) {
    console.error("⚠️ Failed to create admin:", err.message);
  }

  // Start server after DB and admin are ready
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
  });
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(
  "/api/messages",
  (req, res, next) => {
    console.log("Message route hit:", req.method, req.url);
    next();
  },
  messageRoutes,
);

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Student Management System API" });
});

// Socket.io setup
const io = socketio(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Make io accessible to routes
app.set("io", io);

// Socket.io connection
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("authenticate", (token) => {
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.join(decoded.userId.toString());
      console.log(`User ${decoded.userId} authenticated for socket`);
      socket.emit("authenticated", { success: true });
    } catch (error) {
      console.log("Socket authentication failed:", error.message);
      socket.emit("authenticated", { success: false });
    }
  });

  socket.on("send_message", (data) => {
    console.log(`📨 Message from ${socket.userId} to ${data.receiverId}`);
    io.to(data.receiverId.toString()).emit("receive_message", {
      senderId: socket.userId,
      message: data.message,
      timestamp: new Date(),
    });
  });

  socket.on("typing", (data) => {
    io.to(data.receiverId.toString()).emit("user_typing", {
      userId: socket.userId,
      isTyping: data.isTyping,
    });
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});
