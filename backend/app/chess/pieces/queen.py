from app.chess.pieces.base import SlidingPiece
from app.chess.pieces.types import PieceType


class Queen(SlidingPiece):
    piece_type = PieceType.QUEEN
    DIRECTIONS = ((0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (1, -1), (-1, 1), (-1, -1))
