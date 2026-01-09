const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  createChat,
  chat,
  getChatHistory,
  getChatNames,
  renameChat,
  deleteChat,
} = require("../controllers/chatController");
const { authMiddleware } = require("../middleware/authMiddleware");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/create", authMiddleware, createChat);

router.post("/message", authMiddleware, upload.single("pdf"), chat);

router.get("/history/:sessionId", authMiddleware, getChatHistory);

router.get("/names", authMiddleware, getChatNames);

router.patch("/rename", authMiddleware, renameChat);

router.delete("/delete/:sessionId", authMiddleware, deleteChat);

module.exports = router;
