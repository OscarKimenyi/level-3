const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Course = require("../models/Course");

// Mark attendance
const markAttendance = async (req, res) => {
  try {
    const { course, date, records } = req.body;

    // Find the teacher making the request
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(403).json({
        success: false,
        message: "Only teachers can mark attendance",
      });
    }

    // Verify teacher owns this course
    const courseData = await Course.findById(course);
    if (
      !courseData ||
      courseData.teacher.toString() !== teacher._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to mark attendance for this course",
      });
    }

    // Process each attendance record
    const attendanceRecords = [];
    for (const record of records) {
      const { student, status } = record;

      // Check if attendance already exists for this student/course/date
      let attendance = await Attendance.findOne({
        student,
        course,
        date: new Date(date),
      });

      if (attendance) {
        // Update existing
        attendance.status = status;
        attendance.markedBy = teacher._id;
        await attendance.save();
      } else {
        // Create new
        attendance = new Attendance({
          student,
          course,
          date: new Date(date),
          status,
          markedBy: teacher._id,
        });
        await attendance.save();
      }

      attendanceRecords.push(attendance);
    }

    res.json({
      success: true,
      message: "Attendance marked successfully",
      data: attendanceRecords,
    });
  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error marking attendance",
      error: error.message,
    });
  }
};

// Get student attendance
const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { student: studentId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query)
      .populate("course", "courseCode courseName")
      .populate("markedBy", "firstName lastName")
      .sort({ date: -1 });

    // Calculate statistics
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === "present").length;
    const absent = attendance.filter((a) => a.status === "absent").length;
    const late = attendance.filter((a) => a.status === "late").length;
    const excused = attendance.filter((a) => a.status === "excused").length;

    const percentage =
      total > 0 ? (((present + late) / total) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: attendance,
      stats: {
        total,
        present,
        absent,
        late,
        excused,
        percentage,
      },
    });
  } catch (error) {
    console.error("Get student attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching attendance",
    });
  }
};

// Get course attendance
const getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;

    const query = { course: courseId };
    if (date) {
      query.date = new Date(date);
    }

    const attendance = await Attendance.find(query)
      .populate("student", "firstName lastName studentId")
      .populate("markedBy", "firstName lastName")
      .sort({ date: -1 });

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Get course attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching attendance",
    });
  }
};

// Get attendance report
const getAttendanceReport = async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.query;

    const query = {};
    if (courseId) query.course = courseId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query)
      .populate("student", "firstName lastName studentId classGrade")
      .populate("course", "courseCode courseName")
      .populate("markedBy", "firstName lastName");

    // Group by student
    const report = {};
    attendance.forEach((record) => {
      const studentId = record.student._id.toString();
      if (!report[studentId]) {
        report[studentId] = {
          student: record.student,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
        };
      }
      report[studentId][record.status]++;
      report[studentId].total++;
    });

    // Calculate percentages
    Object.values(report).forEach((student) => {
      student.percentage = (
        ((student.present + student.late) / student.total) *
        100
      ).toFixed(1);
    });

    res.json({
      success: true,
      data: Object.values(report),
    });
  } catch (error) {
    console.error("Get attendance report error:", error);
    res.status(500).json({
      success: false,
      message: "Server error generating report",
    });
  }
};

// Update attendance
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    res.json({
      success: true,
      message: "Attendance updated successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Update attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating attendance",
    });
  }
};

module.exports = {
  markAttendance,
  getStudentAttendance,
  getCourseAttendance,
  getAttendanceReport,
  updateAttendance,
};
