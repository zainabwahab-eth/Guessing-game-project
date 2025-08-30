import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE_URL;

mongoose
  .connect(DB)
  .then(() => {
    console.log("connection to mongodb successful");
  })
  .catch((err) => console.log("MongoDB Error:", err.message));

const PORT = process.env.PORT || 4000;

const server = createServer(app);

const socket = io();
app.set("io", io);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", ({ gameCode, userId }) => {
    socket.join(gameCode);
    socket.gameCode = gameCode;
    socket.userId = userId;
  });

  socket.on("userJoined", (msg) => {
    if (socket.gameCode) {
      socket.to(socket.gameCode).emit("userJoined", msg);
    }
  });
});

server.listen(PORT, () => {
  console.log(`You're listening to port ${PORT}`);
});
