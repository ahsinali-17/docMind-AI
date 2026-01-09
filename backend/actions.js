const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const { DocumentModel } = require('./models/DocumentSchema');
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function connectDB() {
  mongoose.connect(`${process.env.MONGODB_URI}`)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));
}

const parsePdfByPage = async (pdfBuffer) => {
  // Uint8Array conversion
  const uint8Array = new Uint8Array(pdfBuffer);
  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    disableFontFace: true,
    verbosity: 0
});
  const pdfDocument = await loadingTask.promise;
  
  const pagesData = [];

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items.map((item) => item.str).join(" ");
    
    const cleanText = pageText.replace(/\s+/g, " ").trim();
    
    if (cleanText.length > 0) {
      pagesData.push({ pageNumber: i, text: cleanText });
    }
  }
  
  return pagesData;
};
 
function chunkText(text, chunkSize, overlap = 200) {
  if (!text) return [];
  const chunks = [];
  for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
    chunks.push(text.slice(i, i + chunkSize));
    if(i+chunkSize >= text.length) break;
  }
  return chunks;
}

const embedText = async (text) => {
  try {
    const response = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: { parts: [{ text: text }] },
    });
    const vector = response.embeddings?.[0]?.values;
    return vector;
  } catch (error) {
    console.error("Embedding Error:", error);
    return null;
  }
};

const getAiResponse = async (question, sessionHistory, sessionId, imidiateContext) => {
   try {
  const questionEmbedding = await embedText(question);
  if (!questionEmbedding) {
     throw new Error("Failed to generate embedding for the question.");
  }

  // Vector Search
  const results = await DocumentModel.aggregate([
    {
      "$vectorSearch": {
        "index": "vector_index",
        "path": "embedding",
        "queryVector": questionEmbedding,
        "numCandidates": 100,
        "limit": 1,
        "filter": {
          "chatSessionId": { $eq: sessionId } 
        }
      }
    },
    {
      "$project": {
        "_id": 0,
        "text": 1,
        "pageNumber": 1,
        "score": { "$meta": "vectorSearchScore" }
      }
    }
  ]);

  const bestMatch = imidiateContext ? {text:imidiateContext,pageNumber:1} : (results.length > 0 ? results[0] : { text: "No relevant context found.", pageNumber: null });

  const formattedHistory = sessionHistory.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  const currentMessageWithContext = `
    CONTEXT INFORMATION (Page ${bestMatch.pageNumber || "unknown"}: ${bestMatch.text})
    USER QUESTION:
    ${question}
  `;

    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: {
          parts: [{ text: "You are a smart assistant. Use the conversation History attached below to understand the question and given Context to answer that, if user asks a question related to them. If not, answer based on your own knowledge or say you don't know." }]
        }
      },
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: currentMessageWithContext }] } 
      ]
    });

    return { 
        answerStream: response, 
        context: bestMatch.pageNumber
    };

  } catch (error) {
    console.error("Error in chat:", error);
    return null;
  }
};

module.exports = { chunkText, embedText, getAiResponse, connectDB, parsePdfByPage };