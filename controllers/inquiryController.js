// server/controllers/inquiryController.js
const Inquiry = require("../models/inquiry");
const StatusHistory = require("../models/StatusHistory");

exports.getInquiries = async (req, res) => {
  try {
    const { type, source, search, status } = req.query;
    const filter = {};

    // Filter by status if provided
    if (status) {
      filter.status = status;
    }

    // Filter by concern type
    if (type && type !== "All") {
      filter.concern_type = new RegExp(`^${type}$`, "i");
    }

    // Filter by discovery platform
    if (source && source !== "All") {
      filter.discovery_platform = new RegExp(`^${source}$`, "i");
    }

    // Search by multiple fields
    if (search) {
      filter.$or = [
        { inquiry_id: new RegExp(search, "i") },
        { full_name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { message: new RegExp(search, "i") }
      ];
    }

    // Query DB and sort newest first
    const inquiries = await Inquiry.find(filter).sort({ inquiry_date: -1 });

    // Get latest status history notes for each inquiry
    const inquiriesWithNotes = await Promise.all(inquiries.map(async (inq) => {
      const latestHistory = await StatusHistory.findOne({ inquiry_id: inq.inquiry_id }).sort({ change_at: -1 });
      return {
        ...inq.toObject(),
        latestNote: latestHistory ? latestHistory.notes : null
      };
    }));

    res.json(inquiriesWithNotes);
  } catch (err) {
    console.error("Error in getInquiries:", err);
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
};

exports.updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Update the inquiry status
    const inquiry = await Inquiry.findOneAndUpdate(
      { inquiry_id: id },
      { status: status, status_date: new Date() },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    // Save to StatusHistory
    await StatusHistory.create({
      inquiry_id: id,
      status: status,
      notes: notes,
      change_at: new Date()
    });

    res.json({ success: true, inquiry });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
};