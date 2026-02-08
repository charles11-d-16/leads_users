const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'users', 
    required: false // Changed to false because user might not exist
  },
  attemptedEmail: { type: String }, // Add this to see what they typed
  ipAddress: { type: String },
  device: { type: String },
  status: { 
    type: String, 
    enum: ["Success", "Failed"], 
    default: "Success" 
  },
  loginTime: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LoginHistory", loginHistorySchema);