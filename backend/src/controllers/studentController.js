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
    // Find student by userId
    const student = await Student.findOne({ userId: req.user._id })
      .populate("userId", "username email profilePicture")
      .populate("parents", "username email");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    res.json({
      success: true,
      data: student,
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

    // Validate required fields
    if (!studentData.userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check if user exists
    const User = require("../models/User");
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
        message: "This user already has a student profile",
      });
    }

    // Set default values if not provided
    const student = new Student({
      userId: studentData.userId,
      firstName: studentData.firstName || user.username,
      lastName: studentData.lastName || "",
      phone: studentData.phone || "",
      classGrade: studentData.classGrade || "First Year",
      dateOfBirth: studentData.dateOfBirth || new Date(),
      gender: studentData.gender || "Other",
      address: studentData.address || "",
      emergencyContact: studentData.emergencyContact || {
        name: "",
        phone: "",
        relationship: "",
      },
      enrollmentDate: new Date(),
      status: "active",
    });

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
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Find the student to check ownership
    const existingStudent = await Student.findById(id);

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check permissions: Admin can update any student, student can only update their own
    const isAdmin = userRole === "admin";
    const isOwnProfile =
      existingStudent.userId.toString() === userId.toString();

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own profile.",
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.userId;
    delete updateData.studentId;
    delete updateData.enrollmentDate;

    // Students can only update certain fields
    if (!isAdmin) {
      // Allow students to update only these fields
      const allowedFields = [
        "firstName",
        "lastName",
        "phone",
        "address",
        "emergencyContact",
      ];
      Object.keys(updateData).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
    }

    const student = await Student.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("userId", "email username");

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
      error: error.message,
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
