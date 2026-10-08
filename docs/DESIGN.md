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
| Win checked during placement? | **No** | Only after slides. Prevents premature wins; placement is purely setup. |
| Diagonal lines count? | **Yes** | "Straight line" naturally includes diagonals; 24 lines vs 16 makes wins more accessible. |
| Slide directions | **Orthogonal only** (up/down/left/right) | Simpler to understand; diagonal slides would allow "jumping" and reduce strategy. |
| Repetition threshold | **3-fold** (like chess) | Standard, proven termination mechanism. 2-fold would end games too abruptly. |
| Who loses on repetition? | **Player to move** | Consistent with chess (player to move loses if they repeat). |

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

**Chosen variant** (4×4, 4 tokens each, orthogonal slides, 3-in-a-row, 3-fold repetition) balances:
- Recognizable tic-tac-toe feel
- Genuine sliding mechanic
- Non-trivial strategy
- Provable no-draw/termination
- Simple rules explainable in one page

---

## 3. Argument: No Draw & Always Terminates

### Informal Argument

1. **Finite State Space**  
   A position is defined by:
   - Which 4 of 16 cells hold X tokens: `C(16,4) = 1820`
   - Which 4 of remaining 12 hold O tokens: `C(12,4) = 495`
   - Which player's turn: `2`  
   Total distinct positions ≤ `1820 × 495 × 2 = 1,801,800`.

2. **Phase 1 (Placement) is Finite**  
   Exactly 8 moves (4 each). No choices after 8th placement → deterministic transition to Phase 2.

3. **Phase 2 (Sliding) Changes State Each Turn**  
   A legal slide moves one token to an adjacent empty cell. This **always** changes the board configuration (the token's position changes). The player to move also alternates. Therefore, each half-move produces a new `(board, player)` pair — or repeats a previous one.

3. **Repetition Rule Bounds Game Length**  
   The 3-fold repetition rule states: if the same `(board, player)` occurs 3 times, the player to move loses.  
   With ≤ 1.8M distinct states, after at most `2 × 1.8M = 3.6M` half-moves, some state must occur for the 3rd time (pigeonhole principle).  
   → **Game cannot continue indefinitely.**

4. **No Terminal State Without a Winner**  
   The only terminal conditions are:
   - A player forms 3-in-a-row → that player wins.
   - 3-fold repetition → player to move loses, opponent wins.  
   There is **no** "draw" terminal state.

**Conclusion**: Every game ends in a finite number of moves with exactly one winner. Draws are impossible.

---

### Exhaustive Search Feasibility (Optional Proof Strengthening)

The state space (~1.8M) is small enough for **retrograde analysis** (solving the game completely) if desired:
- Build directed graph of all legal transitions.
- Mark win-in-1 positions (any slide creates 3-in-a-row).
- Propagate: a position is **winning** if ∃ move to a losing position; **losing** if all moves go to winning positions; **draw** if neither (but repetition rule eliminates draws).
- With repetition rule encoded as a loss for the player to move on 3rd visit, the graph has no cycles without a win/loss label.
- This would prove **which player wins from the start of Phase 2** (likely first player with perfect play).

*Note: Not implemented due to time box, but the structure supports it.*

---

## 4. Known Issues / Unfinished

| Issue | Status | Notes |
|-------|--------|-------|
| **No computer opponent** | ✅ Not required | Brief says human vs human is sufficient. |
| **No visual indication of winning line** | ⚠️ Minor | Current code highlights winning *cells* but doesn't draw a line. Acceptable per "visual design not scored." |
| **Repetition count not shown in UI** | ⚠️ Minor | Player can't see how close to 3-fold they are. Could add a counter. |
| **No keyboard accessibility** | ⚠️ Minor | Click-only. Not scored per brief. |
| **Mobile touch targets** | ⚠️ Minor | 400px board → 100px cells, acceptable. |
| **Phase 1 win check omitted** | ✅ Intentional | By design; documented in RULES.md. |
| **First-player advantage unmeasured** | 📝 Known | Likely exists (as in most tic-tac-toe variants). Not a bug. |

---

## 5. Technical Implementation Notes

### Files
- `index.html` — Structure, loads CSS/JS
- `style.css` — Minimal styling, grid layout, highlight states
- `game.js` — All logic (~180 lines, no dependencies)

### Key Data Structures
```js
board: number[16]        // 0=empty, 1=X, 2=O
phase: 'place' | 'slide'
current: 1 | 2           // player to move
placed: {1: n, 2: n}     // tokens placed in Phase 1
selectedIdx: number      // -1 or index of selected token
history: Map<string, n>  // stateKey -> occurrence count
```

### State Key
`board.join(',') + '|' + current` — uniquely identifies position + player to move.

### Win Lines
Precomputed 24 length-3 segments (8 horizontal, 8 vertical, 4 each diagonal direction).

### Adjacency
Precomputed orthogonal neighbors for each of 16 cells.

### Event Flow
1. Click → `onCellClick(idx)`
2. Phase 1: `handlePlace` → switch player → render
3. Phase 2: `handleSlide` → select or move → checkWin → switch player → recordPosition → checkRepetition → render

### Complexity
- Time per move: O(1) — win check scans 24 lines × 3 cells = 72 checks.
- Space: O(positions visited) ≤ ~1.8M entries in worst case (unrealistic in practice; typical game < 50 moves).

---

## 6. Commit History Plan

| Commit | Description |
|--------|-------------|
| 1 | `init: scaffold HTML/CSS/JS + empty board` |
| 2 | `feat: placement phase (8 moves, alternating)` |
| 3 | `feat: slide phase + orthogonal move validation` |
| 4 | `feat: win detection (24 lines, 3-in-a-row)` |
| 5 | `feat: 3-fold repetition rule + termination` |
| 6 | `feat: UI polish (status, selection highlight, reset)` |
| 7 | `docs: RULES.md + DESIGN.md` |
| 8 | `chore: transcript/README.md` |

---

## 7. Time Spent (Estimated)

| Task | Time |
|------|------|
| Reading brief + variant design | 20 min |
| Scaffold + placement logic | 25 min |
| Slide logic + adjacency | 20 min |
| Win detection | 15 min |
| Repetition + termination | 15 min |
| UI polish | 15 min |
| Documentation (RULES/DESIGN) | 30 min |
| **Total** | **~2 hours** |

Within 3-hour time box.