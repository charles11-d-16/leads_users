const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/leads")
  .then(() => {
    console.log("MongoDB connected");
    seedUsers();
  })
  .catch(err => {
    console.error("MongoDB error:", err);
    process.exit(1);
  });

async function seedUsers() {
  try {
    // Delete existing test users
    await User.deleteMany({ email: { $in: ["superadmin@test.com", "admin@test.com"] } });

    // Hash passwords
    const superadminPassword = await bcrypt.hash("password123", 10);
    const adminPassword = await bcrypt.hash("password123", 10);

    // Create test users
    const users = [
      {
        firstname: "Super",
        lastname: "Admin",
        email: "superadmin@test.com",
        phone_user: "1234567890",
        address: "123 Main St",
        role: "Superadmin",
        password: superadminPassword,
        status: "Active"
      },
      {
        firstname: "Admin",
        lastname: "User",
        email: "admin@test.com",
        phone_user: "0987654321",
        address: "456 Oak Ave",
        role: "Admin",
        password: adminPassword,
        status: "Active"
      }
    ];

    await User.insertMany(users);
    console.log("✅ Test users created successfully!");
    console.log("Superadmin: superadmin@test.com / password123");
    console.log("Admin: admin@test.com / password123");
    
    process.exit(0);
  } catch (err) {
    console.error("Error seeding users:", err);
    process.exit(1);
  }
}
