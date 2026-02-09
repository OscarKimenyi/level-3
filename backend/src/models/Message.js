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
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Generate conversation ID (always sorted so A-B is same as B-A)
messageSchema.pre("save", function (next) {
  const participants = [
    this.sender.toString(),
    this.receiver.toString(),
  ].sort();
  this.conversationId = participants.join("_");
  next();
});

module.exports = mongoose.model("Message", messageSchema);
