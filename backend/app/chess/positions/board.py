from __future__ import annotations

from typing import Optional

from app.chess.pieces.base import Piece
from app.chess.pieces.types import Color, PieceType
from app.chess.positions.square import Square


class Board:
    """Which piece (if any) stands on each square."""

    def __init__(self, pieces: Optional[dict[Square, Piece]] = None):
        self._pieces: dict[Square, Piece] = dict(pieces or {})

    def get(self, square: Square) -> Optional[Piece]:
        return self._pieces.get(square)

    def set(self, square: Square, piece: Piece) -> None:
        self._pieces[square] = piece

    def remove(self, square: Square) -> Optional[Piece]:
        return self._pieces.pop(square, None)

    def pieces(self) -> list[tuple[Square, Piece]]:
        return list(self._pieces.items())

    def find_king(self, color: Color) -> Optional[Square]:
        for square, piece in self._pieces.items():
            if piece.piece_type is PieceType.KING and piece.color is color:
                return square
        return None

    def copy(self) -> "Board":
        return Board(self._pieces)  # pieces are immutable in practice, so sharing them is safe
