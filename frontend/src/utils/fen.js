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
