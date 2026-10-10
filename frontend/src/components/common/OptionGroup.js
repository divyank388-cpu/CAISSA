import { h } from "../../utils/dom.js";

// A row of selectable pills. options: [{ value, label, glyph? }]
export function optionGroup(options, value, onChange) {
  const group = h("div", { class: "pill-group", role: "group" });
  const paint = () =>
    group.replaceChildren(
      ...options.map((option) =>
        h(
          "button",
          {
            type: "button",
            class: `pill${option.value === value ? " active" : ""}`,
            onclick: () => {
              value = option.value;
              onChange(value);
              paint();
            },
          },
          option.glyph ? h("span", { class: "pill-glyph" }, option.glyph) : null,
          option.label,
        ),
      ),
    );
  paint();
  return group;
}
