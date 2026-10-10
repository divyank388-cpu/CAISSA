import { h } from "../utils/dom.js";

// "/learn/openings/:colour" style matching. Returns params, or null if the path doesn't match.
export function matchPath(pattern, path) {
  const patternParts = pattern.split("/");
  const pathParts = path.split("/");
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    if (patternParts[i].startsWith(":")) params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    else if (patternParts[i] !== pathParts[i]) return null;
  }
  return params;
}

// routes: [[pattern, handler(params, pageElement) -> optional cleanup function]]
export function createRouter(outlet, routes, onChange) {
  let cleanup = null;
  let current = 0;

  async function navigate() {
    const token = (current += 1);
    const path = location.hash.slice(1).replace(/\/+$/, "") || "/";
    cleanup?.();
    cleanup = null;
    const page = h("div", { class: "page" });
    outlet.replaceChildren(page);
    window.scrollTo(0, 0);

    for (const [pattern, handler] of routes) {
      const params = matchPath(pattern, path);
      if (!params) continue;
      onChange(path);
      const result = await handler(params, page);
      if (token !== current) result?.(); // user already moved on: clean up straight away
      else cleanup = result ?? null;
      return;
    }
    location.hash = "#/";
  }

  window.addEventListener("hashchange", navigate);
  return { start: navigate };
}
