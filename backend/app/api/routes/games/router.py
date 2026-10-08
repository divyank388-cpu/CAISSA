from fastapi import APIRouter, HTTPException

from app.schemas.game import MoveRequest
from app.services.game_service import GameNotFoundError, IllegalMoveError, game_service

router = APIRouter(prefix="/games", tags=["games"])


def _run(action):
    try:
        return action()
    except GameNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error))
    except IllegalMoveError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.post("", status_code=201)
def create_game():
    return game_service.snapshot(game_service.create_game())


@router.get("/{game_id}")
def get_game(game_id: str):
    return _run(lambda: game_service.snapshot(game_id))


@router.post("/{game_id}/moves")
def play_move(game_id: str, request: MoveRequest):
    def action():
        game_service.play_move(game_id, request.uci)
        return game_service.snapshot(game_id)
    return _run(action)


@router.post("/{game_id}/undo")
def undo_move(game_id: str):
    def action():
        game_service.undo(game_id)
        return game_service.snapshot(game_id)
    return _run(action)
