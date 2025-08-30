import express from "express";
import {
  getCreatePage,
  getGamePage,
  getJoinPage,
  getWelcome,
  requireUserForGame
} from "../controllers/viewController.js";
import { getCurrentUser } from "../controllers/gameController.js";

const router = express.Router();

router.get("/", getWelcome);
router.get("/join", getJoinPage);
router.get("/create", getCreatePage);
router.get("/game/:gameCode", requireUserForGame, getGamePage);

export default router;
