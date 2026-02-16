const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    teacherId: {
      type: String,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    qualification: {
      type: String,
      required: true,
    },
    specialization: [
      {
        type: String,
      },
    ],
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    assignedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    contactNumber: {
      type: String,
      required: true,
    },
    department: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on-leave"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

// Generate teacher ID automatically - FIXED VERSION
teacherSchema.pre("save", function () {
  if (!this.teacherId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(1000 + Math.random() * 9000);
    this.teacherId = `TCH${year}${random}`;
  }
});

module.exports = mongoose.model("Teacher", teacherSchema);
