const express = require("express");
const router = express.Router();
const {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherProfile,
} = require("../controllers/teacherController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", roleMiddleware("admin", "teacher"), getTeachers);
router.get("/profile", getTeacherProfile);

// Admin only routes
router.post("/", roleMiddleware("admin"), createTeacher);
router.get("/:id", getTeacherById);
router.put("/:id", roleMiddleware("admin"), updateTeacher);
router.delete("/:id", roleMiddleware("admin"), deleteTeacher);

module.exports = router;
