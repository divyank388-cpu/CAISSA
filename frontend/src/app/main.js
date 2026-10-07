import { createChessboard } from "../components/chessboard/Chessboard.js";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

document.getElementById("board-mount").append(createChessboard(START_FEN));
