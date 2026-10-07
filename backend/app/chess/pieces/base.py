from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, ClassVar

from app.chess.moves.move import Move
from app.chess.pieces.types import Color, PieceType
from app.chess.positions.square import Square

if TYPE_CHECKING:
    from app.chess.positions.board import Board
    from app.chess.positions.position import Position


class Piece(ABC):
    """A chess piece. Knows only how it moves and attacks, nothing about the whole game."""

    piece_type: ClassVar[PieceType]

    def __init__(self, color: Color):
        self.color = color

    @property
    def symbol(self) -> str:
        letter = self.piece_type.value
        return letter.upper() if self.color is Color.WHITE else letter

    @abstractmethod
    def attacked_squares(self, board: Board, square: Square) -> list[Square]:
        """Squares this piece attacks (defends or could capture on) from `square`."""

    def pseudo_legal_moves(self, position: Position, square: Square) -> list[Move]:
        """Moves following the piece's movement rules, ignoring whether the own king is left in check."""
        moves = []
        for target in self.attacked_squares(position.board, square):
            occupant = position.board.get(target)
            if occupant is None or occupant.color is not self.color:
                moves.append(Move(square, target))
        return moves

    def __eq__(self, other: object) -> bool:
        return isinstance(other, Piece) and (self.piece_type, self.color) == (other.piece_type, other.color)

    def __hash__(self) -> int:
        return hash((self.piece_type, self.color))

    def __repr__(self) -> str:
        return f"{type(self).__name__}({self.color.name})"


class SlidingPiece(Piece):
    """Moves any distance along its directions until blocked (rook, bishop, queen)."""

    DIRECTIONS: ClassVar[tuple[tuple[int, int], ...]] = ()

    def attacked_squares(self, board: Board, square: Square) -> list[Square]:
        squares = []
        for d_file, d_rank in self.DIRECTIONS:
            current = square.offset(d_file, d_rank)
            while current is not None:
                squares.append(current)
                if board.get(current) is not None:  # blocked: this square is included, nothing behind it
                    break
                current = current.offset(d_file, d_rank)
        return squares


class StepPiece(Piece):
    """Moves exactly one fixed jump (knight, king)."""

    OFFSETS: ClassVar[tuple[tuple[int, int], ...]] = ()

    def attacked_squares(self, board: Board, square: Square) -> list[Square]:
        targets = (square.offset(d_file, d_rank) for d_file, d_rank in self.OFFSETS)
        return [target for target in targets if target is not None]
