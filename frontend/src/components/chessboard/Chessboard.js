import { parseFenPlacement } from "../../utils/fen.js";

// Filled glyphs for both colors; CSS decides white vs black. \uFE0E forces text (not emoji) style.
const GLYPHS = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const FILES = "ABCDEFGH";

function labelRow(items) {
  return items.map((text) => {
    const span = document.createElement("span");
    span.textContent = text;
    return span;
  });
}

export function createChessboard(fen) {
  const frame = document.createElement("div");
  frame.className = "board-frame";

  const ranks = document.createElement("div");
  ranks.className = "rank-labels";
  ranks.append(...labelRow([8, 7, 6, 5, 4, 3, 2, 1]));

  const files = document.createElement("div");
  files.className = "file-labels";
  files.append(...labelRow([...FILES]));

  const board = document.createElement("div");
  board.className = "board";
  parseFenPlacement(fen).forEach((row, rowIndex) => {
    row.forEach((cell, fileIndex) => {
      const square = document.createElement("div");
      const rank = 8 - rowIndex;
      square.className = `square ${(fileIndex + rank - 1) % 2 === 0 ? "dark" : "light"}`;
      square.dataset.square = `${FILES[fileIndex].toLowerCase()}${rank}`;
      if (cell) {
        const piece = document.createElement("span");
        piece.className = `piece ${cell.color}`;
        piece.textContent = `${GLYPHS[cell.type]}\uFE0E`;
        square.append(piece);
      }
      board.append(square);
    });
  });

  frame.append(ranks, board, files);
  return frame;
}
