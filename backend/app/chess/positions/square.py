from __future__ import annotations

from typing import NamedTuple, Optional

FILES = "abcdefgh"


class Square(NamedTuple):
    file: int  # 0 = a ... 7 = h
    rank: int  # 0 = rank 1 ... 7 = rank 8

    @property
    def name(self) -> str:
        return f"{FILES[self.file]}{self.rank + 1}"

    @classmethod
    def from_name(cls, name: str) -> "Square":
        if len(name) != 2 or name[0] not in FILES or name[1] not in "12345678":
            raise ValueError(f"Invalid square: {name!r}")
        return cls(FILES.index(name[0]), int(name[1]) - 1)

    def offset(self, d_file: int, d_rank: int) -> Optional["Square"]:
        """The square shifted by the given amounts, or None if that falls off the board."""
        file, rank = self.file + d_file, self.rank + d_rank
        if 0 <= file < 8 and 0 <= rank < 8:
            return Square(file, rank)
        return None

    @property
    def is_dark(self) -> bool:
        return (self.file + self.rank) % 2 == 0  # a1 is dark
