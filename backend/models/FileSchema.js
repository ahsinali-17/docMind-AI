const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  fileName: { type: String, required: true },
  fileData: { type: Buffer, required: true },
  contentType: { type: String, default: "application/pdf" },
  uploadedAt: { type: Date, default: Date.now }
});

const FileModel = mongoose.model("File", FileSchema);
module.exports = { FileModel };