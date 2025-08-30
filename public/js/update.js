export const showUpdate = (msg) => {
  const updatesDiv = document.getElementById("game-updates");
  const update = document.createElement("p");
  update.textContent = msg;
  updatesDiv.appendChild(update);
  setTimeout(() => {
    update.remove();
  }, 3000);
};
