// backend/controllers/timeEntryController.js
const TimeEntry = require("../models/TimeEntry");

// Helper: generator meter diff
function calculateGeneratorDiff(startHour, startMinute, endHour, endMinute) {
  const sh = Number(startHour);
  const sm = Number(startMinute);
  const eh = Number(endHour);
  const em = Number(endMinute);

  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;

  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  const diff = end - start;

  if (diff <= 0) return null;

  return {
    diffHours: Math.floor(diff / 60),
    diffMinutes: diff % 60,
    totalMinutes: diff,
  };
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
    const { date, startHour, startMinute, endHour, endMinute } = req.body;

    if (
      !date &&
      date !== "" &&
      startHour === undefined &&
      startMinute === undefined &&
      endHour === undefined &&
      endMinute === undefined
    ) {
      return res.status(400).json({ error: "All fields required" });
    }

    const calc = calculateGeneratorDiff(
      startHour,
      startMinute,
      endHour,
      endMinute
    );

    if (!calc) {
      return res
        .status(400)
        .json({ error: "End reading, start reading se bada hona chahiye" });
    }

    const newEntry = await TimeEntry.create({
      date,
      startHour,
      startMinute,
      endHour,
      endMinute,
      diffHours: calc.diffHours,
      diffMinutes: calc.diffMinutes,
      totalMinutes: calc.totalMinutes,
    });

    res.status(201).json(newEntry);
  } catch (err) {
    console.error("Error creating entry:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// PUT /api/entries/:id  (edit)
async function updateEntry(req, res) {
  try {
    const { id } = req.params;
    const { date, startHour, startMinute, endHour, endMinute } = req.body;

    if (
      !date &&
      date !== "" &&
      startHour === undefined &&
      startMinute === undefined &&
      endHour === undefined &&
      endMinute === undefined
    ) {
      return res.status(400).json({ error: "All fields required" });
    }

    const calc = calculateGeneratorDiff(
      startHour,
      startMinute,
      endHour,
      endMinute
    );

    if (!calc) {
      return res
        .status(400)
        .json({ error: "End reading, start reading se bada hona chahiye" });
    }

    const entry = await TimeEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    entry.date = date;
    entry.startHour = startHour;
    entry.startMinute = startMinute;
    entry.endHour = endHour;
    entry.endMinute = endMinute;
    entry.diffHours = calc.diffHours;
    entry.diffMinutes = calc.diffMinutes;
    entry.totalMinutes = calc.totalMinutes;

    await entry.save();

    res.json(entry);
  } catch (err) {
    console.error("Error updating entry:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// DELETE /api/entries/:id  (delete)
async function deleteEntry(req, res) {
  try {
    const { id } = req.params;

    const deleted = await TimeEntry.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting entry:", err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
};
