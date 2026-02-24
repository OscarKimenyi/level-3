import React, { useState, useEffect, useCallback } from "react";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
  ArcElement,
} from "chart.js";
import useAuth from "../context/useAuth";
import api from "../services/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
  ArcElement,
);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Admin dashboard data
  const [adminStats, setAdminStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalUsers: 0,
  });
  const [adminCharts, setAdminCharts] = useState({
    studentGrowth: { labels: [], data: [] },
    courseDistribution: { labels: [], data: [] },
  });
  const [recentActivities, setRecentActivities] = useState([]);

  // Teacher dashboard data
  const [teacherStats, setTeacherStats] = useState({
    activeCourses: 0,
    totalStudents: 0,
    pendingGrading: 0,
    todayClasses: 0,
  });
  const [teacherCharts, setTeacherCharts] = useState({
    performanceTrend: { labels: [], data: [] },
    classDistribution: { labels: [], data: [] },
  });
  const [todaySchedule, setTodaySchedule] = useState([]);

  // Student dashboard data
  const [studentStats, setStudentStats] = useState({
    enrolledCourses: 0,
    attendanceRate: 0,
    pendingAssignments: 0,
    averageGrade: 0,
  });
  const [studentCharts, setStudentCharts] = useState({
    attendanceTrend: { labels: [], data: [] },
    gradeDistribution: { labels: [], data: [] },
  });
  const [studentAssignments, setStudentAssignments] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      if (user?.role === "admin") {
        const response = await api.get("/dashboard/admin");
        if (response.data.success) {
          setAdminStats(response.data.data.stats);
          setAdminCharts(response.data.data.charts);
          setRecentActivities(response.data.data.recentActivities || []);
        }
      } else if (user?.role === "teacher") {
        const response = await api.get("/dashboard/teacher");
        if (response.data.success) {
          setTeacherStats(response.data.data.stats);
          setTeacherCharts(response.data.data.charts);
          setTodaySchedule(response.data.data.todaySchedule || []);
        }
      } else if (user?.role === "student") {
        const response = await api.get("/dashboard/student");
        if (response.data.success) {
          setStudentStats(response.data.data.stats);
          setStudentCharts(response.data.data.charts);
          setStudentAssignments(response.data.data.upcomingAssignments || []);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const cleanUsername = (username) => {
    if (!username) return "User";
    return username.replace(/[0-9_]+$/, "");
  };

  const getAdminCharts = () => {
    // Safe check with default values
    const safeAdminCharts = adminCharts || {
      studentGrowth: { labels: [], data: [] },
      courseDistribution: { labels: [], data: [] },
    };

    const studentGrowthData = {
      labels:
        safeAdminCharts.studentGrowth?.labels?.length > 0
          ? safeAdminCharts.studentGrowth.labels
          : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "New Students",
          data:
            safeAdminCharts.studentGrowth?.data?.length > 0
              ? safeAdminCharts.studentGrowth.data
              : [0, 0, 0, 0, 0, 0],
          backgroundColor: "rgba(79, 70, 229, 0.8)",
          borderRadius: 8,
        },
      ],
    };

    const courseDistributionData = {
      labels:
        safeAdminCharts.courseDistribution?.labels?.length > 0
          ? safeAdminCharts.courseDistribution.labels
          : ["Active", "Inactive", "Completed"],
      datasets: [
        {
          data:
            safeAdminCharts.courseDistribution?.data?.length > 0
              ? safeAdminCharts.courseDistribution.data
              : [0, 0, 0],
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(99, 102, 241, 0.8)",
          ],
          borderWidth: 0,
        },
      ],
    };

    return { studentGrowthData, courseDistributionData };
  };

  const getTeacherCharts = () => {
    // Add safe checks with default values
    const safeTeacherCharts = teacherCharts || {
      performanceTrend: { labels: [], data: [] },
      classDistribution: { labels: [], data: [] },
    };

    const performanceData = {
      labels: safeTeacherCharts.performanceTrend?.labels || [
        "Week 1",
        "Week 2",
        "Week 3",
        "Week 4",
        "Week 5",
      ],
      datasets: [
        {
          label: "Class Average",
          data: safeTeacherCharts.performanceTrend?.data || [0, 0, 0, 0, 0],
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79, 70, 229, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    };

    const classDistributionData = {
      labels: safeTeacherCharts.classDistribution?.labels || [
        "Course A",
        "Course B",
        "Course C",
        "Course D",
      ],
      datasets: [
        {
          data: safeTeacherCharts.classDistribution?.data || [0, 0, 0, 0],
          backgroundColor: [
            "rgba(79, 70, 229, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
        },
      ],
    };

    return { performanceData, classDistributionData };
  };

  const getStudentCharts = () => {
    // Safe check with default values
    const safeStudentCharts = studentCharts || {
      attendanceTrend: { labels: [], data: [] },
      gradeDistribution: { labels: [], data: [] },
    };

    const attendanceData = {
      labels:
        safeStudentCharts.attendanceTrend?.labels?.length > 0
          ? safeStudentCharts.attendanceTrend.labels
          : ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
      datasets: [
        {
          label: "Attendance %",
          data:
            safeStudentCharts.attendanceTrend?.data?.length > 0
              ? safeStudentCharts.attendanceTrend.data
              : [0, 0, 0, 0, 0],
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#10b981",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };

    const gradeData = {
      labels:
        safeStudentCharts.gradeDistribution?.labels?.length > 0
          ? safeStudentCharts.gradeDistribution.labels
          : ["A", "B", "C", "D", "F"],
      datasets: [
        {
          data:
            safeStudentCharts.gradeDistribution?.data?.length > 0
              ? safeStudentCharts.gradeDistribution.data
              : [0, 0, 0, 0, 0],
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",
            "rgba(79, 70, 229, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(249, 115, 22, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderWidth: 0,
        },
      ],
    };

    return { attendanceData, gradeData };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "var(--text-secondary)",
          font: {
            family: "Inter",
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "var(--card-bg)",
        titleColor: "var(--text-primary)",
        bodyColor: "var(--text-secondary)",
        borderColor: "var(--border-light)",
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "var(--border-light)",
          drawBorder: false,
        },
        ticks: {
          color: "var(--text-tertiary)",
          font: {
            family: "Inter",
            size: 11,
          },
          callback: function (value) {
            return (
              value + (this.chart.canvas.id === "attendance-chart" ? "%" : "")
            );
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "var(--text-tertiary)",
          font: {
            family: "Inter",
            size: 11,
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <div
          className="spinner-border text-primary"
          style={{ width: "3rem", height: "3rem" }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (user?.role === "admin") {
    const { studentGrowthData, courseDistributionData } = getAdminCharts();

    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Welcome back, {cleanUsername(user?.username)} 👋</h1>
          <p>Here's what's happening with your institution today.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <i className="bi bi-people-fill"></i>
              </div>
              <span className="stat-card-title">Students</span>
            </div>
            <div className="stat-card-value">{adminStats.totalStudents}</div>
            <div className="stat-card-trend">
              <span className="trend-up">
                <i className="bi bi-arrow-up-short"></i>12%
              </span>
              <span>from last month</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <i className="bi bi-person-badge-fill"></i>
              </div>
              <span className="stat-card-title">Teachers</span>
            </div>
            <div className="stat-card-value">{adminStats.totalTeachers}</div>
            <div className="stat-card-trend">
              <span className="trend-up">
                <i className="bi bi-arrow-up-short"></i>8%
              </span>
              <span>from last month</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <i className="bi bi-book-fill"></i>
              </div>
              <span className="stat-card-title">Courses</span>
            </div>
            <div className="stat-card-value">{adminStats.totalCourses}</div>
            <div className="stat-card-trend">
              <span className="trend-up">
                <i className="bi bi-arrow-up-short"></i>5%
              </span>
              <span>from last month</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <i className="bi bi-people-fill"></i>
              </div>
              <span className="stat-card-title">Total Users</span>
            </div>
            <div className="stat-card-value">{adminStats.totalUsers}</div>
            <div className="stat-card-trend">
              <span className="trend-up">
                <i className="bi bi-arrow-up-short"></i>15%
              </span>
              <span>from last month</span>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Student Growth</h3>
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <div className="chart-container">
              <Bar data={studentGrowthData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Course Distribution</h3>
              <i className="bi bi-pie-chart"></i>
            </div>
            <div className="chart-container">
              <Doughnut data={courseDistributionData} options={chartOptions} />
            </div>
          </div>
        </div>

        {recentActivities.length > 0 && (
          <div className="card-modern">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
              <button className="btn-modern btn-secondary">View All</button>
            </div>
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Time</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <div
                            className="user-avatar"
                            style={{
                              width: "32px",
                              height: "32px",
                              fontSize: "0.8rem",
                            }}
                          >
                            {activity.user?.charAt(0)}
                          </div>
                          <span>{activity.user}</span>
                        </div>
                      </td>
                      <td>{activity.action}</td>
                      <td>{activity.time}</td>
                      <td>
                        <span className={`badge-modern badge-${activity.type}`}>
                          {activity.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Teacher Dashboard
  if (user?.role === "teacher") {
    const { performanceData, classDistributionData } = getTeacherCharts();

    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Welcome back, {cleanUsername(user?.username)} 👋</h1>
          <p>Here's what's happening with your classes today.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <i className="bi bi-journal-bookmark-fill"></i>
              </div>
              <span className="stat-card-title">Active Courses</span>
            </div>
            <div className="stat-card-value">{teacherStats.activeCourses}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <i className="bi bi-people-fill"></i>
              </div>
              <span className="stat-card-title">Students</span>
            </div>
            <div className="stat-card-value">{teacherStats.totalStudents}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <i className="bi bi-clock-history"></i>
              </div>
              <span className="stat-card-title">Pending Grading</span>
            </div>
            <div className="stat-card-value">{teacherStats.pendingGrading}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <i className="bi bi-calendar-event-fill"></i>
              </div>
              <span className="stat-card-title">Today's Classes</span>
            </div>
            <div className="stat-card-value">{teacherStats.todayClasses}</div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Class Performance Trend</h3>
              <i className="bi bi-bar-chart-line"></i>
            </div>
            <div className="chart-container">
              <Line data={performanceData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Class Distribution</h3>
              <i className="bi bi-pie-chart"></i>
            </div>
            <div className="chart-container">
              <Doughnut data={classDistributionData} options={chartOptions} />
            </div>
          </div>
        </div>

        {todaySchedule.length > 0 && (
          <div className="card-modern" style={{ marginTop: "var(--space-6)" }}>
            <div className="card-header">
              <h3 className="card-title">Today's Schedule</h3>
            </div>
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Course</th>
                    <th>Room</th>
                    <th>Students</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySchedule.map((item, index) => (
                    <tr key={index}>
                      <td>
                        {item.schedule?.startTime} - {item.schedule?.endTime}
                      </td>
                      <td>
                        {item.courseCode} - {item.courseName}
                      </td>
                      <td>{item.schedule?.room}</td>
                      <td>{item.studentCount} students</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Student Dashboard
  if (user?.role === "student") {
    const { attendanceData, gradeData } = getStudentCharts();

    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Welcome back, {cleanUsername(user?.username)} 👋</h1>
          <p>Here's your academic progress.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <i className="bi bi-book-fill"></i>
              </div>
              <span className="stat-card-title">Enrolled Courses</span>
            </div>
            <div className="stat-card-value">
              {studentStats.enrolledCourses}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <i className="bi bi-calendar-check-fill"></i>
              </div>
              <span className="stat-card-title">Attendance</span>
            </div>
            <div className="stat-card-value">
              {studentStats.attendanceRate}%
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <i className="bi bi-file-earmark-text-fill"></i>
              </div>
              <span className="stat-card-title">Pending Assignments</span>
            </div>
            <div className="stat-card-value">
              {studentStats.pendingAssignments}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon">
                <i className="bi bi-award-fill"></i>
              </div>
              <span className="stat-card-title">Average Grade</span>
            </div>
            <div className="stat-card-value">{studentStats.averageGrade}%</div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Attendance Trend</h3>
              <i className="bi bi-graph-up"></i>
            </div>
            <div className="chart-container">
              <Line data={attendanceData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <h3>Grade Distribution</h3>
              <i className="bi bi-pie-chart"></i>
            </div>
            <div className="chart-container">
              <Doughnut data={gradeData} options={chartOptions} />
            </div>
          </div>
        </div>

        {studentAssignments.length > 0 && (
          <div className="card-modern" style={{ marginTop: "var(--space-6)" }}>
            <div className="card-header">
              <h3 className="card-title">Upcoming Assignments</h3>
            </div>
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Assignment</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAssignments.map((assignment) => (
                    <tr key={assignment._id}>
                      <td>{assignment.courseCode}</td>
                      <td>{assignment.title}</td>
                      <td>
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </td>
                      <td>
                        {assignment.submitted ? (
                          <span className="badge-modern badge-success">
                            Submitted
                          </span>
                        ) : (
                          <span className="badge-modern badge-warning">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default Dashboard;
