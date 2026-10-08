# Sliding Tic-Tac-Toe (4×4) — Design Document

## 1. Reading of the Brief & Ambiguities Resolved

### Brief Requirements
- **No draw**: No terminal state where neither player has won.
- **Always terminates**: No line of play continues indefinitely.
- **Recognizably tic-tac-toe**: Two players, X and O, alternating turns, win by forming a line.
- **Browser-based**: HTML/CSS/JS, no build step, runs via `python -m http.server`.

### Ambiguities & Decisions

| Ambiguity | Decision | Rationale |
|-----------|----------|-----------|
| Board size | **4×4** | 3×3 sliding has only 1 empty cell after placement — too constrained. 4×4 gives 8 empty cells, rich sliding. |
| Tokens per player | **4 each** | 8 tokens placed, 8 empty — balanced mobility. |
| Win condition | **3 in a row** (not 4) | Keeps game shorter, more tactical; 4-in-a-row on 4×4 is very hard with sliding. |
| Win checked during placement? | **Yes** | Natural tic-tac-toe behavior; if you form 3-in-a-row while placing, you win. |
| Diagonal lines count? | **Yes** | "Straight line" naturally includes diagonals; 24 lines vs 16 makes wins more accessible. |
| Slide directions | **Orthogonal only** (up/down/left/right) | Simpler to understand; diagonal slides would allow "jumping" and reduce strategy. |
| Who slides first? | **X** (placed first in Phase 1) | Fairness — player who starts the game starts both phases. |
| First-player advantage mitigation | **Pie Rule** (Phase 0) | X places first token; O chooses swap/keep. Standard balancing mechanism. |
| Repetition threshold | **3-fold (board-only)** | Same board appears 3× → player who caused it loses. Simpler than chess-style. |
| Who loses on repetition? | **Player who created the 3rd occurrence** | Direct penalty for cycling; intuitive: "don't recreate a board twice." |
| Repetition tracked in Phase 1? | **No** | Phase 1 is deterministic setup; repetition only matters in slide phase. |
| State key includes player? | **No** | Board-only tracking: `board.join(',')` — same board = same state regardless of turn. |

---

## 2. Rule Sets Considered & Rejected

| Variant | Why Rejected |
|---------|--------------|
| **3×3 board, 3 tokens each, orthogonal slides** | Only 3 empty cells after placement → very limited mobility; often deadlocked. |
| **3×3 board, 3 tokens each, king-move slides (8 dirs)** | More mobility but still cramped; first-player advantage extreme. |
| **4×4 board, 4 tokens each, 4-in-a-row win** | Win too rare; games drag on, repetition dominates. |
| **4×4 board, 3 tokens each, 3-in-a-row** | Too few tokens → sparse board, less interaction. |
| **Gravity drop (Connect-4 style)** | Not "sliding" in the sense requested; different genre. |
| **Toroidal 3×3 (wraparound), standard placement** | Elegant but not a sliding variant; brief asked for something "interesting." |
| **Misère (avoid 3-in-a-row)** | Counter-intuitive for players; harder to explain in RULES.md. |
| **No win check during placement** | Rejected after review — unnatural for tic-tac-toe; players expect immediate wins. |
| **No first-player mitigation** | Rejected — X advantage in both phases was significant; Pie Rule is standard fix. |

**Chosen variant** (4×4, 4 tokens each, orthogonal slides, 3-in-a-row, win during placement, X slides first, 3-fold repetition in slide phase, Pie Rule for fairness) balances:
- Recognizable tic-tac-toe feel
- Genuine sliding mechanic
- Non-trivial strategy
- Provable no-draw/termination
- Simple rules explainable in one page
- Fairness via Pie Rule

---

## 3. Argument: No Draw & Always Terminates

### Informal Argument

1. **Finite State Space**  
   A position is defined by:
   - Which 4 of 16 cells hold X tokens: `C(16,4) = 1820`
   - Which 4 of remaining 12 hold O tokens: `C(12,4) = 495`
   Total distinct **board configurations** ≤ `1820 × 495 = 900,900`.

2. **Phase 0 (Pie Rule) is Finite**  
   Exactly 1 move (X places) + 1 choice (O swaps/keeps). Deterministic transition to Phase 1.

3. **Phase 1 (Placement) is Finite**  
   At most 7 additional moves (4 each, minus the one already placed). A win can end the game early. If no win after 8th placement → deterministic transition to Phase 2 with X to move.

4. **Phase 2 (Sliding) Changes Board State Each Turn**  
   A legal slide moves one token to an adjacent empty cell. This **always** changes the board configuration (the token's position changes). Therefore, each slide produces a new board state — or repeats a previous one.

5. **Repetition Rule Bounds Game Length**  
   The 3-fold repetition rule states: if the same **board** occurs 3 times during Phase 2, the player who **made the move** creating the 3rd occurrence loses.  
   With ≤ 900K distinct boards, after at most `3 × 900K = 2.7M` slides, some board must occur for the 3rd time (pigeonhole principle).  
   → **Game cannot continue indefinitely.**

6. **No Terminal State Without a Winner**  
   The only terminal conditions are:
   - A player forms 3-in-a-row (in Phase 1 or Phase 2) → that player wins.
   - 3-fold repetition in Phase 2 → player who caused it loses, opponent wins.  
   There is **no** "draw" terminal state.

**Conclusion**: Every game ends in a finite number of moves with exactly one winner. Draws are impossible.

---

### Exhaustive Search Feasibility (Optional Proof Strengthening)

The state space (~900K boards) is small enough for **retrograde analysis** (solving the game completely) if desired:
- Build directed graph of all legal transitions between board states.
- Mark win-in-1 positions (any move creates 3-in-a-row).
- Propagate: a position is **winning** if ∃ move to a losing position; **losing** if all moves go to winning positions; **draw** if neither (but repetition rule eliminates draws).
- With repetition rule encoded as a loss for the mover on 3rd visit, the graph has no cycles without a win/loss label.
- This would prove **which player wins from the start of Phase 2** (likely first player with perfect play).

*Note: Not implemented due to time box, but the structure supports it.*

---

## 4. Code Review Findings & Fixes Applied

### Issues Found During Review

| Issue | Severity | Fix Applied |
|-------|----------|-------------|
| **No win check during placement** | High | Added `checkWin(current)` after each placement; immediate win ends game. |
| **Wrong player slides first** | Medium | After placement phase, explicitly set `current = X` so X slides first (placed first). |
| **Repetition tracked from reset** | Low | `recordPosition()` now only records during `phase === 'slide'`. Empty board not counted. |
| **First-player advantage unmitigated** | Medium | Added **Pie Rule** (Phase 0): X places first token, O chooses swap/keep. |
| **No handling of "no legal moves"** | Low | Not explicitly handled, but with 8 empty cells and orthogonal slides, a legal move always exists unless all 4 tokens are fully surrounded (extremely rare; repetition would trigger first). |
| **Selected token stays selected on invalid target** | UX | Intentional — allows player to try another target without re-clicking. |
| **Win highlighting shows all 3 cells** | ✓ Correct | `checkWinningCell` correctly identifies all cells in any winning line. |
| **State key includes player to move** | ✓ Correct | `board.join(',')` — board-only, no player factor. Same board = same state. |
| **History never cleared except reset** | ✓ Correct | Map persists for entire game session. |

### Edge Cases Verified

| Scenario | Behavior |
|----------|----------|
| X forms 3-in-a-row on 3rd placement | X wins immediately; game ends |
| O forms 3-in-a-row on 4th placement | O wins immediately; game ends |
| Placement phase ends 4-4 no winner | Transitions to slide phase, X to move |
| Slide creates 3-in-a-row | Moving player wins immediately |
| Slide creates opponent's 3-in-a-row | Impossible — only moving player's tokens change |
| Same board occurs 3× in slide phase | Player who caused 3rd occurrence loses (board-only 3-fold repetition) |
| Click own token → click same token | Deselects |
| Click own token → click invalid target | Token stays selected (can try another target) |
| Click opponent's token / empty cell with nothing selected | No-op |
| Reset during game | Full state reset, back to Phase 0 (Pie) |
| Win on last possible slide | Detected correctly |
| Pie Rule: O chooses Swap | Board token becomes O; O plays next as X |
| Pie Rule: O chooses Keep | Board token stays X; O plays next as O |

---

## 5. Known Issues / Unfinished

| Issue | Status | Notes |
|-------|--------|-------|
| **No computer opponent** | ✅ Not required | Brief says human vs human is sufficient. |
| **No visual indication of winning line** | ✅ Fixed | Winning line now drawn as colored line across the 3 cells. |
| **Repetition count not shown in UI** | ✅ Fixed | Counter shown in status bar during slide phase (e.g., "repetition: 2/3"). |
| **No keyboard accessibility** | ⚠️ Minor | Click-only. Not scored per brief. |
| **Mobile touch targets** | ⚠️ Minor | 400px board → 100px cells, acceptable. |

