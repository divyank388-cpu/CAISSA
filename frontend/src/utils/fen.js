// Display helper only: turns the piece-placement part of a FEN into an 8x8 grid.
// Row 0 is rank 8, column 0 is file a. Cells are null or { color, type }.
export function parseFenPlacement(fen) {
  return fen.split(" ")[0].split("/").map((row) => {
    const cells = [];
    for (const char of row) {
      if (/\d/.test(char)) {
        for (let i = 0; i < Number(char); i += 1) cells.push(null);
      } else {
        cells.push({ color: char === char.toUpperCase() ? "white" : "black", type: char.toLowerCase() });
      }
    }
    return cells;
  });
}

// Square name (e.g. "e1") of the given color's king, or null. color: "white" | "black".
export function findKingSquare(fen, color) {
  const grid = parseFenPlacement(fen);
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const cell = grid[row][col];
      if (cell && cell.type === "k" && cell.color === color) return `${"abcdefgh"[col]}${8 - row}`;
    }
  }
  return null;
}
