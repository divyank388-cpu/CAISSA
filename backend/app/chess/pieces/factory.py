from app.chess.pieces.base import Piece
from app.chess.pieces.bishop import Bishop
from app.chess.pieces.king import King
from app.chess.pieces.knight import Knight
from app.chess.pieces.pawn import Pawn
from app.chess.pieces.queen import Queen
from app.chess.pieces.rook import Rook
from app.chess.pieces.types import Color, PieceType

_CLASSES = {
    PieceType.PAWN: Pawn,
    PieceType.KNIGHT: Knight,
    PieceType.BISHOP: Bishop,
    PieceType.ROOK: Rook,
    PieceType.QUEEN: Queen,
    PieceType.KING: King,
}


def create_piece(piece_type: PieceType, color: Color) -> Piece:
    return _CLASSES[piece_type](color)


def piece_from_symbol(symbol: str) -> Piece:
    """'N' -> white knight, 'n' -> black knight."""
    if len(symbol) != 1 or symbol.lower() not in "pnbrqk":
        raise ValueError(f"Invalid piece symbol: {symbol!r}")
    color = Color.WHITE if symbol.isupper() else Color.BLACK
    return create_piece(PieceType(symbol.lower()), color)
