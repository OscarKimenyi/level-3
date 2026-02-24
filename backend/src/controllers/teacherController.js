const Teacher = require("../models/Teacher");
const User = require("../models/User");
const Course = require("../models/Course");

// Get all teachers
const getTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { teacherId: { $regex: search, $options: "i" } },
      ];
    }

    if (department) {
      query.department = department;
    }

    const teachers = await Teacher.find(query)
      .populate("userId", "username email profilePicture")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Teacher.countDocuments(query);

    res.json({
      success: true,
      data: teachers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get teachers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching teachers",
    });
  }
};

// Get teacher by ID
const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate("userId", "username email profilePicture")
      .populate("assignedCourses", "courseCode courseName");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error("Get teacher error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching teacher",
    });
  }
};

// Get teacher profile (current user)
const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id }).populate(
      "assignedCourses",
      "courseCode courseName credits",
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    // Get courses taught by this teacher
    const courses = await Course.find({ teacher: teacher._id }).populate(
      "students",
      "firstName lastName",
    );

    res.json({
      success: true,
      data: {
        ...teacher.toObject(),
        courses,
      },
    });
  } catch (error) {
    console.error("Get teacher profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching teacher profile",
    });
  }
};

// Create new teacher - FIX THIS FUNCTION
const createTeacher = async (req, res) => {
  try {
    const teacherData = req.body;

    console.log("Received teacher creation request:", teacherData);

    // Validate required fields
    if (!teacherData.userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check if user exists
    const User = require("../models/User");
    const user = await User.findById(teacherData.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if teacher already exists for this user
    const existingTeacher = await Teacher.findOne({
      userId: teacherData.userId,
    });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: "Teacher already exists for this user",
      });
    }

    // Process specialization if it's a string
    let specialization = teacherData.specialization || [];
    if (typeof specialization === "string") {
      specialization = specialization
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
    }

    // Set default values if not provided
    const teacher = new Teacher({
      userId: teacherData.userId,
      firstName: teacherData.firstName || user.username,
      lastName: teacherData.lastName || "",
      qualification: teacherData.qualification || "Not specified",
      specialization: specialization,
      joiningDate: teacherData.joiningDate || new Date(),
      assignedCourses: teacherData.assignedCourses || [],
      contactNumber: teacherData.contactNumber || "",
      department: teacherData.department || "General",
      status: teacherData.status || "active",
    });

    console.log("Saving teacher:", teacher);

    await teacher.save();

    // Update user role if not already teacher
    if (user.role !== "teacher") {
      user.role = "teacher";
      await user.save();
    }

    console.log("Teacher created successfully:", teacher._id);

    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: teacher,
    });
  } catch (error) {
    console.error("Create teacher error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating teacher",
      error: error.message,
    });
  }
};

// Update teacher - FIX PERMISSIONS
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Find the teacher to check ownership
    const existingTeacher = await Teacher.findById(id);

    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Check permissions: Admin can update any teacher, teacher can only update their own
    const isAdmin = userRole === "admin";
    const isOwnProfile =
      existingTeacher.userId.toString() === userId.toString();

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own profile.",
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.userId;
    delete updateData.teacherId;
    delete updateData.assignedCourses;
    delete updateData.joiningDate;

    // Teachers can only update certain fields
    if (!isAdmin) {
      const allowedFields = [
        "firstName",
        "lastName",
        "contactNumber",
        "qualification",
        "specialization",
      ];
      Object.keys(updateData).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
    }

    const teacher = await Teacher.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("userId", "email username");

    res.json({
      success: true,
      message: "Teacher updated successfully",
      data: teacher,
    });
  } catch (error) {
    console.error("Update teacher error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating teacher",
      error: error.message,
    });
  }
};

// Delete teacher
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    console.error("Delete teacher error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting teacher",
    });
  }
};

module.exports = {
  getTeachers,
  getTeacherById,
  getTeacherProfile,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
