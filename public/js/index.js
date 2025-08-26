import { showAlert } from "./alert.js";

const createBtn = document.getElementById("create-btn");
const joinBtn = document.getElementById("join-btn");
const startBtn = document.getElementById("start-btn");

const socket = io("http://localhost:4000");

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
      socket.emit("joinRoom", { gameCode });
      window.location.assign(`/game/${gameCode}`);
    }
  } catch (err) {
    console.error("err", err);
    const errorMessage = err.response?.data?.message || "Error joining game";
    showAlert("error", errorMessage);
  }
};

if (joinBtn) {
  joinBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const userGameCode = document.getElementById("gamecode").value.trim();

    if (!username || !userGameCode) {
      alert("Please enter both username and game code");
      return;
    }

    const data = { username };
    const url = `http://localhost:4000/api/v1/gameSession/${userGameCode}/join`;
    const method = "PATCH";

    try {
      await enterGame(data, url, method);
      document.getElementById("username").value = "";
      document.getElementById("gamecode").value = "";
    } catch (error) {
      console.error("Join game error:", error);
      const errorMessage =
        error.response?.data?.message || "Error joining game";
      showAlert("error", errorMessage);
    }
  });
}

if (createBtn) {
  createBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();

    if (!username) {
      alert("Please enter username");
      return;
    }

    const data = { username };
    const url = "http://localhost:4000/api/v1/gameSession/create";
    const method = "POST";

    enterGame(data, url, method);
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
        url: `http://localhost:4000/api/v1/gameSession/${gameCode}/start`,
      });

      console.log(response);
    } catch (err) {
      console.error("Join game error:", err);
      const errorMessage = err.response?.data?.message || "Error joining game";
      showAlert("error", errorMessage);
    }
  });
}
