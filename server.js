const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv"); 
const bcrypt = require("bcrypt");
const User = require("./models/User");

dotenv.config();

// Route imports
const userRoutes = require("./routes/userRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "views")));

// MongoDB connection + seed superadmin
// mongoose.connect(process.env.MONGO_URI)
//   .then(async () => {
//     console.log("MongoDB Atlas connected");
//     await ensureSuperAdmin();   // seed superadmin once
//   })
//   .catch(err => console.error("MongoDB error:", err));

mongoose.connect("mongodb://127.0.0.1:27017/leads")
  .then(async () => {
    console.log("MongoDB localhost connected");
    await ensureSuperAdmin();   // seed superadmin once
  })
  .catch(err => console.error("MongoDB error:", err));


// API Routes
app.use("/api/users", userRoutes);
app.use("/api/inquiries", inquiryRoutes);

// HTML routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/admin-list", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin-list.html"));
});

app.get("/inquiry-list", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "inquiry-list.html"));
});

// Superadmin seeding
async function ensureSuperAdmin() {
  const existing = await User.findOne({ email: "techstacks_2026@leads.com" });
  if (!existing) {
    const hashedPassword = await bcrypt.hash("techstacks123", 10);
    await User.create({
      firstname: "Super",
      lastname: "Admin",
      email: "techstacks_2026@leads.com",
      password: hashedPassword,
      role: "Superadmin",
      status: "Active"
    });
    console.log("✅ Superadmin account created");
  } else {
    console.log("ℹ️ Superadmin already exists");
  }
}

// KEEP SERVER ALIVE
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Inside server.js or app.js
const LoginHistory = require("./models/LoginHistory"); // Make sure to import the model!

app.get('/api/audit/logins', async (req, res) => {
    try {
        const history = await LoginHistory.find()
            .populate('userId', 'firstname lastname email role')
            .sort({ loginTime: -1 })
            .limit(100);

        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
