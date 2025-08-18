import express from "express";
import globalErrorHandler from "./controllers/errController.js";
import gameRoutes from "./routes/gameRoutes.js";

const app = express();
app.use(express.json());

app.set("view engine", "pug");

app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

export default app;

app.use("/api/v1/gameSession", gameRoutes);
app.use(globalErrorHandler);
