import { showAlert } from "./alert.js";

const BASE_URL =
  window.env.NODE_ENV === "production"
    ? window.env.BACKEND_URL
    : "http://localhost:4000";
console.log(
  "From index.js..",
  window.env.BACKEND_URL === "https://guessing-game-project.onrender.com"
);
const createBtn = document.getElementById("create-btn");
const joinBtn = document.getElementById("join-btn");
const startBtn = document.getElementById("start-btn");
const questionBtn = document.getElementById("question-btn");
const submitBtn = document.getElementById("submit-btn");
const leaveBtn = document.getElementById("leave-btn");

const enterGame = async (data, url, method) => {
  try {
    const response = await axios({
      method,
      url,
      data,
    });
    if (response.data.status === "success") {
      const gameCode =
        method === "POST"
          ? +response.data.data.game.gameCode
          : +response.data.data.updatedGame.gameCode;
      window.location.assign(`/game/${gameCode}`);
    }
  } catch (err) {
    console.error("err", err);
    const errorMessage = err.response?.data?.message || "Error joining game";
    showAlert("error", errorMessage);
  }
};

export const addQuestion = async (gameCode, question, answer) => {
  try {
    if (!question || !answer) {
      showAlert("error", "Please enter both question and answer");
      return;
    }
    const response = await axios({
      method: "PATCH",
      url: `${BASE_URL}/api/v1/gameSession/${gameCode}/question`,
      data: { question, answer },
    });
    if (response.data.status === "success") {
      console.log("Question asked successfully");
    }
  } catch (err) {
    console.error("Add question error:", err);
    const errorMessage = err.response?.data?.message || "Error adding question";
    showAlert("error", errorMessage);
  }
};

export const checkAnswer = async (gameCode, answer) => {
  try {
    if (!answer) {
      showAlert("error", "Please enter your answer");
      return;
    }
    const response = await axios({
      method: "PATCH",
      url: `${BASE_URL}/api/v1/gameSession/${gameCode}/answer`,
      data: { answer },
    });
    if (response.data.status === "correct") {
      console.log("answer correct");
    } else if (response.data.status === "wrong") {
      console.log("answer wrong");
    }
  } catch (err) {
    console.error("Submit answer error:", err);
    const errorMessage =
      err.response?.data?.message || "Error submitting answer";
    showAlert("error", errorMessage);
  }
};

export const leaveGame = async (gameCode) => {
  if (confirm("Are you sure you want to leave the game?")) {
    try {
      const response = await axios({
        method: "PATCH",
        url: `${BASE_URL}/api/v1/gameSession/${gameCode}/leave`,
      });
      if (response.data.status === "success") {
        window.location.assign("/");
      }
    } catch (err) {
      console.error("Leave game error:", err);
      const errorMessage = err.response?.data?.message || "Error leaving game";
      showAlert("error", errorMessage);
    }
  }
};

if (joinBtn) {
  joinBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const userGameCode = document.getElementById("gamecode").value.trim();

    if (!username || !userGameCode) {
      showAlert("error", "Please enter both username and game code");
      return;
    }
    const data = { username };
    const url = `${BASE_URL}/api/v1/gameSession/${userGameCode}/join`;
    const method = "PATCH";

    await enterGame(data, url, method);
    document.getElementById("username").value = "";
    document.getElementById("gamecode").value = "";
  });
}

if (createBtn) {
  createBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();

    if (!username) {
      showAlert("error", "Please enter username");
      return;
    }

    const data = { username };
    const url = `${BASE_URL}/api/v1/gameSession/create`;
    const method = "POST";

    await enterGame(data, url, method);
    document.getElementById("username").value = "";
  });
}

if (startBtn) {
  startBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const gameCode = document.getElementById("game-container").dataset.gamecode;
    try {
      const response = await axios({
        method: "PATCH",
        url: `${BASE_URL}/api/v1/gameSession/${gameCode}/start`,
      });
      if (response.data.status === "success") {
        console.log("Game started successfully");
      }
    } catch (err) {
      console.error("Start game error:", err);
      const errorMessage = err.response?.data?.message || "Error Starting game";
      showAlert("error", errorMessage);
    }
  });
}

if (questionBtn) {
  questionBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const gameCode = document.getElementById("game-container").dataset.gamecode;
    const question = document.getElementById("question").value;
    const answer = document.getElementById("answer").value;
    await addQuestion(gameCode, question, answer);
    document.getElementById("question").value = "";
    document.getElementById("answer").value = "";
  });
}

if (submitBtn) {
  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const gameCode = document.getElementById("game-container").dataset.gamecode;
    const answer = document.getElementById("userAnswer").value;
    await checkAnswer(gameCode, answer);
    document.getElementById("userAnswer").value = "";
  });
}

if (leaveBtn) {
  leaveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const gameCode = document.getElementById("game-container").dataset.gamecode;
    await leaveGame(gameCode);
  });
}
