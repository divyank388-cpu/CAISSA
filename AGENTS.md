# AGENTS.md

Guidance for coding agents working in this repository.

## Architectural intent

This monorepo keeps these concerns separated so each can evolve independently:

1. Frontend (`frontend/`)
2. Backend/API (`backend/app/api/`)
3. Chess/domain logic (`backend/app/chess/`)
4. Chess-engine integration (`backend/app/engine/`)
5. Teaching/coach system (`backend/app/teaching/`)
6. Learning/adaptive system (`backend/app/learning/`)
7. Authentication/user system
8. Persistence/data (`backend/app/database/`, `backend/app/repositories/`, `data/`)
9. Tests (`tests/`, `frontend/tests/`, `backend/tests/`)
10. Documentation (`docs/`)
11. Deployment/infrastructure (`infrastructure/`)

## Rules

- Keep frontend and backend separated.
- Keep chess logic separated from AI explanation.
- Never let an LLM be the source of truth for legal chess moves or objectively best moves.
- Keep teaching logic separate from chess-engine logic.
- Keep learning/adaptive logic separate from UI.
- Prefer small, modular services.
- Do not introduce unnecessary dependencies.
- Do not implement features outside the current phase.
- Read the repository structure before modifying it.
