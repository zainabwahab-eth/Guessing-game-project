import User from "./../models/userModel.js";
import GameSession from "./../models/gameModel.js";
import AppError from "./../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";

const generateGameCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const checkGame = catchAsync(async (req, res, next) => {
  const game = await GameSession.findOne({ gameCode: req.params.gameCode });
  if (!game) return next(new AppError("This game does not exist", 404));
  req.gameSession = game;
  next();
});

export const createUser = catchAsync(async (req, res, next) => {
  const { username } = req.body;
  const user = await User.create({ username });
  req.user = user;
  next();
});

export const createGame = catchAsync(async (req, res, next) => {
  const gameCode = generateGameCode();
  const gameMaster = req.user;

  const game = await GameSession.create({
    gameMaster: gameMaster._id,
    gameCode,
    players: [{ user: gameMaster._id }],
  });

  res.status(201).json({
    status: "success",
    message: "Game session created successfully",
    data: {
      game,
    },
  });
});

export const joinGame = catchAsync(async (req, res, next) => {
  const { gameCode } = req.params;

  const player = req.user;
  const game = req.gameSession;

  if (game.status !== "waiting") {
    await player.deleteOne();
    return next(new AppError("This game has already started", 400));
  }

  const updatedGame = await GameSession.findOneAndUpdate(
    { gameCode },
    { $push: { players: { user: player._id } } },
    { new: true }
  );

  res.status(201).json({
    status: "success",
    message: "User joined successfully",
    data: {
      updatedGame,
    },
  });
});

export const startGame = catchAsync(async (req, res, next) => {
  const game = req.gameSession;

  const noOfPlayers = game.players.length;

  if (noOfPlayers < 3) {
    return next(new AppError("Players must be up to 3 for game to start", 400));
  }

  if (game.status !== "waiting") {
    return next(new AppError("This game has already started", 400));
  }

  game.status = "in-progress";
  await game.save();

  res.status(201).json({
    status: "success",
    message: "Game started",
    data: {
      game,
    },
  });
});

export const addQuestionAndAnswer = catchAsync(async (req, res, next) => {
  const { gameCode } = req.params;
  const { question, answer } = req.body;

  if (!question || !answer) {
    return next(new AppError("Question and answer are required", 400));
  }

  const updatedGame = await GameSession.findOneAndUpdate(
    { gameCode },
    { question, answer },
    { new: true }
  );

  res.status(201).json({
    status: "success",
    message: "Question added",
    data: {
      updatedGame,
    },
  });
});
