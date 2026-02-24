import React, { useState, useEffect, useCallback } from "react";
//import { useNavigate } from "react-router-dom";
import { Bar, Line } from "react-chartjs-2";
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
);

const Dashboard = () => {
  const { user } = useAuth();
  //const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    attendanceRate: 95,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      if (user?.role === "admin") {
        const [studentsRes, teachersRes, coursesRes] = await Promise.all([
          api
            .get("/students?limit=1")
            .catch(() => ({ data: { pagination: { total: 0 } } })),
          api
            .get("/teachers?limit=1")
            .catch(() => ({ data: { pagination: { total: 0 } } })),
          api
            .get("/courses?limit=1")
            .catch(() => ({ data: { pagination: { total: 0 } } })),
        ]);

        setStats({
          totalStudents: studentsRes.data.pagination?.total || 0,
          totalTeachers: teachersRes.data.pagination?.total || 0,
          totalCourses: coursesRes.data.pagination?.total || 0,
          attendanceRate: 95,
        });
      } else if (user?.role === "teacher") {
        // Teacher-specific stats can be added here
        setStats({
          totalStudents: 45,
          totalTeachers: 1,
          totalCourses: 3,
          attendanceRate: 92,
        });
      } else if (user?.role === "student") {
        // Student-specific stats can be added here
        setStats({
          totalStudents: 1,
          totalTeachers: 5,
          totalCourses: 4,
          attendanceRate: 88,
        });
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

  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Students",
        data: [65, 78, 90, 81, 96, 105],
        backgroundColor: "rgba(79, 70, 229, 0.8)",
        borderRadius: 8,
      },
    ],
  };

  const lineData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
    datasets: [
      {
        label: "Performance",
        data: [75, 82, 78, 89, 92],
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#4f46e5",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const recentActivities = [
    {
      id: 1,
      user: "John Doe",
      action: "Submitted assignment",
      time: "5 minutes ago",
      type: "submission",
    },
    {
      id: 2,
      user: "Jane Smith",
      action: "Marked attendance",
      time: "15 minutes ago",
      type: "attendance",
    },
    {
      id: 3,
      user: "Admin",
      action: "Added new course",
      time: "1 hour ago",
      type: "course",
    },
    {
      id: 4,
      user: "Robert Johnson",
      action: "Updated profile",
      time: "2 hours ago",
      type: "profile",
    },
    {
      id: 5,
      user: "Sarah Williams",
      action: "Sent message",
      time: "3 hours ago",
      type: "message",
    },
  ];

  const cleanUsername = (username) => {
    if (!username) return "User";
    return username.replace(/[0-9_]+$/, "");
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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {cleanUsername(user?.username)} 👋</h1>
        <p>Here's what's happening with your institution today.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon">
              <i className="bi bi-people-fill"></i>
            </div>
            <span className="stat-card-title">Students</span>
          </div>
          <div className="stat-card-value">{stats.totalStudents}</div>
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
          <div className="stat-card-value">{stats.totalTeachers}</div>
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
          <div className="stat-card-value">{stats.totalCourses}</div>
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
              <i className="bi bi-calendar-check-fill"></i>
            </div>
            <span className="stat-card-title">Attendance</span>
          </div>
          <div className="stat-card-value">{stats.attendanceRate}%</div>
          <div className="stat-card-trend">
            <span className="trend-down">
              <i className="bi bi-arrow-down-short"></i>2%
            </span>
            <span>from last month</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Student Growth</h3>
            <i className="bi bi-graph-up-arrow"></i>
          </div>
          <div className="chart-container">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: "var(--card)",
                    titleColor: "var(--text)",
                    bodyColor: "var(--text-light)",
                    borderColor: "var(--border)",
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                      label: function (context) {
                        return ` Students: ${context.raw}`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    grid: {
                      color: "var(--border-light)",
                    },
                    ticks: {
                      color: "var(--text-light)",
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: "var(--text-light)",
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3>Performance Trend</h3>
            <i className="bi bi-bar-chart-line"></i>
          </div>
          <div className="chart-container">
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: "var(--card)",
                    titleColor: "var(--text)",
                    bodyColor: "var(--text-light)",
                    borderColor: "var(--border)",
                    borderWidth: 1,
                    padding: 12,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                      color: "var(--border-light)",
                    },
                    ticks: {
                      color: "var(--text-light)",
                      callback: function (value) {
                        return value + "%";
                      },
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: "var(--text-light)",
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
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
                <th>Status</th>
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
                        {activity.user.charAt(0)}
                      </div>
                      <span>{activity.user}</span>
                    </div>
                  </td>
                  <td>{activity.action}</td>
                  <td>{activity.time}</td>
                  <td>
                    <span
                      className={`badge-modern badge-${
                        activity.type === "submission"
                          ? "success"
                          : activity.type === "attendance"
                            ? "warning"
                            : activity.type === "course"
                              ? "info"
                              : activity.type === "profile"
                                ? "primary"
                                : "secondary"
                      }`}
                    >
                      {activity.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
