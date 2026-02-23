const Course = require("../models/Course");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

// Get all courses
const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, semester, teacher } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { courseCode: { $regex: search, $options: "i" } },
        { courseName: { $regex: search, $options: "i" } },
      ];
    }

    if (semester) {
      query.semester = semester;
    }

    if (teacher) {
      query.teacher = teacher;
    }

    const courses = await Course.find(query)
      .populate("teacher", "firstName lastName teacherId")
      .populate("students", "firstName lastName studentId")
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ courseCode: 1 });

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching courses",
      error: error.message,
    });
  }
};

// Get course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("teacher", "firstName lastName teacherId qualification")
      .populate("students", "firstName lastName studentId classGrade");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching course",
    });
  }
};

// Get courses for current teacher
const getTeacherCourses = async (req, res) => {
  try {
    // Find teacher for current user
    const teacher = await Teacher.findOne({ userId: req.user._id });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    const courses = await Course.find({ teacher: teacher._id }).populate(
      "students",
      "firstName lastName studentId",
    );

    res.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Get teacher courses error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching teacher courses",
    });
  }
};

// Get students in a course
const getCourseStudents = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "students",
      "firstName lastName studentId classGrade phone",
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.json({
      success: true,
      data: course.students,
    });
  } catch (error) {
    console.error("Get course students error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching course students",
    });
  }
};

// Create new course
const createCourse = async (req, res) => {
  try {
    const courseData = req.body;

    // Check if course code already exists
    const existingCourse = await Course.findOne({
      courseCode: courseData.courseCode,
    });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: "Course code already exists",
      });
    }

    // Check if teacher exists
    const teacher = await Teacher.findById(courseData.teacher);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const course = new Course(courseData);
    await course.save();

    // Add course to teacher's assigned courses
    teacher.assignedCourses.push(course._id);
    await teacher.save();

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating course",
      error: error.message,
    });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating course",
    });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Remove course from teacher's assigned courses
    await Teacher.updateOne(
      { _id: course.teacher },
      { $pull: { assignedCourses: course._id } },
    );

    res.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting course",
    });
  }
};

// Enroll student in course
const enrollStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if student is already enrolled
    if (course.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Student already enrolled in this course",
      });
    }

    // Check if course has reached max capacity
    if (course.students.length >= course.maxStudents) {
      return res.status(400).json({
        success: false,
        message: "Course has reached maximum capacity",
      });
    }

    // Enroll student
    course.students.push(studentId);
    await course.save();

    res.json({
      success: true,
      message: "Student enrolled successfully",
      data: course,
    });
  } catch (error) {
    console.error("Enroll student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error enrolling student",
    });
  }
};

// Remove student from course
const removeStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if student is enrolled
    if (!course.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Student is not enrolled in this course",
      });
    }

    // Remove student
    course.students = course.students.filter(
      (id) => id.toString() !== studentId,
    );
    await course.save();

    res.json({
      success: true,
      message: "Student removed successfully",
      data: course,
    });
  } catch (error) {
    console.error("Remove student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error removing student",
    });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  getTeacherCourses,
  getCourseStudents,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
  removeStudent,
};
