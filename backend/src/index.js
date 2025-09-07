import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import pandleRoutes from './routes/pandal.route.js';
import userRoutes from './routes/user.routes.js';
import http from "http";
import socketHandler from './socket/socket.js';


dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '20mb' })); 
app.use(express.urlencoded({ limit: '20mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/pandals', pandleRoutes);
app.use('/api/user', userRoutes);

socketHandler(server);

console.log(process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

app.listen(3000, () => {
  console.log('Server running on port 3000');
})