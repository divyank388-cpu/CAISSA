import { Chess } from "../../services/chessEngine.js";
import * as api from "../../services/gameApi.js";
import { createChessboard } from "../../components/chessboard/Chessboard.js";
import { askPromotion } from "../../components/common/PromotionDialog.js";
import { findKingSquare } from "../../utils/fen.js";
import { createGameControls } from "./GameControls.js";

const STORAGE_KEY = "chess-learning-app:game-id";
const OFFLINE_NOTICE = "Server not reachable: playing with chess.js only (python-chess is not checking moves).";

// Compare only placement, side to move and castling: clocks and en-passant formatting can differ.
const fenCore = (fen) => fen.split(" ").slice(0, 3).join(" ");

function describeStatus(game) {
  const turn = game.turn() === "w" ? "white" : "black";
  const side = turn === "white" ? "White" : "Black";
  const other = turn === "white" ? "Black" : "White";
  if (game.isCheckmate()) return { message: `Checkmate: ${other} wins`, turn, over: true };
  if (game.isStalemate()) return { message: "Draw by stalemate", turn, over: true };
  if (game.isInsufficientMaterial()) return { message: "Draw: insufficient material", turn, over: true };
  if (game.isThreefoldRepetition()) return { message: "Draw by threefold repetition", turn, over: true };
  if (game.isDraw()) return { message: "Draw by the fifty-move rule", turn, over: true };
  if (game.inCheck()) return { message: `${side} to move: check!`, turn, over: false };
  return { message: `${side} to move`, turn, over: false };
}

export async function mountPlayGame(root) {
  const game = new Chess(); // chess.js: instant legal-move feedback for the UI
  let gameId = null; // the matching python-chess game on the server
  let online = false;
  let selected = null;
  let busy = false;
  let orientation = "white";

  const controls = createGameControls({ onNewGame: newGame, onUndo: undo, onFlip: flip });
  const board = createChessboard({ onSquareClick: squareClicked });
  root.append(controls.statusElement, board.element, controls.noticeElement, controls.actionsElement);

  function render() {
    const history = game.history({ verbose: true });
    const last = history[history.length - 1];
    board.render({
      fen: game.fen(),
      orientation,
      selected,
      targets: selected ? game.moves({ square: selected, verbose: true }) : [],
      lastMove: last ? { from: last.from, to: last.to } : null,
      checkSquare: game.inCheck() ? findKingSquare(game.fen(), game.turn() === "w" ? "white" : "black") : null,
    });
    controls.setStatus(describeStatus(game));
    controls.setUndoEnabled(history.length > 0 && !busy);
  }

  // Runs a server call. Returns null when offline (play continues with chess.js only).
  async function backend(call) {
    if (!online || !gameId) return null;
    try {
      return await call(gameId);
    } catch (error) {
      if (error instanceof api.BackendOfflineError) {
        goOffline();
        return null;
      }
      throw error;
    }
  }

  function goOffline() {
    online = false;
    gameId = null;
    controls.setNotice(OFFLINE_NOTICE);
  }

  function verify(state) {
    if (state && fenCore(state.fen) !== fenCore(game.fen())) {
      game.load(state.fen);
      controls.setNotice("Board re-synced with the server.");
    }
  }

  async function startServerGame() {
    try {
      const state = await api.createGame();
      gameId = state.id;
      online = true;
      localStorage.setItem(STORAGE_KEY, gameId);
      controls.setNotice("");
    } catch {
      goOffline();
    }
  }

  async function restoreOrStart() {
    let savedId = null;
    try {
      savedId = localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (savedId) {
      try {
        const state = await api.getGame(savedId);
        for (const uci of state.uci_moves) {
          game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
        }
        gameId = state.id;
        online = true;
        return;
      } catch {
        game.reset(); // saved game is gone (e.g. server restarted): start fresh
      }
    }
    await startServerGame();
  }

  async function squareClicked(square) {
    if (busy || game.isGameOver()) return;
    if (selected) {
      const candidates = game.moves({ square: selected, verbose: true }).filter((move) => move.to === square);
      if (candidates.length) {
        await attemptMove(selected, square, candidates);
        return;
      }
    }
    const piece = game.get(square);
    selected = piece && piece.color === game.turn() ? square : null;
    render();
  }

  async function attemptMove(from, to, candidates) {
    let promotion;
    if (candidates.some((move) => move.promotion)) {
      promotion = await askPromotion(game.turn());
      if (!promotion) return;
    }
    busy = true;
    try {
      const state = await backend((id) => api.playMove(id, `${from}${to}${promotion ?? ""}`));
      game.move({ from, to, promotion });
      verify(state);
    } catch (error) {
      controls.setNotice(error.message);
    } finally {
      selected = null;
      busy = false;
      render();
    }
  }

  async function undo() {
    if (busy || game.history().length === 0) return;
    busy = true;
    try {
      await backend((id) => api.undoMove(id));
      game.undo();
    } catch (error) {
      controls.setNotice(error.message);
    } finally {
      selected = null;
      busy = false;
      render();
    }
  }

  async function newGame() {
    if (busy) return;
    const inProgress = game.history().length > 0 && !game.isGameOver();
    if (inProgress && !window.confirm("Start a new game? The current game will be lost.")) return;
    busy = true;
    game.reset();
    selected = null;
    orientation = "white";
    await startServerGame();
    busy = false;
    render();
  }

  function flip() {
    orientation = orientation === "white" ? "black" : "white";
    render();
  }

  await restoreOrStart();
  render();
}
