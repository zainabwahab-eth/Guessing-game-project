import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please enter username"],
    },
    gameSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameSession",
    },
    score: {
      type: Number,
      default: 0,
    },
    attempts: {
      type: Number,
      default: 3,
    },
    currentRound: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
