import { h } from "../../utils/dom.js";
import { getMatches } from "../../services/matchHistory.js";
import { levelLabel } from "../profile/profileStore.js";

const SKILLS = [
  "Tactical vision", "Calculation", "Candidate moves", "Opening understanding",
  "Position evaluation", "King safety", "Endgame knowledge", "Decision speed",
];

// "win" | "loss" | "draw" from the profile owner's point of view, or null if they played both sides.
export function outcomeFor(match) {
  if (match.youPlayed !== "white" && match.youPlayed !== "black") return null;
  if (match.result === "1/2-1/2") return "draw";
  const winner = match.result === "1-0" ? "white" : "black";
  return winner === match.youPlayed ? "win" : "loss";
}

export function computeStats(matches) {
  let wins = 0, losses = 0, draws = 0, rated = 0;
  for (const match of matches) {
    const outcome = outcomeFor(match);
    if (!outcome) continue;
    rated += 1;
    if (outcome === "win") wins += 1;
    else if (outcome === "loss") losses += 1;
    else draws += 1;
  }
  return { games: matches.length, wins, losses, draws, winRate: rated ? `${Math.round((wins / rated) * 100)}%` : "—" };
}

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function resultText(match) {
  const outcome = outcomeFor(match);
  return outcome === "win" ? "Win" : outcome === "loss" ? "Loss" : outcome === "draw" ? "Draw" : match.result;
}

function analysisContent(match) {
  const pairs = [];
  for (let i = 0; i < match.moves.length; i += 2) pairs.push([i / 2 + 1, match.moves[i], match.moves[i + 1] ?? ""]);
  return [
    h("div", { class: "analysis-title" }, `${match.white} vs ${match.black}`),
    h("p", { class: "muted" }, `${match.label} · ${match.result} · ${match.reason}`),
    h("ol", { class: "move-list" }, pairs.map(([no, white, black]) => h("li", {}, h("span", { class: "no" }, `${no}.`), `${white} ${black}`))),
    h("p", { class: "muted" }, "Move-by-move engine analysis will appear here in a later update."),
  ];
}

export function createDashboardPage(profile) {
  return (params, page) => {
    const matches = getMatches();
    const stats = computeStats(matches);
    let selected = matches[0] ?? null;

    const analysisBody = h("div", {});
    const list = h("div", { class: "match-list" });

    const renderAnalysis = () =>
      analysisBody.replaceChildren(
        ...(selected ? analysisContent(selected) : [h("div", { class: "empty" }, "Finish a match and select it to review it here.")]),
      );

    const renderList = () =>
      list.replaceChildren(
        ...matches.map((match) =>
          h(
            "button",
            {
              class: `match-row${match === selected ? " active" : ""}`,
              type: "button",
              onclick: () => {
                selected = match;
                renderList();
                renderAnalysis();
              },
            },
            h("span", { class: "mr-date" }, formatDate(match.date)),
            h("span", {}, `${match.white} vs ${match.black}`),
            h("span", { class: "chip" }, match.label),
            h("span", { class: "mr-moves" }, `${Math.ceil(match.moves.length / 2)} moves`),
            h("span", { class: `badge ${outcomeFor(match) ?? "neutral"}` }, resultText(match)),
          ),
        ),
      );

    renderAnalysis();
    renderList();

    page.append(
      h(
        "header",
        { class: "page-header" },
        h("p", { class: "eyebrow" }, greeting()),
        h("h1", {}, profile.name),
        h("p", { class: "subtitle" }, `Level: ${levelLabel(profile.level)}`),
      ),
      h(
        "div",
        { class: "stat-grid" },
        [["Games played", stats.games], ["Wins", stats.wins], ["Draws", stats.draws], ["Win rate", stats.winRate]].map(([label, value]) =>
          h("div", { class: "stat" }, h("div", { class: "stat-value" }, String(value)), h("div", { class: "stat-label" }, label)),
        ),
      ),
      h(
        "div",
        { class: "dash-grid" },
        h(
          "section",
          { class: "card" },
          h("h2", {}, "Progress report"),
          h("p", { class: "card-sub" }, "Your skills across the learning modes"),
          SKILLS.map((name) =>
            h("div", { class: "skill" }, h("span", {}, name), h("div", { class: "bar" }, h("span", { style: "width:0%" })), h("span", { class: "skill-val" }, "—")),
          ),
          h("p", { class: "muted" }, "Skill tracking starts once Learn and Test are live."),
        ),
        h("section", { class: "card" }, h("h2", {}, "Match analysis"), h("p", { class: "card-sub" }, "Review a past match"), analysisBody),
      ),
      h(
        "section",
        { class: "card" },
        h("h2", {}, "Past matches"),
        h("p", { class: "card-sub" }, "Select a match to review it above"),
        matches.length
          ? list
          : h("div", { class: "empty" }, "No matches yet.", h("br"), h("a", { class: "back-link", href: "#/play" }, "Play a friend →")),
      ),
    );
  };
}
