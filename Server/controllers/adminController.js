const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Video = require("../models/Video");

const formatValidationErrors = (result) => {
  const errors = result.array();
  return {
    message: errors.length === 1 ? errors[0].msg : "Validation failed",
    errors: errors.map((e) => ({ field: e.path, message: e.msg })),
  };
};

/** GET /admin/stats — total, active, admins, regular (editor+viewer) */
const getStats = async (req, res) => {
  try {
    const [total, admins, editors, viewers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "editor" }),
      User.countDocuments({ role: "viewer" }),
    ]);
    res.json({
      success: true,
      totalUsers: total,
      activeUsers: total,
      admins,
      regularUsers: editors + viewers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** GET /admin/users — list users with video counts, no passwordHash */
const listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-passwordHash -__v")
      .sort({ createdAt: -1 })
      .lean();
    const userIds = users.map((u) => u._id);
    const videoCounts = await Video.aggregate([
      { $match: { ownerId: { $in: userIds } } },
      { $group: { _id: "$ownerId", count: { $sum: 1 } } },
    ]);
    const countByUser = Object.fromEntries(
      videoCounts.map((c) => [String(c._id), c.count])
    );
    const usersWithCounts = users.map((u) => ({
      ...u,
      videoCount: countByUser[String(u._id)] ?? 0,
    }));
    res.json({ success: true, users: usersWithCounts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** POST /admin/users — add user (name, email, password, role) */
const addUser = async (req, res) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ success: false, ...formatValidationErrors(result) });
    }
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || "editor",
    });
    const safe = user.toObject();
    delete safe.passwordHash;
    delete safe.__v;
    res.status(201).json({ success: true, user: safe, message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** PATCH /admin/users/:id — update role (and optionally name) */
const updateUser = async (req, res) => {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ success: false, ...formatValidationErrors(result) });
    }
    const { name, role } = req.body;
    const user = await User.findById(req.params.id).select("-passwordHash -__v");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    await user.save();
    res.json({ success: true, user: user.toObject(), message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/** DELETE /admin/users/:id — delete user (optionally cascade videos or leave orphan) */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (String(user._id) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getStats,
  listUsers,
  addUser,
  updateUser,
  deleteUser,
};
