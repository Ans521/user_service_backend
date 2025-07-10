import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import {connectDb} from "./config/db";
import authRouter from "./routes/route";
import cookieParser from 'cookie-parser';
import path from 'path';
import http from 'http'; 
import {Server}  from 'socket.io'
import cors from 'cors';
import { userSocketMap } from "./controllers/socket";
dotenv.config();
connectDb();


const app = express();
const server = http.createServer(app);


export const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
  });
  
io.on('connect', async (socket: any) => {
    console.log('User connected');
    console.log(socket.id);

    socket.on('set-user-id', (userId : string ) => {
        if(userId){
            userSocketMap.set(userId, socket.id) 
            socket.userId = userId
            socket.emit('server-connect', "server connected");
            console.log(`Mapped user ${userId} to socket ${socket.id}`);
            console.log("get it", userSocketMap.get(userId))
        }
    })

    socket.on('disconnect', () => {
        console.log('User disconnected');
        userSocketMap.delete(socket.userId);
    });
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/api", authRouter);

app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.get('/', (req, res) => {
    res.send('Hello World!');
})

  
export {app, server};
