const Student = require("../models/Student");
const User = require("../models/User");
const Course = require("../models/Course");

// Get all students
const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, classGrade, status } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
      ];
    }

    if (classGrade) {
      query.classGrade = classGrade;
    }

    if (status) {
      query.status = status;
    }

    const students = await Student.find(query)
      .populate("userId", "username email profilePicture")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching students",
    });
  }
};

// Get student by ID
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("userId", "username email profilePicture")
      .populate("parents", "username email");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching student",
    });
  }
};

// Get student profile (current user)
const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate(
      "parents",
      "username email",
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Get enrolled courses
    const courses = await Course.find({ students: student._id }).populate(
      "teacher",
      "firstName lastName",
    );

    res.json({
      success: true,
      data: {
        ...student.toObject(),
        courses,
      },
    });
  } catch (error) {
    console.error("Get student profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching student profile",
    });
  }
};

// Create new student
const createStudent = async (req, res) => {
  try {
    const studentData = req.body;

    // Check if user exists
    const user = await User.findById(studentData.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if student already exists for this user
    const existingStudent = await Student.findOne({
      userId: studentData.userId,
    });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student already exists for this user",
      });
    }

    const student = new Student(studentData);
    await student.save();

    // Update user role if not already student
    if (user.role !== "student") {
      user.role = "student";
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating student",
      error: error.message,
    });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating student",
    });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Optionally delete associated user
    // await User.findByIdAndDelete(student.userId);

    res.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting student",
    });
  }
};

// Bulk import students from CSV
const bulkImportStudents = async (req, res) => {
  try {
    const studentsData = req.body; // Array of student objects

    if (!Array.isArray(studentsData)) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format. Expected array of students.",
      });
    }

    const results = {
      successful: [],
      failed: [],
    };

    for (const studentData of studentsData) {
      try {
        const student = new Student(studentData);
        await student.save();
        results.successful.push(student);
      } catch (error) {
        results.failed.push({
          data: studentData,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Imported ${results.successful.length} students successfully, ${results.failed.length} failed`,
      results,
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during bulk import",
    });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  getStudentProfile,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents,
};
