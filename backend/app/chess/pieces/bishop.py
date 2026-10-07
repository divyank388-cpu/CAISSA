from app.chess.pieces.base import SlidingPiece
from app.chess.pieces.types import PieceType


class Bishop(SlidingPiece):
    piece_type = PieceType.BISHOP
    DIRECTIONS = ((1, 1), (1, -1), (-1, 1), (-1, -1))
