const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const User = require("../models/User");

// Get admin dashboard data
const getAdminDashboard = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalUsers = await User.countDocuments();

    // Get recent activities
    const recentActivities = [];

    // Recent students
    const recentStudents = await Student.find()
      .populate("userId", "username")
      .sort({ createdAt: -1 })
      .limit(3);

    recentStudents.forEach((s) => {
      recentActivities.push({
        id: `student-${s._id}`,
        user: s.userId?.username || "Unknown",
        action: "New student registered",
        time: formatTimeAgo(s.createdAt),
        type: "student",
      });
    });

    // Recent assignments
    const recentAssignments = await Assignment.find()
      .populate("course", "courseName")
      .sort({ createdAt: -1 })
      .limit(3);

    recentAssignments.forEach((a) => {
      recentActivities.push({
        id: `assignment-${a._id}`,
        user: "System",
        action: `New assignment: ${a.title}`,
        time: formatTimeAgo(a.createdAt),
        type: "assignment",
      });
    });

    // Sort by date
    recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalTeachers,
          totalCourses,
          totalUsers,
        },
        recentActivities: recentActivities.slice(0, 5),
        chartData: {
          studentGrowth: await getStudentGrowthData(),
          courseDistribution: await getCourseDistributionData(),
        },
      },
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get teacher dashboard data
const getTeacherDashboard = async (req, res) => {
  try {
    // Find teacher profile
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res
        .status(404)
        .json({ success: false, message: "Teacher not found" });
    }

    // Get teacher's courses
    const courses = await Course.find({ teacher: teacher._id })
      .populate("students", "firstName lastName")
      .lean();

    // Calculate total students
    const totalStudents = courses.reduce(
      (acc, course) => acc + (course.students?.length || 0),
      0,
    );

    // Get pending assignments to grade
    const assignments = await Assignment.find({
      course: { $in: courses.map((c) => c._id) },
    });

    const pendingGrading = assignments.reduce((acc, assignment) => {
      const ungraded =
        assignment.submissions?.filter((s) => !s.grade).length || 0;
      return acc + ungraded;
    }, 0);

    // Get today's schedule
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayName = days[new Date().getDay()];

    const todaySchedule = courses
      .filter((course) => course.schedule?.some((s) => s.day === todayName))
      .map((course) => ({
        courseCode: course.courseCode,
        courseName: course.courseName,
        schedule: course.schedule.find((s) => s.day === todayName),
        studentCount: course.students?.length || 0,
      }))
      .sort((a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime));

    // Get upcoming assignments
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingAssignments = await Assignment.find({
      course: { $in: courses.map((c) => c._id) },
      dueDate: { $gte: new Date(), $lte: nextWeek },
      status: "published",
    })
      .populate("course", "courseCode courseName")
      .lean();

    const formattedUpcoming = upcomingAssignments.map((assignment) => ({
      _id: assignment._id,
      title: assignment.title,
      courseCode: assignment.course.courseCode,
      dueDate: assignment.dueDate,
      submissionsCount: assignment.submissions?.length || 0,
      totalStudents: assignment.course?.students?.length || 0,
    }));

    // Get recent submissions
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentSubmissions = [];

    for (const assignment of assignments) {
      const recent =
        assignment.submissions
          ?.filter((sub) => new Date(sub.submittedAt) >= yesterday)
          .map((sub) => ({
            _id: sub._id,
            studentName:
              `${sub.student?.firstName || ""} ${sub.student?.lastName || ""}`.trim(),
            assignmentTitle: assignment.title,
            courseCode: assignment.course?.courseCode || "",
            submittedAt: sub.submittedAt,
            status: sub.grade ? "graded" : "pending",
          })) || [];

      recentSubmissions.push(...recent);
    }

    recentSubmissions.sort(
      (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt),
    );

    res.json({
      success: true,
      data: {
        stats: {
          activeCourses: courses.length,
          totalStudents,
          pendingGrading,
          todayClasses: todaySchedule.length,
        },
        todaySchedule,
        upcomingAssignments: formattedUpcoming,
        recentSubmissions: recentSubmissions.slice(0, 5),
        performanceTrend: await getTeacherPerformanceData(teacher._id),
      },
    });
  } catch (error) {
    console.error("Get teacher dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get student dashboard data
const getStudentDashboard = async (req, res) => {
  try {
    // Find student profile
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Get enrolled courses
    const courses = await Course.find({ students: student._id })
      .populate("teacher", "firstName lastName")
      .lean();

    // Get attendance stats
    const attendanceRecords = await Attendance.find({
      student: student._id,
      date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
    });

    const present = attendanceRecords.filter(
      (a) => a.status === "present",
    ).length;
    const total = attendanceRecords.length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    // Get assignments
    const assignments = await Assignment.find({
      course: { $in: courses.map((c) => c._id) },
    })
      .populate("course", "courseCode courseName")
      .lean();

    // Calculate stats
    const pendingAssignments = assignments.filter((a) => {
      const submitted = a.submissions?.some(
        (s) => s.student?.toString() === student._id.toString(),
      );
      return !submitted && new Date(a.dueDate) > new Date();
    }).length;

    // Calculate average grade
    let totalGrade = 0;
    let gradedCount = 0;

    assignments.forEach((assignment) => {
      const submission = assignment.submissions?.find(
        (s) => s.student?.toString() === student._id.toString(),
      );
      if (submission?.grade) {
        totalGrade += submission.grade;
        gradedCount++;
      }
    });

    const averageGrade =
      gradedCount > 0 ? Math.round(totalGrade / gradedCount) : 0;

    // Get upcoming assignments
    const upcomingAssignments = assignments
      .filter((a) => new Date(a.dueDate) > new Date())
      .map((a) => ({
        _id: a._id,
        title: a.title,
        courseCode: a.course?.courseCode,
        dueDate: a.dueDate,
        submitted: a.submissions?.some(
          (s) => s.student?.toString() === student._id.toString(),
        ),
      }))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    // Get recent grades
    const recentGrades = [];
    assignments.forEach((assignment) => {
      const submission = assignment.submissions?.find(
        (s) => s.student?.toString() === student._id.toString(),
      );
      if (submission?.grade) {
        recentGrades.push({
          courseCode: assignment.course?.courseCode,
          assignmentTitle: assignment.title,
          grade: submission.grade,
          feedback: submission.feedback,
          gradedAt: submission.gradedAt,
        });
      }
    });

    recentGrades.sort((a, b) => new Date(b.gradedAt) - new Date(a.gradedAt));

    res.json({
      success: true,
      data: {
        stats: {
          enrolledCourses: courses.length,
          attendanceRate,
          pendingAssignments,
          averageGrade,
        },
        upcomingAssignments: upcomingAssignments.slice(0, 5),
        recentGrades: recentGrades.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Get student dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Helper functions
const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
};

const getStudentGrowthData = async () => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const data = [];

  for (let i = 0; i < 6; i++) {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const count = await Student.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    data.unshift(count);
  }

  return {
    labels: months.slice(0, 6),
    data,
  };
};

const getCourseDistributionData = async () => {
  const courses = await Course.find().populate("students");

  return {
    labels: ["Active", "Inactive", "Graduated"],
    data: [300, 50, 100], // You can calculate these from actual data
  };
};

const getTeacherPerformanceData = async (teacherId) => {
  const assignments = await Assignment.find().populate({
    path: "course",
    match: { teacher: teacherId },
  });

  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
  const data = [75, 82, 78, 89, 92]; // Calculate from actual grades

  return {
    labels: weeks,
    data,
  };
};

module.exports = {
  getAdminDashboard,
  getTeacherDashboard,
  getStudentDashboard,
};
