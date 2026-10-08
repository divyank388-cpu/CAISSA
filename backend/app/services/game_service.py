"""Holds live games and applies moves using python-chess (the source of truth for chess rules)."""
import uuid

import chess


class GameNotFoundError(Exception):
    pass


class IllegalMoveError(Exception):
    pass


class GameService:
    def __init__(self) -> None:
        self._games: dict[str, chess.Board] = {}  # in-memory for now; a database comes in a later phase

    def create_game(self) -> str:
        game_id = uuid.uuid4().hex[:8]
        self._games[game_id] = chess.Board()
        return game_id

    def _board(self, game_id: str) -> chess.Board:
        board = self._games.get(game_id)
        if board is None:
            raise GameNotFoundError(f"Game {game_id!r} not found")
        return board

    def play_move(self, game_id: str, uci: str) -> None:
        board = self._board(game_id)
        try:
            move = chess.Move.from_uci(uci)
        except ValueError:
            raise IllegalMoveError(f"Invalid move format: {uci!r}")
        if move not in board.legal_moves:
            raise IllegalMoveError(f"Illegal move: {uci}")
        board.push(move)

    def undo(self, game_id: str) -> None:
        board = self._board(game_id)
        if not board.move_stack:
            raise IllegalMoveError("Nothing to undo")
        board.pop()

    def snapshot(self, game_id: str) -> dict:
        board = self._board(game_id)

        replay, san_moves = chess.Board(), []
        for move in board.move_stack:
            san_moves.append(replay.san(move))
            replay.push(move)

        outcome = board.outcome(claim_draw=True)  # claims threefold repetition / fifty-move draws
        if outcome is None:
            status, result, winner = ("check" if board.is_check() else "ongoing"), None, None
        else:
            status = outcome.termination.name.lower()
            result = outcome.result()
            winner = None if outcome.winner is None else ("white" if outcome.winner else "black")

        last_move = None
        if board.move_stack:
            last = board.peek()
            last_move = {"from": chess.square_name(last.from_square), "to": chess.square_name(last.to_square)}

        return {
            "id": game_id,
            "fen": board.fen(),
            "turn": "white" if board.turn else "black",
            "status": status,
            "result": result,
            "winner": winner,
            "san_moves": san_moves,
            "uci_moves": [move.uci() for move in board.move_stack],
            "last_move": last_move,
        }


game_service = GameService()
