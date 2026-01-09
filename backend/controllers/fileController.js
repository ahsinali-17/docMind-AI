const { FileModel } = require("../models/FileSchema");

const getFile = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const fileDoc = await FileModel.findOne({ sessionId });

    if (!fileDoc) {
      return res.status(404).json({ error: "No file attached to this session" });
    }

    // Binary data response
    res.setHeader("Content-Type", fileDoc.contentType);
    res.setHeader("Content-Disposition", `inline; filename="${fileDoc.fileName}"`);
    res.send(fileDoc.fileData);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({ error: "Failed to fetch file" });
  }
};

module.exports = {
  getFile,
};
