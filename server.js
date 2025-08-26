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

app.set("io", io);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", ({ gameCode }) => {
    socket.join(gameCode);
    console.log(`Socket ${socket.id} joined room ${gameCode}`);
    socket.gameCode = gameCode;
  });

  socket.on("userJoined", (msg) => {
    if (socket.gameCode) {
      socket.to(socket.gameCode).emit("userJoined", msg);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`You're listening to port ${PORT}`);
});
