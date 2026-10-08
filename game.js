// Sliding Tic-Tac-Toe (4×4) — Game Logic
// Phase 0: Pie Rule — X places first token, O chooses swap or keep
// Phase 1: Place 4 tokens each (alternating) — win checked after each placement
// Phase 2: Slide own token orthogonally to adjacent empty cell
// Win: 3 in a row (orthogonal or diagonal) after any move
// No draw: 3-fold repetition (board only) → player who causes it loses

const EMPTY = 0;
const X = 1;
const O = 2;

const PLAYER_SYMBOL = { [X]: 'X', [O]: 'O' };
const PLAYER_CLASS = { [X]: 'x', [O]: 'o' };

// All length-3 straight lines on 4x4 (orthogonal + diagonal)
// Each line is 3 cell indices (0-15, row-major)
const WIN_LINES = [
  // Horizontal (4 rows × 2 per row = 8)
  [0,1,2], [1,2,3],
  [4,5,6], [5,6,7],
  [8,9,10], [9,10,11],
  [12,13,14], [13,14,15],
  // Vertical (4 cols × 2 per col = 8)
  [0,4,8], [4,8,12],
  [1,5,9], [5,9,13],
  [2,6,10], [6,10,14],
  [3,7,11], [7,11,15],
  // Diagonal \ (2×2 = 4)
  [0,5,10], [1,6,11],
  [4,9,14], [5,10,15],
  // Diagonal / (2×2 = 4)
  [2,5,8], [3,6,9],
  [6,9,12], [7,10,13],
];

// Orthogonal adjacency for 4x4 (up, down, left, right)
const ADJACENT = Array.from({ length: 16 }, (_, i) => {
  const r = Math.floor(i / 4);
  const c = i % 4;
  const adj = [];
  if (r > 0) adj.push(i - 4);     // up
  if (r < 3) adj.push(i + 4);     // down
  if (c > 0) adj.push(i - 1);     // left
  if (c < 3) adj.push(i + 1);     // right
  return adj;
});

// Game state
let board = Array(16).fill(EMPTY);
let phase = 'pie'; // 'pie' | 'place' | 'slide'
let current = X;
let placed = { [X]: 0, [O]: 0 };
let selectedIdx = -1;
let history = new Map(); // boardKey -> count (slide phase only)
let gameOver = false;
let winner = null;
let firstMoveIdx = -1; // Track X's first placement for pie rule
let winningLine = null; // Store the winning line for visualization

// DOM elements
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset');

// Initialize board cells
for (let i = 0; i < 16; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.dataset.idx = i;
  cell.addEventListener('click', () => onCellClick(i));
  boardEl.appendChild(cell);
}

resetBtn.addEventListener('click', resetGame);

function resetGame() {
  board = Array(16).fill(EMPTY);
  phase = 'pie';
  current = X;
  placed = { [X]: 0, [O]: 0 };
  selectedIdx = -1;
  history = new Map();
  gameOver = false;
  winner = null;
  firstMoveIdx = -1;
  winningLine = null;
  render();
  updateStatus();
}

function onCellClick(idx) {
  if (gameOver) return;

  if (phase === 'pie') {
    handlePie(idx);
  } else if (phase === 'place') {
    handlePlace(idx);
  } else {
    handleSlide(idx);
  }
}

function handlePie(idx) {
  if (board[idx] !== EMPTY) return;

  // X places first token
  board[idx] = X;
  placed[X] = 1;
  firstMoveIdx = idx;

  // Check if X already won (impossible with 1 token, but keep for completeness)
  if (checkWin(X)) {
    gameOver = true;
    winner = X;
    render();
    updateStatus();
    return;
  }

  // Now O chooses: swap or keep
  phase = 'pie_choose';
  current = O; // O makes the choice
  render();
  updateStatus();
}

function handlePieChoose(choice) {
  // choice: 'swap' or 'keep'
  if (choice === 'swap') {
    // O becomes X, X becomes O
    // Swap the token on board
    board[firstMoveIdx] = O;
    placed = { [X]: 0, [O]: 1 };
    current = X; // The player who is now X goes next (was O)
  } else {
    // Keep sides
    current = O; // O places next
  }
  phase = 'place';
  render();
  updateStatus();
}

function handlePlace(idx) {
  if (board[idx] !== EMPTY) return;

  board[idx] = current;
  placed[current]++;

  // Check win immediately after placement
  if (checkWin(current)) {
    gameOver = true;
    winner = current;
    render();
    updateStatus();
    return;
  }

  // Check if both players have placed all tokens
  if (placed[X] === 4 && placed[O] === 4) {
    phase = 'slide';
    // X (the player who placed first in placement phase) slides first
    current = X;
    recordPosition(); // Record first slide-phase position
  } else {
    current = current === X ? O : X;
  }

  render();
  updateStatus();
}

function handleSlide(idx) {
  const cell = board[idx];

  if (selectedIdx === -1) {
    // Select own token
    if (cell === current) {
      selectedIdx = idx;
      render();
    }
    return;
  }

  // Try to move selected token to idx
  if (idx === selectedIdx) {
    // Deselect
    selectedIdx = -1;
    render();
    return;
  }

  if (cell !== EMPTY) return; // Target occupied

  if (!ADJACENT[selectedIdx].includes(idx)) return; // Not orthogonal adjacent

  // Perform move
  board[selectedIdx] = EMPTY;
  board[idx] = current;
  selectedIdx = -1;

  // Check win
  if (checkWin(current)) {
    gameOver = true;
    winner = current;
    render();
    updateStatus();
    return;
  }

  // Switch player
  current = current === X ? O : X;

  // Record position and check repetition (board-only, 3-fold)
  // The player who just moved is the one who caused the new board state
  const mover = current === X ? O : X; // player who just moved
  if (recordAndCheckRepetition(mover)) {
    gameOver = true;
    winner = 'repetition'; // special value indicating repetition win
    render();
    updateStatus();
    return;
  }

  render();
  updateStatus();
}

// ============================================================
// REPETITION RULE (board-only, 3-fold) — Guarantees termination
// ============================================================
// Tracks BOARD STATES ONLY (ignores whose turn it is).
// When a board appears for the 3rd time, the player who
// MADE THE MOVE that created that 3rd occurrence LOSES.
// 
// Example: A→B→A→B→A  (A=board state)
//   Move 1: X creates B (count A=1, B=1)
//   Move 2: O creates A (count A=2, B=1)
//   Move 3: X creates B (count A=2, B=2)
//   Move 4: O creates A (count A=3) → O loses!
// 
// This is simpler than chess-style (which tracks player-to-move)
// and directly penalizes cycling. Finite boards (~1.8M) guarantee
// termination because infinite play would require infinite distinct
// boards, which is impossible.
// ============================================================

function getBoardKey() {
  return board.join(','); // board only, no player
}

function recordPosition() {
  // Record initial slide-phase position (no mover, just setup)
  if (phase !== 'slide') return;
  const key = getBoardKey();
  history.set(key, (history.get(key) || 0) + 1);
}

function recordAndCheckRepetition(mover) {
  // Only track during slide phase
  if (phase !== 'slide') return false;
  
  const key = getBoardKey();
  const count = (history.get(key) || 0) + 1;
  history.set(key, count);
  
  // If this board has now appeared 3 times, the mover loses
  return count >= 3;
}

function getRepetitionCount() {
  if (phase !== 'slide') return 0;
  const key = getBoardKey();
  return history.get(key) || 0;
}

function render() {
  const cells = boardEl.querySelectorAll('.cell');
  cells.forEach((cell, idx) => {
    const val = board[idx];
    cell.textContent = val === X ? 'X' : val === O ? 'O' : '';
    cell.className = 'cell';
    if (val !== EMPTY) {
      cell.classList.add('occupied', PLAYER_CLASS[val]);
    }
    if (idx === selectedIdx) {
      cell.classList.add('selected');
    }
    if (gameOver && winner !== null && winningLine && winningLine.includes(idx)) {
      cell.classList.add('winner');
    }
  });

  // Draw winning line if game over with winner
  if (gameOver && winner !== null && winningLine) {
    drawWinningLine(winningLine);
  } else {
    removeWinningLine();
  }

  // Show pie choice buttons if in pie_choose phase
  let choiceDiv = document.getElementById('pie-choice');
  if (phase === 'pie_choose') {
    if (!choiceDiv) {
      choiceDiv = document.createElement('div');
      choiceDiv.id = 'pie-choice';
      choiceDiv.style.marginTop = '1rem';
      choiceDiv.innerHTML = `
        <p style="margin-bottom: 0.5rem;">O chooses:</p>
        <button id="pie-swap" style="margin-right: 0.5rem;">Swap (become X)</button>
        <button id="pie-keep">Keep (stay O)</button>
      `;
      statusEl.parentNode.insertBefore(choiceDiv, statusEl.nextSibling);
      document.getElementById('pie-swap').addEventListener('click', () => handlePieChoose('swap'));
      document.getElementById('pie-keep').addEventListener('click', () => handlePieChoose('keep'));
    }
    choiceDiv.style.display = 'block';
  } else if (choiceDiv) {
    choiceDiv.style.display = 'none';
  }
}

function drawWinningLine(line) {
  // Remove any existing line
  removeWinningLine();

  const [a, b, c] = line;
  const cells = boardEl.querySelectorAll('.cell');
  const cellA = cells[a];
  const cellC = cells[c];

  const boardRect = boardEl.getBoundingClientRect();
  const aRect = cellA.getBoundingClientRect();
  const cRect = cellC.getBoundingClientRect();

  const lineEl = document.createElement('div');
  lineEl.id = 'winning-line';
  lineEl.style.position = 'absolute';
  lineEl.style.pointerEvents = 'none';
  lineEl.style.zIndex = '10';
  lineEl.style.height = '4px';
  lineEl.style.background = winner === X ? '#d00' : '#00d';
  lineEl.style.borderRadius = '2px';
  lineEl.style.transformOrigin = 'left center';

  const dx = cRect.left - aRect.left;
  const dy = cRect.top - aRect.top;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  lineEl.style.width = `${length}px`;
  lineEl.style.left = `${aRect.left - boardRect.left + cellA.offsetWidth / 2}px`;
  lineEl.style.top = `${aRect.top - boardRect.top + cellA.offsetHeight / 2}px`;
  lineEl.style.transform = `rotate(${angle}deg)`;

  boardEl.style.position = 'relative';
  boardEl.appendChild(lineEl);
}

function removeWinningLine() {
  const existing = document.getElementById('winning-line');
  if (existing) existing.remove();
}

function checkWin(player) {
  for (const line of WIN_LINES) {
    if (line.every(idx => board[idx] === player)) {
      winningLine = line;
      return true;
    }
  }
  return false;
}

function checkWinningCell(idx, player) {
  for (const line of WIN_LINES) {
    if (line.includes(idx) && line.every(i => board[i] === player)) {
      return true;
    }
  }
  return false;
}

function updateStatus() {
  if (gameOver) {
    if (winner !== null) {
      if (winner === 'repetition') {
        // current is the player who gets the next turn (opponent of mover who caused repetition)
        statusEl.textContent = `${PLAYER_SYMBOL[current]} wins by 3-fold repetition!`;
        statusEl.style.color = current === X ? '#d00' : '#00d';
      } else {
        statusEl.textContent = `${PLAYER_SYMBOL[winner]} wins!`;
        statusEl.style.color = winner === X ? '#d00' : '#00d';
      }
    } else {
      statusEl.textContent = 'Draw (should not happen)';
    }
    return;
  }

  if (phase === 'pie') {
    statusEl.textContent = `X places first token (Pie Rule)`;
    statusEl.style.color = '#333';
  } else if (phase === 'pie_choose') {
    statusEl.textContent = `O chooses: Swap sides or Keep sides?`;
    statusEl.style.color = '#333';
  } else if (phase === 'place') {
    const num = placed[current] + 1;
    statusEl.textContent = `${PLAYER_SYMBOL[current]} to place (${num}/4)`;
    statusEl.style.color = '#333';
  } else {
    // Slide phase - show repetition count for current board
    const repCount = getRepetitionCount();
    const repText = repCount > 0 ? ` (board seen ${repCount}/3)` : '';
    statusEl.textContent = `${PLAYER_SYMBOL[current]} to slide${repText}`;
    statusEl.style.color = '#333';
    
    // Add tooltip explaining repetition rule on first slide phase entry
    if (repCount === 0 && !statusEl.hasAttribute('title')) {
      statusEl.title = '3-fold repetition: if same board appears 3×, player who caused it loses';
    }
  }
}

// Start
resetGame();