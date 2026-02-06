const express = require("express");
const { body, param } = require("express-validator");
const auth = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const {
  getStats,
  listUsers,
  addUser,
  updateUser,
  deleteUser,
} = require("../controllers/adminController");

const router = express.Router();

router.use(auth);
router.use(requireRole(["admin"]));

const addUserValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["viewer", "editor", "admin"])
    .withMessage("Role must be viewer, editor, or admin"),
];

const updateUserValidation = [
  param("id").isMongoId().withMessage("Invalid user ID"),
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("role")
    .optional()
    .isIn(["viewer", "editor", "admin"])
    .withMessage("Role must be viewer, editor, or admin"),
];

router.get("/stats", getStats);
router.get("/users", listUsers);
router.post("/users", addUserValidation, addUser);
router.patch("/users/:id", updateUserValidation, updateUser);
router.delete("/users/:id", param("id").isMongoId().withMessage("Invalid user ID"), deleteUser);

module.exports = router;
