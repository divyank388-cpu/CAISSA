import { createDashboardPage } from "../features/dashboard/Dashboard.js";
import { createPlayPages } from "../features/play/PlayRoom.js";
import { learnPages } from "../features/learn/LearnPages.js";
import { createTestPages } from "../features/test/TestPages.js";

export function createRoutes(profile) {
  const play = createPlayPages(profile);
  const test = createTestPages(profile);
  return [
    ["/", createDashboardPage(profile)],
    ["/play", play.home],
    ["/play/settings", play.settings],
    ["/play/invite", play.invite],
    ["/play/game", play.game],
    ["/learn", learnPages.home],
    ["/learn/openings", learnPages.openingColour],
    ["/learn/openings/:colour", learnPages.openingList],
    ["/learn/openings/:colour/:id", learnPages.openingBoard],
    ["/learn/middlegames", learnPages.middlegames],
    ["/learn/endgames", learnPages.endgames],
    ["/test", test.home],
    ["/test/play", test.play],
  ];
}
