const express = require("express");
const router = express.Router();
const {
  markAttendance,
  getStudentAttendance,
  getCourseAttendance,
  getAttendanceReport,
  updateAttendance,
} = require("../controllers/attendanceController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

router.use(authMiddleware);

// Teacher only routes
router.post("/mark", roleMiddleware("teacher"), markAttendance);
router.put("/:id", roleMiddleware("teacher"), updateAttendance);

// Get attendance data
router.get("/student/:studentId", getStudentAttendance);
router.get("/course/:courseId", getCourseAttendance);
router.get("/report", getAttendanceReport);

module.exports = router;
