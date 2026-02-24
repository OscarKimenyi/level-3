const express = require("express");
const router = express.Router();
const {
  getAdminDashboard,
  getTeacherDashboard,
  getStudentDashboard,
} = require("../controllers/dashboardController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/admin", roleMiddleware("admin"), getAdminDashboard);
router.get("/teacher", roleMiddleware("teacher"), getTeacherDashboard);
router.get("/student", roleMiddleware("student"), getStudentDashboard);

module.exports = router;
