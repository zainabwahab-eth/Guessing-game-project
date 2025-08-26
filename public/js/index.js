const createBtn = document.getElementById("create-btn");
const joinBtn = document.getElementById("join-btn");

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
    alert("error", "Error onboarding please try agin later");
  }
};

if (joinBtn) {
  joinBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const userGameCode = document.getElementById("gamecode").value;

    const data = { username };
    const url = `http://localhost:4000/api/v1/gameSession/${userGameCode}/join`;
    const method = "PATCH";

    enterGame(data, url, method);
    document.getElementById("username").value = "";
    document.getElementById("gamecode").value = "";
  });
}

if (createBtn) {
  createBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;

    const data = { username };
    const url = "http://localhost:4000/api/v1/gameSession/create";
    const method = "POST";

    enterGame(data, url, method);
    document.getElementById("username").value = "";
  });
}
