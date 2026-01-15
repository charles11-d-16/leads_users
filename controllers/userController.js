const User = require("../models/User");
const bcrypt = require("bcryptjs"); // ✅ use only bcryptjs

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password, and role are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Normalize role comparison (case-insensitive)
    if (user.role.toLowerCase() !== role.toLowerCase()) {
      return res.status(403).json({ error: "Invalid role for this user" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create user
exports.createUser = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      phone_user,
      address,
      role,
      password
    } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({ error: "First name, last name, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstname,
      lastname,
      email,
      phone_user: phone_user || "",
      address: address || "",
      role: role || "Admin",
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message || "Registration failed" });
  }
};

// Get all users
exports.getAll = async (req, res) => {
  try {
    const users = await User.find().lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get one user
exports.getOne = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Update user
exports.updateOne = async (req, res) => {
  try {
    const { status, role, newPassword } = req.body;
    const update = {};
    if (status) update.status = status;
    if (role) update.role = role;
    if (newPassword) update.password = await bcrypt.hash(newPassword, 10);

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User updated", user });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    // Always reset to "password"
    const defaultPassword = "password";
    const hashed = await bcrypt.hash(defaultPassword, 10);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashed },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Password reset to default 'password'" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password" });
  }
};


// Delete user
exports.deleteOne = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// server/controllers/userController.js
exports.getUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const filter = {};

    // Normalize role
    if (role && role.toLowerCase() !== "all roles") {
      filter.role = new RegExp(`^${role}$`, "i");
    }

    // Normalize status
    if (status && status.toLowerCase() !== "all status") {
      filter.status = new RegExp(`^${status}$`, "i");
    }

    // Search across multiple fields
    if (search) {
      filter.$or = [
        { firstname: new RegExp(search, "i") },
        { lastname: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { phone_user: new RegExp(search, "i") }
      ];
    }

    const users = await User.find(filter).sort({ firstname: 1 });
    res.json(users);
  } catch (err) {
    console.error("Error in getUsers:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};