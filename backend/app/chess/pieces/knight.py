from app.chess.pieces.base import StepPiece
from app.chess.pieces.types import PieceType


class Knight(StepPiece):
    piece_type = PieceType.KNIGHT
    OFFSETS = ((1, 2), (2, 1), (2, -1), (1, -2), (-1, -2), (-2, -1), (-2, 1), (-1, 2))
