import { parseFenPlacement } from "../../utils/fen.js";
import { h } from "../../utils/dom.js";

// Filled glyphs for both colors; CSS decides white vs black. \uFE0E forces text (not emoji) style.
export const GLYPHS = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const FILES = "abcdefgh";
const DRAG_THRESHOLD_PX = 6;

function labels(items) {
  return items.map((text) => h("span", {}, String(text)));
}

const squareAt = (x, y) => document.elementFromPoint(x, y)?.closest?.(".square") ?? null;

/**
 * A "dumb" board: draws whatever it is told to and reports what the player does. It knows no chess rules.
 *  - onSquareClick(square)
 *  - onDragStart(square) -> true if that piece may be dragged (the controller decides)
 *  - onDrop(from, to)    -> `to` is null when dropped outside the board / cancelled
 */
export function createChessboard({ onSquareClick, onDragStart = () => false, onDrop = () => {} }) {
  const ranks = h("div", { class: "rank-labels" });
  const files = h("div", { class: "file-labels" });
  const board = h("div", { class: "board" });
  const frame = h("div", { class: "board-frame" }, ranks, board, files);

  let pending = null; // pointer is down on a draggable piece
  let ghost = null; // floating copy of the piece, exists only while really dragging
  let hovered = null;
  let dragFrom = null;
  let suppressClick = false;

  board.addEventListener("click", (event) => {
    if (suppressClick) return;
    const square = event.target.closest(".square");
    if (square) onSquareClick(square.dataset.square);
  });

  board.addEventListener("pointerdown", (event) => {
    if (pending || (event.pointerType === "mouse" && event.button !== 0)) return;
    const squareEl = event.target.closest(".square");
    const pieceEl = squareEl?.querySelector(".piece");
    if (!pieceEl) return;
    const info = { square: squareEl.dataset.square, glyph: pieceEl.textContent, className: pieceEl.className };
    if (!onDragStart(info.square)) return;
    pending = { ...info, pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    board.setPointerCapture(event.pointerId);
  });

  board.addEventListener("pointermove", (event) => {
    if (!pending || event.pointerId !== pending.pointerId) return;
    if (!ghost) {
      if (Math.hypot(event.clientX - pending.x, event.clientY - pending.y) < DRAG_THRESHOLD_PX) return;
      dragFrom = pending.square;
      ghost = h("span", { class: `${pending.className} drag-ghost` }, pending.glyph);
      document.body.append(ghost);
      board.querySelector(`[data-square="${dragFrom}"] .piece`)?.classList.add("drag-source");
    }
    ghost.style.left = `${event.clientX}px`;
    ghost.style.top = `${event.clientY}px`;
    const over = squareAt(event.clientX, event.clientY);
    if (over !== hovered) {
      hovered?.classList.remove("drag-over");
      over?.classList.add("drag-over");
      hovered = over;
    }
  });

  function endDrag(event, cancelled) {
    if (!pending || event.pointerId !== pending.pointerId) return;
    const from = pending.square;
    const dragging = Boolean(ghost);
    const to = dragging && !cancelled ? squareAt(event.clientX, event.clientY)?.dataset.square ?? null : null;

    ghost?.remove();
    ghost = null;
    hovered?.classList.remove("drag-over");
    hovered = null;
    dragFrom = null;
    board.querySelector(".drag-source")?.classList.remove("drag-source");
    try {
      board.releasePointerCapture(pending.pointerId);
    } catch {}
    pending = null;

    if (dragging) {
      suppressClick = true; // the browser may still send a click after a drag
      setTimeout(() => (suppressClick = false), 0);
      onDrop(from, to);
    }
  }
  board.addEventListener("pointerup", (event) => endDrag(event, false));
  board.addEventListener("pointercancel", (event) => endDrag(event, true));

  // Red flash + shake for an illegal move attempt.
  function flash(square) {
    board.querySelector(`[data-square="${square}"]`)?.classList.add("illegal");
    board.classList.add("shake");
    setTimeout(() => {
      board.querySelector(".illegal")?.classList.remove("illegal");
      board.classList.remove("shake");
    }, 600);
  }

  function render({ fen, orientation = "white", selected = null, targets = [], lastMove = null, checkSquare = null }) {
    const grid = parseFenPlacement(fen); // row 0 = rank 8, col 0 = file a
    const flipped = orientation === "black";
    const order = [0, 1, 2, 3, 4, 5, 6, 7];
    const rowOrder = flipped ? [...order].reverse() : order;
    const colOrder = flipped ? [...order].reverse() : order;
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

        const square = h("div", { class: classes.join(" "), "data-square": name });
        const cell = grid[row][col];
        if (cell) {
          square.append(h("span", { class: `piece ${cell.color}${name === dragFrom ? " drag-source" : ""}` }, `${GLYPHS[cell.type]}\uFE0E`));
        }
        squares.push(square);
      }
    }
    board.replaceChildren(...squares);
    ranks.replaceChildren(...labels(rowOrder.map((row) => 8 - row)));
    files.replaceChildren(...labels(colOrder.map((col) => FILES[col].toUpperCase())));
  }

  return { element: frame, render, flash };
}
