const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    messages: [
        {
            role: { type: String, enum: ["user", "model"] },
            content: String,
            file: String || null,
            pageNumber: Number || null,
            timestamp: { type: Date, default: Date.now }
        }
    ]
});
const ChatModel = mongoose.model('ChatHistory', ChatSchema);

module.exports = { ChatModel };