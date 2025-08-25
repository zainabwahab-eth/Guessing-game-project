// const mongoose = require("mongoose");
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please enter username"],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
