// backend/routes/timeEntryRoutes.js
const express = require("express");
const { getEntries, createEntry } = require("../controllers/timeEntryController");
const { generatePDF } = require("../controllers/pdfController");

const router = express.Router();

router.get("/", getEntries);
router.post("/", createEntry);
router.get("/download/pdf", generatePDF);

module.exports = router;
