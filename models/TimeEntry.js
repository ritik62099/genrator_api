const mongoose = require("mongoose");

const timeEntrySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },

    startHour: { type: Number, required: true },
    startMinute: { type: Number, required: true },

    endHour: { type: Number, required: true },
    endMinute: { type: Number, required: true },

    diffHours: { type: Number, required: true },
    diffMinutes: { type: Number, required: true },
    totalMinutes: { type: Number, required: true },

    closed: { type: Boolean, default: false }, // 🔥 new
  },
  { timestamps: true }
);

module.exports = mongoose.model("TimeEntry", timeEntrySchema);
