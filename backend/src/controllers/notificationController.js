const Notification = require("../models/Notification");
const User = require("../models/User");

// Get user's notifications
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: req.user._id };
    if (unreadOnly === "true") {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate("sender", "username email role")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.json({
      success: true,
      message: "Marked as read",
      unreadCount,
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark as read",
    });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true },
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all as read",
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.json({
      success: true,
      message: "Notification deleted",
      unreadCount,
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

// Send notification (admin only)
const sendNotification = async (req, res) => {
  try {
    const { title, message, type, recipients, link, metadata } = req.body;

    if (!title || !message || !recipients) {
      return res.status(400).json({
        success: false,
        message: "Title, message, and recipients are required",
      });
    }

    let targetUsers = [];

    // Determine recipients
    switch (recipients) {
      case "all":
        targetUsers = await User.find({ isActive: true }).select("_id");
        break;
      case "students":
        targetUsers = await User.find({
          role: "student",
          isActive: true,
        }).select("_id");
        break;
      case "teachers":
        targetUsers = await User.find({
          role: "teacher",
          isActive: true,
        }).select("_id");
        break;
      case "parents":
        targetUsers = await User.find({
          role: "parent",
          isActive: true,
        }).select("_id");
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid recipient type",
        });
    }

    if (targetUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found for the selected recipient group",
      });
    }

    // Create notifications for all recipients
    const notifications = targetUsers.map((user) => ({
      recipient: user._id,
      sender: req.user._id,
      title,
      message,
      type: type || "info",
      link,
      metadata,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }));

    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`✅ Created ${createdNotifications.length} notifications`);

    // Emit real-time notifications via socket.io
    const io = req.app.get("io");

    // Emit to each user individually
    let sentCount = 0;
    for (const notification of createdNotifications) {
      const userId = notification.recipient.toString();
      io.to(userId).emit("new_notification", {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        timestamp: notification.createdAt,
        link: notification.link,
        read: false,
      });
      sentCount++;
      console.log(`📨 Emitted notification to user: ${userId}`);
    }

    console.log(`📨 Emitted real-time notifications to ${sentCount} users`);

    res.json({
      success: true,
      message: `Notification sent to ${targetUsers.length} users`,
      count: targetUsers.length,
    });
  } catch (error) {
    console.error("❌ Send notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification,
};
