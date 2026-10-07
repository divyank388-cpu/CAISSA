from __future__ import annotations

from typing import TYPE_CHECKING

from app.chess.moves.move import Move
from app.chess.pieces.base import StepPiece
from app.chess.pieces.rook import Rook
from app.chess.pieces.types import Color, PieceType
from app.chess.positions.square import Square
from app.chess.rules.attacks import is_square_attacked

if TYPE_CHECKING:
    from app.chess.positions.position import Position


class King(StepPiece):
    piece_type = PieceType.KING
    OFFSETS = ((0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (1, -1), (-1, 1), (-1, -1))

    def pseudo_legal_moves(self, position: Position, square: Square) -> list[Move]:
        moves = super().pseudo_legal_moves(position, square)
        moves.extend(self._castling_moves(position, square))
        return moves

    def _castling_moves(self, position: Position, square: Square) -> list[Move]:
        white = self.color is Color.WHITE
        rank = 0 if white else 7
        if square != Square(4, rank):
            return []
        board, enemy = position.board, self.color.opposite
        if is_square_attacked(board, square, enemy):  # cannot castle out of check
            return []

        # (rights letter, rook file, files that must be empty, files the king crosses/lands on, king target file)
        options = (
            ("K", 7, (5, 6), (5, 6), 6),
            ("Q", 0, (1, 2, 3), (3, 2), 2),
        )
        moves = []
        for letter, rook_file, empty_files, safe_files, target_file in options:
            right = letter if white else letter.lower()
            if right not in position.castling_rights:
                continue
            rook = board.get(Square(rook_file, rank))
            if not (isinstance(rook, Rook) and rook.color is self.color):
                continue
            if any(board.get(Square(f, rank)) is not None for f in empty_files):
                continue
            if any(is_square_attacked(board, Square(f, rank), enemy) for f in safe_files):
                continue
            moves.append(Move(square, Square(target_file, rank), is_castling=True))
        return moves
