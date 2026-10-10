import { Chess } from "../../services/chessEngine.js";
import * as api from "../../services/gameApi.js";
import { createChessboard } from "../../components/chessboard/Chessboard.js";
import { askPromotion } from "../../components/common/PromotionDialog.js";
import { findKingSquare } from "../../utils/fen.js";
import { h } from "../../utils/dom.js";
import { addMatch, removeMatch } from "../../services/matchHistory.js";
import { createGameControls } from "./GameControls.js";

// Only developers running locally need to hear the server is missing. On a static deployment chess.js alone runs the game.
const IS_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
const OFFLINE_NOTICE = IS_LOCAL ? "Server not reachable: playing with chess.js only (python-chess is not checking moves)." : "";

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
  let recordedId = null;
  let overlayDismissed = false;
  let noticeTimer = null;

  const controls = createGameControls({ onNewGame: newGame, onUndo: undo, onFlip: flip });
  const board = createChessboard({ onSquareClick: squareClicked, onDragStart: dragStarted, onDrop: dropped });
  const topBar = showPlayers ? createPlayerBar(Boolean(clock)) : null;
  const bottomBar = showPlayers ? createPlayerBar(Boolean(clock)) : null;
  const boardParts = [...(topBar ? [topBar.element] : []), board.element, ...(bottomBar ? [bottomBar.element] : [])];
  if (options.controlsRoot) {
    root.append(...boardParts);
    options.controlsRoot.append(controls.statusElement, controls.noticeElement, controls.actionsElement);
  } else {
    root.append(controls.statusElement, ...boardParts, controls.noticeElement, controls.actionsElement);
  }

  const overlayTitle = h("h2", {});
  const overlayDetail = h("p", {});
  const overlay = h(
    "div",
    { class: "game-over", role: "dialog", "aria-live": "polite" },
    h(
      "div",
      { class: "game-over-card" },
      overlayTitle,
      overlayDetail,
      h(
        "div",
        { class: "game-over-actions" },
        h("button", { class: "btn inline", type: "button", onclick: () => newGame() }, "New game"),
        h("button", { class: "btn secondary inline", type: "button", onclick: () => { overlayDismissed = true; render(); } }, "Review board"),
      ),
    ),
  );
  board.element.append(overlay);

  const isOver = () => game.isGameOver() || Boolean(timedOut);

  const winText = (colour) => {
    const label = colour === "white" ? "White" : "Black";
    return players[colour] === label ? `${label} wins` : `${players[colour]} wins (${label})`;
  };

  // Uses chess.js to name the result: checkmate, stalemate, other draws, or time out.
  function outcomeText() {
    if (timedOut) return { title: "Time out", detail: winText(timedOut === "white" ? "black" : "white") };
    if (game.isCheckmate()) return { title: "Checkmate", detail: winText(game.turn() === "w" ? "black" : "white") };
    if (game.isStalemate()) return { title: "Stalemate", detail: "No legal moves and the king is not in check, so the game is a draw." };
    return { title: "Draw", detail: `Draw by ${drawReason(game)}.` };
  }

  function updateOverlay() {
    if (!isOver() || overlayDismissed) {
      overlay.classList.remove("show");
      return;
    }
    const { title, detail } = outcomeText();
    overlayTitle.textContent = title;
    overlayDetail.textContent = detail;
    overlay.classList.add("show");
  }

  // ---- clock ----
  function resetClocks() {
    timedOut = null;
    recorded = false;
    recordedId = null;
    overlayDismissed = false;
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
    controls.setUndoEnabled(history.length > 0 && !busy && !timedOut);
    renderBars();
    updateOverlay();
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
    recordedId = Date.now().toString(36);
    addMatch({
      id: recordedId,
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
  const baseNotice = () => (online ? "" : OFFLINE_NOTICE);

  function showTransientNotice(message) {
    controls.setNotice(message);
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      if (!destroyed) controls.setNotice(baseNotice());
    }, 4500);
  }

  // The player tried a move chess.js does not allow: snap back, flash, explain.
  function rejectMove(to) {
    render();
    board.flash(to);
    showTransientNotice(
      game.inCheck()
        ? "Illegal move: your king is in check. Deal with the check first."
        : `Illegal move: that piece can't go to ${to}, or it would leave your king in check.`,
    );
  }

  // Only the side to move may pick up a piece.
  function dragStarted(square) {
    if (busy || destroyed || isOver()) return false;
    const piece = game.get(square);
    if (!piece || piece.color !== game.turn()) return false;
    if (selected !== square) {
      selected = square;
      render();
    }
    return true;
  }

  async function dropped(from, to) {
    if (busy || destroyed) return;
    if (!to || to === from) {
      render(); // dropped outside the board or back where it came from
      return;
    }
    await tryMove(from, to);
  }

  async function squareClicked(square) {
    if (busy || destroyed || isOver()) return;
    const piece = game.get(square);
    const ownPiece = piece && piece.color === game.turn();
    if (selected && square !== selected && !ownPiece) {
      await tryMove(selected, square);
      return;
    }
    selected = ownPiece && square !== selected ? square : null;
    render();
  }

  // chess.js decides whether the move is legal; python-chess confirms it in attemptMove.
  async function tryMove(from, to) {
    const candidates = game.moves({ square: from, verbose: true }).filter((move) => move.to === to);
    if (!candidates.length) {
      rejectMove(to);
      return;
    }
    await attemptMove(from, to, candidates);
  }

  async function attemptMove(from, to, candidates) {
    let promotion;
    if (candidates.some((move) => move.promotion)) {
      promotion = await askPromotion(game.turn());
      if (!promotion) {
        render();
        return;
      }
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
      clearTimeout(noticeTimer);
      controls.setNotice(baseNotice());
      verify(state);
    } catch (error) {
      showTransientNotice(error.message);
    } finally {
      selected = null;
      busy = false;
      if (!destroyed) render();
    }
  }

  async function undo() {
    if (busy || game.history().length === 0 || timedOut) return;
    busy = true;
    try {
      await backend((id) => api.undoMove(id));
      game.undo();
      if (recorded) {
        removeMatch(recordedId); // undoing a checkmate/stalemate: the game is not over any more
        recorded = false;
        recordedId = null;
      }
      overlayDismissed = false;
    } catch (error) {
      showTransientNotice(error.message);
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
    clearTimeout(noticeTimer);
  };
}
