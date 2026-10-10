import { h } from "../../utils/dom.js";
import { rookMarkSvg } from "../../components/common/Logo.js";
import { LEVELS, saveProfile } from "./profileStore.js";

// First-run questions. Resolves with the saved profile.
export function runOnboarding() {
  return new Promise((resolve) => {
    const card = h("div", { class: "onboarding-card" });
    const overlay = h("div", { class: "onboarding" }, card);
    document.body.append(overlay);

    const answers = { name: "", level: null };
    const mark = h("div", { class: "onboarding-mark", html: rookMarkSvg() });

    function nameStep() {
      const input = h("input", { class: "field", type: "text", maxlength: "24", placeholder: "Your name", autocomplete: "given-name" });
      const next = h("button", { class: "btn", type: "button", disabled: true }, "Continue");
      const go = () => {
        if (!answers.name) return;
        levelStep();
      };
      input.addEventListener("input", () => {
        answers.name = input.value.trim();
        next.disabled = !answers.name;
      });
      input.addEventListener("keydown", (event) => event.key === "Enter" && go());
      next.addEventListener("click", go);
      card.replaceChildren(
        mark,
        h("h1", {}, "Welcome to CAISSA"),
        h("p", { class: "lead" }, "A chess coach that teaches you how to think. First, what should we call you?"),
        input,
        next,
      );
      input.focus();
    }

    function levelStep() {
      const finish = h("button", { class: "btn", type: "button", disabled: true }, "Enter CAISSA");
      const options = LEVELS.map((level) =>
        h(
          "button",
          {
            type: "button",
            class: "level-option",
            onclick: (event) => {
              answers.level = level.id;
              options.forEach((option) => option.classList.remove("active"));
              event.currentTarget.classList.add("active");
              finish.disabled = false;
            },
          },
          h("strong", {}, level.label),
          h("span", {}, level.blurb),
        ),
      );
      finish.addEventListener("click", () => {
        const profile = { name: answers.name, level: answers.level, createdAt: new Date().toISOString() };
        saveProfile(profile);
        overlay.classList.add("leaving");
        setTimeout(() => {
          overlay.remove();
          resolve(profile);
        }, 500);
      });
      card.replaceChildren(
        mark,
        h("h1", {}, `Nice to meet you, ${answers.name}`),
        h("p", { class: "lead" }, "How much chess do you know? We'll use this to set your starting level."),
        h("div", { class: "level-list" }, options),
        finish,
      );
    }

    nameStep();
  });
}
