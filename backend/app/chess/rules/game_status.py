from __future__ import annotations

from enum import Enum

from app.chess.pieces.types import PieceType
from app.chess.positions.board import Board
from app.chess.positions.position import Position
from app.chess.rules.attacks import is_in_check
from app.chess.rules.legal_moves import legal_moves


class GameStatus(Enum):
    ONGOING = "ongoing"
    CHECK = "check"
    CHECKMATE = "checkmate"
    STALEMATE = "stalemate"
    DRAW_INSUFFICIENT_MATERIAL = "draw_insufficient_material"
    DRAW_FIFTY_MOVE = "draw_fifty_move"


def has_insufficient_material(board: Board) -> bool:
    """K vs K, K+minor vs K, or only bishops that all stand on the same square color."""
    others = [(sq, p) for sq, p in board.pieces() if p.piece_type is not PieceType.KING]
    if not others:
        return True
    if len(others) == 1:
        return others[0][1].piece_type in (PieceType.BISHOP, PieceType.KNIGHT)
    if all(p.piece_type is PieceType.BISHOP for _, p in others):
        return len({sq.is_dark for sq, _ in others}) == 1
    return False


def get_status(position: Position) -> GameStatus:
    if has_insufficient_material(position.board):
        return GameStatus.DRAW_INSUFFICIENT_MATERIAL
    in_check = is_in_check(position.board, position.side_to_move)
    if not legal_moves(position):
        return GameStatus.CHECKMATE if in_check else GameStatus.STALEMATE
    if position.halfmove_clock >= 100:
        return GameStatus.DRAW_FIFTY_MOVE
    return GameStatus.CHECK if in_check else GameStatus.ONGOING
