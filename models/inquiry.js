// models/Inquiry.js
const mongoose = require('mongoose');
const InquiryCounter = require('./InquiryCounter');

const inquirySchema = new mongoose.Schema({
  inquiry_id: { type: String, unique: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true },
  discovery_platform: { type: String, required: true },
  concern_type: { type: String, required: true },
  message: { type: String, required: true },
  inquiry_date: { type: Date, default: Date.now },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: [
      'New',
      'Contacted',
      'Qualified',
      'In Progress',
      'Completed-Successful',
      'Completed-Unsuccessful',
      'Cancelled'
    ],
    default: 'New'
  },
  status_date: { type: Date, default: Date.now },
  phone: { type: String },
  address: { type: String },
  company: { type: String }
});

// Auto-increment hook with error handling
inquirySchema.pre('save', async function () {
  try {
    if (!this.inquiry_id) {
      let counter = await InquiryCounter.findByIdAndUpdate(
        { _id: 'inquiry_id' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      if (!counter || typeof counter.seq !== 'number') {
        counter = { seq: 1 };
      }

      // Pad to 4 digits for scalability: CLNT_0001, CLNT_0002, ...
      const padded = String(counter.seq).padStart(4, '0');
      this.inquiry_id = `CLNT_${padded}`;
    }
  } catch (err) {
    console.error('Error generating inquiry_id:', err);
    throw err; // rethrow so save fails properly
  }
});

module.exports = mongoose.model('Inquiry', inquirySchema);