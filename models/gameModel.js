import mongoose from "mongoose";

const gameSessionSchema = new mongoose.Schema({
  gameMaster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  currentRound: {
    type: Number,
    default: 1,
  },
  gameCode: {
    type: String,
    required: true,
    unique: true,
  },
  question: {
    type: String,
    default: null,
  },
  answer: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ["waiting", "in-progress", "ended"],
    default: "waiting",
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  expiresAt: {
    type: Date,
    default: null,
  },
});

gameSessionSchema.pre(/^find/, function (next) {
  this.populate({
    path: "players",
    select: "username score attempts currentRound",
  });
  next();
});

const GameSession = new mongoose.model("GameSession", gameSessionSchema);
export default GameSession;
