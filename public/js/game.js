const socket = io("http://localhost:4000");
const gameCode = document.getElementById("game-container").dataset.gamecode;
console.log(gameCode);

socket.on("connect", () => {
  socket.emit("joinRoom", { gameCode });
  console.log("Joined room:", gameCode);
});

socket.on("userJoined", (data) => {
  console.log(`${data.username} joined the game 🎮`);

  const updatesDiv = document.getElementById("game-updates");
  const update = document.createElement("p");
  update.textContent = `${data.username} joined the game 🎮`;
  updatesDiv.appendChild(update);
  setTimeout(() => {
    update.remove();
  }, 3000);

  const playerList = document.querySelector(".player-list");
  const player = document.createElement("li");
  player.textContent = `${data.username} - ${data.score}`;
  player.classList.add("player-item");
  playerList.appendChild(player);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
