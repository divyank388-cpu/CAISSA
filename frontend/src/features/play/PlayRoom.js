import { h } from "../../utils/dom.js";
import { pageHeader } from "../../components/common/PageHeader.js";
import { optionGroup } from "../../components/common/OptionGroup.js";
import { ICONS } from "../../components/common/Icons.js";
import { mountGameScreen } from "./GameScreen.js";

const TIME_OPTIONS = [
  { value: "none", label: "No clock", minutes: 0, increment: 0 },
  { value: "3", label: "3 min", minutes: 3, increment: 0 },
  { value: "5", label: "5 min", minutes: 5, increment: 0 },
  { value: "10", label: "10 min", minutes: 10, increment: 0 },
  { value: "15+10", label: "15 | 10", minutes: 15, increment: 10 },
  { value: "30", label: "30 min", minutes: 30, increment: 0 },
];
const COLOUR_OPTIONS = [
  { value: "white", label: "White", glyph: "♔\uFE0E" },
  { value: "black", label: "Black", glyph: "♚\uFE0E" },
  { value: "random", label: "Random", glyph: "?" },
];

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const makeCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// The room being set up. Kept in memory: online rooms arrive in a later phase.
const room = { code: null, time: "10", colour: "white", youColour: null };
const timeLabel = () => TIME_OPTIONS.find((option) => option.value === room.time).label;
const colourLabel = () => COLOUR_OPTIONS.find((option) => option.value === room.colour).label;

export function createPlayPages(profile) {
  return {
    home(params, page) {
      page.append(
        pageHeader({ title: "Play with a friend", subtitle: "Create a room, choose the match settings, then invite your friend." }),
        h(
          "div",
          { class: "choice-grid" },
          h(
            "button",
            {
              class: "choice-card",
              type: "button",
              onclick: () => {
                room.code = makeCode();
                location.hash = "#/play/settings";
              },
            },
            h("span", { class: "choice-glyph" }, "♟\uFE0E"),
            h("h3", {}, "Create a room"),
            h("p", {}, "Start a new match room and set the time and colour."),
          ),
        ),
      );
    },

    settings(params, page) {
      if (!room.code) {
        location.hash = "#/play";
        return;
      }
      page.append(
        pageHeader({ title: "Room settings", subtitle: "Choose how the match will be played.", back: { href: "#/play", label: "Back" } }),
        h(
          "section",
          { class: "card narrow" },
          h("div", { class: "setting" }, h("h3", {}, "Room code"), h("span", { class: "room-code" }, room.code)),
          h("div", { class: "setting" }, h("h3", {}, "Match time"), optionGroup(TIME_OPTIONS, room.time, (value) => (room.time = value))),
          h("div", { class: "setting" }, h("h3", {}, "Your colour"), optionGroup(COLOUR_OPTIONS, room.colour, (value) => (room.colour = value))),
          h("button", { class: "btn inline", type: "button", onclick: () => (location.hash = "#/play/invite") }, "Continue: invite a friend"),
        ),
      );
    },

    invite(params, page) {
      if (!room.code) {
        location.hash = "#/play";
        return;
      }
      const link = `${location.origin}${location.pathname}#/play/room/${room.code}`;
      const copyButton = h("button", { class: "btn secondary inline", type: "button" }, h("span", { html: ICONS.copy }), " Copy");
      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(link);
          copyButton.lastChild.textContent = " Copied";
        } catch {
          copyButton.lastChild.textContent = " Copy failed";
        }
      });
      page.append(
        pageHeader({ title: "Invite a friend", subtitle: "Share this room code or link with your friend.", back: { href: "#/play/settings", label: "Settings" } }),
        h(
          "section",
          { class: "card narrow" },
          h("div", { class: "setting" }, h("h3", {}, "Room code"), h("span", { class: "room-code" }, room.code)),
          h("div", { class: "setting" }, h("h3", {}, "Invite link"), h("div", { class: "copy-row" }, h("input", { class: "field", readonly: true, value: link }), copyButton)),
          h("div", { class: "summary" }, h("span", { class: "chip" }, timeLabel()), h("span", { class: "chip" }, `You: ${colourLabel()}`)),
          h("p", { class: "muted" }, "Online invites arrive in a later update. For now, start the match and play together on this device."),
          h("div", { class: "button-row" }, h("button", {
            class: "btn inline",
            type: "button",
            onclick: () => {
              room.youColour = room.colour === "random" ? (Math.random() < 0.5 ? "white" : "black") : room.colour;
              location.hash = "#/play/game";
            },
          }, "Start match")),
        ),
      );
    },

    game(params, page) {
      if (!room.code || !room.youColour) {
        location.hash = "#/play";
        return;
      }
      const time = TIME_OPTIONS.find((option) => option.value === room.time);
      const you = profile.name;
      return mountGameScreen(page, {
        title: `Room ${room.code}`,
        subtitle: `You play ${cap(room.youColour)} · ${time.label}`,
        back: { href: "#/play/invite", label: "Room" },
        game: {
          label: "Friend match",
          orientation: room.youColour,
          clock: time.minutes ? { minutes: time.minutes, increment: time.increment } : null,
          players: room.youColour === "white" ? { white: you, black: "Friend" } : { white: "Friend", black: you },
          showPlayers: true,
          youPlayed: room.youColour,
        },
      });
    },
  };
}
