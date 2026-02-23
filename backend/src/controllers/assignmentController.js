const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

// Create assignment
const createAssignment = async (req, res) => {
  try {
    const assignmentData = req.body;

    // Find teacher
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can create assignments",
      });
    }

    // Verify teacher owns this course
    const course = await Course.findById(assignmentData.course);
    if (!course || course.teacher.toString() !== teacher._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create assignments for this course",
      });
    }

    // Handle file attachments if any
    if (req.files && req.files.length > 0) {
      assignmentData.attachments = req.files.map((file) => ({
        filename: file.filename,
        path: file.path,
        originalName: file.originalname,
      }));
    }

    const assignment = new Assignment(assignmentData);
    await assignment.save();

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating assignment",
      error: error.message,
    });
  }
};

// Get assignments
const getAssignments = async (req, res) => {
  try {
    const { courseId, status } = req.query;
    const query = {};

    if (courseId) query.course = courseId;
    if (status) query.status = status;

    // Role-based filtering
    if (req.user.role === "student") {
      const student = await Student.findOne({ userId: req.user._id });
      const courses = await Course.find({ students: student._id });
      query.course = { $in: courses.map((c) => c._id) };
    } else if (req.user.role === "teacher") {
      const teacher = await Teacher.findOne({ userId: req.user._id });
      query.course = { $in: teacher.assignedCourses };
    }

    const assignments = await Assignment.find(query)
      .populate("course", "courseCode courseName")
      .populate("submissions.student", "firstName lastName studentId")
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching assignments",
    });
  }
};

// Get assignment by ID
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate("course", "courseCode courseName")
      .populate("submissions.student", "firstName lastName studentId");

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error("Get assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching assignment",
    });
  }
};

// Update assignment
const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    res.json({
      success: true,
      message: "Assignment updated successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Update assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating assignment",
    });
  }
};

// Delete assignment
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    res.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting assignment",
    });
  }
};

// Submit assignment
const submitAssignment = async (req, res) => {
  try {
    console.log("Submit assignment request received:");
    console.log("Assignment ID:", req.params.id);
    console.log("User ID:", req.user._id);
    console.log("File received:", req.file ? "Yes" : "No");
    if (req.file) {
      console.log("File details:", {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    }
    const { id } = req.params;

    // Find student
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(403).json({
        success: false,
        message: "Only students can submit assignments",
      });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    if (assignment.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "This assignment is not accepting submissions",
      });
    }

    if (new Date(assignment.dueDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Assignment due date has passed",
      });
    }

    const course = await Course.findById(assignment.course);
    if (!course.students.includes(student._id)) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    // Check if already submitted
    const existingSubmission = assignment.submissions.find(
      (s) => s.student.toString() === student._id.toString(),
    );

    const submissionData = {
      student: student._id,
      submittedAt: new Date(),
    };

    if (req.file) {
      submissionData.submittedFile = {
        filename: req.file.filename,
        path: req.file.path,
        originalName: req.file.originalname,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Please upload a file for submission",
      });
    }

    if (existingSubmission) {
      // Update existing submission
      Object.assign(existingSubmission, submissionData);
    } else {
      // Add new submission
      assignment.submissions.push(submissionData);
    }

    await assignment.save();

    res.json({
      success: true,
      message: "Assignment submitted successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Submit assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error submitting assignment",
    });
  }
};

// Grade assignment
const gradeAssignment = async (req, res) => {
  try {
    const { id, submissionId } = req.params;
    const { grade, feedback } = req.body;

    // Find teacher
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can grade assignments",
      });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const submission = assignment.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found",
      });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedAt = new Date();
    submission.gradedBy = teacher._id;

    await assignment.save();

    res.json({
      success: true,
      message: "Assignment graded successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Grade assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error grading assignment",
    });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeAssignment,
};
