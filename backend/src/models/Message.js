const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false,
    },
    conversationId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.pre("save", function (next) {
  if (!this.conversationId) {
    const participants = [
      this.sender.toString(),
      this.receiver.toString(),
    ].sort();
    this.conversationId = participants.join("_");
  }
  next();
});

module.exports = mongoose.model("Message", messageSchema);
