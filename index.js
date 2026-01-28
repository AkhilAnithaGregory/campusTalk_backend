import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import Message from "./model/message.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

connectDB();

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  console.log("🔌 Device connected:", socket.id);

  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    socket.emit("chat-history", messages);
  } catch (err) {
    console.error("Error sending chat history:", err);
  }

  socket.on("disconnect", () => {
    console.log("❌ Device disconnected:", socket.id);
  });
});

app.post("/send-message", async (req, res) => {
  try {
    const { username, content } = req.body;

    if (!username || !content) {
      return res
        .status(400)
        .json({ message: "username and content are required" });
    }

    const message = await Message.create({
      username,
      content,
    });

    io.emit("new-message", message);

    return res.status(200).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });

    return res.status(200).json({
      total: messages.length,
      messages,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send("🟢 UniBuddy Socket Server Running");
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
