const express = require("express");
const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotification,
} = require("../controllers/notificationController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Get notifications
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);

// Mark as read
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);

// Delete notification
router.delete("/:id", deleteNotification);

// Send notification (admin only)
router.post("/send", roleMiddleware("admin"), sendNotification);

module.exports = router;
