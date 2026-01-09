const {
  chunkText,
  embedText,
  getAiResponse,
  parsePdfByPage,
} = require("../actions");
const { DocumentModel } = require("../models/DocumentSchema");
const { ChatModel } = require("../models/ChatSchema");
const { UserModel } = require("../models/UserSchema");
const { FileModel } = require("../models/FileSchema");

const createChat = async (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = "session-" + Math.random().toString(36).substring(9, 15);

    const newChat = new ChatModel({
      sessionId,
      name: `New Chat-${sessionId.substring(9, 15)}`,
      messages: [],
    });
    await newChat.save();

    await UserModel.findByIdAndUpdate(userId, {
      $push: { chats: sessionId },
    });

    res.status(201).json({ chat: newChat });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ error: "Failed to create chat" });
  }
};

const chat = async (req, res) => {
  const { question, sessionId } = req.body;
  const file = req.file;
  const userId = req.userId;
  let immediateContext = null;

  if (!question || !sessionId) {
    return res
      .status(400)
      .json({ message: "No question or session provided." });
  }

  //file processing
  if (file) {
    try {
      const pages = await parsePdfByPage(file.buffer);
      const vectorStore = [];
      const allText = pages.map((p) => p.text).join("\n");
      immediateContext = allText.substring(0, 5000);
      for (const page of pages) {
        const chunks = chunkText(page.text, 800, 100);

        for (const text of chunks) {
          const embedding = await embedText(text);
          if (embedding) {
            vectorStore.push({
              text,
              embedding,
              source: file.originalname,
              pageNumber: page.pageNumber,
              chatSessionId: sessionId,
            });
          }
        }
      }
      await DocumentModel.insertMany(vectorStore);
      console.log(
        `Saved ${vectorStore.length} chunks from ${pages.length} pages.`
      );

      await FileModel.findOneAndUpdate(
        { sessionId: sessionId },
        {
          sessionId: sessionId,
          fileName: file.originalname,
          fileData: file.buffer,
          contentType: file.mimetype,
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error("Error parsing PDF:", err);
      return res.status(500).json({ error: "Failed to parse PDF." });
    }
  }

  let chatSession = await ChatModel.findOne({ sessionId });

  if (!chatSession) {
    chatSession = new ChatModel({
      sessionId,
      name: question.substring(0, 20) + "...",
      messages: [],
    });

    await UserModel.findByIdAndUpdate(userId, {
      $push: { chats: sessionId },
    });
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  const history = chatSession ? chatSession.messages.slice(-6) : [];
  try {
    const aiResult = await getAiResponse(
      question,
      history,
      sessionId,
      immediateContext
    );

    if (!aiResult) {
      return res
        .status(503)
        .json({ error: "AI Service is overloaded. Please try again." })
        .end();
    }

    const { answerStream, context } = aiResult;

    const metaData = JSON.stringify({
      pageNumber: context,
      sessionId: sessionId,
      chatName: chatSession?.name || "New Chat",
    });

    res.write(`__META__${metaData}__META__`);

    let fullResponse = "";

    for await (const chunk of answerStream) {
      const text = chunk.text ? chunk.text : "";
      if (text) {
        res.write(text);
        fullResponse += text;
      }
    }

    chatSession.messages.push({
      role: "user",
      content: question,
      file: file ? file.originalname : null,
    });
    chatSession.messages.push({ role: "model", content: fullResponse, pageNumber: context });

    if (
      chatSession.messages.length <= 2 &&
      chatSession.name.startsWith("New Chat")
    ) {
      chatSession.name = question.substring(0, 10) + "...";
    }

    await chatSession.save();

    res.end();
  } catch (error) {
    console.error("Server Error:", error.message);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: error.message || "AI Service Error" });
    } else {
      res.write(`\n[SYSTEM ERROR: ${error.message}]`);
      res.end();
    }
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chat = await ChatModel.findOne({ sessionId });
    
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    res.status(200).json({ messages: chat.messages });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

const getChatNames = async (req, res) => {
  const userId = req.userId;
  const user = await UserModel.findById(userId).select("chats");
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  const chats = await ChatModel.find({ sessionId: { $in: user.chats } }).select(
    "name sessionId"
  );
  res.status(200).json({ chats });
};

const renameChat = async (req, res) => {
  const { sessionId, value } = req.body;
  const userId = req.userId;
  const user = await UserModel.findById(userId).select("-password");
  try {
    const updatedChat = await ChatModel.findOneAndUpdate(
      { sessionId: sessionId },
      { $set: { name: value } },
      { new: true }
    );

    if (!updatedChat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    const userChats = await ChatModel.find({
      sessionId: { $in: user.chats },
    }).select("name sessionId");
    res.status(201).json({ message: "Chat renamed", chat: userChats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteChat = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.userId;
  try {
    const deletedChat = await ChatModel.findOneAndDelete({
      sessionId: sessionId,
    });
    if (!deletedChat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const user = await UserModel.findByIdAndUpdate(userId, {
      $pull: { chats: sessionId },
    });
    await DocumentModel.deleteMany({ chatSessionId: sessionId });
    await FileModel.deleteOne({ sessionId: sessionId });
    const userChats = await ChatModel.find({
      sessionId: { $in: user.chats },
    }).select("name sessionId");
    res.status(201).json({ message: "Chat deleted", chat: userChats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createChat,
  chat,
  getChatHistory,
  getChatNames,
  renameChat,
  deleteChat,
};
