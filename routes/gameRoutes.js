import express from "express";
import {
  checkGame,
  createUser,
  createGame,
  joinGame,
  startGame,
  addQuestionAndAnswer,
} from "../controllers/gameController.js";

const router = express.Router();

router.post("/create", createUser, createGame);
router.patch("/:gameCode/join", checkGame, createUser, joinGame);
router.patch("/:gameCode/start", checkGame, startGame);
router.patch("/:gameCode/question", checkGame, addQuestionAndAnswer);

export default router;
