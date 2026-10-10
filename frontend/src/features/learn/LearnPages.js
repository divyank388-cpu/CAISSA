import { h } from "../../utils/dom.js";
import { pageHeader } from "../../components/common/PageHeader.js";
import { mountGameScreen } from "../play/GameScreen.js";
import { OPENINGS } from "./catalog.js";

const card = (href, glyph, title, text, line) =>
  h("a", { class: "choice-card", href }, h("span", { class: "choice-glyph" }, glyph), h("h3", {}, title), text ? h("p", {}, text) : null, line ? h("span", { class: "line" }, line) : null);

// A learning board: both sides are played by the learner; the explainer panel is reserved for the teacher.
const learnBoard = (page, { title, subtitle, back, label, orientation = "white" }) =>
  mountGameScreen(page, {
    title,
    subtitle,
    back,
    withPanel: true,
    game: { label, orientation, players: { white: "White", black: "Black" }, showPlayers: false, youPlayed: "both" },
  });

export const learnPages = {
  home(params, page) {
    page.append(
      pageHeader({ title: "Learn", subtitle: "Choose what you want to study." }),
      h(
        "div",
        { class: "choice-grid" },
        card("#/learn/openings", "♙\uFE0E", "OPENINGS", "Start strong with the first moves of the game."),
        card("#/learn/middlegames", "♞\uFE0E", "MIDDLEGAMES", "Plans, tactics and decisions in complex positions."),
        card("#/learn/endgames", "♚\uFE0E", "ENDGAMES", "Convert small advantages with precise technique."),
      ),
    );
  },

  openingColour(params, page) {
    page.append(
      pageHeader({ title: "Openings", subtitle: "Which side do you want to play?", back: { href: "#/learn", label: "Learn" } }),
      h(
        "div",
        { class: "choice-grid" },
        card("#/learn/openings/white", "♔\uFE0E", "White", "Openings for the side that moves first."),
        card("#/learn/openings/black", "♚\uFE0E", "Black", "Openings and defenses against 1.e4 and 1.d4."),
      ),
    );
  },

  openingList({ colour }, page) {
    const list = OPENINGS[colour];
    if (!list) {
      location.hash = "#/learn/openings";
      return;
    }
    page.append(
      pageHeader({ title: `Openings as ${colour === "white" ? "White" : "Black"}`, subtitle: "Choose an opening to study.", back: { href: "#/learn/openings", label: "Colour" } }),
      h("div", { class: "choice-grid opening-grid" }, list.map((opening) => card(`#/learn/openings/${colour}/${opening.id}`, colour === "white" ? "♙\uFE0E" : "♟\uFE0E", opening.name, null, opening.line)).map((c) => (c.classList.add("opening-card"), c))),
    );
  },

  openingBoard({ colour, id }, page) {
    const opening = OPENINGS[colour]?.find((item) => item.id === id);
    if (!opening) {
      location.hash = "#/learn/openings";
      return;
    }
    return learnBoard(page, {
      title: opening.name,
      subtitle: `Opening as ${colour === "white" ? "White" : "Black"}`,
      back: { href: `#/learn/openings/${colour}`, label: "Openings" },
      label: `Opening · ${opening.name}`,
      orientation: colour,
    });
  },

  middlegames(params, page) {
    return learnBoard(page, { title: "Middlegames", subtitle: "Practice on the board.", back: { href: "#/learn", label: "Learn" }, label: "Middlegame" });
  },

  endgames(params, page) {
    return learnBoard(page, { title: "Endgames", subtitle: "Practice on the board.", back: { href: "#/learn", label: "Learn" }, label: "Endgame" });
  },
};
