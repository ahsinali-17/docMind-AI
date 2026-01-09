const { UserModel } = require("../models/UserSchema");

const register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Missing required fields." });
  }
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: "User already exists." });
  } else {
    const newUser = new UserModel({
      username,
      email,
      password,
      chats: [],
      profilepicurl: "",
    });
    await newUser.save();
    const token = newUser.generateAuthToken();
    return res.status(201).json({ token });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password." });
  }
  const user = await UserModel.findOne({ email, password });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials." });
  } else {
    const token = user.generateAuthToken();
    return res.status(200).json({ token, user });
  }
};

const verifyToken = async (req, res) => {
  const userId = req.userId;
  const user = await UserModel.findById(userId).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  } else {
    return res.status(200).json({ user });
  }
};

module.exports = {
  register,
  login,
  verifyToken,
};
