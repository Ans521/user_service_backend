// import express from "express";
// import dotenv from "dotenv";
// import bodyParser from "body-parser";
// import {connectDb} from "./config/db";
// import authRouter from "./routes/route";
// import cookieParser from 'cookie-parser';
// import path from 'path';
// import http from 'http'; 
// import {Server}  from 'socket.io'
// import cors from 'cors';
// dotenv.config();
// connectDb();


// const app = express();
// const server = http.createServer(app);


// const io = new Server(server, {
//     cors: {
//       origin: "*", 
//       methods: ["GET", "POST"]
//     }
//   });

// console.log("io", io)
// io.on('connect', (socket: any) => {
//     console.log('User connected');
//     socket.on('clientMessage', (message : any ) => {
//         console.log(message);
//         socket.emit('serverMessage', "Hello from server!");
//     })

//     socket.on('disconnect', () => {
//         console.log('User disconnected');
//     });
// });

// app.use(cors());
// app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use("/api", authRouter);
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// app.use(cookieParser());

// app.use((req, res) => {
//     res.status(404).json({ message: "Route not found" });
// });

// app.get('/', (req, res) => {
//     res.send('Hello World!');
// })

// export {app, server};

import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { connectDb } from "./config/db";
import authRouter from "./routes/route";
import cookieParser from "cookie-parser";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

dotenv.config();
connectDb();

const app = express();
const server = http.createServer(app);

// Setup CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*", // set your frontend URL in .env
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connect", (socket) => {
  console.log("User connected");

  socket.on("clientMessage", (message) => {
    console.log(message);
    socket.emit("serverMessage", "Hello from server!");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.use("/api", authRouter);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server };
