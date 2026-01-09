const express = require("express");
const router = express.Router();
const { register, login, verifyToken } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/register", register);

router.post("/login", login);

router.get("/verifyToken", authMiddleware, verifyToken);

module.exports = router;
