// Opening names and their first moves, for the picker only. Teaching content comes in a later phase.
export const OPENINGS = {
  white: [
    { id: "kings-gambit", name: "King's Gambit", line: "1.e4 e5 2.f4" },
    { id: "queens-gambit", name: "Queen's Gambit", line: "1.d4 d5 2.c4" },
    { id: "ruy-lopez", name: "Ruy Lopez", line: "1.e4 e5 2.Nf3 Nc6 3.Bb5" },
    { id: "italian-game", name: "Italian Game", line: "1.e4 e5 2.Nf3 Nc6 3.Bc4" },
    { id: "london-system", name: "London System", line: "1.d4 d5 2.Bf4" },
  ],
  black: [
    { id: "sicilian-defense", name: "Sicilian Defense", line: "1.e4 c5" },
    { id: "caro-kann-defense", name: "Caro-Kann Defense", line: "1.e4 c6" },
    { id: "berlin-defense", name: "Berlin Defense", line: "1.e4 e5 2.Nf3 Nc6 3.Bb5 Nf6" },
    { id: "french-defense", name: "French Defense", line: "1.e4 e6" },
    { id: "queens-gambit-declined", name: "Queen's Gambit Declined", line: "1.d4 d5 2.c4 e6" },
  ],
};
