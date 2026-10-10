import { h } from "../utils/dom.js";
import { ICONS } from "../components/common/Icons.js";
import { rookMarkSvg } from "../components/common/Logo.js";
import { levelLabel } from "../features/profile/profileStore.js";

const NAV = [
  { href: "#/", label: "Dashboard", icon: "home", base: "/" },
  { href: "#/play", label: "Play with a friend", icon: "users", base: "/play" },
  { href: "#/learn", label: "Learn", icon: "book", base: "/learn" },
  { href: "#/test", label: "Test", icon: "target", base: "/test" },
];

// The permanent frame: left menu + content area.
export function createShell(profile) {
  const links = NAV.map((item) =>
    h("a", { class: "nav-link", href: item.href }, h("span", { class: "icon", html: ICONS[item.icon] }), h("span", { class: "nav-label" }, item.label)),
  );

  const sidebar = h(
    "aside",
    { class: "sidebar" },
    h("a", { class: "brand", href: "#/" }, h("span", { class: "brand-mark", html: rookMarkSvg() }), h("span", { class: "brand-name" }, "CAISSA")),
    h("nav", { class: "nav" }, links),
    h(
      "div",
      { class: "user-card" },
      h("span", { class: "avatar" }, profile.name.charAt(0).toUpperCase()),
      h("div", { class: "user-meta" }, h("strong", {}, profile.name), h("span", {}, levelLabel(profile.level))),
    ),
  );

  const outlet = h("main", { class: "content" });

  return {
    element: h("div", { class: "shell" }, sidebar, outlet),
    outlet,
    setActive(path) {
      NAV.forEach((item, index) => {
        const active = item.base === "/" ? path === "/" : path.startsWith(item.base);
        links[index].classList.toggle("active", active);
      });
    },
  };
}
