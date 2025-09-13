import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema({
  participants: [
    { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User"
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("ChatRoom", chatRoomSchema);
