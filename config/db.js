const mongoose = require("mongoose");
const User = require("../models/User"); // Import User model
const seedUsers=require("./seedUser")
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI||"mongodb+srv://linkplayer23577:8RXDGgtlqF3WPzPP@cluster0.f7fda.mongodb.net/", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await seedUsers()
    console.log("MongoDB Connected");

    // Seed Default Users
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// Seed default admin, manager, and user



module.exports = connectDB;
