const aiBtn = document.getElementById("aiBtn");
const friendBtn = document.getElementById("friendBtn");
const gameDiv = document.querySelector(".game");
const menuDiv = document.querySelector(".menu");
const playerCards = document.getElementById("playerCards");
const resultText = document.getElementById("resultText");
const winnerOverlay = document.getElementById("winnerOverlay");
const p1ScoreEl = document.getElementById("p1Score");
const p2ScoreEl = document.getElementById("p2Score");
const progressBar = document.getElementById("progressBar");
const roundsDropdown = document.getElementById("rounds");
const aiLevelDropdown = document.getElementById("aiLevel");
const aiLabel = document.getElementById("aiLabel");
const roundDisplay = document.getElementById("roundDisplay");
const turnDisplay = document.getElementById("turnDisplay");
const infoIcon = document.getElementById("infoIcon");
const infoModal = document.getElementById("infoModal");
const closeInfo = document.getElementById("closeInfo");

let mode = "ai",
  p1Score = 0,
  p2Score = 0,
  round = 1,
  totalRounds = parseInt(roundsDropdown.value),
  waitingForP2 = false;
let lastPlayerChoice = null;

// Round Display
function updateRoundDisplay() {
  roundDisplay.textContent = `Round ${round} / ${totalRounds}`;
}
roundsDropdown.addEventListener("change", () => {
  totalRounds = parseInt(roundsDropdown.value);
  updateRoundDisplay();
});

// AI Logic
function getAIChoice(playerLast) {
  const level = aiLevelDropdown.value;
  const options = ["rock", "paper", "scissors"];
  if (level === "easy") return options[Math.floor(Math.random() * 3)];
  if (level === "medium") {
    return Math.random() < 0.6
      ? options[Math.floor(Math.random() * 3)]
      : counterChoice(playerLast);
  }
  if (level === "hard") return counterChoice(playerLast);
}
function counterChoice(playerLast) {
  if (!playerLast)
    return ["rock", "paper", "scissors"][Math.floor(Math.random() * 3)];
  return playerLast === "rock"
    ? "paper"
    : playerLast === "paper"
    ? "scissors"
    : "rock";
}

// Game Logic
function determineWinner(p1, p2) {
  if (p1 === p2) return "draw";
  if (
    (p1 === "rock" && p2 === "scissors") ||
    (p1 === "paper" && p2 === "rock") ||
    (p1 === "scissors" && p2 === "paper")
  )
    return "p1";
  return "p2";
}
function updateScore(winner) {
  p1ScoreEl.classList.remove("winner");
  p2ScoreEl.classList.remove("winner");
  if (winner === "p1") {
    p1Score++;
    p1ScoreEl.classList.add("winner");
  }
  if (winner === "p2") {
    p2Score++;
    p2ScoreEl.classList.add("winner");
  }
  p1ScoreEl.textContent = `Player 1: ${p1Score}`;
  p2ScoreEl.textContent = `Player 2: ${p2Score}`;
}
function updateProgress() {
  progressBar.style.width = `${((round - 1) / totalRounds) * 100}%`;
}

// Turn Highlight
function updateTurnHighlight() {
  p1ScoreEl.classList.remove("current-turn");
  p2ScoreEl.classList.remove("current-turn");
  if (mode === "friend") {
    if (!waitingForP2) {
      p1ScoreEl.classList.add("current-turn");
      turnDisplay.textContent = "Turn: Player 1";
    } else {
      p2ScoreEl.classList.add("current-turn");
      turnDisplay.textContent = "Turn: Player 2";
    }
  } else {
    turnDisplay.textContent = `AI Level: ${aiLevelDropdown.value}`;
  }
}

// Card Animation
function showMoves(p1Choice, p2Choice, winner) {
  const cards = document.querySelectorAll(".card");
  cards.forEach((c) => c.classList.add("flipped"));
  setTimeout(() => {
    cards.forEach((c) => c.classList.remove("flipped", "winner"));
    if (winner === "p1")
      cards.forEach((c) => {
        if (c.dataset.choice === p1Choice) c.classList.add("winner");
      });
    if (winner === "p2")
      cards.forEach((c) => {
        if (c.dataset.choice === p2Choice) c.classList.add("winner");
      });
  }, 500);
}

// Play Round
function playRound(p1Choice, p2Choice) {
  lastPlayerChoice = p1Choice;
  const winner = determineWinner(p1Choice, p2Choice);
  showMoves(p1Choice, p2Choice, winner);
  resultText.textContent = `Round ${round}: ${
    winner === "draw"
      ? "Draw"
      : winner === "p1"
      ? "Player 1 Wins"
      : "Player 2 Wins"
  }!`;
  resultText.style.color =
    winner === "draw" ? "orange" : winner === "p1" ? "green" : "red";
  updateScore(winner);
  round++;
  updateProgress();
  updateRoundDisplay();
  updateTurnHighlight();
  if (
    round > totalRounds ||
    p1Score === Math.ceil(totalRounds / 2) ||
    p2Score === Math.ceil(totalRounds / 2)
  )
    showWinnerOverlay();
}

// Winner Overlay
function showWinnerOverlay() {
  let finalWinner =
    p1Score > p2Score ? "Player 1" : p2Score > p1Score ? "Player 2" : "Draw";
  let message =
    finalWinner === "Draw" ? `It's a Draw!` : `${finalWinner} Wins! 🏆`;
  winnerOverlay.innerHTML = `<div>${message}</div><div class="control-btns"><button class="btn" onclick="resetGame()">Restart</button><button class="btn" onclick="returnHome()">Home</button></div>`;
  winnerOverlay.classList.add("show");
  triggerConfetti();
  playerCards.style.display = "none";
}

// Event Listeners
aiBtn.addEventListener("click", () => {
  mode = "ai";
  menuDiv.style.display = "none";
  gameDiv.style.display = "flex";
  aiLevelDropdown.style.display = "inline";
  aiLabel.style.display = "inline";
  updateTurnHighlight();
});
friendBtn.addEventListener("click", () => {
  mode = "friend";
  menuDiv.style.display = "none";
  gameDiv.style.display = "flex";
  aiLevelDropdown.style.display = "none";
  aiLabel.style.display = "none";
  updateTurnHighlight();
});
playerCards.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  const p1Choice = card.dataset.choice;
  if (mode === "ai") {
    playRound(p1Choice, getAIChoice(lastPlayerChoice));
  } else {
    if (!waitingForP2) {
      playerCards.dataset.p1 = p1Choice;
      resultText.textContent = "Player 2, make your choice!";
      resultText.style.color = "#000";
      waitingForP2 = true;
    } else {
      playRound(playerCards.dataset.p1, p1Choice);
      delete playerCards.dataset.p1;
      waitingForP2 = false;
    }
  }
  updateTurnHighlight();
});

// Info Modal
infoIcon.addEventListener("click", () => {
  infoModal.classList.add("show");
});
closeInfo.addEventListener("click", () => {
  infoModal.classList.remove("show");
});

// Reset & Home
function resetGame() {
  p1Score = 0;
  p2Score = 0;
  round = 1;
  winnerOverlay.classList.remove("show");
  p1ScoreEl.textContent = "Player 1: 0";
  p2ScoreEl.textContent = "Player 2: 0";
  playerCards.style.display = "flex";
  progressBar.style.width = "0%";
  resultText.textContent = "";
  lastPlayerChoice = null;
  waitingForP2 = false;
  updateRoundDisplay();
  updateTurnHighlight();
}
function returnHome() {
  resetGame();
  gameDiv.style.display = "none";
  menuDiv.style.display = "flex";
}

// Confetti
const canvas = document.getElementById("confetti-canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let confettiParticles = [];
function initConfetti() {
  confettiParticles = [];
  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 6 + 2,
      d: Math.random() * 50 + 10,
      color: `hsl(${Math.random() * 360},100%,50%)`,
      tilt: Math.random() * 10 - 10,
      tiltAngle: 0,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
    });
  }
}
function drawConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  confettiParticles.forEach((p) => {
    ctx.beginPath();
    ctx.lineWidth = p.r;
    ctx.strokeStyle = p.color;
    ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
    ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
    ctx.stroke();
  });
  updateConfetti();
  requestAnimationFrame(drawConfetti);
}
function updateConfetti() {
  confettiParticles.forEach((p) => {
    p.tiltAngle += p.tiltAngleIncrement;
    p.y += Math.cos(p.d) + 1 + p.r / 2;
    p.x += Math.sin(p.tiltAngle);
    p.tilt = Math.sin(p.tiltAngle) * 15;
    if (p.y > canvas.height) {
      p.y = -10;
      p.x = Math.random() * canvas.width;
    }
  });
}
function triggerConfetti() {
  drawConfetti();
  setTimeout(() => {
    confettiParticles = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, 3000);
}
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initConfetti();
});
initConfetti();
