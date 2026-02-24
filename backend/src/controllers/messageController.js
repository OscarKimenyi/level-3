const Message = require("../models/Message");

const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      message,
      timestamp: new Date(),
    });

    await newMessage.save();

    res.json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Validate that userId is a valid ObjectId
    if (!userId || userId === "[object Object]") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    console.log("Getting conversation between:", currentUserId, "and", userId);

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get conversation",
      error: error.message,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    await Message.findByIdAndUpdate(messageId, { read: true });

    res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark as read",
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
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

module.exports = {
  sendMessage,
  getConversation,
  markAsRead,
  getUnreadCount,
};
