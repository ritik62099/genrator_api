// backend/controllers/pdfController.js
const PDFDocument = require("pdfkit");
const TimeEntry = require("../models/TimeEntry");

exports.generatePDF = async (req, res) => {
  try {
    const entries = await TimeEntry.find().sort({ date: 1 }); // oldest → newest

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=generator-work-report.pdf"
    );

    doc.pipe(res);

    // --------- Common column positions ---------
    const columns = {
      date: 60,
      start: 190,
      end: 320,
      duration: 450,
    };

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // --------- Helpers ---------
    function drawMainHeader() {
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("Generator Time Work Report", {
          align: "center",
          underline: true,
        });

      doc.moveDown(1);
    }

    function drawTableHeader(startY) {
      doc.fontSize(12).font("Helvetica-Bold");

      doc.text("Date", columns.date, startY);
      doc.text("Start Reading", columns.start, startY);
      doc.text("End Reading", columns.end, startY);
      doc.text("Duration", columns.duration, startY);

      doc
        .moveTo(50, startY + 16)
        .lineTo(550, startY + 16)
        .stroke();

      return startY + 24;
    }

    function ensureSpace(rowY, extra = 30) {
      if (rowY + extra > 760) {
        doc.addPage();
        drawMainHeader();
        return drawTableHeader(120);
      }
      return rowY;
    }

    // --------- Group entries by month ---------
    const groups = {};
    entries.forEach((entry) => {
      if (!entry.date) return;
      const [year, month] = entry.date.split("-");
      if (!year || !month) return;

      const key = `${year}-${month}`;
      if (!groups[key]) {
        const monthIndex = parseInt(month, 10) - 1;
        groups[key] = {
          label: `${monthNames[monthIndex]} ${year}`,
          items: [],
          totalMinutes: 0, // sirf running days ka sum
        };
      }

      const isClosed = entry.closed === true;

      let totalMinutes = entry.totalMinutes;
      let diffHours = entry.diffHours;
      let diffMinutes = entry.diffMinutes;

      // safe fallback if diffHours not saved (old data)
      if (
        !isClosed &&
        (diffHours == null || diffMinutes == null) &&
        entry.startHour != null &&
        entry.startMinute != null &&
        entry.endHour != null &&
        entry.endMinute != null
      ) {
        const start = entry.startHour * 60 + entry.startMinute;
        const end = entry.endHour * 60 + entry.endMinute;
        const diff = end - start;
        if (diff > 0) {
          totalMinutes = diff;
          diffHours = Math.floor(diff / 60);
          diffMinutes = diff % 60;
        }
      }

      // Month total me sirf running time add karo, closed days skip
      if (!isClosed && typeof totalMinutes === "number" && totalMinutes > 0) {
        groups[key].totalMinutes += totalMinutes;
      }

      groups[key].items.push({
        ...entry.toObject(),
        _diffHours: diffHours,
        _diffMinutes: diffMinutes,
        _totalMinutes: totalMinutes,
      });
    });

    // --------- Render PDF ---------
    drawMainHeader();
    let rowY = drawTableHeader(120);

    let grandTotalMinutes = 0;
    let dayCount = 0; // sirf running days

    const groupKeys = Object.keys(groups).sort(); // oldest month first

    groupKeys.forEach((key) => {
      const group = groups[key];

      // Month heading with total
      const monthTotal = group.totalMinutes;
      const monthH = Math.floor(monthTotal / 60);
      const monthM = monthTotal % 60;

      rowY = ensureSpace(rowY, 50);

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(
          `${group.label}  —  Total: ${monthH}h ${monthM}m (${monthTotal} min)`,
          50,
          rowY
        );

      rowY += 22;

      // table header
      rowY = drawTableHeader(rowY);

      doc.fontSize(11).font("Helvetica");

      group.items.forEach((entry) => {
        rowY = ensureSpace(rowY, 24);

        const isClosed = entry.closed === true;

        const durationText = isClosed
          ? "Generator Closed (No Run)"
          : entry._totalMinutes && entry._totalMinutes > 0
          ? `${entry._diffHours}h ${entry._diffMinutes}m (${entry._totalMinutes} min)`
          : "-";

        // grand totals me closed days include nahi
        if (!isClosed && entry._totalMinutes && entry._totalMinutes > 0) {
          grandTotalMinutes += entry._totalMinutes;
          dayCount += 1;
        }

        // Date
        doc.text(entry.date || "-", columns.date, rowY);

        // Start / End
        if (isClosed) {
          doc.text("CLOSED", columns.start, rowY);
          doc.text("CLOSED", columns.end, rowY);
        } else {
          doc.text(
            entry.startHour != null
              ? `${entry.startHour}h ${entry.startMinute}m`
              : "-",
            columns.start,
            rowY
          );
          doc.text(
            entry.endHour != null
              ? `${entry.endHour}h ${entry.endMinute}m`
              : "-",
            columns.end,
            rowY
          );
        }

        // Duration / Status
        doc.text(durationText, columns.duration, rowY);

        rowY += 20;
      });

      rowY += 10; // month block gap
    });

    // --------- Grand Summary ---------
    const totalHours = Math.floor(grandTotalMinutes / 60);
    const totalRemain = grandTotalMinutes % 60;
    const avg =
      dayCount > 0 ? (grandTotalMinutes / dayCount / 60).toFixed(2) : "0.00";

    rowY = ensureSpace(rowY, 80);

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Overall Summary", 50, rowY);
    doc
      .moveTo(50, rowY + 18)
      .lineTo(200, rowY + 18)
      .stroke();

    rowY += 30;

    doc.fontSize(12).font("Helvetica");
    doc.text(
      `Total Hours Worked: ${totalHours}h ${totalRemain}m (${grandTotalMinutes} min)`,
      50,
      rowY
    );
    doc.text(
      `Total Working Days (valid readings): ${dayCount}`,
      50,
      rowY + 18
    );
    doc.text(`Average Per Day: ${avg} hrs/day`, 50, rowY + 36);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("PDF generation failed");
  }
};
