// backend/config/db.js
const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "time_generator_db",
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("Mongo error:", err);
    process.exit(1); // app band kar do agar DB hi nahi chalu
  }
}

module.exports = connectDB;
