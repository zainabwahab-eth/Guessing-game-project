import { showUpdate } from "./update.js";

// const socket = io("http://localhost:4000");
const backendUrl =
  window.env.NODE_ENV === "production"
    ? window.env.BACKEND_URL
    : "http://localhost:4000";
const socket = io(backendUrl, {
  transports: ["websocket", "polling"],
});

const updateGameMasterView = (isGameMaster) => {
  const gmSection = document.querySelector(".gamemaster-section");
  if (gmSection) {
    if (isGameMaster) {
      gmSection.classList.remove("hidden");
    } else {
      gmSection.classList.add("hidden");
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const currentUserId =
    document.getElementById("game-container").dataset.userId;
  const initialGameMaster =
    document.getElementById("game-container").dataset.gamemasterId;
  const gameStatus =
    document.getElementById("game-container").dataset.gameStatus;
  updateGameMasterView(
    currentUserId.toString() === initialGameMaster.toString()
  );

  if (
    currentUserId.toString() === initialGameMaster.toString() &&
    gameStatus === "in-progress"
  ) {
    const questionForm = document.querySelector(".question-form");
    const startbtn = document.getElementById("start-btn");

    if (questionForm) questionForm.classList.remove("hidden");
    if (startbtn) startbtn.classList.add("hidden");
  }
});

// const isAdmin = document.querySelector(".admin-info") !== null;
const showQuestion = (question, gameCode) => {
  const questionSection = document.querySelector(".question-section");
  const questionDiv = document.querySelector(".question-sub");
  if (questionSection) questionSection.classList.remove("hidden");
  if (questionDiv) questionDiv.textContent = question;
};

const updateTimer = (timeLeft) => {
  const timeBar = document.querySelector(".time-bar");
  if (timeBar) {
    const totalTime = 60;
    const percent = (timeLeft / totalTime) * 100;
    timeBar.style.width = percent + "%";
    if (timeLeft < 10) {
      timeBar.style.backgroundColor = "#eb4d4b";
    } else {
      timeBar.style.backgroundColor = "#20bf6b";
    }
  }
};

socket.on("connect", () => {
  const gameCode = document.getElementById("game-container").dataset.gamecode;
  const userId = document.getElementById("game-container").dataset.userId;
  socket.emit("joinRoom", { gameCode, userId });
  console.log("Joined room:", gameCode);
});

socket.on("userJoined", (data) => {
  console.log(`${data.username} joined the game 🎮`);

  showUpdate(`${data.username} joined the game 🎮`);

  const playerList = document.querySelector(".player-list");
  const player = document.createElement("li");
  player.classList.add("player-item");
  player.dataset.id = `${data.userId.toString()}`;
  player.textContent = `${data.username} - ${data.score}`;
  playerList.appendChild(player);
});

socket.on("userLeft", (data) => {
  console.log(`${data.username} left the game 🎮`);
  showUpdate(`${data.username} left the game 🎮`);
  const playerList = document.querySelectorAll(".player-item");
  Array.from(playerList).forEach((player) => {
    if (player.dataset.id === data.userId) {
      player.remove();
    }
  });
});

socket.on("startGame", (data) => {
  console.log(`${data.username} game-master started the game 🎮`);
  showUpdate(
    `Round ${data.round} - ${data.username}(game-master) started the game 🎮`
  );

  const questionForm = document.querySelector(".question-form");
  const startbtn = document.getElementById("start-btn");

  if (questionForm) questionForm.classList.remove("hidden");
  if (startbtn) startbtn.classList.add("hidden");
});

socket.on("askQuestion", (data) => {
  console.log(`Game-master sent question 🎮`);
  showUpdate(
    `Game-master sent question. You have 60secs and 3 attempts to anser this question🎮`
  );
  showQuestion(data.question, data.gameCode);
});

socket.on("timerUpdate", (data) => {
  updateTimer(data.timeLeft);
  if (data.timeLeft < 0) {
    showUpdate(`Timeup - No correct answer🎮`);
  }
});

socket.on("correctAnswer", (data) => {
  console.log(
    `${data.username} got the answer for round ${data.round} correctly and scored 10points 🎮`
  );
  showUpdate(
    `${data.username} got the answer for round ${data.round} correctly and scored 10points 🎮`
  );
  const playerDetails = document.querySelector(".player-details");
  const userId = playerDetails.dataset.userId;
  console.log(userId);
  if (userId === data.userId) {
    playerDetails.textContent = `${data.username} - ${data.userScore}`;
  }
  const playerList = document.querySelectorAll(".player-item");
  Array.from(playerList).forEach((player) => {
    if (player.dataset.id === data.userId) {
      player.textContent = `${data.username} - ${data.userScore}`;
    }
  });
});

socket.on("wrongAnswer", (data) => {
  console.log(
    `${data.username} submitted a wrong answer, attempts left: ${data.attemptsLeft}`
  );
  showUpdate(
    `${data.username} submitted a wrong answer, attempts left: ${data.attemptsLeft}`
  );
});

socket.on("newRound", (data) => {
  console.log(
    `New round: round ${data.round} - New Game Master: ${data.gameMasterUsername}`
  );
  showUpdate(
    `New round: round ${data.round} - New Game Master: ${data.gameMasterUsername}`
  );

  const questionSection = document.querySelector(".question-section");
  const questionDiv = document.querySelector(".question-sub");
  const timeBar = document.querySelector(".time-bar");

  if (questionSection) questionSection.classList.add("hidden");
  if (questionDiv) questionDiv.textContent = "";
  if (timeBar) {
    timeBar.style.width = "100%";
    timeBar.style.backgroundColor = "#20bf6b";
  }

  const currentUserId =
    document.getElementById("game-container").dataset.userId;
  const isNewGameMaster =
    data.gameMaster._id.toString() === currentUserId.toString();
  const submitBtn = document.getElementById("submit-btn");
  const answerInput = document.querySelector(".answer-input");
  submitBtn.disabled = isNewGameMaster;
  answerInput.disabled = isNewGameMaster;
  updateGameMasterView(isNewGameMaster);
});

socket.on("gameMasterLeft", (data) => {
  console.log(data.message);
  showUpdate(data.message);

  const questionSection = document.querySelector(".question-section");
  const questionDiv = document.querySelector(".question-sub");
  const timeBar = document.querySelector(".time-bar");

  if (questionSection) questionSection.classList.add("hidden");
  if (questionDiv) questionDiv.textContent = "";
  if (timeBar) {
    timeBar.style.width = "100%";
    timeBar.style.backgroundColor = "#20bf6b";
  }

  const currentUserId =
    document.getElementById("game-container").dataset.userId;
  console.log("currentUser", currentUserId);
  const isNewGameMaster =
    data.newGameMasterId.toString() === currentUserId.toString();
  console.log("new Master", data.newGameMasterId);
  const submitBtn = document.getElementById("submit-btn");
  const answerInput = document.querySelector(".answer-input");
  submitBtn.disabled = isNewGameMaster;
  answerInput.disabled = isNewGameMaster;

  const playerList = document.querySelectorAll(".player-item");
  Array.from(playerList).forEach((player) => {
    if (player.dataset.id.toString() === data.leavingUserId.toString()) {
      player.remove();
    }
  });
  updateGameMasterView(isNewGameMaster);
});

socket.on("gameEnded", (data) => {
  showUpdate(data.message);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
