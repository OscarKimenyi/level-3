const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getConversation,
  markAsRead,
  getUnreadCount,
} = require("../controllers/messageController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/send", sendMessage);
router.get("/conversation/:userId", getConversation);
router.put("/:messageId/read", markAsRead);
router.get("/unread/count", getUnreadCount);

module.exports = router;
