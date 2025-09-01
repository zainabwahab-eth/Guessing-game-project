import catchAsync from "../utils/catchAsync.js";
import GameSession from "./../models/gameModel.js";
import User from "../models/userModel.js";

export const requireUserForGame = catchAsync(async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    // Redirect to join page if no user session
    return res.redirect(`/join`);
  }

  const user = await User.findById(req.session.userId);
  if (!user) {
    // Redirect to join page if user not found
    return res.redirect(`/join`);
  }

  req.user = user;
  next();
});

export const getWelcome = (req, res) => {
  res.status(200).render("welcome", {
    title: "Welcome Page",
  });
};

export const getJoinPage = (req, res) => {
  const startType = "join";
  res.status(200).render("start", {
    title: startType === "join" ? "Join Game" : "Create Game",
    startType,
  });
};

export const getCreatePage = (req, res) => {
  const startType = "create";
  res.status(200).render("start", {
    title: startType === "join" ? "Join Game" : "Create Game",
    startType,
  });
};

export const getGamePage = catchAsync(async (req, res) => {
  const { gameCode } = req.params;
  const game = await GameSession.findOne({ gameCode })
    .populate("players", "username")
    .populate("gameMaster", "username");
  const user = req.user;
  const gameMaster =
    user._id.toString() === game.gameMaster._id.toString() ? true : false;
  res.status(200).render("game", {
    game,
    user,
    gameMaster,
  });
});
