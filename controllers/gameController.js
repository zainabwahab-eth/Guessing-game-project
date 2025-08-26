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
  const gameCode = req.params.gameCode;

  // Check for duplicate username in the same game
  if (gameCode) {
    const game = await GameSession.findOne({ gameCode }).populate(
      "players", // This is correct now
      "username"
    );
    if (game) {
      // FIX: Since players is now a simple array, access username directly
      const existingUsernames = game.players.map((player) => player.username);
      if (existingUsernames.includes(username)) {
        return next(new AppError("Username already taken in this game", 400));
      }
    }
  }
  const user = await User.create({ username });
  req.session.userId = user._id;
  req.user = user;
  console.log(req.user);
  next();
});

export const getCurrentUser = catchAsync(async (req, res, next) => {
  if (!req.session.userId) {
    return next(new AppError("No user in session", 401));
  }

  const user = await User.findById(req.session.userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  req.user = user;
  next();
});

export const createGame = catchAsync(async (req, res, next) => {
  const gameCode = generateGameCode();
  const gameMaster = req.user;

  const game = await GameSession.create({
    gameMaster: gameMaster._id,
    gameCode,
    players: [gameMaster._id],
  });

  // Update user to reference this game
  await User.findByIdAndUpdate(gameMaster._id, { gameSession: game._id });

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
    { $push: { players: player._id } },
    { new: true }
  );

  await User.findByIdAndUpdate(player._id, { gameSession: updatedGame._id });

  const io = req.app.get("io");
  io.to(gameCode).emit("userJoined", {
    score: req.user.score,
    username: req.user.username,
  });

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

  if (req.session.userId.toString() !== game.gameMaster.toString()) {
    return next(new AppError("Only the Game Master can start the game", 403));
  }

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
