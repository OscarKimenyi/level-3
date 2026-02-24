const express = require("express");
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentProfile,
  bulkImportStudents,
} = require("../controllers/studentController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// All student routes require authentication
router.use(authMiddleware);

// Bulk import (admin only)
router.post("/import", roleMiddleware("admin"), bulkImportStudents);

// Get student profile (student can see own profile)
router.get("/profile", getStudentProfile);

// Get all students (admin/teacher only)
router.get("/", roleMiddleware("admin", "teacher"), getStudents);

// Student CRUD operations (admin only)
router.post("/", roleMiddleware("admin"), createStudent);
router.get("/:id", getStudentById);
router.put("/:id", roleMiddleware("admin"), updateStudent);
router.delete("/:id", roleMiddleware("admin"), deleteStudent);

module.exports = router;
