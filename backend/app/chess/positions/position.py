from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from app.chess.pieces.factory import piece_from_symbol
from app.chess.pieces.types import Color
from app.chess.positions.board import Board
from app.chess.positions.square import Square

STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"


@dataclass
class Position:
    """A full chess position: pieces plus everything needed to know which moves are legal."""

    board: Board
    side_to_move: Color = Color.WHITE
    castling_rights: frozenset = field(default_factory=lambda: frozenset("KQkq"))
    en_passant_square: Optional[Square] = None
    halfmove_clock: int = 0
    fullmove_number: int = 1

    @classmethod
    def starting(cls) -> "Position":
        return cls.from_fen(STARTING_FEN)

    @classmethod
    def from_fen(cls, fen: str) -> "Position":
        parts = fen.split()
        if len(parts) < 4:
            raise ValueError(f"Invalid FEN: {fen!r}")
        placement, active, castling, en_passant = parts[:4]
        halfmove = int(parts[4]) if len(parts) > 4 else 0
        fullmove = int(parts[5]) if len(parts) > 5 else 1

        rows = placement.split("/")
        if len(rows) != 8:
            raise ValueError("FEN must have 8 ranks")
        board = Board()
        for index, row in enumerate(rows):
            rank, file = 7 - index, 0
            for char in row:
                if char.isdigit():
                    file += int(char)
                else:
                    board.set(Square(file, rank), piece_from_symbol(char))
                    file += 1
            if file != 8:
                raise ValueError(f"Rank does not have 8 squares: {row!r}")

        if active not in ("w", "b"):
            raise ValueError("Active color must be 'w' or 'b'")
        return cls(
            board=board,
            side_to_move=Color(active),
            castling_rights=frozenset(c for c in castling if c in "KQkq"),
            en_passant_square=None if en_passant == "-" else Square.from_name(en_passant),
            halfmove_clock=halfmove,
            fullmove_number=fullmove,
        )

    def to_fen(self) -> str:
        rows = []
        for rank in range(7, -1, -1):
            row, empty = "", 0
            for file in range(8):
                piece = self.board.get(Square(file, rank))
                if piece is None:
                    empty += 1
                else:
                    row += (str(empty) if empty else "") + piece.symbol
                    empty = 0
            rows.append(row + (str(empty) if empty else ""))
        castling = "".join(c for c in "KQkq" if c in self.castling_rights) or "-"
        en_passant = self.en_passant_square.name if self.en_passant_square else "-"
        return f"{'/'.join(rows)} {self.side_to_move.value} {castling} {en_passant} {self.halfmove_clock} {self.fullmove_number}"

    def copy(self) -> "Position":
        return Position(
            board=self.board.copy(),
            side_to_move=self.side_to_move,
            castling_rights=self.castling_rights,
            en_passant_square=self.en_passant_square,
            halfmove_clock=self.halfmove_clock,
            fullmove_number=self.fullmove_number,
        )
