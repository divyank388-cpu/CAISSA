import { GLYPHS } from "../chessboard/Chessboard.js";

// Resolves with "q" | "r" | "b" | "n", or null if the player cancels.
export function askPromotion(color) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "promotion-overlay";
    const dialog = document.createElement("div");
    dialog.className = "promotion-dialog";

    const finish = (choice) => {
      overlay.remove();
      resolve(choice);
    };

    for (const type of ["q", "r", "b", "n"]) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `Promote to ${type}`);
      const piece = document.createElement("span");
      piece.className = `piece ${color === "w" ? "white" : "black"}`;
      piece.textContent = `${GLYPHS[type]}\uFE0E`;
      button.append(piece);
      button.addEventListener("click", () => finish(type));
      dialog.append(button);
    }

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) finish(null);
    });
    overlay.append(dialog);
    document.body.append(overlay);
  });
}
