const express = require("express");
const cors = require("cors");
const { connectDB } = require("./actions");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

const port = 3000;

app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);
app.use("/file", fileRoutes);


app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
