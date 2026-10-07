from __future__ import annotations

from app.chess.moves.move import Move
from app.chess.positions.position import Position
from app.chess.positions.square import Square
from app.chess.rules.attacks import is_in_check
from app.chess.rules.move_execution import apply_move


def legal_moves(position: Position) -> list[Move]:
    """Every legal move for the side to move: piece movement rules + own king never left in check."""
    mover = position.side_to_move
    result = []
    for square, piece in position.board.pieces():
        if piece.color is not mover:
            continue
        for move in piece.pseudo_legal_moves(position, square):
            if not is_in_check(apply_move(position, move).board, mover):
                result.append(move)
    return result


def legal_moves_from(position: Position, square: Square) -> list[Move]:
    return [move for move in legal_moves(position) if move.from_square == square]


def find_legal_move(position: Position, move: Move):
    """The fully-flagged legal move matching `move` (e.g. one parsed from UCI), or None."""
    return next((m for m in legal_moves(position) if m == move), None)
