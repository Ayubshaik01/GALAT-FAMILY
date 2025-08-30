class TypeChallengePro {
  constructor() {
    this.contentPools = {
      words: {
        easy: [
          "cat",
          "dog",
          "run",
          "sun",
          "car",
          "hat",
          "bat",
          "cup",
          "pen",
          "box",
          "key",
          "map",
          "red",
          "big",
          "new",
          "old",
          "hot",
          "day",
          "way",
          "boy",
          "got",
          "its",
          "did",
          "get",
          "may",
          "him",
          "his",
          "had",
          "let",
          "put",
          "say",
          "she",
          "too",
          "use",
          "who",
          "oil",
          "sit",
          "set",
          "but",
          "not",
        ],
        medium: [
          "house",
          "water",
          "phone",
          "table",
          "music",
          "light",
          "happy",
          "world",
          "power",
          "friend",
          "school",
          "family",
          "system",
          "problem",
          "develop",
          "company",
          "service",
          "student",
          "program",
          "business",
          "network",
          "support",
          "website",
          "project",
          "quality",
          "payment",
          "product",
          "content",
          "machine",
          "windows",
          "freedom",
          "picture",
          "country",
          "nothing",
          "because",
          "morning",
          "evening",
          "kitchen",
          "bedroom",
          "library",
        ],
        hard: [
          "beautiful",
          "important",
          "different",
          "necessary",
          "government",
          "experience",
          "knowledge",
          "community",
          "technology",
          "information",
          "opportunity",
          "environment",
          "relationship",
          "organization",
          "communication",
          "development",
          "performance",
          "management",
          "application",
          "requirement",
          "professional",
          "understanding",
          "responsibility",
          "implementation",
          "infrastructure",
          "administration",
          "configuration",
          "documentation",
          "optimization",
          "transformation",
          "sophisticated",
          "extraordinary",
          "revolutionary",
          "consciousness",
          "entrepreneurship",
          "internationally",
          "characteristic",
          "representative",
          "pharmaceutical",
          "archaeological",
        ],
        expert: [
          "entrepreneurship",
          "sophistication",
          "incomprehensible",
          "responsibilities",
          "internationalization",
          "acknowledgment",
          "troubleshooting",
          "implementation",
          "optimization",
          "transformation",
          "disproportionately",
          "inconsequential",
          "uncharacteristically",
          "misunderstanding",
          "intercommunication",
          "counterproductive",
          "hypersensitivity",
          "overcompensation",
          "interdisciplinary",
          "counterrevolutionary",
          "pseudointellectual",
          "antidisestablishmentarianism",
          "floccinaucinihilipilification",
          "pneumonoultramicroscopicsilicovolcanoconios",
          "hippopotomonstrosesquippedaliophobia",
          "supercalifragilisticexpialidocious",
          "electroencephalography",
          "otorhinolaryngological",
          "immunoelectrophoresis",
          "spectrophotometrically",
        ],
      },
      sentences: {
        easy: [
          "The cat sat on the mat.",
          "I love to eat pizza every day.",
          "The sun is very bright today.",
          "She has a beautiful red car.",
          "We go to school every morning.",
          "The dog runs in the big park.",
          "He likes to read good books.",
          "The house is very big and nice.",
          "I can see the blue sky clearly.",
          "They play fun games together.",
          "My mom makes great food.",
          "The bird sings in the tree.",
          "Kids play in the yard happily.",
          "The water is cold and fresh.",
          "We watch movies on Friday night.",
        ],
        medium: [
          "The quick brown fox jumps over the lazy dog.",
          "Technology has revolutionized the way we communicate with each other.",
          "Learning to type efficiently requires consistent practice and dedication.",
          "The internet connects people from around the world instantly.",
          "Artificial intelligence is changing many industries rapidly.",
          "Remote work has become increasingly popular in recent years.",
          "Digital transformation affects every business sector significantly.",
          "Data security is crucial in our modern connected world.",
          "Mobile devices have changed how we access information daily.",
          "Cloud computing enables flexible and scalable business solutions.",
          "Social media platforms influence how we share information.",
          "Online education provides access to learning opportunities globally.",
          "E-commerce has transformed traditional retail business models.",
          "Renewable energy sources are becoming more cost effective.",
          "Sustainable development practices are essential for our future.",
        ],
        hard: [
          "The implementation of sophisticated algorithms requires comprehensive understanding of computational complexity theory.",
          "Quantum computing represents a paradigm shift in information processing capabilities and cryptographic security.",
          "Machine learning models demonstrate remarkable performance in pattern recognition and predictive analytics tasks.",
          "Cybersecurity frameworks must address evolving threats in distributed systems and cloud infrastructure.",
          "Microservices architecture enables scalable and maintainable enterprise applications with improved fault tolerance.",
          "Blockchain technology facilitates decentralized and transparent transaction processing with cryptographic verification.",
          "Artificial neural networks simulate biological processes to solve complex optimization and classification problems.",
          "Container orchestration platforms streamline deployment and management workflows in production environments.",
          "Edge computing reduces latency by processing data closer to source locations and end users.",
          "Distributed databases ensure high availability and consistent performance across multiple geographic regions.",
        ],
        expert: [
          "The epistemological implications of postmodern deconstructionist theory fundamentally challenge traditional hermeneutical approaches to textual interpretation.",
          "Phenomenological investigations into consciousness reveal the intricate relationship between intentionality and temporal experience in human cognition.",
          "The thermodynamic principles governing irreversible processes demonstrate the fundamental asymmetry of time in physical systems.",
          "Quantum entanglement phenomena exhibit non-local correlations that transcend classical mechanistic explanations of physical reality.",
          "Neuroplasticity research demonstrates the brain's remarkable capacity for structural and functional reorganization throughout life.",
        ],
      },
    };

    // Game state
    this.currentLevel = "easy";
    this.contentType = "words";
    this.timeMode = 60;
    this.isInfinite = false;
    this.currentText = "";
    this.userInput = "";
    this.gameActive = false;
    this.gameStarted = false;
    this.startTime = null;
    this.timer = null;
    this.timeLeft = 60;
    this.soundEnabled = true;
    this.totalChars = 0;
    this.correctChars = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.mistakes = 0;
    this.wordsCompleted = 0;
    this.accurateTypedChars = 0;
    this.totalTypedChars = 0;

    this.initializeGame();
  }

  initializeGame() {
    this.cacheElements();
    this.bindEvents();
    this.loadLeaderboard();
    this.generateContent();
    this.gameActive = true;
    setTimeout(() => this.elements.input.focus(), 100);
  }

  cacheElements() {
    this.elements = {
      input: document.getElementById("typing-input"),
      contentDisplay: document.getElementById("content-display"),
      wpm: document.getElementById("wpm-display"),
      accuracy: document.getElementById("accuracy-display"),
      timer: document.getElementById("timer-display"),
      streak: document.getElementById("streak-display"),
      completed: document.getElementById("completed-display"),
      difficultyBadge: document.getElementById("difficulty-badge"),
      progressFill: document.getElementById("progress-fill"),
      progressLeft: document.getElementById("progress-left"),
      progressRight: document.getElementById("progress-right"),
      levelDropdown: document.getElementById("level-dropdown"),
      contentDropdown: document.getElementById("content-dropdown"),
      timeDropdown: document.getElementById("time-dropdown"),
      scoresModal: document.getElementById("scores-modal"),
      gameOverModal: document.getElementById("game-over-modal"),
      scoreList: document.getElementById("score-list"),
      modalStats: document.getElementById("modal-stats"),
      tipsSection: document.getElementById("tips-section"),
    };
  }

  bindEvents() {
    // Dropdown changes
    this.elements.levelDropdown.addEventListener("change", (e) => {
      this.setLevel(e.target.value);
    });

    this.elements.contentDropdown.addEventListener("change", (e) => {
      this.setContentType(e.target.value);
    });

    this.elements.timeDropdown.addEventListener("change", (e) => {
      this.setTimeMode(e.target.value);
    });

    // Input handling
    this.elements.input.addEventListener("input", (e) => this.handleInput(e));
    this.elements.input.addEventListener("keydown", (e) =>
      this.handleKeydown(e)
    );

    // Control buttons
    document
      .getElementById("restart-btn")
      .addEventListener("click", () => this.restartGame());
    document
      .getElementById("sound-btn")
      .addEventListener("click", () => this.toggleSound());

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.target !== this.elements.input) {
        if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          this.restartGame();
        } else if (e.key === "Escape") {
          this.closeAllModals();
        }
      }
    });

    this.elements.contentDisplay.addEventListener("click", () => {
      this.elements.input.focus();
    });
  }

  setLevel(level) {
    this.currentLevel = level;
    this.elements.difficultyBadge.textContent = `${
      level.charAt(0).toUpperCase() + level.slice(1)
    } Level`;
    this.generateContent();
    this.restartGame();
  }

  setContentType(type) {
    this.contentType = type;
    this.generateContent();
    this.restartGame();
  }

  setTimeMode(mode) {
    if (mode === "infinite") {
      this.isInfinite = true;
      this.timeMode = 999999;
      this.timeLeft = 999999;
      this.elements.timer.textContent = "∞";
    } else {
      this.isInfinite = false;
      this.timeMode = parseInt(mode);
      this.timeLeft = parseInt(mode);
      this.elements.timer.textContent = this.timeLeft;
    }
    this.restartGame();
  }

  generateContent() {
    const pool = this.contentPools[this.contentType][this.currentLevel];
    const randomIndex = Math.floor(Math.random() * pool.length);
    this.currentText = pool[randomIndex];
    this.userInput = "";
    this.elements.input.value = "";
    this.updateDisplay();
  }

  updateDisplay() {
    const display = this.elements.contentDisplay;
    display.innerHTML = "";

    display.className = `content-display ${
      this.contentType === "words" ? "word-mode" : "sentence-mode"
    }`;

    for (let i = 0; i < this.currentText.length; i++) {
      const char = document.createElement("span");
      char.textContent = this.currentText[i];
      char.className = "char";

      if (i < this.userInput.length) {
        if (this.userInput[i] === this.currentText[i]) {
          char.classList.add("correct");
        } else {
          char.classList.add("incorrect");
        }
      } else if (i === this.userInput.length && this.gameActive) {
        char.classList.add("current");
      }

      display.appendChild(char);
    }

    if (this.userInput.length > 0) {
      const currentChar = display.querySelector(".current");
      if (currentChar) {
        currentChar.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    }
  }

  handleInput(e) {
    if (!this.gameActive) return;

    const newInput = e.target.value;

    if (!this.gameStarted) {
      this.startGame();
    }

    if (newInput.length > this.userInput.length) {
      const addedChar = newInput[newInput.length - 1];
      const expectedChar = this.currentText[newInput.length - 1];

      this.totalTypedChars++;

      if (addedChar === expectedChar) {
        this.accurateTypedChars++;
        this.correctChars++;
      } else {
        this.mistakes++;
        this.currentStreak = 0;
      }
    } else if (newInput.length < this.userInput.length) {
      this.totalTypedChars = Math.max(0, this.totalTypedChars - 1);
    }

    this.userInput = newInput;
    this.updateDisplay();
    this.updateStatsRealTime();
    if (this.userInput === this.currentText) {
      this.completeText();
    }
  }

  handleKeydown(e) {
    if (!this.gameActive) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (this.userInput.trim() === this.currentText.trim()) {
        this.completeText();
      } else if (
        this.contentType === "sentences" &&
        this.userInput.length > this.currentText.length * 0.8
      ) {
        this.completeText();
      }
    }
  }

  startGame() {
    this.gameStarted = true;
    this.startTime = Date.now();

    if (!this.isInfinite) {
      this.startTimer();
    }

    this.elements.progressLeft.textContent = "Keep typing!";
    this.elements.progressRight.textContent = "Press Enter when ready";
    this.playSound("start");
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.elements.timer.textContent = this.timeLeft;

      if (this.timeLeft <= 0) {
        this.endGame();
      }

      this.updateStatsRealTime();
    }, 1000);
  }

  completeText() {
    const isCorrect =
      this.userInput === this.currentText ||
      (this.contentType === "sentences" &&
        this.userInput.trim() === this.currentText.trim());

    if (isCorrect) {
      this.wordsCompleted++;
      this.currentStreak++;
      this.maxStreak = Math.max(this.maxStreak, this.currentStreak);
      if (this.currentStreak > 0 && this.currentStreak % 5 === 0) {
        this.elements.streak.classList.add("streak-bonus");
        setTimeout(
          () => this.elements.streak.classList.remove("streak-bonus"),
          600
        );
      }

      this.playSound("success");
    } else {
      this.currentStreak = 0;
      this.playSound("error");
    }

    this.updateProgressBar();
    this.updateStatsRealTime();
    setTimeout(() => this.generateContent(), 500);
  }

  updateStatsRealTime() {
    const stats = this.calculatePreciseStats();

    this.elements.wpm.textContent = stats.wpm;
    this.elements.accuracy.textContent = stats.accuracy;
    this.elements.streak.textContent = this.currentStreak;
    this.elements.completed.textContent = this.wordsCompleted;
  }

  calculatePreciseStats() {
    if (!this.gameStarted) {
      return { wpm: 0, accuracy: 100, timeElapsed: 0 };
    }

    const timeElapsedSeconds = (Date.now() - this.startTime) / 1000;
    const timeElapsedMinutes = timeElapsedSeconds / 60;
    const wpm =
      timeElapsedMinutes > 0
        ? Math.round(this.accurateTypedChars / 5 / timeElapsedMinutes)
        : 0;
    const accuracy =
      this.totalTypedChars > 0
        ? Math.round((this.accurateTypedChars / this.totalTypedChars) * 100)
        : 100;

    return {
      wpm: Math.max(0, wpm),
      accuracy: Math.min(100, Math.max(0, accuracy)),
      timeElapsed: timeElapsedSeconds,
    };
  }

  updateProgressBar() {
    const progress = this.isInfinite
      ? Math.min((this.currentStreak / 20) * 100, 100)
      : Math.min((this.wordsCompleted / 10) * 100, 100);

    this.elements.progressFill.style.width = `${progress}%`;
  }

  endGame() {
    this.gameActive = false;
    this.gameStarted = false;
    clearInterval(this.timer);

    const stats = this.calculatePreciseStats();
    const score = Math.round(
      stats.wpm * (stats.accuracy / 100) * (this.maxStreak / 10 + 1)
    );

    this.saveScore(score, stats);
    this.showGameOverModal(score, stats);
    this.playSound("finish");
  }

  showGameOverModal(score, stats) {
    const statsData = [
      ["Final Score", score],
      ["Words Per Minute", stats.wpm],
      ["Accuracy", stats.accuracy + "%"],
      ["Content Completed", this.wordsCompleted],
      ["Best Streak", this.maxStreak],
      ["Total Mistakes", this.mistakes],
      ["Characters Typed", this.totalTypedChars],
      ["Correct Characters", this.accurateTypedChars],
      ["Time Mode", this.isInfinite ? "Infinite" : `${this.timeMode}s`],
      [
        "Level",
        this.currentLevel.charAt(0).toUpperCase() + this.currentLevel.slice(1),
      ],
      [
        "Content Type",
        this.contentType.charAt(0).toUpperCase() + this.contentType.slice(1),
      ],
    ];

    this.elements.modalStats.innerHTML = statsData
      .map(
        ([label, value]) =>
          `<div class="modal-stat"><span>${label}:</span><span><strong>${value}</strong></span></div>`
      )
      .join("");
    const tips = this.generateTips(stats);
    this.elements.tipsSection.innerHTML = `<strong>💡 Performance Analysis:</strong><br>${tips}`;

    this.elements.gameOverModal.style.display = "flex";
  }

  generateTips(stats) {
    const tips = [];

    if (stats.accuracy < 90) {
      tips.push("• Focus on accuracy over speed - aim for 95%+ accuracy");
    }
    if (stats.wpm < 30) {
      tips.push("• Practice touch typing to build muscle memory");
    }
    if (this.mistakes > 5) {
      tips.push("• Take your time with difficult content");
    }
    if (this.maxStreak < 5) {
      tips.push("• Try to maintain consistency for longer streaks");
    }
    if (this.currentLevel === "easy" && stats.wpm > 40) {
      tips.push("• You're ready for medium difficulty level!");
    }
    if (this.currentLevel === "medium" && stats.wpm > 60) {
      tips.push("• Challenge yourself with hard difficulty level!");
    }
    if (stats.accuracy > 95 && stats.wpm > 50) {
      tips.push("• Excellent performance! You're a typing pro!");
    }

    return tips.length > 0
      ? tips.join("<br>")
      : "• Great job! Keep practicing to improve further!";
  }

  saveScore(score, stats) {
    const scores = JSON.parse(
      localStorage.getItem("typeChallengePro_scores") || "[]"
    );

    scores.push({
      score,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      level: this.currentLevel,
      contentType: this.contentType,
      timeMode: this.isInfinite ? "infinite" : `${this.timeMode}s`,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
    });

    scores.sort((a, b) => b.score - a.score);
    scores.splice(10); // Keep top 10

    localStorage.setItem("typeChallengePro_scores", JSON.stringify(scores));
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    const scores = JSON.parse(
      localStorage.getItem("typeChallengePro_scores") || "[]"
    );

    if (scores.length === 0) {
      this.elements.scoreList.innerHTML =
        '<div class="score-item">No scores yet - start playing!</div>';
      return;
    }

    this.elements.scoreList.innerHTML = scores
      .map(
        (score, index) =>
          `<div class="score-item">
                        <span>#${index + 1} - ${score.wpm} WPM (${
            score.accuracy
          }% acc, ${score.level})</span>
                        <span>${score.score} pts</span>
                    </div>`
      )
      .join("");
  }

  playSound(type) {
    if (!this.soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const frequencies = {
        start: 220,
        success: 440,
        error: 150,
        finish: 330,
      };

      oscillator.frequency.setValueAtTime(
        frequencies[type] || 220,
        audioContext.currentTime
      );
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Audio not supported or blocked
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const soundBtn = document.getElementById("sound-btn");
    soundBtn.textContent = this.soundEnabled ? "🔊" : "🔇";
  }

  restartGame() {
    this.gameActive = true;
    this.gameStarted = false;
    this.totalChars = 0;
    this.correctChars = 0;
    this.accurateTypedChars = 0;
    this.totalTypedChars = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.mistakes = 0;
    this.wordsCompleted = 0;

    // Reset timer based on current mode
    if (this.isInfinite) {
      this.timeLeft = 999999;
      this.elements.timer.textContent = "∞";
    } else {
      this.timeLeft = this.timeMode;
      this.elements.timer.textContent = this.timeLeft;
    }

    clearInterval(this.timer);

    // Reset UI
    this.elements.wpm.textContent = "0";
    this.elements.accuracy.textContent = "100";
    this.elements.streak.textContent = "0";
    this.elements.completed.textContent = "0";
    this.elements.progressLeft.textContent = "Ready to Start";
    this.elements.progressRight.textContent = "Click input field to begin";
    this.elements.progressFill.style.width = "0%";

    this.generateContent();
    this.elements.input.focus();
  }

  closeAllModals() {
    this.elements.scoresModal.style.display = "none";
    this.elements.gameOverModal.style.display = "none";
  }
}

// Global functions
function showBestScores() {
  document.getElementById("scores-modal").style.display = "flex";
}

function closeScoresModal() {
  document.getElementById("scores-modal").style.display = "none";
}

function closeGameOverModal() {
  document.getElementById("game-over-modal").style.display = "none";
  if (window.game) {
    window.game.restartGame();
  }
}

// Initialize game when page loads
document.addEventListener("DOMContentLoaded", () => {
  window.game = new TypeChallengePro();
});

// Prevent zoom on mobile
document.addEventListener("touchstart", function (e) {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
});

let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  function (e) {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  },
  false
);
