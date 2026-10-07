from __future__ import annotations

from app.chess.moves.move import Move
from app.chess.pieces.factory import create_piece
from app.chess.pieces.types import PieceType
from app.chess.positions.position import Position
from app.chess.positions.square import Square

# Moving from or to one of these squares removes the matching castling right.
_ROOK_HOME_RIGHTS = {
    Square(0, 0): "Q", Square(7, 0): "K",
    Square(0, 7): "q", Square(7, 7): "k",
}


def apply_move(position: Position, move: Move) -> Position:
    """Return the position after `move`. Does NOT check legality (see legal_moves.is_legal)."""
    new = position.copy()
    board = new.board
    piece = board.get(move.from_square)
    if piece is None or piece.color is not position.side_to_move:
        raise ValueError(f"No {position.side_to_move.name} piece on {move.from_square.name}")

    is_pawn = piece.piece_type is PieceType.PAWN
    is_king = piece.piece_type is PieceType.KING
    file_shift = move.to_square.file - move.from_square.file
    captured = board.get(move.to_square)

    board.remove(move.from_square)

    if is_pawn and file_shift != 0 and captured is None:  # en passant: captured pawn sits beside the origin
        captured = board.remove(Square(move.to_square.file, move.from_square.rank))

    if is_king and abs(file_shift) == 2:  # castling: also relocate the rook
        rank = move.from_square.rank
        rook_from, rook_to = (Square(7, rank), Square(5, rank)) if file_shift > 0 else (Square(0, rank), Square(3, rank))
        board.set(rook_to, board.remove(rook_from))

    board.set(move.to_square, create_piece(move.promotion, piece.color) if move.promotion else piece)

    rights = set(new.castling_rights)
    if is_king:
        rights -= set("KQ") if piece.color.value == "w" else set("kq")
    for square in (move.from_square, move.to_square):
        rights.discard(_ROOK_HOME_RIGHTS.get(square, ""))
    new.castling_rights = frozenset(rights)

    new.en_passant_square = None
    if is_pawn and abs(move.to_square.rank - move.from_square.rank) == 2:
        new.en_passant_square = Square(move.from_square.file, (move.from_square.rank + move.to_square.rank) // 2)

    new.halfmove_clock = 0 if (is_pawn or captured is not None) else position.halfmove_clock + 1
    if piece.color.value == "b":
        new.fullmove_number += 1
    new.side_to_move = position.side_to_move.opposite
    return new
