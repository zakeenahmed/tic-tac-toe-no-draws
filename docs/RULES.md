# Sliding Tic-Tac-Toe (4×4) — Rules

## Overview
Two-player variant of tic-tac-toe on a 4×4 board where draws are impossible. Each player has 4 tokens. The game has two phases: **Placement** then **Sliding**.

---

## Components
- **Board**: 4×4 grid (16 cells).
- **Tokens**: 4 × X tokens, 4 × O tokens.

---

## Phase 1 — Placement
1. X goes first.
2. Players alternate placing **one token** on any **empty** cell.
3. **After each placement**, check for a win: if the placing player has **three of their tokens in a straight line**, they win **immediately**.
4. After 8 total placements (4 each) with no winner, Phase 2 begins.

---

## Phase 2 — Sliding
1. **X slides first** (since X placed first).
2. Players alternate turns.
3. On your turn:
   - **Select** one of your own tokens (click it).
   - **Move** it to an **orthogonally adjacent empty cell** (up, down, left, or right — no diagonals).
   - The token slides; the original cell becomes empty.
4. After your slide, check for a win (see below).
5. If no win, the other player takes their turn.

---

## Winning
- After any placement or slide, if the moving player has **three of their tokens in a straight line**, they win **immediately**.
- A "straight line" means any **three consecutive cells** in a row, column, or diagonal (both `\` and `/`).
- On a 4×4 board, there are **24 possible winning lines** (8 horizontal, 8 vertical, 4 diagonal `\`, 4 diagonal `/`).

---

## No-Draw Guarantee (Repetition Rule)
- The game tracks every **position + player to move** that occurs during **Phase 2 only**.
- If the **exact same position with the same player to move** occurs for the **third time**, the player whose turn it is **loses** (their opponent wins).
- Since the number of possible positions is finite (~1.8 million), and each slide changes the position, the game **must** eventually either produce a 3-in-a-row or hit a 3-fold repetition.
- **Therefore, every game terminates with a winner. Draws are impossible.**

---

## Quick Reference
| Action | When | How |
|--------|------|-----|
| Place token | Phase 1 | Click any empty cell |
| Select token | Phase 2 | Click your own token |
| Move token | Phase 2 | Click adjacent empty cell (orthogonal only) |
| Deselect | Phase 2 | Click the selected token again |
| Win | After any move | 3 in a row (any direction) |
| Lose by repetition | Phase 2 | Same position + player to move occurs 3× |

---

## Example Winning Lines (3 in a row on 4×4)
```
Horizontal:  (0,1,2)  (1,2,3)  |  (4,5,6)  (5,6,7)  |  etc.
Vertical:    (0,4,8)  (4,8,12) |  (1,5,9)  (5,9,13) |  etc.
Diagonal \:  (0,5,10) (1,6,11) |  (4,9,14) (5,10,15)
Diagonal /:  (2,5,8)  (3,6,9)  |  (6,9,12) (7,10,13)
```
(Cell indices are 0–15, row-major: row 0 = 0–3, row 1 = 4–7, etc.)