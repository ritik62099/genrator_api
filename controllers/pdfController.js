const PDFDocument = require("pdfkit");
const TimeEntry = require("../models/TimeEntry");

exports.generatePDF = async (req, res) => {
  try {
    const entries = await TimeEntry.find().sort({ date: 1 });

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=work-report.pdf");

    doc.pipe(res);

    // -------- Common column positions --------
    const columns = {
      date: 60,
      start: 200,
      end: 320,
      duration: 450,
    };

    // Helper: table header draw karne ka function (page change pe bhi call karenge)
    function drawTableHeader(startY = 120) {
      doc.fontSize(14).font("Helvetica-Bold");

      doc.text("Date", columns.date, startY);
      doc.text("Start Time", columns.start, startY);
      doc.text("End Time", columns.end, startY);
      doc.text("Duration", columns.duration, startY);

      doc
        .moveTo(50, startY + 18)
        .lineTo(550, startY + 18)
        .stroke();

      return startY + 26; // next row y
    }

    // ---------------- HEADER ----------------
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Daily Time Work Report", { align: "center", underline: true });

    doc.moveDown(1);

    let rowY = drawTableHeader(120);
    let totalMins = 0;

    doc.fontSize(12).font("Helvetica");

    // ---------------- ROWS ----------------
    entries.forEach((entry) => {
      // Page break handle
      if (rowY > 700) {
        doc.addPage();
        rowY = drawTableHeader(80);
        doc.fontSize(12).font("Helvetica");
      }

      totalMins += entry.totalMinutes;

      const durationText = `${Math.floor(entry.totalMinutes / 60)}h ${
        entry.totalMinutes % 60
      }m`;

      // sab ko same rowY pe print karo
      doc.text(entry.date, columns.date, rowY);
      doc.text(entry.startTime, columns.start, rowY);
      doc.text(entry.endTime, columns.end, rowY);
      doc.text(durationText, columns.duration, rowY);

      rowY += 22; // next row gap
    });

    // ---------------- SUMMARY ----------------
    const totalHours = Math.floor(totalMins / 60);
    const totalRemain = totalMins % 60;
    const avg =
      entries.length > 0
        ? (totalMins / entries.length / 60).toFixed(2)
        : "0.00";

    // thoda neeche le jao
    rowY += 40;
    if (rowY > 700) {
      doc.addPage();
      rowY = 100;
    }

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Total Work Summary", 50, rowY);
    doc
      .moveTo(50, rowY + 18)
      .lineTo(200, rowY + 18)
      .stroke();

    rowY += 30;

    doc.fontSize(12).font("Helvetica");
    doc.text(`Total Hours Worked: ${totalHours}h ${totalRemain}m`, 50, rowY);
    doc.text(`Total Working Days: ${entries.length}`, 50, rowY + 18);
    doc.text(`Average Per Day: ${avg} hrs/day`, 50, rowY + 36);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("PDF generation failed");
  }
};
