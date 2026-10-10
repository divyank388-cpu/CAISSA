import { h } from "../../utils/dom.js";
import { logoSvg } from "./Logo.js";

// Full-screen logo shown while the app starts. Resolves once it has faded out.
export function showSplash(durationMs = 2600) {
  const element = h(
    "div",
    { class: "splash" },
    h("div", { class: "splash-logo", html: logoSvg({ animated: true }) }),
    h("div", { class: "splash-name" }, "CAISSA"),
    h("div", { class: "splash-tag" }, "Learn to think, not just to play"),
    h("div", { class: "splash-bar" }, h("span")),
  );
  document.body.append(element);
  return new Promise((resolve) => {
    setTimeout(() => {
      element.classList.add("hide");
      setTimeout(() => {
        element.remove();
        resolve();
      }, 700);
    }, durationMs);
  });
}
