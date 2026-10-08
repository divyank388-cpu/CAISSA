function button(label, onClick) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.addEventListener("click", onClick);
  return element;
}

// Status line above the board, notice + action buttons below it.
export function createGameControls({ onNewGame, onUndo, onFlip }) {
  const statusElement = document.createElement("div");
  statusElement.className = "game-status";
  const dot = document.createElement("span");
  dot.className = "turn-dot";
  const text = document.createElement("span");
  statusElement.append(dot, text);

  const noticeElement = document.createElement("div");
  noticeElement.className = "game-notice";

  const actionsElement = document.createElement("div");
  actionsElement.className = "game-actions";
  const undoButton = button("Undo", onUndo);
  actionsElement.append(button("New game", onNewGame), undoButton, button("Flip board", onFlip));

  return {
    statusElement,
    noticeElement,
    actionsElement,
    setStatus({ message, turn, over }) {
      text.textContent = message;
      dot.className = `turn-dot ${turn}${over ? " over" : ""}`;
    },
    setNotice(message) {
      noticeElement.textContent = message;
    },
    setUndoEnabled(enabled) {
      undoButton.disabled = !enabled;
    },
  };
}
