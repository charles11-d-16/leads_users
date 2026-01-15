const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone_user: { type: String },
  address: { type: String },
  role: {
    type: String,
    enum: ["Admin", "Superadmin", "Staff"],
    default: "Admin"
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("users", userSchema);