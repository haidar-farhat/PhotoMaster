require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Store connected users
const users = new Map();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle user joining
  socket.on("join", (username) => {
    console.log(`${username} joined the chat`);
    users.set(socket.id, username);

    // Notify all clients about the new user
    io.emit("userJoined", { username });
  });

  // Handle messages
  socket.on("message", (data) => {
    console.log(`Message from ${data.username}: ${data.message}`);
    io.emit("message", data);
  });

  // Handle typing status
  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", data);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const username = users.get(socket.id);
    if (username) {
      console.log(`${username} left the chat`);
      io.emit("userLeft", { username });
      users.delete(socket.id);
    }
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", users: users.size });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
});
