import { h } from "../../utils/dom.js";
import { pageHeader } from "../../components/common/PageHeader.js";
import { optionGroup } from "../../components/common/OptionGroup.js";
import { levelLabel } from "../profile/profileStore.js";
import { mountGameScreen } from "../play/GameScreen.js";

const DIFFICULTIES = [
  { value: "auto", label: "Auto (adaptive)" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];
const settings = { difficulty: "auto" };
const difficultyLabel = () => DIFFICULTIES.find((item) => item.value === settings.difficulty).label;

export function createTestPages(profile) {
  return {
    home(params, page) {
      const note = h("p", { class: "muted" });
      const paint = () => {
        note.textContent =
          settings.difficulty === "auto"
            ? `Difficulty will adjust automatically as your progress grows. Your starting point: ${levelLabel(profile.level)}.`
            : `Difficulty is fixed at ${difficultyLabel()}.`;
      };
      paint();
      page.append(
        pageHeader({ title: "Test", subtitle: "Put what you've learned to the test." }),
        h(
          "section",
          { class: "card narrow" },
          h("div", { class: "setting" }, h("h3", {}, "Difficulty"), optionGroup(DIFFICULTIES, settings.difficulty, (value) => { settings.difficulty = value; paint(); }), h("div", { style: "margin-top:14px" }, note)),
          h("button", { class: "btn inline", type: "button", onclick: () => (location.hash = "#/test/play") }, "Start test"),
        ),
      );
    },

    play(params, page) {
      return mountGameScreen(page, {
        title: "Test",
        subtitle: `Difficulty: ${difficultyLabel()}`,
        back: { href: "#/test", label: "Test setup" },
        withPanel: true,
        game: { label: `Test · ${difficultyLabel()}`, players: { white: "White", black: "Black" }, showPlayers: false, youPlayed: "both" },
      });
    },
  };
}
