// backend/routes/timeEntryRoutes.js
const express = require("express");
const {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} = require("../controllers/timeEntryController");
const { generatePDF } = require("../controllers/pdfController");

const router = express.Router();

// PDF route pehle
router.get("/download/pdf", generatePDF);

// CRUD routes
router.get("/", getEntries);
router.post("/", createEntry);
router.put("/:id", updateEntry);
router.delete("/:id", deleteEntry);

module.exports = router;
