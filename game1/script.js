let gameState = {
  cards: [],
  flippedCards: [],
  matchedPairs: 0,
  moves: 0,
  startTime: null,
  timer: null,
  gridSize: 12,
  gameActive: false,
  previewMode: false,
  score: 0,
  hintsUsed: 0,
  maxHints: 3,
  soundEnabled: true,
  previewTime: 2,
  isPaused: false,
  pausedTime: 0,
  hintCooldown: false,
  hintCooldownTime: 10000, // 10 seconds cooldown
};

const symbols = [
  "🎮",
  "🚀",
  "⚡",
  "🔥",
  "💎",
  "🎯",
  "🌟",
  "💀",
  "🎪",
  "🎭",
  "🎨",
  "🎲",
  "🎸",
  "🎤",
  "🎧",
  "🎬",
  "📱",
  "💻",
  "⌚",
  "🔋",
  "🛸",
  "🎊",
  "🎈",
  "🎁",
  "🏆",
  "🥇",
  "💰",
  "🔮",
  "🎳",
  "🎰",
  "🦄",
  "🐉",
  "🔥",
  "❄️",
  "🌙",
  "☀️",
  "⭐",
  "💫",
  "🌈",
  "🍀",
  "🌺",
  "🌸",
  "🌼",
  "🌻",
  "🌹",
  "🌷",
  "🌴",
  "🌊",
  "🏔️",
  "🌍",
];

const difficulties = {
  12: { name: "EASY", grid: "4×3", pairs: 6, previewTime: 1500 }, // 1.5 seconds
  18: { name: "HARD", grid: "6×3", pairs: 9, previewTime: 3000 }, // 3 seconds
  36: { name: "EXPERT", grid: "6×6", pairs: 18, previewTime: 5000 }, // 5 seconds
};

function getRandomSeed() {
  return Date.now() + Math.random() * 1000000 + performance.now();
}

function createLinearCongruentialGenerator(seed) {
  let currentSeed = seed % 2147483647;
  if (currentSeed <= 0) currentSeed += 2147483646;

  return function () {
    currentSeed = (currentSeed * 16807) % 2147483647;
    return (currentSeed - 1) / 2147483646;
  };
}

function advancedShuffle(array) {
  const workArray = [...array];
  const seed = getRandomSeed();
  const rng = createLinearCongruentialGenerator(seed);

  for (let i = workArray.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [workArray[i], workArray[j]] = [workArray[j], workArray[i]];
  }

  const blockSize = Math.ceil(Math.sqrt(workArray.length));
  for (let start = 0; start < workArray.length; start += blockSize) {
    const end = Math.min(start + blockSize, workArray.length);
    const block = workArray.slice(start, end);

    // Shuffle within block
    for (let i = block.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [block[i], block[j]] = [block[j], block[i]];
    }

    // Replace original section
    workArray.splice(start, block.length, ...block);
  }

  const swapCount = Math.floor(workArray.length * 0.5);
  for (let i = 0; i < swapCount; i++) {
    const idx1 = Math.floor(Math.random() * workArray.length);
    const idx2 = Math.floor(Math.random() * workArray.length);
    [workArray[idx1], workArray[idx2]] = [workArray[idx2], workArray[idx1]];
  }

  const timeBasedSeed = (Date.now() % 1000) + (performance.now() % 1000);
  const timeLCG = createLinearCongruentialGenerator(timeBasedSeed);

  for (let i = workArray.length - 1; i > 0; i--) {
    const j = Math.floor(timeLCG() * (i + 1));
    [workArray[i], workArray[j]] = [workArray[j], workArray[i]];
  }

  return workArray;
}

function validateShuffle(originalArray, shuffledArray) {
  for (let i = 0; i < shuffledArray.length - 1; i++) {
    if (shuffledArray[i] === shuffledArray[i + 1]) {
      let swapIndex;
      do {
        swapIndex = Math.floor(Math.random() * shuffledArray.length);
      } while (Math.abs(swapIndex - i) <= 1 && swapIndex !== i);

      [shuffledArray[i], shuffledArray[swapIndex]] = [
        shuffledArray[swapIndex],
        shuffledArray[i],
      ];
    }
  }

  return shuffledArray;
}

function deepShuffle(array) {
  let result = advancedShuffle(array);
  if (window.lastMouseEvent) {
    const mouseSeed =
      (window.lastMouseEvent.clientX * window.lastMouseEvent.clientY) % 1000;
    const mouseRNG = createLinearCongruentialGenerator(mouseSeed);

    for (let i = 0; i < Math.floor(result.length * 0.3); i++) {
      const idx1 = Math.floor(mouseRNG() * result.length);
      const idx2 = Math.floor(mouseRNG() * result.length);
      [result[idx1], result[idx2]] = [result[idx2], result[idx1]];
    }
  }

  result = validateShuffle(array, result);

  return result;
}

// Track mouse events for additional entropy
document.addEventListener("mousemove", (e) => {
  window.lastMouseEvent = e;
});

function playSound(type) {
  if (!gameState.soundEnabled) return;

  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case "flip":
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        break;
      case "match":
        oscillator.frequency.value = 1200;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        break;
      case "wrong":
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        break;
      case "victory":
        oscillator.frequency.value = 1500;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        break;
      case "hint":
        oscillator.frequency.value = 1000;
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        break;
    }

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    console.log("Audio not supported");
  }
}

// Game Functions
function createGameGrid() {
  const totalPairs = gameState.gridSize / 2;
  const selectedSymbols = symbols.slice(0, totalPairs);
  const cardSymbols = [...selectedSymbols, ...selectedSymbols];

  gameState.cards = deepShuffle(cardSymbols);

  const grid = document.getElementById("gameGrid");
  grid.setAttribute("data-size", gameState.gridSize);
  grid.innerHTML = "";

  gameState.cards.forEach((symbol, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.index = index;
    card.dataset.symbol = symbol;
    card.addEventListener("click", flipCard);

    card.innerHTML = `
                    <div class="card-face card-back"></div>
                    <div class="card-face card-front">${symbol}</div>
                `;

    grid.appendChild(card);
  });

  startPreviewMode();
}

function startPreviewMode() {
  gameState.previewMode = true;

  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    card.classList.add("preview-mode");
  });

  const difficulty = difficulties[gameState.gridSize];
  const previewDuration = difficulty.previewTime;

  setTimeout(() => {
    endPreviewMode();
  }, previewDuration);
}

function endPreviewMode() {
  gameState.previewMode = false;
  gameState.gameActive = true;

  const cards = document.querySelectorAll(".card");
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.remove("preview-mode");
    }, index * 50);
  });
}

function flipCard() {
  if (
    !gameState.gameActive ||
    gameState.previewMode ||
    gameState.isPaused ||
    this.classList.contains("flipped") ||
    this.classList.contains("matched")
  ) {
    return;
  }

  if (gameState.flippedCards.length === 2) {
    return;
  }

  if (!gameState.startTime) {
    startTimer();
  }

  playSound("flip");
  this.classList.add("flipped");
  gameState.flippedCards.push(this);

  if (gameState.flippedCards.length === 2) {
    gameState.moves++;
    updateStats();
    checkMatch();
  }
}

function checkMatch() {
  const [card1, card2] = gameState.flippedCards;

  if (card1.dataset.symbol === card2.dataset.symbol) {
    setTimeout(() => {
      playSound("match");
      card1.classList.add("matched");
      card2.classList.add("matched");
      gameState.matchedPairs++;
      calculateScore();
      updateStats();

      if (gameState.matchedPairs === gameState.cards.length / 2) {
        endGame();
      }

      gameState.flippedCards = [];
    }, 600);
  } else {
    setTimeout(() => {
      playSound("wrong");
      card1.classList.add("wrong");
      card2.classList.add("wrong");

      setTimeout(() => {
        card1.classList.remove("flipped", "wrong");
        card2.classList.remove("flipped", "wrong");
        gameState.flippedCards = [];
      }, 600);
    }, 1000);
  }
}

function calculateScore() {
  const baseScore = 100;
  const difficultyMultiplier = Math.floor(gameState.gridSize / 6);
  const timeBonus = Math.max(
    0,
    500 - Math.floor((Date.now() - gameState.startTime) / 1000)
  );
  const movesPenalty = gameState.moves * 3;
  const hintPenalty = gameState.hintsUsed * 75;

  gameState.score = Math.max(
    0,
    baseScore * difficultyMultiplier + timeBonus - movesPenalty - hintPenalty
  );
}

function startTimer() {
  gameState.startTime = Date.now() - gameState.pausedTime;
  gameState.timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
  if (gameState.startTime && !gameState.isPaused) {
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    document.getElementById("timer").textContent = `${minutes}:${seconds}`;
  }
}

function updateStats() {
  document.getElementById("moves").textContent = gameState.moves;
  document.getElementById("matches").textContent = gameState.matchedPairs;
  document.getElementById("score").textContent = gameState.score;
}

function endGame() {
  gameState.gameActive = false;
  clearInterval(gameState.timer);

  playSound("victory");
  calculateScore();

  const finalTime = document.getElementById("timer").textContent;
  const accuracy = Math.round(
    ((gameState.matchedPairs * 2) / gameState.moves) * 100
  );
  const difficulty = difficulties[gameState.gridSize];

  setTimeout(() => {
    document.getElementById("modalTitle").textContent = "VICTORY!";
    document.getElementById("modalText").textContent =
      "Congratulations! You completed the memory challenge.";
    document.getElementById("modalStats").innerHTML = `
                    <p><strong>Final Score:</strong> ${gameState.score} points</p>
                    <p><strong>Time:</strong> ${finalTime}</p>
                    <p><strong>Moves:</strong> ${gameState.moves}</p>
                    <p><strong>Accuracy:</strong> ${accuracy}%</p>
                    <p><strong>Difficulty:</strong> ${difficulty.name} (${difficulty.grid})</p>
                    <p><strong>Hints Used:</strong> ${gameState.hintsUsed}/${gameState.maxHints}</p>
                `;
    showModal("gameModal");
  }, 1000);
}

function newGame() {
  closeModal();

  const currentGridSize = gameState.gridSize;
  const currentSoundEnabled = gameState.soundEnabled;
  const currentPreviewTime = gameState.previewTime;

  gameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    startTime: null,
    timer: null,
    gridSize: currentGridSize,
    gameActive: false,
    previewMode: false,
    score: 0,
    hintsUsed: 0,
    maxHints: 3,
    soundEnabled: currentSoundEnabled,
    previewTime: currentPreviewTime,
    isPaused: false,
    pausedTime: 0,
    hintCooldown: false,
    hintCooldownTime: 10000,
  };

  clearInterval(gameState.timer);
  document.getElementById("timer").textContent = "00:00";
  updateStats();
  updateHintsDisplay();
  createGameGrid();
}

function setLevel(size) {
  gameState.gridSize = size;
  document
    .querySelectorAll(".level-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");
  closeModal();
  newGame();
}

function pauseGame() {
  if (!gameState.gameActive) return;

  gameState.isPaused = true;
  clearInterval(gameState.timer);
  gameState.pausedTime = Date.now() - gameState.startTime;
  showModal("pauseModal");
}

function resumeGame() {
  if (gameState.isPaused) {
    gameState.isPaused = false;
    gameState.startTime = Date.now() - gameState.pausedTime;
    gameState.timer = setInterval(updateTimer, 1000);
    closeModal();
  }
}

function hintCard() {
  if (
    gameState.hintsUsed >= gameState.maxHints ||
    !gameState.gameActive ||
    gameState.previewMode ||
    gameState.hintCooldown
  )
    return;

  const unmatched = document.querySelectorAll(
    ".card:not(.matched):not(.flipped)"
  );
  if (unmatched.length < 2) return;

  const matchingPairs = [];
  for (let i = 0; i < unmatched.length; i++) {
    for (let j = i + 1; j < unmatched.length; j++) {
      if (unmatched[i].dataset.symbol === unmatched[j].dataset.symbol) {
        matchingPairs.push([unmatched[i], unmatched[j]]);
      }
    }
  }

  if (matchingPairs.length > 0) {
    const randomPair =
      matchingPairs[Math.floor(Math.random() * matchingPairs.length)];
    const [card1, card2] = randomPair;

    playSound("hint");
    card1.classList.add("hint");
    card2.classList.add("hint");

    setTimeout(() => {
      card1.classList.remove("hint");
      card2.classList.remove("hint");
    }, 2000);

    gameState.hintsUsed++;
    updateHintsDisplay();
    startHintCooldown();
  }
}

function startHintCooldown() {
  gameState.hintCooldown = true;
  const hintBtn = document.getElementById("hintBtn");
  const cooldownEl = document.getElementById("hintCooldown");

  hintBtn.disabled = true;

  let timeLeft = gameState.hintCooldownTime / 1000;
  const cooldownInterval = setInterval(() => {
    timeLeft--;
    cooldownEl.textContent = `${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(cooldownInterval);
      gameState.hintCooldown = false;
      hintBtn.disabled = false;
      cooldownEl.textContent = "Ready";
    }
  }, 1000);
}

function updateHintsDisplay() {
  const hintsLeft = gameState.maxHints - gameState.hintsUsed;
  document.getElementById("hintsLeft").textContent = hintsLeft;
  document.getElementById("hintBtn").setAttribute("data-hints", hintsLeft);

  if (hintsLeft === 0) {
    document.getElementById("hintBtn").disabled = true;
  }
}

function toggleSound() {
  gameState.soundEnabled = !gameState.soundEnabled;
  const soundBtn = document.getElementById("soundToggle");
  const soundSetting = document.getElementById("soundSetting");

  if (gameState.soundEnabled) {
    soundBtn.textContent = "🔊";
    soundBtn.classList.remove("muted");
    if (soundSetting) soundSetting.textContent = "ON";
  } else {
    soundBtn.textContent = "🔇";
    soundBtn.classList.add("muted");
    if (soundSetting) soundSetting.textContent = "OFF";
  }
}

function changePreviewTime() {
  const times = [1, 2, 3, 4, 5];
  const currentIndex = times.indexOf(gameState.previewTime);
  const nextIndex = (currentIndex + 1) % times.length;
  gameState.previewTime = times[nextIndex];
  document.getElementById(
    "previewTime"
  ).textContent = `${gameState.previewTime}s`;
}

// Modal Functions
function showModal(modalId) {
  document.getElementById(modalId).style.display = "flex";
}

function closeModal() {
  document.querySelectorAll(".overlay").forEach((modal) => {
    modal.style.display = "none";
  });
}

function showLevels() {
  showModal("levelModal");
}

function showInstructions() {
  showModal("instructionsModal");
}

function showSettings() {
  showModal("settingsModal");
}

// Keyboard Controls
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "n":
    case "N":
      newGame();
      break;
    case "p":
    case "P":
      if (gameState.gameActive) pauseGame();
      break;
    case "h":
    case "H":
      hintCard();
      break;
    case "Escape":
      closeModal();
      break;
    case "m":
    case "M":
      toggleSound();
      break;
  }
});

// Initialize game
updateHintsDisplay();
newGame();
