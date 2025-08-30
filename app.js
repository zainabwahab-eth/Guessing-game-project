import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import { fileURLToPath } from "url";
import path from "path";
import globalErrorHandler from "./controllers/errController.js";
import gameRoutes from "./routes/gameRoutes.js";
import viewRoutes from "./routes/viewRoutes.js";

import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
