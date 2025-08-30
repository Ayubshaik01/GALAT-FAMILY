const gameState = {
  currentLevel: 1,
  score: 0,
  timeLeft: 60,
  maxTime: 60,
  timerInterval: null,
  isGameActive: false,
  dropZoneCards: [],
  wordPoolCards: [],
  draggedCard: null,
  currentStory: null,
  autoCheckTimeout: null,
  touchStartPos: null,
  isDragging: false,
  hintsUsed: 0,
};

const storyLevels = [
  {
    level: 1,
    stories: [
      { words: ["The", "cat", "sleeps"], correctOrder: [0, 1, 2] },
      { words: ["Birds", "can", "fly"], correctOrder: [0, 1, 2] },
      { words: ["Dogs", "love", "treats"], correctOrder: [0, 1, 2] },
      { words: ["Rain", "is", "falling"], correctOrder: [0, 1, 2] },
      { words: ["Stars", "shine", "bright"], correctOrder: [0, 1, 2] },
      { words: ["Fire", "burns", "hot"], correctOrder: [0, 1, 2] },
      { words: ["Kids", "play", "games"], correctOrder: [0, 1, 2] },
      { words: ["Books", "teach", "wisdom"], correctOrder: [0, 1, 2] },
    ],
    timeLimit: 30,
  },
  {
    level: 2,
    stories: [
      {
        words: ["Yesterday", "I", "walked", "to", "the", "bright", "store"],
        correctOrder: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        words: ["The", "quick", "brown", "fox", "jumps", "over", "fences"],
        correctOrder: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        words: ["Children", "were", "playing", "in", "the", "sunny", "park"],
        correctOrder: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        words: [
          "My",
          "grandmother",
          "bakes",
          "delicious",
          "chocolate",
          "chip",
          "cookies",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        words: ["The", "old", "tree", "stands", "tall", "in", "winter"],
        correctOrder: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        words: [
          "Fresh",
          "morning",
          "coffee",
          "smells",
          "absolutely",
          "wonderful",
          "today",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6],
      },
      {
        words: [
          "Colorful",
          "butterflies",
          "dance",
          "gracefully",
          "among",
          "blooming",
          "flowers",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6],
      },
    ],
    timeLimit: 60,
  },
  {
    level: 3,
    stories: [
      {
        words: [
          "Every",
          "morning",
          "the",
          "sun",
          "rises",
          "over",
          "the",
          "beautiful",
          "mountain",
          "peaks",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      },
      {
        words: [
          "The",
          "ancient",
          "lighthouse",
          "guides",
          "ships",
          "safely",
          "through",
          "dangerous",
          "rocky",
          "waters",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      },
      {
        words: [
          "Scientists",
          "discovered",
          "amazing",
          "fossils",
          "buried",
          "deep",
          "beneath",
          "layers",
          "of",
          "sediment",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      },
      {
        words: [
          "The",
          "mysterious",
          "castle",
          "stands",
          "proudly",
          "on",
          "top",
          "of",
          "the",
          "hill",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      },
      {
        words: [
          "Talented",
          "musicians",
          "performed",
          "beautiful",
          "symphonies",
          "for",
          "the",
          "enthusiastic",
          "concert",
          "audience",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      },
      {
        words: [
          "Wild",
          "animals",
          "roam",
          "freely",
          "across",
          "the",
          "vast",
          "African",
          "safari",
          "plains",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      },
    ],
    timeLimit: 90,
  },
  {
    level: 4,
    stories: [
      {
        words: [
          "The",
          "brave",
          "explorer",
          "discovered",
          "a",
          "hidden",
          "treasure",
          "chest",
          "buried",
          "deep",
          "in",
          "the",
          "cave",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
      {
        words: [
          "During",
          "the",
          "storm",
          "lightning",
          "illuminated",
          "the",
          "dark",
          "sky",
          "while",
          "thunder",
          "echoed",
          "through",
          "valleys",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
      {
        words: [
          "The",
          "wise",
          "old",
          "wizard",
          "taught",
          "young",
          "apprentices",
          "powerful",
          "magic",
          "spells",
          "in",
          "his",
          "tower",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
      {
        words: [
          "Graceful",
          "dolphins",
          "swim",
          "playfully",
          "through",
          "crystal",
          "clear",
          "ocean",
          "waters",
          "near",
          "tropical",
          "coral",
          "reefs",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      },
    ],
    timeLimit: 120,
  },
  {
    level: 5,
    stories: [
      {
        words: [
          "The",
          "magnificent",
          "spaceship",
          "traveled",
          "through",
          "countless",
          "galaxies",
          "searching",
          "for",
          "new",
          "planets",
          "to",
          "explore",
          "and",
          "colonize",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      },
      {
        words: [
          "Ancient",
          "civilizations",
          "built",
          "incredible",
          "monuments",
          "that",
          "continue",
          "to",
          "amaze",
          "archaeologists",
          "and",
          "historians",
          "around",
          "the",
          "world",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      },
      {
        words: [
          "The",
          "dedicated",
          "gardener",
          "carefully",
          "tended",
          "to",
          "hundreds",
          "of",
          "different",
          "flowers",
          "creating",
          "a",
          "spectacular",
          "botanical",
          "paradise",
        ],
        correctOrder: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      },
    ],
    timeLimit: 150,
  },
];

const elements = {
  levelDisplay: document.getElementById("level-display"),
  scoreDisplay: document.getElementById("score-display"),
  targetDisplay: document.getElementById("target-display"),
  timerBar: document.getElementById("timer-bar"),
  timerText: document.getElementById("timer-text"),
  dropZone: document.getElementById("drop-zone"),
  dropZoneCards: document.getElementById("drop-zone-cards"),
  wordPool: document.getElementById("word-pool"),
  wordCards: document.getElementById("word-cards"),
  feedback: document.getElementById("feedback"),
  nextBtn: document.getElementById("next-btn"),
  replayBtn: document.getElementById("replay-btn"),
  shareBtn: document.getElementById("share-btn"),
  hintBtn: document.getElementById("hint-btn"),
  howToPlayBtn: document.getElementById("how-to-play-btn"),
  howToPlayModal: document.getElementById("howToPlayModal"),
  closeModal: document.getElementById("closeModal"),
  startGameBtn: document.getElementById("startGameBtn"),
  gameOverModal: document.getElementById("gameOverModal"),
  gameOverMessage: document.getElementById("gameOverMessage"),
  retryBtn: document.getElementById("retryBtn"),
  newStoryBtn: document.getElementById("newStoryBtn"),
};

// Utility Functions
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomStory(level) {
  const levelData = storyLevels[level - 1];
  if (!levelData) return null;

  const randomIndex = Math.floor(Math.random() * levelData.stories.length);
  return {
    ...levelData.stories[randomIndex],
    timeLimit: levelData.timeLimit,
  };
}

function updateDisplay() {
  elements.levelDisplay.textContent = gameState.currentLevel;
  elements.scoreDisplay.textContent = gameState.score;
  elements.targetDisplay.textContent = gameState.currentStory
    ? gameState.currentStory.words.length
    : 0;
}

function showFeedback(message, type) {
  elements.feedback.textContent = message;
  elements.feedback.className = `feedback ${type}`;
}

function clearFeedback() {
  elements.feedback.textContent = "Arrange the words in the correct order";
  elements.feedback.className = "feedback";
}

// Modal Functions
function showModal() {
  elements.howToPlayModal.classList.add("active");
  if (gameState.timerInterval) {
    stopTimer();
  }
}

function hideModal() {
  elements.howToPlayModal.classList.remove("active");
  if (gameState.isGameActive && gameState.timeLeft > 0) {
    startTimer();
  }
}

function showGameOverModal(message) {
  elements.gameOverMessage.textContent = message;
  elements.gameOverModal.classList.add("active");
}

function hideGameOverModal() {
  elements.gameOverModal.classList.remove("active");
}

// Timer Functions
function startTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
  }

  if (!gameState.timeLeft || gameState.timeLeft === gameState.maxTime) {
    gameState.timeLeft = gameState.currentStory.timeLimit;
    gameState.maxTime = gameState.currentStory.timeLimit;
  }

  updateTimerDisplay();

  gameState.timerInterval = setInterval(() => {
    gameState.timeLeft--;
    updateTimerDisplay();

    if (gameState.timeLeft <= 0) {
      handleTimeUp();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const percentage = Math.max(
    0,
    (gameState.timeLeft / gameState.maxTime) * 100
  );
  elements.timerBar.style.width = `${percentage}%`;
  elements.timerText.textContent = `${Math.max(0, gameState.timeLeft)}s`;

  // Change color based on time remaining
  if (percentage <= 20) {
    elements.timerBar.style.backgroundColor = "#cc0000";
  } else if (percentage <= 50) {
    elements.timerBar.style.backgroundColor = "#ff6600";
  } else {
    elements.timerBar.style.backgroundColor = "black";
  }
}

function stopTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
}

function handleTimeUp() {
  stopTimer();
  gameState.isGameActive = false;

  const currentStoryText = gameState.currentStory.words.join(" ");
  const message = `Time's up! The correct story was: "${currentStoryText}"`;

  showGameOverModal(message);
}

// Enhanced Card Functions
function createCard(word, index) {
  const card = document.createElement("div");
  card.className = "word-card";
  card.textContent = word;
  card.draggable = true;
  card.dataset.index = index;
  card.dataset.word = word;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Word: ${word}`);
  card.tabIndex = 0;

  // Desktop drag events
  card.addEventListener("dragstart", handleDragStart);
  card.addEventListener("dragend", handleDragEnd);

  // Mouse events
  card.addEventListener("mousedown", handleMouseDown);

  // Touch events for mobile
  card.addEventListener("touchstart", handleTouchStart, { passive: false });
  card.addEventListener("touchmove", handleTouchMove, { passive: false });
  card.addEventListener("touchend", handleTouchEnd, { passive: false });

  // Keyboard support
  card.addEventListener("keydown", handleCardKeydown);

  // Click support for easier interaction
  card.addEventListener("click", handleCardClick);

  return card;
}

function renderCards() {
  if (!gameState.currentStory) return;

  const shuffledIndices = shuffleArray([
    ...Array(gameState.currentStory.words.length).keys(),
  ]);

  elements.wordCards.innerHTML = "";
  gameState.wordPoolCards = [];

  shuffledIndices.forEach((index) => {
    const card = createCard(gameState.currentStory.words[index], index);
    elements.wordCards.appendChild(card);
    gameState.wordPoolCards.push(card);
  });
}

// Enhanced Drag and Drop Handlers
function handleDragStart(e) {
  if (!gameState.isGameActive) {
    e.preventDefault();
    return;
  }

  console.log("Drag start:", e.target.textContent);
  gameState.draggedCard = e.target;
  gameState.isDragging = true;
  e.dataTransfer.setData("text/plain", e.target.dataset.index);
  e.dataTransfer.setData("text/word", e.target.dataset.word);
  e.dataTransfer.effectAllowed = "move";
  e.target.classList.add("dragging");
  if (gameState.autoCheckTimeout) {
    clearTimeout(gameState.autoCheckTimeout);
  }
  setTimeout(() => {
    if (gameState.draggedCard) {
      gameState.draggedCard.classList.add("ghost");
    }
  }, 0);
}

function handleDragEnd(e) {
  console.log("Drag end");
  e.target.classList.remove("dragging", "ghost");
  gameState.draggedCard = null;
  gameState.isDragging = false;
  elements.dropZone.classList.remove("drag-over");
}

function handleMouseDown(e) {
  if (!gameState.isGameActive) return;
  console.log("Mouse down on:", e.target.textContent);
}

// Touch handlers for mobile
function handleTouchStart(e) {
  if (!gameState.isGameActive) return;

  console.log("Touch start:", e.target.textContent);
  gameState.draggedCard = e.target;
  gameState.isDragging = true;
  gameState.touchStartPos = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
  };

  e.target.classList.add("dragging");

  if (gameState.autoCheckTimeout) {
    clearTimeout(gameState.autoCheckTimeout);
  }
}

function handleTouchMove(e) {
  if (!gameState.draggedCard || !gameState.isDragging) return;

  e.preventDefault();
  const touch = e.touches[0];
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  if (elementBelow) {
    if (elementBelow.closest(".drop-zone")) {
      elements.dropZone.classList.add("drag-over");
    } else {
      elements.dropZone.classList.remove("drag-over");
    }
  }
}

function handleTouchEnd(e) {
  if (!gameState.draggedCard) return;

  console.log("Touch end");
  const touch = e.changedTouches[0];
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);

  gameState.draggedCard.classList.remove("dragging");
  elements.dropZone.classList.remove("drag-over");

  if (elementBelow) {
    const dropZone = elementBelow.closest(".drop-zone");
    const wordPool = elementBelow.closest(".word-pool");

    if (dropZone && !gameState.draggedCard.closest("#drop-zone-cards")) {
      console.log("Moving to drop zone via touch");
      moveToDropZone(gameState.draggedCard);
    } else if (wordPool && !gameState.draggedCard.closest("#word-cards")) {
      console.log("Moving to word pool via touch");
      moveToWordPool(gameState.draggedCard);
    }
  }

  gameState.draggedCard = null;
  gameState.isDragging = false;
  gameState.touchStartPos = null;
}

function handleCardKeydown(e) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    if (e.target.closest("#word-cards")) {
      moveToDropZone(e.target);
    } else {
      moveToWordPool(e.target);
    }
  }
}

function handleCardClick(e) {
  if (!gameState.isGameActive || gameState.isDragging) return;

  console.log("Card clicked:", e.target.textContent);
  if (e.target.closest("#word-cards")) {
    console.log("Moving to drop zone via click");
    moveToDropZone(e.target);
  } else if (e.target.closest("#drop-zone-cards")) {
    console.log("Moving to word pool via click");
    moveToWordPool(e.target);
  }
}

function moveToDropZone(card) {
  if (!gameState.isGameActive) return;

  console.log("Moving card to drop zone:", card.textContent);

  // Remove from word pool tracking
  const poolIndex = gameState.wordPoolCards.indexOf(card);
  if (poolIndex > -1) {
    gameState.wordPoolCards.splice(poolIndex, 1);
  }
  elements.dropZoneCards.appendChild(card);
  gameState.dropZoneCards.push(card);
  updateDropZoneState();
  scheduleAutoCheck();
}

function moveToWordPool(card) {
  if (!gameState.isGameActive) return;

  console.log("Moving card to word pool:", card.textContent);
  const dropIndex = gameState.dropZoneCards.indexOf(card);
  if (dropIndex > -1) {
    gameState.dropZoneCards.splice(dropIndex, 1);
  }
  elements.wordCards.appendChild(card);
  gameState.wordPoolCards.push(card);
  updateDropZoneState();
  if (gameState.dropZoneCards.length === 0) {
    clearFeedback();
  }
}

function updateDropZoneState() {
  elements.dropZone.classList.toggle(
    "has-cards",
    gameState.dropZoneCards.length > 0
  );
}

function scheduleAutoCheck() {
  if (gameState.autoCheckTimeout) {
    clearTimeout(gameState.autoCheckTimeout);
  }

  gameState.autoCheckTimeout = setTimeout(() => {
    if (
      gameState.dropZoneCards.length === gameState.currentStory.words.length
    ) {
      checkAnswer();
    }
  }, 500);
}

function setupDropZone() {
  elements.dropZone.addEventListener("dragover", handleDragOver);
  elements.dropZone.addEventListener("drop", handleDrop);
  elements.dropZone.addEventListener("dragleave", handleDragLeave);
  elements.dropZone.addEventListener("dragenter", handleDragEnter);
  elements.wordPool.addEventListener("dragover", handleWordPoolDragOver);
  elements.wordPool.addEventListener("drop", handleWordPoolDrop);
}

function handleDragEnter(e) {
  if (!gameState.isGameActive || !gameState.draggedCard) return;
  e.preventDefault();
  console.log("Drag enter drop zone");
}

function handleDragOver(e) {
  if (!gameState.isGameActive || !gameState.draggedCard) return;

  e.preventDefault();
  elements.dropZone.classList.add("drag-over");
  console.log("Drag over drop zone");
}

function handleDrop(e) {
  if (!gameState.isGameActive) return;

  e.preventDefault();
  console.log("Drop on drop zone");
  elements.dropZone.classList.remove("drag-over");

  const cardIndex = e.dataTransfer.getData("text/plain");
  const cardWord = e.dataTransfer.getData("text/word");

  if (cardIndex !== "" && gameState.draggedCard) {
    if (!gameState.draggedCard.closest("#drop-zone-cards")) {
      console.log("Moving to drop zone via drop");
      moveToDropZone(gameState.draggedCard);
    }
  }
}

function handleDragLeave(e) {
  if (!e.relatedTarget || !elements.dropZone.contains(e.relatedTarget)) {
    elements.dropZone.classList.remove("drag-over");
    console.log("Drag leave drop zone");
  }
}

function handleWordPoolDragOver(e) {
  if (!gameState.isGameActive || !gameState.draggedCard) return;
  e.preventDefault();
  console.log("Drag over word pool");
}

function handleWordPoolDrop(e) {
  if (!gameState.isGameActive) return;

  e.preventDefault();
  console.log("Drop on word pool");

  if (gameState.draggedCard && !gameState.draggedCard.closest("#word-cards")) {
    console.log("Moving to word pool via drop");
    moveToWordPool(gameState.draggedCard);
  }
}

// Game Logic
function checkAnswer() {
  if (
    !gameState.currentStory ||
    gameState.dropZoneCards.length !== gameState.currentStory.words.length
  ) {
    return false;
  }

  const userOrder = gameState.dropZoneCards.map((card) =>
    parseInt(card.dataset.index)
  );
  const isCorrect =
    JSON.stringify(userOrder) ===
    JSON.stringify(gameState.currentStory.correctOrder);

  if (isCorrect) {
    stopTimer();
    const bonusPoints = Math.floor(gameState.timeLeft * 3);
    const levelPoints = 100 + gameState.currentLevel * 50;
    const hintPenalty = gameState.hintsUsed * 25;
    const totalPoints = Math.max(0, levelPoints + bonusPoints - hintPenalty);

    gameState.score += totalPoints;
    gameState.isGameActive = false;

    let message = `✅ Perfect! +${levelPoints} points +${bonusPoints} time bonus`;
    if (hintPenalty > 0) {
      message += ` -${hintPenalty} hint penalty`;
    }

    showFeedback(message, "success");
    elements.shareBtn.style.display = "inline-block";

    if (gameState.currentLevel < storyLevels.length) {
      elements.nextBtn.style.display = "inline-block";
    } else {
      showFeedback(
        `🎉 Game Complete! Final Score: ${gameState.score}`,
        "success"
      );
    }

    updateDisplay();
    return true;
  } else {
    showFeedback("❌ Not quite right! Keep trying...", "error");
    return false;
  }
}

// Hints
function showHint() {
  if (!gameState.currentStory || !gameState.isGameActive) return;

  gameState.hintsUsed++;

  const hints = [
    `🔤 This story has ${gameState.currentStory.words.length} words`,
    `📝 Look for words that typically start sentences`,
    `🎯 Think about subject-verb-object order`,
    `💡 Articles like "the" usually come before nouns`,
    `🔍 Past tense words often end in -ed`,
    `📚 Adjectives describe nouns and come before them`,
    `⏰ Time words often come at the beginning`,
    `🏃 Action words (verbs) follow the subject`,
  ];

  let selectedHint;
  const words = gameState.currentStory.words;

  if (words.some((word) => word.toLowerCase().includes("the"))) {
    selectedHint = `💡 Look for articles like "the" - they usually come before nouns`;
  } else if (words.some((word) => word.endsWith("ed"))) {
    selectedHint = `🔍 Past tense words ending in -ed can give you clues about timing`;
  } else if (words.some((word) => word.endsWith("ly"))) {
    selectedHint = `⭐ Words ending in -ly are often adverbs that describe actions`;
  } else {
    selectedHint = hints[Math.floor(Math.random() * hints.length)];
  }

  showFeedback(selectedHint, "neutral");

  setTimeout(() => {
    if (gameState.isGameActive) {
      clearFeedback();
    }
  }, 4000);
}

function startLevel(level, sameStory = false) {
  gameState.currentLevel = level;

  if (!sameStory) {
    gameState.currentStory = getRandomStory(level);
  }

  gameState.hintsUsed = 0;

  if (!gameState.currentStory) {
    showFeedback("🎉 You've completed all levels!", "success");
    return;
  }

  gameState.isGameActive = true;
  gameState.dropZoneCards = [];
  gameState.wordPoolCards = [];
  gameState.draggedCard = null;
  gameState.isDragging = false;
  gameState.timeLeft = gameState.currentStory.timeLimit;
  gameState.maxTime = gameState.currentStory.timeLimit;
  elements.dropZoneCards.innerHTML = "";
  elements.wordCards.innerHTML = "";
  elements.nextBtn.style.display = "none";
  elements.shareBtn.style.display = "none";

  updateDisplay();
  renderCards();
  updateDropZoneState();
  showFeedback(
    `Level ${level} - ${
      sameStory ? "Try again!" : "New story loaded!"
    } Arrange the words correctly.`,
    "neutral"
  );
  startTimer();
}

function nextLevel() {
  if (gameState.currentLevel < storyLevels.length) {
    startLevel(gameState.currentLevel + 1);
  }
}

function replayGame() {
  stopTimer();
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.hintsUsed = 0;
  startLevel(1);
}

function retryCurrentStory() {
  hideGameOverModal();
  startLevel(gameState.currentLevel, true);
}

function tryNewStory() {
  hideGameOverModal();
  startLevel(gameState.currentLevel, false);
}

async function shareStory() {
  const storyText = gameState.dropZoneCards
    .map((card) => card.dataset.word)
    .join(" ");

  if (!storyText) {
    showFeedback("❌ No story to share!", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(
      `I built this story: "${storyText}" - Score: ${gameState.score} points! Play Story Builder!`
    );
    showFeedback("📋 Story copied to clipboard!", "success");
  } catch (err) {
    const textArea = document.createElement("textarea");
    textArea.value = `I built this story: "${storyText}" - Score: ${gameState.score} points! Play Story Builder!`;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showFeedback("📋 Story copied!", "success");
  }
}

function setupEventListeners() {
  elements.nextBtn.addEventListener("click", nextLevel);
  elements.replayBtn.addEventListener("click", replayGame);
  elements.shareBtn.addEventListener("click", shareStory);
  elements.hintBtn.addEventListener("click", showHint);
  elements.howToPlayBtn.addEventListener("click", showModal);
  elements.closeModal.addEventListener("click", hideModal);
  elements.startGameBtn.addEventListener("click", hideModal);
  elements.retryBtn.addEventListener("click", retryCurrentStory);
  elements.newStoryBtn.addEventListener("click", tryNewStory);
  elements.howToPlayModal.addEventListener("click", (e) => {
    if (e.target === elements.howToPlayModal) {
      hideModal();
    }
  });

  // Close modal on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (elements.howToPlayModal.classList.contains("active")) {
        hideModal();
      }
      if (elements.gameOverModal.classList.contains("active")) {
        hideGameOverModal();
      }
    }
  });

  setupDropZone();
}

// Initialize Game
function initGame() {
  setupEventListeners();
  startLevel(1);
  console.log("Game initialized");
}

document.addEventListener("DOMContentLoaded", initGame);
