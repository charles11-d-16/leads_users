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

exports.updateInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, company, address, message } = req.body;

    // Validate required fields
    if (!full_name || !email || !message) {
      return res.status(400).json({ error: "Full name, email, and message are required" });
    }

    // Update the inquiry
    const inquiry = await Inquiry.findOneAndUpdate(
      { inquiry_id: id },
      { 
        full_name,
        email,
        phone: phone || undefined,
        company: company || undefined,
        address: address || undefined,
        message
      },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    res.json({ success: true, inquiry });
  } catch (err) {
    console.error("Error updating inquiry:", err);
    res.status(500).json({ error: "Failed to update inquiry details" });
  }
};

exports.bulkImportInquiries = async (req, res) => {
  try {
    const { inquiries } = req.body;

    if (!inquiries || !Array.isArray(inquiries) || inquiries.length === 0) {
      return res.status(400).json({ error: "No inquiries provided" });
    }

    // Format data - let the pre-save hook generate inquiry_id
    const inquiriesToInsert = inquiries.map((inq) => ({
      full_name: String(inq.full_name || '').trim() || '',
      email: String(inq.email || '').trim() || '',
      phone: String(inq.phone || '').trim() || '',
      company: String(inq.company || '').trim() || '',
      address: String(inq.address || '').trim() || '',
      message: String(inq.message || '').trim() || '(Empty - Please fill in later)',
      concern_type: String(inq.concern_type || '').trim() || 'General Inquiry',
      discovery_platform: String(inq.discovery_platform || '').trim() || 'Other',
      status: 'New',
      inquiry_date: new Date()
    }));

    // Save each inquiry individually to trigger pre-save hooks
    const result = [];
    for (const inquiryData of inquiriesToInsert) {
      const inquiry = new Inquiry(inquiryData);
      const saved = await inquiry.save();
      result.push(saved);
    }

    res.json({ 
      success: true, 
      imported: result.length, 
      inquiries: result 
    });
  } catch (err) {
    console.error("Error bulk importing inquiries:", err);
    res.status(500).json({ error: "Failed to import inquiries: " + err.message });
  }
};