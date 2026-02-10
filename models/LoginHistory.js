const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: false },
  attemptedEmail: { type: String },
  ipAddress: { type: String },
  device: { type: String },
  location: { type: String }, // New field: stores "Lat, Long"
  status: { type: String, enum: ["Success", "Failed"], default: "Success" },
  loginTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LoginHistory", loginHistorySchema);