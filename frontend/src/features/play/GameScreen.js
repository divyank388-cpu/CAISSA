import { h } from "../../utils/dom.js";
import { pageHeader } from "../../components/common/PageHeader.js";

// A page with the playable board (and optionally the empty explainer panel). Returns a cleanup function.
// The board code is loaded on demand so the rest of the app still works if chess.js can't be fetched.
export function mountGameScreen(page, { title, subtitle, back, withPanel = false, game }) {
  const boardArea = h("section", { class: "board-area" });
  // Without the explainer panel (friend matches) the status and buttons live in a side card.
  const side = withPanel ? null : h("aside", { class: "game-side" });
  page.append(
    pageHeader({ title, subtitle, back, compact: true }),
    h("div", { class: "game-row" }, boardArea, withPanel ? h("aside", { class: "teacher-panel", "aria-label": "Explainer panel" }) : side),
  );

  let stop = null;
  let closed = false;
  import("./PlayGame.js")
    .then(({ mountPlayGame }) => {
      if (!closed) stop = mountPlayGame(boardArea, { ...game, controlsRoot: side });
    })
    .catch((error) => {
      console.error(error);
      boardArea.replaceChildren(h("div", { class: "load-error" }, "Couldn't load the chess board. Check your internet connection (chess.js loads from a CDN) and reload the page."));
    });

  return () => {
    closed = true;
    stop?.();
  };
}
