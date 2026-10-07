from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from app.chess.pieces.types import PieceType
from app.chess.positions.square import Square


@dataclass(frozen=True)
class Move:
    """A move from one square to another. Equality uses only from/to/promotion."""

    from_square: Square
    to_square: Square
    promotion: Optional[PieceType] = None
    is_en_passant: bool = field(default=False, compare=False)
    is_castling: bool = field(default=False, compare=False)

    @property
    def uci(self) -> str:
        suffix = self.promotion.value if self.promotion else ""
        return f"{self.from_square.name}{self.to_square.name}{suffix}"

    @classmethod
    def from_uci(cls, text: str) -> "Move":
        if len(text) not in (4, 5):
            raise ValueError(f"Invalid move: {text!r}")
        promotion = PieceType(text[4]) if len(text) == 5 else None
        return cls(Square.from_name(text[:2]), Square.from_name(text[2:4]), promotion)
