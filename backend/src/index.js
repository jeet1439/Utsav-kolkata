import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import pandleRoutes from './routes/pandal.route.js';
import userRoutes from './routes/user.routes.js';
import redis from '../src/redis/redis.js';
import { Server } from "socket.io";
import http from "http";


dotenv.config();

const app = express();
const server = http.createServer(app);


app.use(cors());
app.use(express.json({ limit: '20mb' })); 
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/pandals', pandleRoutes);
app.use('/api/user', userRoutes);


mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));


const io = new Server(server, {
  cors: { origin: "*" },
});


io.on("connection", (socket) => {
  console.log("User connected");

  let currentUserId = null;

  socket.on("userOnline", async (userId) => {
    currentUserId = userId;

    await redis.set(`online:${userId}`, "true", "EX", 300);

    console.log(`User ${userId} online`);
  });

  socket.on("userOffline", async (userId) => {
    await redis.del(`online:${userId}`);

    console.log(`User ${userId} offline`);
  });

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
