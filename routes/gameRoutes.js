import express from "express";
import {
  checkGame,
  createUser,
  createGame,
  joinGame,
  startGame,
  addQuestionAndAnswer,
  getCurrentUser,
  checkAnswer,
  leaveGame,
} from "../controllers/gameController.js";

const router = express.Router();

router.post("/create", createUser, createGame);
router.patch("/:gameCode/join", createUser, checkGame, joinGame);
router.patch("/:gameCode/start", getCurrentUser, checkGame, startGame);
router.patch(
  "/:gameCode/question",
  getCurrentUser,
  checkGame,
  addQuestionAndAnswer
);
router.patch("/:gameCode/answer", getCurrentUser, checkGame, checkAnswer);
router.patch("/:gameCode/leave", getCurrentUser, checkGame, leaveGame);

export default router;
