// backend/models/TimeEntry.js
const mongoose = require("mongoose");

const timeEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },      // "2025-12-05"
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "18:00"
    totalMinutes: { type: Number, required: true },
  },
  { timestamps: true }
);

const TimeEntry = mongoose.model("TimeEntry", timeEntrySchema);

module.exports = TimeEntry;
