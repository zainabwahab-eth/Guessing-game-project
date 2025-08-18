import mongoose from "mongoose";
import dotenv from "dotenv";
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
app.listen(PORT, () => {
  console.log(`You're listening to port ${PORT}`);
});
