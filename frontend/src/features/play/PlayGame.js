import { Chess } from "../../services/chessEngine.js";
import * as api from "../../services/gameApi.js";
import { createChessboard } from "../../components/chessboard/Chessboard.js";
import { askPromotion } from "../../components/common/PromotionDialog.js";
import { findKingSquare } from "../../utils/fen.js";
import { h } from "../../utils/dom.js";
import { addMatch } from "../../services/matchHistory.js";
import { createGameControls } from "./GameControls.js";

const OFFLINE_NOTICE = "Server not reachable: playing with chess.js only (python-chess is not checking moves).";

// Compare only placement, side to move and castling: clocks and en-passant formatting can differ.
const fenCore = (fen) => fen.split(" ").slice(0, 3).join(" ");
const colourName = (c) => (c === "w" ? "white" : "black");

function formatTime(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function drawReason(game) {
  if (game.isStalemate()) return "stalemate";
  if (game.isInsufficientMaterial()) return "insufficient material";
  if (game.isThreefoldRepetition()) return "threefold repetition";
  if (game.isDraw()) return "fifty-move rule";
  return null;
}

function describeStatus(game, timedOut) {
  const turn = colourName(game.turn());
  const side = turn === "white" ? "White" : "Black";
  const other = turn === "white" ? "Black" : "White";
  if (timedOut) return { message: `Time out: ${timedOut === "white" ? "Black" : "White"} wins`, turn, over: true };
  if (game.isCheckmate()) return { message: `Checkmate: ${other} wins`, turn, over: true };
  const reason = drawReason(game);
  if (reason) return { message: `Draw: ${reason}`, turn, over: true };
  if (game.inCheck()) return { message: `${side} to move: check!`, turn, over: false };
  return { message: `${side} to move`, turn, over: false };
}

function createPlayerBar(withClock) {
  const dot = h("span", { class: "pb-dot" });
  const name = h("span", { class: "pb-name" });
  const time = withClock ? h("span", { class: "pb-clock" }) : null;
  const element = h("div", { class: "player-bar" }, dot, name, time);
  return {
    element,
    update({ colour, label, ms, active }) {
      dot.className = `pb-dot ${colour}`;
      name.textContent = label;
      if (time) {
        time.textContent = formatTime(ms);
        time.classList.toggle("low", ms < 20000);
      }
      element.classList.toggle("active", active);
    },
  };
}

/**
 * Mounts a playable board into `root` and returns a cleanup function.
 * options: { orientation, clock: {minutes, increment}|null, players: {white, black},
 *            showPlayers, label, youPlayed: "white"|"black"|"both" }
 */
export function mountPlayGame(root, options = {}) {
  const {
    orientation: startOrientation = "white",
    clock = null,
    players = { white: "White", black: "Black" },
    showPlayers = false,
    label = "Game",
    youPlayed = "both",
  } = options;

  const game = new Chess(); // chess.js: instant legal-move feedback for the UI
  let gameId = null; // the matching python-chess game on the server
  let online = false;
  let selected = null;
  let busy = true; // until the server game exists
  let destroyed = false;
  let orientation = startOrientation;
  let clocks = null;
  let lastTick = Date.now();
  let timerId = null;
  let timedOut = null;
  let recorded = false;

  const controls = createGameControls({ onNewGame: newGame, onUndo: undo, onFlip: flip });
  const board = createChessboard({ onSquareClick: squareClicked });
  const topBar = showPlayers ? createPlayerBar(Boolean(clock)) : null;
  const bottomBar = showPlayers ? createPlayerBar(Boolean(clock)) : null;
  const boardParts = [...(topBar ? [topBar.element] : []), board.element, ...(bottomBar ? [bottomBar.element] : [])];
  if (options.controlsRoot) {
    root.append(...boardParts);
    options.controlsRoot.append(controls.statusElement, controls.noticeElement, controls.actionsElement);
  } else {
    root.append(controls.statusElement, ...boardParts, controls.noticeElement, controls.actionsElement);
  }

  const isOver = () => game.isGameOver() || Boolean(timedOut);

  // ---- clock ----
  function resetClocks() {
    timedOut = null;
    recorded = false;
    clocks = clock ? { w: clock.minutes * 60000, b: clock.minutes * 60000 } : null;
    lastTick = Date.now();
  }

  function tick() {
    if (destroyed) return stopTimer();
    const now = Date.now();
    if (clocks && !timedOut && game.history().length > 0 && !game.isGameOver()) {
      const side = game.turn();
      clocks[side] -= now - lastTick;
      if (clocks[side] <= 0) {
        clocks[side] = 0;
        timedOut = colourName(side);
        lastTick = now;
        render();
        return;
      }
    }
    lastTick = now;
    renderBars();
  }

  function stopTimer() {
    clearInterval(timerId);
    timerId = null;
  }

  // ---- drawing ----
  function renderBars() {
    if (!topBar) return;
    const bottomColour = orientation;
    const topColour = orientation === "white" ? "black" : "white";
    const running = !isOver() && game.history().length > 0;
    for (const [bar, colour] of [[topBar, topColour], [bottomBar, bottomColour]]) {
      const key = colour === "white" ? "w" : "b";
      bar.update({
        colour,
        label: players[colour],
        ms: clocks ? clocks[key] : 0,
        active: running ? colourName(game.turn()) === colour : !isOver() && game.turn() === key,
      });
    }
  }

  function render() {
    const history = game.history({ verbose: true });
    const last = history[history.length - 1];
    board.render({
      fen: game.fen(),
      orientation,
      selected,
      targets: selected ? game.moves({ square: selected, verbose: true }) : [],
      lastMove: last ? { from: last.from, to: last.to } : null,
      checkSquare: game.inCheck() ? findKingSquare(game.fen(), colourName(game.turn())) : null,
    });
    controls.setStatus(describeStatus(game, timedOut));
    controls.setUndoEnabled(history.length > 0 && !busy && !isOver());
    renderBars();
    maybeRecord();
  }

  function maybeRecord() {
    if (recorded || !isOver()) return;
    recorded = true;
    let result = "1/2-1/2";
    let reason = drawReason(game) ?? "Draw";
    if (timedOut) {
      result = timedOut === "white" ? "0-1" : "1-0";
      reason = "Time out";
    } else if (game.isCheckmate()) {
      result = game.turn() === "w" ? "0-1" : "1-0";
      reason = "Checkmate";
    }
    addMatch({
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      label,
      white: players.white,
      black: players.black,
      youPlayed,
      result,
      reason: reason.charAt(0).toUpperCase() + reason.slice(1),
      moves: game.history(),
    });
  }

  // ---- server sync ----
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
      controls.setNotice("");
    } catch {
      goOffline();
    }
  }

  // ---- interaction ----
  async function squareClicked(square) {
    if (busy || destroyed || isOver()) return;
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
      if (timedOut) return; // time ran out while waiting
      tick(); // settle the mover's elapsed time first
      if (timedOut) return;
      const mover = game.turn();
      game.move({ from, to, promotion });
      if (clocks) {
        clocks[mover] += clock.increment * 1000;
        lastTick = Date.now();
      }
      verify(state);
    } catch (error) {
      controls.setNotice(error.message);
    } finally {
      selected = null;
      busy = false;
      if (!destroyed) render();
    }
  }

  async function undo() {
    if (busy || game.history().length === 0 || isOver()) return;
    busy = true;
    try {
      await backend((id) => api.undoMove(id));
      game.undo();
    } catch (error) {
      controls.setNotice(error.message);
    } finally {
      selected = null;
      busy = false;
      if (!destroyed) render();
    }
  }

  async function newGame() {
    if (busy) return;
    if (game.history().length > 0 && !isOver() && !window.confirm("Start a new game? The current game will be lost.")) return;
    busy = true;
    game.reset();
    selected = null;
    orientation = startOrientation;
    resetClocks();
    await startServerGame();
    busy = false;
    if (!destroyed) render();
  }

  function flip() {
    orientation = orientation === "white" ? "black" : "white";
    render();
  }

  // ---- start ----
  resetClocks();
  render();
  if (clocks) timerId = setInterval(tick, 200);
  startServerGame().then(() => {
    busy = false;
    if (!destroyed) render();
  });

  return () => {
    destroyed = true;
    stopTimer();
  };
}
