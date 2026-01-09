const express = require("express");
const router = express.Router();
const { getFile } = require("../controllers/fileController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/:sessionId", authMiddleware, getFile);

module.exports = router;
