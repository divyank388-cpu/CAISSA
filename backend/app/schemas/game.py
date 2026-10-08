from pydantic import BaseModel


class MoveRequest(BaseModel):
    uci: str  # e.g. "e2e4", or "e7e8q" for a promotion
