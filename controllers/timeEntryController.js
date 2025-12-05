// backend/controllers/timeEntryController.js
const TimeEntry = require("../models/TimeEntry");

// Helper
function calculateMinutes(startTime, endTime) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return end - start;
}

// GET /api/entries
async function getEntries(req, res) {
  try {
    const entries = await TimeEntry.find().sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    console.error("Error fetching entries:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// POST /api/entries
async function createEntry(req, res) {
  try {
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: "All fields required" });
    }

    const totalMinutes = calculateMinutes(startTime, endTime);

    if (totalMinutes <= 0) {
      return res
        .status(400)
        .json({ error: "End time should be after start time" });
    }

    const newEntry = await TimeEntry.create({
      date,
      startTime,
      endTime,
      totalMinutes,
    });

    res.status(201).json(newEntry);
  } catch (err) {
    console.error("Error creating entry:", err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  getEntries,
  createEntry,
};
