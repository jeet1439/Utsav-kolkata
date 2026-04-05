import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import pandleRoutes from './routes/pandal.route.js';
import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js';
import redis from '../src/redis/redis.js';
import { Server } from "socket.io";
import http from "http";
import Message from './model/message.model.js';
import ChatRoom from './model/chatRoom.model.js';
import { encrypt, decrypt } from './lib/encryption.js';
import admin from "../src/lib/firebase.js";



dotenv.config();

const app = express();
const server = http.createServer(app);


app.use(cors());
app.use(express.json({ limit: '20mb' })); 
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/pandals', pandleRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);


app.post("/api/test-notification", async (req, res) => {
  try {
    const { token, title, body } = req.body;

    if (!token) {
      return res.status(400).json({ error: "FCM token is required" });
    }

    const message = {
      token: token, // device token from frontend
      notification: {
        title: title || "Test Notification",
        body: body || "This is a test push notification 🚀",
      },
      data: {
        type: "test",
      },
    };

    const response = await admin.messaging().send(message);

    res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Notification error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
});

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));


const io = new Server(server, {
  cors: { origin: "*" },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  let currentUserId = null;

  // ── Online / Offline tracking (existing) ──────────────────────
  socket.on("userOnline", async (userId) => {
    currentUserId = userId;
    await redis.set(`online:${userId}`, "true", "EX", 300);
    console.log(`User ${userId} online`);
  });

  socket.on("userOffline", async (userId) => {
    await redis.del(`online:${userId}`);
    console.log(`User ${userId} offline`);
  });

  // ── Chat room events ──────────────────────────────────────────
  socket.on("joinRoom", (chatRoomId) => {
    socket.join(chatRoomId);
    console.log(`Socket ${socket.id} joined room ${chatRoomId}`);
  });

  socket.on("leaveRoom", (chatRoomId) => {
    socket.leave(chatRoomId);
    console.log(`Socket ${socket.id} left room ${chatRoomId}`);
  });

  // ── Send message: encrypt, save, broadcast ────────────────────
  socket.on("sendMessage", async ({ chatRoomId, senderId, text, senderInfo }) => {
    try {
      const encryptedText = encrypt(text);

      const message = new Message({
        chatRoomId,
        senderId,
        text: encryptedText,
      });
      await message.save();

      // Update chatRoom lastMessage preview & timestamp
      await ChatRoom.findByIdAndUpdate(chatRoomId, {
        lastMessage: text.length > 80 ? text.slice(0, 80) + "…" : text,
        updatedAt: new Date(),
      });

      // Broadcast decrypted message to everyone in the room
      io.to(chatRoomId).emit("newMessage", {
        _id: message._id,
        chatRoomId,
        senderId: senderInfo || { _id: senderId },
        text, // send plaintext to clients in real-time
        createdAt: message.createdAt,
      });
    } catch (error) {
      console.error("sendMessage error:", error);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  // ── Typing indicators ─────────────────────────────────────────
  socket.on("typing", ({ chatRoomId, userId, username }) => {
    socket.to(chatRoomId).emit("userTyping", { userId, username });
  });

  socket.on("stopTyping", ({ chatRoomId, userId }) => {
    socket.to(chatRoomId).emit("userStopTyping", { userId });
  });

  // ── Disconnect ────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    if (currentUserId) {
      await redis.del(`online:${currentUserId}`);
      console.log("User disconnected:", currentUserId);
    }
  });
});



app.get('/', (req, res) => {
  res.send('API is running...');
});


server.listen(3000, () => {
  console.log('Server running on port 3000');
});
