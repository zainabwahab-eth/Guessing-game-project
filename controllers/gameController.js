import User from "./../models/userModel.js";
import GameSession from "./../models/gameModel.js";
import AppError from "./../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";

const generateGameCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handleUserLeave = async (gameCode, userId, io) => {
  try {
    const user = await User.findById(userId);
    const game = await GameSession.findOne({ gameCode });

    if (!user || !game) return null;

    // Store user info before any modifications
    const userInfo = {
      username: user.username,
      userId: user._id,
      isGameMaster: user._id.toString() === game.gameMaster.toString(),
    };

    console.log(
      `User ${userInfo.username} leaving game. Current players: ${game.players.length}`
    );

    // Remove user from game players array
    await GameSession.findOneAndUpdate(
      { gameCode },
      { $pull: { players: user._id } }
    );

    // Get updated game with remaining players
    const updatedGame = await GameSession.findOne({ gameCode }).populate(
      "players",
      "username"
    );

    if (!updatedGame) return null;

    const remainingPlayersCount = updatedGame.players.length;

    // SCENARIO 1: Less than 3 players remaining - END THE GAME
    if (remainingPlayersCount < 3) {
      console.log("Less than 3 players remaining. Ending game...");
      // Delete all remaining users
      const remainingUserIds = updatedGame.players.map((player) => player._id);
      await User.deleteMany({ _id: { $in: remainingUserIds } });

      // Delete the user who left
      await User.findByIdAndDelete(user._id);

      // Delete the game session
      await GameSession.findByIdAndDelete(game._id);

      // Notify remaining players that game is ending
      io.to(gameCode).emit("gameEnded", {
        reason: "Not enough players",
        message: `${userInfo.username} left the game. Game ended due to insufficient players.`,
        leavingUser: userInfo.username,
      });

      return { gameEnded: true, userInfo };
    }

    // SCENARIO 2: 3 or more players remaining
    let newGameMasterInfo = null;

    // If the leaving user was game master, select a new one
    if (userInfo.isGameMaster) {
      console.log("Game master left. Selecting new game master...");
      const newGameMaster = updatedGame.players[0];

      await GameSession.findOneAndUpdate(
        { gameCode },
        { gameMaster: newGameMaster._id }
      );

      newGameMasterInfo = {
        id: newGameMaster._id,
        username: newGameMaster.username,
      };
    }

    // Delete the leaving user
    await User.findByIdAndDelete(user._id);

    // Emit appropriate event
    if (newGameMasterInfo) {
      io.to(gameCode).emit("gameMasterLeft", {
        leavingUser: userInfo.username,
        leavingUserId: userInfo.userId,
        newGameMaster: newGameMasterInfo,
        newGameMasterId: newGameMasterInfo.id,
        playersCount: remainingPlayersCount,
        message: `${userInfo.username} (Game Master) left. ${newGameMasterInfo.username} is now the Game Master.`,
      });
    } else {
      io.to(gameCode).emit("userLeft", {
        username: userInfo.username,
        userId: userInfo.userId,
        playersCount: remainingPlayersCount,
      });
    }

    return {
      gameEnded: false,
      userInfo,
      newGameMasterInfo,
      remainingPlayersCount,
    };
  } catch (error) {
    console.error("Error handling user leave:", error);
    throw error;
  }
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
      "players",
      "username"
    );
    if (game) {
      const existingUsernames = game.players.map((player) => player.username);
      if (existingUsernames.includes(username)) {
        return next(new AppError("Username already taken in this game", 400));
      }
    }
  }
  const user = await User.create({ username });
  req.session.userId = user._id.toString();
  req.user = user;
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

const gameTimers = new Map();

const startRoundTimer = (io, gameCode, gameId) => {
  const totalTime = 60 * 1000; // 60 seconds
  const startTime = Date.now();
  const endTime = startTime + totalTime;

  const timer = setTimeout(async () => {
    const game = await GameSession.findById(gameId);
    if (game && game.status === "in_progress") {
      await resetGameState(io, gameCode, gameId);
    }
    gameTimers.delete(gameCode);
  }, totalTime);

  // Emit timer updates every second
  const interval = setInterval(async () => {
    const timeLeft = Math.max(0, endTime - Date.now());
    io.to(gameCode).emit("timerUpdate", {
      timeLeft: Math.round(timeLeft / 1000),
    });
    if (timeLeft <= 0) {
      clearInterval(interval);
      await resetGameState(io, gameCode, gameId);
    }
  }, 1000);

  gameTimers.set(gameCode, { timer, interval });
};

const resetGameState = async (io, gameCode, gameId) => {
  const game = await GameSession.findById(gameId).populate(
    "players",
    "username"
  );
  if (!game) return;

  let newGameMaster;
  // find current game master index
  const currentGameMasterId = game.gameMaster.toString();
  const currentIndex = game.players.findIndex(
    (player) => player._id.toString() === currentGameMasterId
  );

  if (currentIndex === -1) {
    // Current game master not found in players list, pick first player
    newGameMaster = game.players[0];
  } else {
    // Pick next player in the list (circular)
    const nextIndex = (currentIndex + 1) % game.players.length;
    newGameMaster = game.players[nextIndex];
  }

  // Reset game state
  game.gameMaster = newGameMaster;
  game.currentRound += 1;
  game.question = null;
  game.answer = null;
  await game.save();

  // Reset user attempts
  const users = await User.find({ gameSession: gameId });
  await Promise.all(
    users.map(async (user) => {
      user.attempts = 3;
      await user.save();
    })
  );

  const newGameMasterUser = await User.findById(newGameMaster);

  io.to(gameCode).emit("newRound", {
    gameMasterUsername: newGameMasterUser.username,
    gameMaster: newGameMaster,
    round: game.currentRound,
    gameCode,
  });
};

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
    userId: req.user._id,
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

  const io = req.app.get("io");
  io.to(game.gameCode).emit("startGame", {
    username: req.user.username,
    round: game.currentRound,
    status: "in-progress",
  });

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

  const game = req.gameSession;

  if (req.session.userId.toString() !== game.gameMaster.toString()) {
    return next(new AppError("Only the Game Master can add questions", 403));
  }

  // if (game.status !== "in_progress") {
  //   return next(new AppError("Game must be in progress to add questions", 400));
  // }

  const timerData = gameTimers.get(gameCode);
  if (timerData) {
    clearTimeout(timerData.timer);
    clearInterval(timerData.interval);
    gameTimers.delete(gameCode);
  }

  const updatedGame = await GameSession.findOneAndUpdate(
    { gameCode },
    { question, answer },
    { new: true }
  );

  const io = req.app.get("io");
  io.to(gameCode).emit("askQuestion", {
    gameCode,
    round: updatedGame.currentRound,
    question,
  });

  startRoundTimer(io, gameCode, updatedGame._id);

  res.status(201).json({
    status: "success",
    message: "Question added",
    data: {
      updatedGame,
    },
  });
});

export const checkAnswer = catchAsync(async (req, res, next) => {
  const { gameCode } = req.params;
  const { answer } = req.body;

  const game = req.gameSession;
  const user = req.user;

  if (!answer) {
    return next(new AppError("Answer are required", 400));
  }

  if (user.attempts === 0) {
    return next(new AppError("You're out of attempts", 400));
  }

  const io = req.app.get("io");

  if (game.answer.toLowerCase() === answer.toLowerCase()) {
    user.score += 10;
    user.attempts = 3;
    await user.save();

    io.to(gameCode).emit("correctAnswer", {
      gameCode,
      username: user.username,
      round: game.currentRound,
      userScore: user.score,
      userId: user._id,
    });

    // Clear timer
    const timerData = gameTimers.get(gameCode);
    if (timerData) {
      clearTimeout(timerData.timer);
      clearInterval(timerData.interval);
      gameTimers.delete(gameCode);
    }

    // Reset game state
    await resetGameState(io, gameCode, game._id);

    res.status(201).json({
      status: "correct",
      message: "Your answer is correct",
      data: {
        game,
      },
    });
  } else {
    req.user.attempts--;
    await req.user.save();

    io.to(gameCode).emit("wrongAnswer", {
      gameCode,
      username: user.username,
      attemptsLeft: user.attempts,
    });
    res.status(201).json({
      status: "wrong",
      message: "Your answer is wrong",
      data: {
        game,
      },
    });
  }
});

export const leaveGame = catchAsync(async (req, res, next) => {
  const { gameCode } = req.params;
  const user = req.user;
  const io = req.app.get("io");

  const result = await handleUserLeave(gameCode, user._id, io);

  if (!result) {
    return next(new AppError("Failed to process leave request", 500));
  }

  // Clear session regardless of outcome
  req.session.destroy((err) => {
    if (err) console.error("Session destroy error:", err);
  });

  if (result.gameEnded) {
    return res.status(200).json({
      status: "success",
      message: "Game ended - not enough players remaining",
      gameEnded: true,
    });
  } else {
    return res.status(200).json({
      status: "success",
      message: "Left game successfully",
      gameEnded: false,
    });
  }
});
