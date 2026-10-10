import { showSplash } from "../components/common/Splash.js";
import { getProfile } from "../features/profile/profileStore.js";
import { runOnboarding } from "../features/profile/Onboarding.js";
import { createShell } from "./shell.js";
import { createRouter } from "./router.js";
import { createRoutes } from "./routes.js";

async function start() {
  await showSplash(); // logo loading screen
  const profile = getProfile() ?? (await runOnboarding()); // first visit: ask name + chess level
  const shell = createShell(profile);
  document.getElementById("app").replaceChildren(shell.element);
  createRouter(shell.outlet, createRoutes(profile), shell.setActive).start();
}

start().catch((error) => {
  console.error(error);
  document.getElementById("app").textContent = "Something went wrong while starting CAISSA. Open the browser console (F12) for details.";
});
