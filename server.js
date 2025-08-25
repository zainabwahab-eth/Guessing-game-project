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

const io = new Server(server, {
  cors: {
    origin: "*", // <-- restrict this to your frontend domain in production
    // methods: ["GET", "POST", ''],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Example: join game room
  socket.on("joinGame", (gameId) => {
    socket.join(gameId);
    console.log(`User ${socket.id} joined game ${gameId}`);
  });

  // Example: handle game move
  socket.on("makeMove", (data) => {
    console.log("Move received:", data);
    // send to other players in the same room
    io.to(data.gameId).emit("moveMade", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`You're listening to port ${PORT}`);
});
