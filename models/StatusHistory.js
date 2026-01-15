const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  inquiry_id: { type: String, required: true }, // matches Inquiry.inquiry_id
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
    required: true
  },
  notes: { type: String },
  changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional
  change_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StatusHistory', statusHistorySchema);