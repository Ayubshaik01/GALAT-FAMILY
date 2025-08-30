const boardEl = document.getElementById("board");
const cells = () => Array.from(boardEl.querySelectorAll(".cell"));
const statusEl = document.getElementById("status");
const bannerEl = document.getElementById("banner");

const scoreXEl = document.getElementById("score-x");
const scoreOEl = document.getElementById("score-o");
const scoreDrawEl = document.getElementById("score-draw");

const undoBtn = document.getElementById("undo");
const restartBtn = document.getElementById("restart");
const newRoundBtn = document.getElementById("new-round");
const resetScoresBtn = document.getElementById("reset-scores");
const soundToggle = document.getElementById("soundToggle");
const modeButtons = document.querySelectorAll(".mode-btn");

// Game state
let board = Array(9).fill(null); // null | 'X' | 'O'
let history = []; // previous board states for undo
let currentPlayer = "X"; // 'X' or 'O'
let gameActive = true; // false when round ends
let scores = { X: 0, O: 0, Draw: 0 }; // persisted
let lastRoundResult = null; // store last round winner to revert on undo if necessary

// Settings
let mode = "2p"; // '2p' | 'ai-easy' | 'ai-hard'
let soundOn = false;

// Winning combos
const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

initGame();

function initGame() {
  const saved = safeParse(localStorage.getItem("nbttt-scores"));
  if (saved && typeof saved === "object") scores = Object.assign(scores, saved);
  updateScoreUI();
  boardEl.addEventListener("click", onBoardClick);
  boardEl.addEventListener("keydown", onBoardKeyDown);
  undoBtn.addEventListener("click", undoMove);
  restartBtn.addEventListener("click", restartRound);
  newRoundBtn.addEventListener("click", () => startRound("X"));
  resetScoresBtn.addEventListener("click", resetScores);
  soundToggle.addEventListener("click", toggleSound);

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", onModeButtonClick);
  });

  ensureCells();

  // Start first round
  startRound("X");
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

function startRound(startingPlayer = "X") {
  clearWinHighlights();

  board = Array(9).fill(null);
  history = [];
  currentPlayer = startingPlayer;
  gameActive = true;
  lastRoundResult = null;
  updateUI();
  announce(`${currentPlayer}'s turn`);
  if (mode !== "2p" && currentPlayer === "O") {
    setTimeout(() => aiMove(), 220);
  }
}

function onBoardClick(e) {
  const btn = e.target.closest(".cell");
  if (!btn) return;
  const idx = Number(btn.dataset.index);
  handleCellClick(idx);
}

function handleCellClick(index) {
  if (!gameActive) {
    showBanner("Round over — start a new round", 800);
    return;
  }
  if (typeof index !== "number" || index < 0 || index > 8) return;

  if (board[index] !== null) {
    showBanner("Invalid move!", 800);
    playDenySound();
    return;
  }

  history.push(board.slice());

  board[index] = currentPlayer;
  const cell = boardEl.querySelector(`.cell[data-index="${index}"]`);
  cell.classList.add("cell-click");
  setTimeout(() => cell.classList.remove("cell-click"), 300);
  playClickSound();
  updateUI();

  // Check for winner or draw
  const win = checkWinner(board);
  if (win) {
    gameActive = false;
    highlightWin(win.combo);
    scores[win.winner] = (scores[win.winner] || 0) + 1;
    lastRoundResult = { winner: win.winner, combo: win.combo };
    persistScores();
    updateScoreUI();
    playWinSound();
    const celebration = document.createElement("div");
    celebration.className = "celebration";
    document.body.appendChild(celebration);
    setTimeout(() => celebration.remove(), 1000);

    announce(`${win.winner} wins!`);
    return;
  }

  if (isDraw(board)) {
    gameActive = false;
    scores.Draw = (scores.Draw || 0) + 1;
    lastRoundResult = { winner: "Draw" };
    persistScores();
    updateScoreUI();
    playDrawSound();
    announce(`It's a draw`);
    return;
  }

  togglePlayer();

  if (mode !== "2p" && currentPlayer === "O") {
    // AI turn
    setTimeout(() => aiMove(), 180);
  }
}

function togglePlayer() {
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  announce(`${currentPlayer}'s turn`);
}

function checkWinner(b) {
  for (const line of WIN_LINES) {
    const [a, b1, c] = line;
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
      return { winner: b[a], combo: line.slice() };
    }
  }
  return null;
}

// Draw detection
function isDraw(b) {
  return b.every((cell) => cell !== null) && !checkWinner(b);
}

function updateUI() {
  cells().forEach((btn, idx) => {
    const val = board[idx];
    btn.textContent = val || "";
    btn.setAttribute("aria-label", `Cell ${idx + 1}, ${val ? val : "empty"}`);
    if (val !== null) {
      btn.dataset.filled = "true";
    } else {
      delete btn.dataset.filled;
    }
  });
}

// Highlight winning trio (adds .win class)
function highlightWin(combo) {
  combo.forEach((i) => {
    const btn = boardEl.querySelector(`.cell[data-index="${i}"]`);
    if (btn) btn.classList.add("win");
  });
}

// Clear win highlights
function clearWinHighlights() {
  cells().forEach((c) => c.classList.remove("win"));
}

function undoMove() {
  if (history.length === 0) {
    showBanner("Nothing to undo", 600);
    return;
  }

  if (!gameActive && lastRoundResult) {
    if (lastRoundResult.winner === "Draw") {
      scores.Draw = Math.max(0, (scores.Draw || 0) - 1);
    } else if (lastRoundResult.winner) {
      scores[lastRoundResult.winner] = Math.max(
        0,
        (scores[lastRoundResult.winner] || 0) - 1
      );
    }
    persistScores();
    updateScoreUI();
    lastRoundResult = null;
  }

  board = history.pop();
  gameActive = true;
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  clearWinHighlights();
  updateUI();
  announce(`${currentPlayer}'s turn`);
}

function restartRound() {
  startRound("X");
}

function aiMove() {
  if (!gameActive) return;
  let move = null;
  if (mode === "ai-easy") {
    const empties = board
      .map((v, i) => (v === null ? i : null))
      .filter((i) => i !== null);
    move = empties[Math.floor(Math.random() * empties.length)];
  } else if (mode === "ai-hard") {
    move = findBestMoveMinimax(board, "O");
  }
  if (typeof move === "number" && move >= 0) {
    handleCellClick(move);
  }
}

// Minimax wrapper: returns best index for player 'O' (AI)
function findBestMoveMinimax(b, aiPlayer) {
  const empties = b
    .map((v, i) => (v === null ? i : null))
    .filter((i) => i !== null);
  if (empties.length === 0) return null;

  let bestScore = -Infinity;
  let bestMove = empties[0];

  for (const idx of empties) {
    b[idx] = aiPlayer;
    const score = minimax(b, false, aiPlayer);
    b[idx] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }
  return bestMove;
}

function minimax(b, isMaximizing, aiPlayer) {
  const opponent = aiPlayer === "O" ? "X" : "O";
  const win = checkWinner(b);
  if (win) {
    if (win.winner === aiPlayer) return +10;
    if (win.winner === opponent) return -10;
  }
  if (isDraw(b)) return 0;

  // Explore moves
  const empties = b
    .map((v, i) => (v === null ? i : null))
    .filter((i) => i !== null);
  let best = isMaximizing ? -Infinity : +Infinity;

  for (const idx of empties) {
    b[idx] = isMaximizing ? aiPlayer : opponent;
    const score = minimax(b, !isMaximizing, aiPlayer);
    b[idx] = null;
    if (isMaximizing) {
      best = Math.max(best, score);
    } else {
      best = Math.min(best, score);
    }
  }
  return best;
}
function onBoardKeyDown(e) {
  const focusable = cells();
  const current = document.activeElement;
  const idx = focusable.indexOf(current);
  if (idx === -1) return;

  let next = idx;
  switch (e.key) {
    case "ArrowRight":
      e.preventDefault();
      next = (idx + 1) % 9;
      break;
    case "ArrowLeft":
      e.preventDefault();
      next = (idx + 8) % 9;
      break;
    case "ArrowDown":
      e.preventDefault();
      next = (idx + 3) % 9;
      break;
    case "ArrowUp":
      e.preventDefault();
      next = (idx + 6) % 9;
      break;
    case "Enter":
    case " ":
      e.preventDefault();
      handleCellClick(idx);
      return;
    default:
      return;
  }
  focusable[next].focus();
}

let bannerTimer = null;
function showBanner(text, duration = 800) {
  bannerEl.textContent = text;
  bannerEl.style.display = "block";
  if (bannerTimer) clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => {
    bannerEl.style.display = "none";
    bannerEl.textContent = "";
  }, duration);
}

function announce(text) {
  statusEl.textContent = text;
}
function createAudioContext() {
  return new (window.AudioContext || window.webkitAudioContext)();
}

function playClickSound() {
  if (!soundOn) return;
  try {
    const ctx = createAudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 440;
    g.gain.value = 0.1;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    o.stop(ctx.currentTime + 0.1);
  } catch (e) {
    /* ignore if unavailable */
  }
}

function playDenySound() {
  if (!soundOn) return;
  try {
    const ctx = createAudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(330, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
    g.gain.value = 0.07;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.15);
  } catch (e) {
    /* ignore */
  }
}

function playWinSound() {
  if (!soundOn) return;
  try {
    const ctx = createAudioContext();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = 0.1;
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.1);
      g.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + i * 0.1 + 0.3
      );
      o.stop(ctx.currentTime + i * 0.1 + 0.3);
    });
  } catch (e) {
    /* ignore */
  }
}

function playDrawSound() {
  if (!soundOn) return;
  try {
    const ctx = createAudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(440, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.2);
    g.gain.value = 0.1;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    o.stop(ctx.currentTime + 0.2);
  } catch (e) {
    /* ignore */
  }
}
function persistScores() {
  try {
    localStorage.setItem("nbttt-scores", JSON.stringify(scores));
  } catch (e) {}
}

function updateScoreUI() {
  scoreXEl.textContent = scores.X || 0;
  scoreOEl.textContent = scores.O || 0;
  scoreDrawEl.textContent = scores.Draw || 0;
}

function ensureCells() {
  cells().forEach((btn, i) => {
    btn.setAttribute("data-index", String(i));
    btn.setAttribute("role", "gridcell");
    btn.tabIndex = 0;
  });
}

function onModeButtonClick(e) {
  const newMode = e.target.dataset.mode;
  if (newMode === mode) return;
  modeButtons.forEach((btn) => {
    btn.classList.remove("active");
  });
  e.target.classList.add("active");

  mode = newMode;
  playClickSound();
  startRound("X");
}

function restartRound() {
  startRound("X");
}

function toggleSound() {
  soundOn = !soundOn;
  soundToggle.setAttribute("data-muted", (!soundOn).toString());
  if (soundOn) {
    playClickSound();
  }
}

// Reset all scores to zero
function resetScores() {
  scores = { X: 0, O: 0, Draw: 0 };
  persistScores();
  updateScoreUI();
  showBanner("Scores reset!", 800);
  playClickSound();
}
updateUI();
updateScoreUI();
const firstCell = boardEl.querySelector('.cell[data-index="0"]');
if (firstCell) firstCell.tabIndex = 0;

window.nbttt = {
  getState: () => ({
    board: board.slice(),
    currentPlayer,
    gameActive,
    historyLength: history.length,
    scores,
  }),
  startRound,
  undoMove,
};
