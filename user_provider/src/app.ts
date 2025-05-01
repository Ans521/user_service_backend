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
import ioClient from "socket.io-client";

import { Socket } from "socket.io-client";
dotenv.config();
connectDb();


const app = express();
const server = http.createServer(app);


const io = new Server(server);

io.on('connect', (socket: any) => {
    console.log('User connected');
    console.log(socket.id);
    socket.on('clientMessage', (message : string ) => {
        socket.emit('serverMessage', "Hello from server!");
    })

    
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/api", authRouter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(cookieParser());


app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.get('/', (req, res) => {
    res.send('Hello World!');
})

setTimeout(() => {
    const testClient = ioClient("http://13.202.163.238:4000");
  
    testClient.on("connect", () => {
      console.log("✅ Test client connected to server");
      testClient.emit("clientMessage", "Hello from test client");
    });
  
    testClient.on("serverMessage", (msg: string) => {
      console.log("📩 Message from server:", msg);
    });
  
    testClient.on("disconnect", () => {
      console.log("❌ Test client disconnected from server");
    });
  }, 1000);
  
export {app, server};
