// socket/socket.js
import { Server } from "socket.io";
import mongoose from "mongoose";
import User from "../model/user.model.js";

let onlineUsers = {};

export default function socketHandler(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("user_online", async (userId) => {
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return;

      onlineUsers[socket.id] = userId;

      const usersData = await User.find({
        _id: { $in: Object.values(onlineUsers) },
      }).select("username profileImage");

      // Map to send only latest profile image
      const formattedUsers = usersData.map(user => ({
        _id: user._id,
        username: user.username,
        profileImage:
          Array.isArray(user.profileImage) && user.profileImage.length > 0
            ? user.profileImage[user.profileImage.length - 1] 
            : "https://via.placeholder.com/50", 
      }));

      io.emit("online_users", formattedUsers);
    });

    socket.on("disconnect", async () => {
      delete onlineUsers[socket.id];

      const usersData = await User.find({
        _id: { $in: Object.values(onlineUsers) },
      }).select("username profileImage");

      const formattedUsers = usersData.map(user => ({
        _id: user._id,
        username: user.username,
        profileImage:
          Array.isArray(user.profileImage) && user.profileImage.length > 0
            ? user.profileImage[user.profileImage.length - 1]
            : "https://via.placeholder.com/50",
      }));

      io.emit("online_users", formattedUsers);

      console.log("Socket disconnected:", socket.id);
    });
  });
}
