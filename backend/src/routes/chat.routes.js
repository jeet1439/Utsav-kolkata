import express from "express";
import ChatRoom from "../model/chatRoom.model.js";
import Message from "../model/message.model.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { decrypt } from "../lib/encryption.js";

const router = express.Router();

// ── POST /room — create or get existing 1-on-1 chat room ──────────
router.post("/room", authMiddleware, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.user._id;

    if (!otherUserId) {
      return res.status(400).json({ message: "otherUserId is required" });
    }

    // Check if a room with exactly these two participants already exists
    let room = await ChatRoom.findOne({
      participants: { $all: [userId, otherUserId], $size: 2 },
    }).populate("participants", "username profileImage");

    if (!room) {
      room = new ChatRoom({
        participants: [userId, otherUserId],
      });
      await room.save();
      room = await ChatRoom.findById(room._id).populate(
        "participants",
        "username profileImage"
      );
    }

    res.status(200).json(room);
  } catch (error) {
    console.error("Error creating/getting chat room:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /rooms — get all chat rooms for logged-in user ─────────────
router.get("/rooms", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const rooms = await ChatRoom.find({ participants: userId })
      .populate("participants", "username profileImage")
      .sort({ updatedAt: -1 });

    res.status(200).json(rooms);
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /messages/:roomId — paginated messages (decrypted) ─────────
router.get("/messages/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { before, limit = 50 } = req.query;

    const query = { chatRoomId: roomId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("senderId", "username profileImage");

    // Decrypt message text before sending to client
    const decrypted = messages.map((msg) => {
      const plain = msg.toObject();
      try {
        plain.text = decrypt(plain.text);
      } catch {
        plain.text = "[unable to decrypt]";
      }
      return plain;
    });

    res.status(200).json(decrypted.reverse()); // oldest first for display
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
