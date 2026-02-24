const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Register new user
const register = async (req, res) => {
  try {
    const { username, email, password, role, ...additionalData } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message:
          "This email is already registered. Please use a different email.",
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message:
          "This username is already taken. Please choose a different username.",
      });
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      role: role || "student",
    });

    await user.save();
    console.log(`✅ User created: ${user.email} with role: ${user.role}`);

    // Generate token
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Check for duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === "email") {
        return res.status(400).json({
          success: false,
          message:
            "This email is already registered. Please use a different email.",
        });
      } else if (field === "username") {
        return res.status(400).json({
          success: false,
          message:
            "This username is already taken. Please choose a different username.",
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;

    let profile = null;

    // Get role-specific profile
    if (user.role === "student") {
      profile = await Student.findOne({ userId: user._id }).populate(
        "parents",
        "username email",
      );
    } else if (user.role === "teacher") {
      profile = await Teacher.findOne({ userId: user._id }).populate(
        "assignedCourses",
        "courseCode courseName",
      );
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        profile,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching profile",
    });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const updates = req.body;

    // Update user
    const allowedUpdates = ["username", "profilePicture"];
    allowedUpdates.forEach((update) => {
      if (updates[update] !== undefined) {
        user[update] = updates[update];
      }
    });

    await user.save();

    // Update role-specific profile
    if (user.role === "student") {
      const student = await Student.findOne({ userId: user._id });
      if (student) {
        const studentUpdates = ["firstName", "lastName", "phone", "address"];
        studentUpdates.forEach((update) => {
          if (updates[update] !== undefined) {
            student[update] = updates[update];
          }
        });
        await student.save();
      }
    } else if (user.role === "teacher") {
      const teacher = await Teacher.findOne({ userId: user._id });
      if (teacher) {
        const teacherUpdates = [
          "firstName",
          "lastName",
          "contactNumber",
          "qualification",
        ];
        teacherUpdates.forEach((update) => {
          if (updates[update] !== undefined) {
            teacher[update] = updates[update];
          }
        });
        await teacher.save();
      }
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email (in production)
    // For now, we'll log it
    console.log(`Password reset URL for ${email}: ${resetUrl}`);

    res.json({
      success: true,
      message:
        "Password reset email sent (check console for URL in development)",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error processing request",
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error resetting password",
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error changing password",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  changePassword,
};
