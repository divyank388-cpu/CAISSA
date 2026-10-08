import { mountPlayGame } from "../features/play/PlayGame.js";

mountPlayGame(document.getElementById("board-mount")).catch((error) => {
  console.error(error);
  document.getElementById("board-mount").textContent =
    "Could not start the game. Check your internet connection (chess.js loads from a CDN) and the browser console.";
});
