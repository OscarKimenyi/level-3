const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    studentId: {
      type: String,
      required: true,
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
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    phone: {
      type: String,
      required: true,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    classGrade: {
      type: String,
      required: true,
    },
    section: {
      type: String,
    },
    parents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "graduated", "transferred"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

// Generate student ID automatically
studentSchema.pre("save", async function (next) {
  if (!this.studentId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(1000 + Math.random() * 9000);
    this.studentId = `STU${year}${random}`;
  }
  next();
});

module.exports = mongoose.model("Student", studentSchema);
