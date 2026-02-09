const express = require("express");
const router = express.Router();
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
  getCourseStudents,
  getTeacherCourses,
} = require("../controllers/courseController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", getCourses);
router.get("/my-courses", getTeacherCourses);
router.get("/:id", getCourseById);
router.get("/:id/students", getCourseStudents);

// Admin/Teacher only
router.post("/", roleMiddleware("admin", "teacher"), createCourse);
router.put("/:id", roleMiddleware("admin", "teacher"), updateCourse);
router.delete("/:id", roleMiddleware("admin"), deleteCourse);

// Student enrollment
router.post("/:id/enroll", roleMiddleware("admin", "teacher"), enrollStudent);

module.exports = router;
