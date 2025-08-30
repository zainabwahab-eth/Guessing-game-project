import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config({ path: "./config.env" });
import { fileURLToPath } from "url";
import path from "path";
import globalErrorHandler from "./controllers/errController.js";
import gameRoutes from "./routes/gameRoutes.js";
import viewRoutes from "./routes/viewRoutes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.BACKEND_URL
        : "http://localhost:4000",
  })
);

app.use(express.json());

app.set("view engine", "pug");

app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET, // change to env variable
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE_URL, // your DB connection
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      sameSite: "lax", // CSRF protection
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 hour
    },
  })
);

app.use("/api/v1/gameSession", gameRoutes);
app.use("/", viewRoutes);

app.use(globalErrorHandler);

export default app;
