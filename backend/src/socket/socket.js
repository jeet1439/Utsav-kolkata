import { Server } from "socket.io";

let onlineUsers = {};

export default function socketHandler(server) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("user-online", (username) => {
      onlineUsers[socket.id] = username;
      io.emit("online-users", Object.values(onlineUsers));
    });

    socket.on("send-message", (data) => {
      io.emit("receive-message", data);
    });

    socket.on("disconnect", () => {
      const username = onlineUsers[socket.id];
      delete onlineUsers[socket.id];
      io.emit("online-users", Object.values(onlineUsers));
      console.log(`User disconnected: ${username}`);
    });
  });
}
