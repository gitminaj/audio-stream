import express from "express"
import dotenv from "dotenv"
import { connectDB } from "./config/db.js"
import cookieParser from "cookie-parser"
import {createServer} from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
dotenv.config()

import authRouter from "./routes/auth.js"
import messageRoute from "./routes/message.js"
import roomRoute from "./routes/room.js"
import followUserRoute  from "./routes/follow.js"
import postRoutes from './routes/post.js';
import chatRoutes from './routes/chat.js';
import agencyRoutes from './routes/agency.js';

import socketHandlers from './controllers/socketController.js';
import { authenticateJWT } from "./middleware/verify-token.js";

const app = express();
const server = createServer(app)
const port = process.env.PORT

app.use(cors());
app.use(express.json())
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

const io = new Server(server, {
  cors: {
    origin: "*", // Configure this properly for production
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});


(async () => {
    try {
        await connectDB();
        console.log("Database synced!");
    } catch (error) {
        console.error("Error creating the table:", error);
        process.exit(1);
    }
})();

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/message", messageRoute);
app.use("/api/v1/room", roomRoute);
app.use("/api/v1/follow", followUserRoute);
app.use("/api/v1/post", postRoutes);
app.use('/api/v1/chat', authenticateJWT ,chatRoutes);
app.use('/api/v1/agency' ,agencyRoutes);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle socket events
  socketHandlers.handleConnection(socket, io);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    socketHandlers.handleDisconnection(socket, io);
  });
});

app.get("/", (req, res) => {
    return res.json({
        success: true,
        message: 'Your server is up and running....'
    });
});

server.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`)
})