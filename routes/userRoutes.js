const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// POST login
router.post("/login", userController.login);

// POST register new user
router.post("/register", userController.createUser);

// GET all users (for admin list)
router.get("/", userController.getAll);

// GET one user
router.get("/:id", userController.getOne);

// UPDATE user
router.put("/:id", userController.updateOne);

// RESET password
router.post("/:id/reset-password", userController.resetPassword);

// DELETE user
router.delete("/:id", userController.deleteOne);

module.exports = router;