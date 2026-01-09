const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  source: { type: String, required: true },
  chatSessionId: { type: String, required: true },
  pageNumber: { type: Number, required: true } 
});

const DocumentModel = mongoose.model("Document", DocumentSchema);

module.exports = { DocumentModel };