const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeAssignment,
} = require("../controllers/assignmentController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/assignments";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only document and image files are allowed"));
    }
  },
});

router.use(authMiddleware);

// Assignment CRUD (Teacher only)
router.post(
  "/",
  roleMiddleware("teacher"),
  upload.array("attachments", 5),
  createAssignment,
);
router.get("/", getAssignments);
router.get("/:id", getAssignmentById);
router.put(
  "/:id",
  roleMiddleware("teacher"),
  upload.array("attachments", 5),
  updateAssignment,
);
router.delete("/:id", roleMiddleware("teacher"), deleteAssignment);

// Student submissions
router.post(
  "/:id/submit",
  authMiddleware,
  upload.single("submission"),
  submitAssignment,
);
router.post(
  "/:id/grade/:submissionId",
  roleMiddleware("teacher"),
  gradeAssignment,
);

module.exports = router;
