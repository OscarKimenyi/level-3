const Course = require("../models/Course");
const Assignment = require("../models/Assignment");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");

// Get teacher dashboard data
const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Find teacher profile
    const teacher = await Teacher.findOne({ userId: teacherId });
    if (!teacher) {
      return res
        .status(404)
        .json({ success: false, message: "Teacher not found" });
    }

    // 1. Get teacher's courses
    const courses = await Course.find({ teacher: teacher._id })
      .populate("students", "firstName lastName")
      .lean();

    // 2. Calculate class performance trend (last 5 weeks)
    const today = new Date();
    const performanceTrend = [];

    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - i * 7);

      // Get average grades for this week
      const assignments = await Assignment.find({
        course: { $in: courses.map((c) => c._id) },
        dueDate: {
          $gte: weekStart,
          $lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      let totalGrade = 0;
      let count = 0;

      assignments.forEach((assignment) => {
        assignment.submissions.forEach((sub) => {
          if (sub.grade) {
            totalGrade += sub.grade;
            count++;
          }
        });
      });

      performanceTrend.push({
        week: `Week ${i + 1}`,
        average: count > 0 ? (totalGrade / count).toFixed(1) : 0,
      });
    }

    // 3. Get today's schedule
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayName = days[today.getDay()];

    const todaySchedule = courses
      .filter((course) => course.schedule?.some((s) => s.day === todayName))
      .map((course) => ({
        courseCode: course.courseCode,
        courseName: course.courseName,
        schedule: course.schedule.find((s) => s.day === todayName),
        studentCount: course.students.length,
      }))
      .sort((a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime));

    // 4. Get upcoming assignments (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const upcomingAssignments = await Assignment.find({
      course: { $in: courses.map((c) => c._id) },
      dueDate: { $gte: today, $lte: nextWeek },
      status: "published",
    })
      .populate("course", "courseCode courseName")
      .populate("submissions.student", "firstName lastName")
      .lean();

    const formattedUpcoming = upcomingAssignments.map((assignment) => ({
      _id: assignment._id,
      title: assignment.title,
      courseCode: assignment.course.courseCode,
      dueDate: assignment.dueDate,
      submissionsCount: assignment.submissions.length,
      totalStudents: assignment.course.students?.length || 0,
    }));

    // 5. Get recent submissions (last 24 hours)
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const recentSubmissions = [];

    for (const assignment of upcomingAssignments) {
      const recent = assignment.submissions
        .filter((sub) => new Date(sub.submittedAt) >= yesterday)
        .map((sub) => ({
          _id: sub._id,
          studentName: `${sub.student?.firstName} ${sub.student?.lastName}`,
          assignmentTitle: assignment.title,
          courseCode: assignment.course.courseCode,
          submittedAt: sub.submittedAt,
          status: sub.grade ? "graded" : "pending",
        }));

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
          pendingGrading: upcomingAssignments.reduce(
            (acc, a) =>
              acc +
              (a.submissions.length -
                a.submissions.filter((s) => s.grade).length),
            0,
          ),
          unreadMessages: 0, // You can implement this later
          todayClasses: todaySchedule.length,
        },
        performanceTrend,
        todaySchedule,
        upcomingAssignments: formattedUpcoming,
        recentSubmissions: recentSubmissions.slice(0, 10),
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
    const studentId = req.user._id;

    // Find student profile
    const student = await Student.findOne({ userId: studentId });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Get student's courses
    const courses = await Course.find({ students: student._id })
      .populate("teacher", "firstName lastName")
      .lean();

    // Get attendance stats
    const attendanceRecords = await Attendance.find({
      student: student._id,
      date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) },
    });

    const attendanceStats = {
      present: attendanceRecords.filter((a) => a.status === "present").length,
      absent: attendanceRecords.filter((a) => a.status === "absent").length,
      late: attendanceRecords.filter((a) => a.status === "late").length,
      excused: attendanceRecords.filter((a) => a.status === "excused").length,
      total: attendanceRecords.length,
    };

    // Get upcoming assignments
    const upcomingAssignments = await Assignment.find({
      course: { $in: courses.map((c) => c._id) },
      dueDate: { $gte: new Date() },
      status: "published",
    })
      .populate("course", "courseCode courseName")
      .lean();

    // Get recent grades
    const recentGrades = [];
    for (const assignment of upcomingAssignments) {
      const submission = assignment.submissions?.find(
        (s) => s.student?.toString() === student._id.toString(),
      );
      if (submission?.grade) {
        recentGrades.push({
          courseCode: assignment.course.courseCode,
          assignmentTitle: assignment.title,
          grade: submission.grade,
          feedback: submission.feedback,
          gradedAt: submission.gradedAt,
        });
      }
    }

    res.json({
      success: true,
      data: {
        stats: {
          enrolledCourses: courses.length,
          attendanceRate:
            attendanceStats.total > 0
              ? (
                  ((attendanceStats.present + attendanceStats.late) /
                    attendanceStats.total) *
                  100
                ).toFixed(1)
              : 0,
          pendingAssignments: upcomingAssignments.filter((a) => {
            const submitted = a.submissions?.some(
              (s) => s.student?.toString() === student._id.toString(),
            );
            return !submitted;
          }).length,
          averageGrade:
            recentGrades.length > 0
              ? (
                  recentGrades.reduce((acc, g) => acc + g.grade, 0) /
                  recentGrades.length
                ).toFixed(1)
              : 0,
        },
        upcomingAssignments: upcomingAssignments.map((a) => ({
          _id: a._id,
          title: a.title,
          courseCode: a.course.courseCode,
          dueDate: a.dueDate,
          submitted: a.submissions?.some(
            (s) => s.student?.toString() === student._id.toString(),
          ),
        })),
        recentGrades: recentGrades.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Get student dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getTeacherDashboard,
  getStudentDashboard,
};
