import { h } from "../../utils/dom.js";

export function pageHeader({ title, subtitle, back, compact = false }) {
  return h(
    "header",
    { class: `page-header${compact ? " compact" : ""}` },
    back ? h("a", { class: "back-link", href: back.href }, `← ${back.label ?? "Back"}`) : null,
    h("h1", {}, title),
    subtitle ? h("p", { class: "subtitle" }, subtitle) : null,
  );
}
