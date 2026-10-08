# Chess Learning App

An interactive chess-learning application focused on teaching beginners how to *think* about chess, rather than simply telling them which move to play.

The project will eventually have two experiences: **Play** (chess with friends) and **Learn** (openings, middlegames, endgames, testing, and a personalized learning profile).

This repository is currently at the architecture-only stage. No application functionality has been implemented yet.

## Running (two players, one computer)

```
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate      Mac/Linux:  source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Then open http://localhost:8000. The backend (FastAPI + python-chess) also serves the frontend. The page loads chess.js from a CDN, so it needs an internet connection.
