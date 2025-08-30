let mode = "";
let difficulty = "Easy";
let rounds = 3;
let currentRound = 0;
let scores = { player1: 0, player2: 0 };
let streaks = { player1: 0, player2: 0 };
let currentPlayer = 1;
let currentProblem = "";
let currentAnswer = 0;
let playerTime = 15;
let aiThinkTimes = { Easy: 12, Medium: 8, Hard: 4, Extreme: 2 };
let aiErrorChances = { Easy: 0.4, Medium: 0.2, Hard: 0.1, Extreme: 0.05 };
let aiThinkTime = 10;
let playerTimeoutId;
let aiTimeoutId;
let answeredCorrectly = false;
let isTurnActive = false;
let soundEnabled = true;
let audioCtx;

const soundToggle = document.getElementById("sound-toggle");
soundToggle.addEventListener("change", (e) => {
  soundEnabled = e.target.checked;
});

const answerInput = document.getElementById("answer-input");
answerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && isTurnActive) {
    checkAnswer();
  }
});

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(freq, duration, type = "sine") {
  if (!soundEnabled) return;
  initAudio();
  const oscillator = audioCtx.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  oscillator.connect(audioCtx.destination);
  oscillator.start();
  setTimeout(() => oscillator.stop(), duration * 1000);
}

function playCorrectSound() {
  playTone(800, 0.1);
  setTimeout(() => playTone(1000, 0.1), 100);
}

function playWrongSound() {
  playTone(200, 0.2, "sawtooth");
}

function playWinnerSound() {
  playTone(440, 0.15);
  setTimeout(() => playTone(550, 0.15), 150);
  setTimeout(() => playTone(660, 0.15), 300);
  setTimeout(() => playTone(880, 0.2), 450);
}

function showModes() {
  document.getElementById("home").style.display = "none";
  document.getElementById("modes").style.display = "flex";
  document.getElementById("modes").style.flexDirection = "column";
  document.getElementById("modes").style.alignItems = "center";
}

function selectMode(selectedMode) {
  mode = selectedMode;
  document.getElementById("modes").style.display = "none";
  document.getElementById("options").style.display = "flex";
  document.getElementById("options").style.flexDirection = "column";
  document.getElementById("options").style.alignItems = "center";
  document.getElementById("difficulty-select").style.display =
    mode === "single" ? "block" : "none";
  document.getElementById("rounds-select").style.display =
    mode === "practice" ? "none" : "block";
}

function startGame() {
  difficulty = document.getElementById("difficulty")?.value || "Easy";
  rounds =
    mode === "practice"
      ? Infinity
      : parseInt(document.getElementById("rounds").value);
  aiThinkTime = aiThinkTimes[difficulty];
  document.getElementById("options").style.display = "none";
  document.getElementById("game").style.display = "flex";
  document.getElementById("game").style.flexDirection = "column";
  document.getElementById("game").style.alignItems = "center";
  const player2Label =
    mode === "single" ? "AI: 0" : mode === "two" ? "Player2: 0" : "";
  document.getElementById("player2-score").innerText = player2Label;
  if (mode === "single") {
    document.getElementById("ai-timer-container").style.display = "flex";
    document.getElementById("ai-timer-container").style.flexDirection =
      "column";
    document.getElementById("ai-timer-container").style.alignItems =
      "flex-start";
    document.getElementById("ai-difficulty-tag").innerText = difficulty;
  }
  resetGameState();
  nextRound();
}

function resetGameState() {
  scores = { player1: 0, player2: 0 };
  streaks = { player1: 0, player2: 0 };
  currentRound = 0;
  currentPlayer = 1;
  updateScores();
}

function generateProblem(diff) {
  let ops = ["+", "-", "*", "/"];
  let op = ops[Math.floor(Math.random() * ops.length)];
  let a, b;
  let problemStr, answerVal;
  switch (diff) {
    case "Easy":
      a = Math.floor(Math.random() * 9) + 1;
      b = Math.floor(Math.random() * 9) + 1;
      if (op === "/") {
        while (a % b !== 0) b = Math.floor(Math.random() * (a - 1)) + 1;
      }
      break;
    case "Medium":
      a = Math.floor(Math.random() * 90) + 10;
      b = Math.floor(Math.random() * 90) + 10;
      if (op === "/") {
        while (a % b !== 0) b = Math.floor(Math.random() * (a - 10)) + 10;
      }
      break;
    case "Hard":
      a = Math.floor(Math.random() * 900) + 100;
      b = Math.floor(Math.random() * 900) + 100;
      if (op === "/") {
        while (a % b !== 0) b = Math.floor(Math.random() * (a - 100)) + 100;
      }
      break;
    case "Extreme":
      let terms = Math.floor(Math.random() * 3) + 3;
      let expr = [];
      for (let i = 0; i < terms; i++) {
        let num =
          Math.random() < 0.5
            ? Math.floor(Math.random() * 100)
            : (Math.random() * 100).toFixed(2);
        if (Math.random() < 0.25) num = -num;
        expr.push(num);
        if (i < terms - 1) {
          if (Math.random() < 0.2) expr.push("(");
          expr.push(ops[Math.floor(Math.random() * ops.length)]);
          if (Math.random() < 0.2) expr.push(")");
        }
      }
      problemStr = expr.join(" ");
      try {
        answerVal = eval(problemStr);
      } catch (e) {
        return generateProblem(diff); // Retry if invalid
      }
      return { problem: problemStr, answer: answerVal };
    default:
      a = Math.floor(Math.random() * 9) + 1;
      b = Math.floor(Math.random() * 9) + 1;
  }
  problemStr = `${a} ${op} ${b}`;
  answerVal = eval(problemStr);
  return { problem: problemStr, answer: answerVal };
}

function nextRound() {
  currentRound++;
  if (currentRound > rounds && mode !== "practice") {
    endGame();
    return;
  }
  answeredCorrectly = false;
  currentPlayer = 1;
  startTurn();
}

function startTurn() {
  isTurnActive = true;
  let prob = generateProblem(difficulty);
  currentProblem = prob.problem;
  currentAnswer = prob.answer;
  document.getElementById("problem-text").innerText = currentProblem;
  answerInput.value = "";
  answerInput.focus();
  const turnText =
    mode === "two"
      ? `Player ${currentPlayer}'s Turn`
      : mode === "single"
      ? "Your Turn"
      : "";
  document.getElementById("current-turn").innerText = turnText;

  if (mode === "practice") {
    return;
  }

  const playerBar = document.getElementById("player-timer");
  playerBar.style.width = "100%";
  playerBar.style.transition = `width ${playerTime}s linear`;
  setTimeout(() => (playerBar.style.width = "0%"), 10);
  playerTimeoutId = setTimeout(playerTimeout, playerTime * 1000);

  if (mode === "single") {
    const aiBar = document.getElementById("ai-timer");
    aiBar.style.width = "100%";
    aiBar.style.transition = `width ${aiThinkTime}s linear`;
    setTimeout(() => (aiBar.style.width = "0%"), 10);
    aiTimeoutId = setTimeout(aiDecide, aiThinkTime * 1000);
  }
}

function aiDecide() {
  if (answeredCorrectly) return;
  const errorChance = aiErrorChances[difficulty];
  if (Math.random() > errorChance) {
    scores.player2 += 10;
    updateScores();
  }
  endTurn();
}

function checkAnswer() {
  const value = parseFloat(answerInput.value);
  const card = document.getElementById("problem-card");
  if (Math.abs(value - currentAnswer) < 0.01) {
    answeredCorrectly = true;
    const playerKey =
      mode === "single" || mode === "practice"
        ? "player1"
        : `player${currentPlayer}`;
    const multiplier = Math.floor(streaks[playerKey] / 3) + 1;
    scores[playerKey] += 10 * multiplier;
    streaks[playerKey]++;
    updateStreak(playerKey);
    updateScores();
    card.classList.add("glow-green");
    playCorrectSound();
    setTimeout(() => card.classList.remove("glow-green"), 500);
    endTurn();
  } else {
    card.classList.add("shake", "glow-red");
    playWrongSound();
    setTimeout(() => card.classList.remove("shake", "glow-red"), 500);
    answerInput.value = "";
  }
}

function endTurn() {
  isTurnActive = false;
  clearTimeout(playerTimeoutId);
  if (mode === "single") clearTimeout(aiTimeoutId);
  if (!answeredCorrectly) {
    const playerKey =
      mode === "single" || mode === "practice"
        ? "player1"
        : `player${currentPlayer}`;
    streaks[playerKey] = 0;
    updateStreak(playerKey);
  }
  if (mode === "two" && currentPlayer === 1) {
    currentPlayer = 2;
    startTurn();
  } else {
    nextRound();
  }
}

function playerTimeout() {
  if (answeredCorrectly) return;
  endTurn();
}

function updateScores() {
  document.getElementById("player1-score").innerText = scores.player1;
  const player2Label = mode === "single" ? "AI: " : "Player2: ";
  document.getElementById("player2-score").innerText =
    mode === "practice" ? "" : player2Label + scores.player2;
}

function updateStreak(playerKey) {
  const streak = streaks[playerKey];
  const banner = document.getElementById("streak-banner");
  const count = document.getElementById("streak-count");
  const mult = document.getElementById("multiplier");
  if (streak >= 3) {
    count.innerText = streak;
    mult.innerText = Math.floor(streak / 3) + 1;
    banner.style.display = "block";
    setTimeout(() => (banner.style.display = "none"), 2000);
  } else {
    banner.style.display = "none";
  }
}

function endGame() {
  document.getElementById("game").style.display = "none";
  const overlay = document.getElementById("overlay");
  overlay.style.display = "flex";
  document.getElementById("final-player1").innerText = scores.player1;
  const player2Label = mode === "single" ? "AI: " : "Player2: ";
  document.getElementById("final-player2-card").innerText =
    mode === "practice" ? "" : player2Label + scores.player2;
  let winnerText = "";
  let showCrown = false;
  let winnerPlayer = "";
  if (scores.player1 > scores.player2) {
    winnerText = mode === "single" ? "You Win!" : "Player1 Wins!";
    showCrown = true;
    winnerPlayer = "player1";
  } else if (scores.player2 > scores.player1) {
    winnerText = mode === "single" ? "AI Wins!" : "Player2 Wins!";
    showCrown = true;
    winnerPlayer = "player2";
  } else {
    winnerText = "Tie!";
  }
  document.getElementById("winner-text").innerText = winnerText;
  document.getElementById("crown").style.display = showCrown ? "block" : "none";
  if (showCrown) {
    startConfetti();
    playWinnerSound();
    const winnerCard =
      winnerPlayer === "player1"
        ? document.getElementById("final-player1").parentNode
        : document.getElementById("final-player2-card");
    winnerCard.style.animation = "bounce 1s infinite";
  }
  if (mode === "single") {
    saveHighScore(scores.player1);
  }
}

function startConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  canvas.style.display = "block";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");
  const particles = [];
  const colors = ["#6B7280", "#000000", "#FFFFFF", "#808080"];
  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: (Math.random() * canvas.height) / 2,
      vx: Math.random() * 10 - 5,
      vy: Math.random() * 5 - 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 5 + 5,
      rotation: Math.random() * 360,
      vr: Math.random() * 10 - 5,
    });
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.rotation += p.vr;
      if (p.y > canvas.height) p.y = 0;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    requestAnimationFrame(animate);
  }
  animate();
  setTimeout(() => (canvas.style.display = "none"), 5000);
}

function saveHighScore(score) {
  const highScores =
    JSON.parse(localStorage.getItem("mathSprintHighScores")) || [];
  const newScore = { score, difficulty, date: new Date().toLocaleDateString() };
  highScores.push(newScore);
  highScores.sort((a, b) => b.score - a.score);
  highScores.splice(10);
  localStorage.setItem("mathSprintHighScores", JSON.stringify(highScores));
}

function showLeaderboard() {
  const highScores =
    JSON.parse(localStorage.getItem("mathSprintHighScores")) || [];
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  highScores.forEach((s, index) => {
    const li = document.createElement("li");
    li.innerText = `${index + 1}. ${s.score} - ${s.difficulty} - ${s.date}`;
    list.appendChild(li);
  });
  document.getElementById("leaderboard-modal").style.display = "block";
}

function closeLeaderboard() {
  document.getElementById("leaderboard-modal").style.display = "none";
}

function showInfo() {
  document.getElementById("info-modal").style.display = "block";
}

function closeInfo() {
  document.getElementById("info-modal").style.display = "none";
}

function restart() {
  document.getElementById("overlay").style.display = "none";
  const winnerCard1 = document.getElementById("final-player1").parentNode;
  const winnerCard2 = document.getElementById("final-player2-card");
  winnerCard1.style.animation = "";
  winnerCard2.style.animation = "";
  resetGameState();
  nextRound();
  document.getElementById("game").style.display = "flex";
  document.getElementById("game").style.flexDirection = "column";
  document.getElementById("game").style.alignItems = "center";
}

function goHome() {
  location.reload();
}
