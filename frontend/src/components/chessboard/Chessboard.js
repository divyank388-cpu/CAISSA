import { parseFenPlacement } from "../../utils/fen.js";

// Filled glyphs for both colors; CSS decides white vs black. \uFE0E forces text (not emoji) style.
export const GLYPHS = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const FILES = "abcdefgh";

function labels(items) {
  return items.map((text) => {
    const span = document.createElement("span");
    span.textContent = text;
    return span;
  });
}

// A "dumb" board: draws whatever it is told to and reports clicks. It knows no chess rules.
export function createChessboard({ onSquareClick }) {
  const frame = document.createElement("div");
  frame.className = "board-frame";
  const ranks = document.createElement("div");
  ranks.className = "rank-labels";
  const files = document.createElement("div");
  files.className = "file-labels";
  const board = document.createElement("div");
  board.className = "board";
  frame.append(ranks, board, files);

  board.addEventListener("click", (event) => {
    const square = event.target.closest(".square");
    if (square) onSquareClick(square.dataset.square);
  });

  function render({ fen, orientation = "white", selected = null, targets = [], lastMove = null, checkSquare = null }) {
    const grid = parseFenPlacement(fen); // row 0 = rank 8, col 0 = file a
    const flipped = orientation === "black";
    const rowOrder = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const colOrder = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const targetMap = new Map(targets.map((move) => [move.to, move]));

    const squares = [];
    for (const row of rowOrder) {
      for (const col of colOrder) {
        const rank = 8 - row;
        const name = `${FILES[col]}${rank}`;
        const classes = ["square", (col + rank - 1) % 2 === 0 ? "dark" : "light"];
        if (name === selected) classes.push("selected");
        if (lastMove && (name === lastMove.from || name === lastMove.to)) classes.push("last-move");
        if (name === checkSquare) classes.push("check");
        const target = targetMap.get(name);
        if (target) classes.push("target");
        if (target && target.captured) classes.push("capture");

        const square = document.createElement("div");
        square.className = classes.join(" ");
        square.dataset.square = name;
        const cell = grid[row][col];
        if (cell) {
          const piece = document.createElement("span");
          piece.className = `piece ${cell.color}`;
          piece.textContent = `${GLYPHS[cell.type]}\uFE0E`;
          square.append(piece);
        }
        squares.push(square);
      }
    }
    board.replaceChildren(...squares);
    ranks.replaceChildren(...labels(rowOrder.map((row) => 8 - row)));
    files.replaceChildren(...labels(colOrder.map((col) => FILES[col].toUpperCase())));
  }

  return { element: frame, render };
}
