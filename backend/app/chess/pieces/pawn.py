from __future__ import annotations

from typing import TYPE_CHECKING

from app.chess.moves.move import Move
from app.chess.pieces.base import Piece
from app.chess.pieces.types import Color, PieceType
from app.chess.positions.square import Square

if TYPE_CHECKING:
    from app.chess.positions.board import Board
    from app.chess.positions.position import Position

PROMOTION_TYPES = (PieceType.QUEEN, PieceType.ROOK, PieceType.BISHOP, PieceType.KNIGHT)


class Pawn(Piece):
    piece_type = PieceType.PAWN

    @property
    def _direction(self) -> int:
        return 1 if self.color is Color.WHITE else -1

    @property
    def _start_rank(self) -> int:
        return 1 if self.color is Color.WHITE else 6

    @property
    def _promotion_rank(self) -> int:
        return 7 if self.color is Color.WHITE else 0

    def attacked_squares(self, board: Board, square: Square) -> list[Square]:
        """Pawns attack the two forward diagonals (not the square straight ahead)."""
        targets = (square.offset(-1, self._direction), square.offset(1, self._direction))
        return [target for target in targets if target is not None]

    def pseudo_legal_moves(self, position: Position, square: Square) -> list[Move]:
        board, moves = position.board, []

        one_step = square.offset(0, self._direction)
        if one_step is not None and board.get(one_step) is None:
            moves.extend(self._advance(square, one_step))
            if square.rank == self._start_rank:
                two_steps = square.offset(0, 2 * self._direction)
                if board.get(two_steps) is None:
                    moves.append(Move(square, two_steps))

        for target in self.attacked_squares(board, square):
            occupant = board.get(target)
            if occupant is not None and occupant.color is not self.color:
                moves.extend(self._advance(square, target))
            elif occupant is None and target == position.en_passant_square:
                moves.append(Move(square, target, is_en_passant=True))
        return moves

    def _advance(self, origin: Square, target: Square) -> list[Move]:
        if target.rank == self._promotion_rank:
            return [Move(origin, target, promotion=kind) for kind in PROMOTION_TYPES]
        return [Move(origin, target)]
