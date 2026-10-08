# Design notes

## Reading of the brief

The exercise is not “can you write tic-tac-toe.” It is: take an underspecified two-player variant, make decisions without asking the client, defend them, ship a static browser game, and leave a raw record of how AI tools were used.

Constraints we treated as non-negotiable:

- HTML, CSS, and JavaScript; no build step; `python -m http.server` from the repo root.
- No backend, database, or network calls.
- Human vs human is enough.
- Current Chrome is enough.
- Time box: at most 3 hours of active work.

The two invariants:

1. **No draw.** No terminal state in which neither player has won.
2. **Always terminates.** No line of play continues forever.

The variant must stay recognizably tic-tac-toe (grid, two players, X and O, alternating turns, three-in-a-row still matters) but is not limited to a frozen 3×3 “place until full” game.

## Ambiguity and how we resolved it

**What “no draw” allows.** Any ending is fine as long as exactly one player wins. We added two extra decisive outcomes besides three-in-a-row: no legal slide, and repeating a position. We did not invent a “draw by agreement” or a score-tie.

**Sliding can loop.** Adjacent-piece movement on a 3×3 with three marks each is the old game Three Men’s Morris. Without an extra rule it can cycle. The brief forbids that, so repeating a seen position is a loss for the player who just moved.

**What counts as a position.** Board occupancy, side to move, and phase (place vs slide). Pieces of one player are indistinguishable. We do not track which physical token is which, or a “last move” ko besides full-position repetition.

**When a repeat is judged.** After a legal move is applied, the turn is passed, then we ask whether this new position is already in the history. The initial empty board, X to place, is recorded at the start so a hypothetical return to it would also lose (it cannot happen in play).

**Win lines.** Exactly the eight classic 3×3 lines. No wraparound, no two-in-a-row, no extra patterns.

**Slide geometry.** Orthogonal only, one cell, no wrap. Diagonal slides would be a one-line change to `DELTAS` in `js/game.js` (useful if the interview asks for a live tweak).

**Both players with a line.** A player only moves their own marks, and we test for a line after every turn. If the opponent already had three-in-a-row, they would have won on the previous turn. So we never need a simultaneous-win rule.

**Opponent / polish.** No computer player, animation, or accessibility pass. Those are explicitly not scored.

**Framework.** None. Two script tags. Logic lives in `js/game.js` so a later rule change does not require hunting through DOM code.

## Variants considered and rejected

| Idea | Why not |
| --- | --- |
| Last-mark-wins on a full classic 3×3 | Satisfies the invariants cheaply, but former draws all go to X. Felt like a scoring patch, not a game. |
| Gravity (column drop) plus last-mark-wins | Fun and easy to prove; rejected because we wanted sliding after trying placement-only ideas. |
| At most three tokens; oldest mark is removed when a fourth is placed | Sliding was requested, not vanishing pieces. |
| Wraparound / torus board | Extra geometry to teach in a demo for little extra interest once last-mark-wins is bolted on. |
| Oldest piece must slide | Fewer decisions; a trapped corner that happens to be “next” feels unfair. |
| Move a mark to any empty cell (teleport) | Barely sliding; lines form too easily. |
| Adjacent slide **without** a repeat rule | Fails “always terminates.” |
| Quantum or ultimate tic-tac-toe | Too much to explain; easy to draw unless still more rules are piled on. |

We shipped **place three each, then slide one step orthogonally**, with **no-move loss** and **repeat loss**.

## Argument: a draw is impossible

The engine (`js/game.js`) only sets `result` in three cases, each with a `winner`:

- `reason: "line"` — the player who just moved has a winning line.
- `reason: "repeat"` — the player who just moved recreated a recorded position; the opponent wins.
- `reason: "stuck"` — the player about to move has no legal slide; the player who just moved wins.

There is no path that fills nine cells. Placement stops once each player has three marks. There is no `result` with a missing winner. The UI only prints win/loss sentences. Therefore no terminal state is a draw.

## Argument: play always terminates

**Placement.** At most six placements. Each placement fills an empty cell. Occupancy strictly increases, so placement cannot cycle. It either ends in a line during those six moves or enters the sliding phase with six marks and three holes.

**Sliding.** A sliding position is: three cells for X, three of the remaining six for O, and whose turn it is.

\[
\binom{9}{3} \times \binom{6}{3} \times 2 = 84 \times 20 \times 2 = 3360
\]

After each sliding move, either the mover already won by a line, or the new position (including side to move) was seen before and they lose, or the position is new and is added to the history. You cannot add more than 3360 distinct sliding keys (and in practice fewer, because placement history keys use `phase=place`). By the pigeonhole principle a slide that neither wins nor repeats cannot continue forever. No-move loss only ends games earlier.

This is an informal counting argument, not a full game-tree dump. An exhaustive enumerator over those 3360 keys would be a natural follow-up; it is not in the repo.

## Implementation notes

- `js/game.js` is the rules. `WIN_LINES` and `DELTAS` are the obvious levers for an interview change (diagonal slides, extra win patterns).
- History is a plain object of position keys, not `Set`, so a key is obvious in a debugger: `phase|turn|board`.
- The UI is two-click sliding: select your mark, then a highlighted neighbour. Click another of your marks to reselect.

## Known gaps

- No automated tests in the repo. Logic was smoke-checked with a short Node eval of `game.js` (line win; six placements enter slide with legal moves). Stuck and repeat endings are implemented but not exhaustively searched.
- No computer opponent.
- Visual design is a plain grid, by brief.
- Transcript files are copied at the end of the session; if the tool truncates an in-progress JSONL, that copy is whatever was on disk at export time (see `transcript/README.md`).
- This file does not claim the variant is original. Three Men’s Morris plus a chess-style repetition loss is the point: correct and defensible.
