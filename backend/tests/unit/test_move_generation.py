import unittest

from app.chess.moves.move import Move
from app.chess.pieces.knight import Knight
from app.chess.pieces.types import Color
from app.chess.positions.board import Board
from app.chess.positions.position import Position
from app.chess.positions.square import Square
from app.chess.rules.game_status import GameStatus, get_status
from app.chess.rules.legal_moves import find_legal_move, legal_moves
from app.chess.rules.move_execution import apply_move


def perft(position, depth):
    if depth == 0:
        return 1
    return sum(perft(apply_move(position, m), depth - 1) for m in legal_moves(position))


def ucis(position):
    return sorted(m.uci for m in legal_moves(position))


class PerftTests(unittest.TestCase):
    """Node counts from the standard chess-programming perft suite; they exercise every rule."""

    def check(self, fen, expected):
        position = Position.from_fen(fen)
        for depth, nodes in enumerate(expected, start=1):
            self.assertEqual(perft(position, depth), nodes, f"depth {depth}")

    def test_start(self):
        self.check(Position.starting().to_fen(), [20, 400, 8902])

    def test_kiwipete(self):  # castling, en passant, promotion-heavy middlegame
        self.check("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", [48, 2039])

    def test_endgame_pins_and_en_passant(self):
        self.check("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", [14, 191, 2812])

    def test_promotions_and_castling_rights(self):
        self.check("r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1", [6, 264])


class PieceRuleTests(unittest.TestCase):
    def test_fen_round_trip(self):
        fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"
        self.assertEqual(Position.from_fen(fen).to_fen(), fen)

    def test_knight_in_center_has_eight_moves(self):
        board = Board()
        board.set(Square.from_name("e4"), Knight(Color.WHITE))
        self.assertEqual(len(Knight(Color.WHITE).pseudo_legal_moves(Position(board), Square.from_name("e4"))), 8)

    def test_en_passant(self):
        p = Position.from_fen("rnbqkbnr/ppp1pppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1")
        self.assertIn("d4e3", ucis(p))
        after = apply_move(p, find_legal_move(p, Move.from_uci("d4e3")))
        self.assertIsNone(after.board.get(Square.from_name("e4")))

    def test_cannot_castle_through_check(self):
        p = Position.from_fen("4k3/8/8/8/8/5r2/8/4K2R w K - 0 1")  # f1 attacked by the rook on f3
        self.assertNotIn("e1g1", ucis(p))

    def test_castling_moves_the_rook(self):
        p = Position.from_fen("4k3/8/8/8/8/8/8/4K2R w K - 0 1")
        after = apply_move(p, find_legal_move(p, Move.from_uci("e1g1")))
        self.assertEqual(after.to_fen().split()[0], "4k3/8/8/8/8/8/8/5RK1")
        self.assertNotIn("K", after.castling_rights)

    def test_promotion_gives_four_choices(self):
        p = Position.from_fen("8/P6k/8/8/8/8/8/K7 w - - 0 1")
        self.assertEqual(sorted(u for u in ucis(p) if u.startswith("a7")), ["a7a8b", "a7a8n", "a7a8q", "a7a8r"])

    def test_pinned_piece_cannot_move_off_the_line(self):
        p = Position.from_fen("4r1k1/8/8/8/8/8/4B3/4K3 w - - 0 1")
        self.assertEqual([u for u in ucis(p) if u.startswith("e2")], [])


class StatusTests(unittest.TestCase):
    def test_start_is_ongoing(self):
        self.assertEqual(get_status(Position.starting()), GameStatus.ONGOING)

    def test_fools_mate(self):
        p = Position.from_fen("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3")
        self.assertEqual(get_status(p), GameStatus.CHECKMATE)

    def test_stalemate(self):
        self.assertEqual(get_status(Position.from_fen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1")), GameStatus.STALEMATE)

    def test_insufficient_material(self):
        self.assertEqual(get_status(Position.from_fen("8/8/4k3/8/8/3K4/8/6B1 w - - 0 1")), GameStatus.DRAW_INSUFFICIENT_MATERIAL)


if __name__ == "__main__":
    unittest.main()
