require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@school.com" });

    if (existingAdmin) {
      console.log("Admin user already exists");
      console.log("Email: admin@school.com");
      console.log("Password: admin123");
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      username: "admin",
      email: "admin@school.com",
      password: "admin123",
      role: "admin",
      isActive: true,
    });

    await admin.save();

    console.log("Admin user created successfully!");
    console.log("Email: admin@school.com");
    console.log("Password: admin123");
    console.log("CHANGE THIS PASSWORD AFTER FIRST LOGIN!");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
