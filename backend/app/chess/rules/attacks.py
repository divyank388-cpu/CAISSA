from __future__ import annotations

from typing import TYPE_CHECKING

from app.chess.pieces.types import Color
from app.chess.positions.square import Square

if TYPE_CHECKING:
    from app.chess.positions.board import Board


def is_square_attacked(board: Board, square: Square, by_color: Color) -> bool:
    return any(
        piece.color is by_color and square in piece.attacked_squares(board, origin)
        for origin, piece in board.pieces()
    )


def is_in_check(board: Board, color: Color) -> bool:
    king_square = board.find_king(color)
    return king_square is not None and is_square_attacked(board, king_square, color.opposite)
