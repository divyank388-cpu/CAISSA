# Deploying to Vercel

## Frontend only (current)

The `frontend/` folder is a static site and works on its own: chess.js runs the game in the browser.

1. Vercel project > Settings > General > **Root Directory** = `frontend`
2. Framework Preset = **Other** (`frontend/vercel.json` also sets this), no build command
3. Redeploy

The Python backend is not used in this mode.

## Why not the repository root?

At the root Vercel finds `backend/app/main.py` and tries to run it as a FastAPI app. That fails on import paths
(`from app...` expects `backend/` as the project root) and on dependencies (`backend/requirements.txt`),
and games are kept in server memory, which does not survive serverless invocations.

## Full stack later

Host `backend/` on a server that keeps state (Render, Railway, Fly.io) or make the API stateless first,
then point the frontend at it.
