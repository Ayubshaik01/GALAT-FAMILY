const startPVP = document.getElementById("startPVP");
const startPVE = document.getElementById("startPVE");
const returnHomeBtn = document.getElementById("returnHome");
const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const modeTitle = document.getElementById("modeTitle");
const roundState = document.getElementById("roundState");
const panel1 = document.getElementById("panel1");
const panel2 = document.getElementById("panel2");
const time1 = document.getElementById("time1");
const time2 = document.getElementById("time2");
const label2 = document.getElementById("label2");
const tlOverlay = document.getElementById("tlOverlay");
const lightRed = document.getElementById("lightRed");
const lightYellow = document.getElementById("lightYellow");
const lightGreen = document.getElementById("lightGreen");
const sigText = document.querySelector(".signal-text");
const sigTxt = document.getElementById("sigTxt");
const bestScoreEl = document.getElementById("bestScore");
const bestBadge = document.getElementById("bestBadge");
const historyList = document.getElementById("historyList");
const confettiRoot = document.getElementById("confetti");
const aiDifficultySelect = document.getElementById("aiDifficulty");
const matchBestOfSelect = document.getElementById("matchBestOf");
const touchP1 = document.getElementById("touchP1");
const touchP2 = document.getElementById("touchP2");
const exportCSVBtn = document.getElementById("exportCSV");
const wins1El = document.getElementById("wins1");
const wins2El = document.getElementById("wins2");
const matchBanner = document.getElementById("matchBanner");
const avatar2 = document.getElementById("avatar2");

/* State */
let mode = ""; // 'pvp' | 'pve'
let reactionOpen = false;
let startTime = 0;
let firstReaction = null;
let lateWindow = false;
let lateTimer = null;
let history = JSON.parse(localStorage.getItem("roundHistory") || "[]");
const MAX_HISTORY = 50;
let best = localStorage.getItem("bestScore")
  ? parseInt(localStorage.getItem("bestScore"))
  : null;

/* Match state */
let wins = { p1: 0, p2: 0 };
let roundNumber = 0;
let roundsForMatch = parseInt(matchBestOfSelect.value, 10) || 5;

/* Initialize display */
function updateBestDisplay() {
  bestScoreEl.innerText = best
    ? `🏆 Best Score: ${best} ms`
    : "🏆 Best Score: —";
}
updateBestDisplay();
renderHistory();

/* ========== Helpers: History ========== */
function clampHistory() {
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  localStorage.setItem("roundHistory", JSON.stringify(history));
}
function addHistoryItem(item) {
  history.unshift(item);
  clampHistory();
  renderHistory();
}
function renderHistory() {
  historyList.innerHTML = "";
  if (history.length === 0) {
    historyList.innerHTML = '<li style="opacity:.7">No rounds yet</li>';
    return;
  }
  history.forEach((h) => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${h.round}</b> • ${h.mode.toUpperCase()} • Winner: <b>${
      h.winner
    }</b> • P1: ${h.p1 ?? "—"} ms • P2: ${h.p2 ?? "—"} ms`;
    historyList.appendChild(li);
  });
}

/* ========== Reset & UI helpers ========== */
function resetPanels() {
  reactionOpen = false;
  startTime = 0;
  firstReaction = null;
  lateWindow = false;
  clearTimeout(lateTimer);
  panel1.className = "panel";
  panel2.className = "panel";
  time1.textContent = "—";
  time2.textContent = "—";
  roundState.textContent = "Waiting";
  clearConfetti();
  bestBadge.classList.remove("best-glow");
}
function showHome() {
  gameScreen.style.display = "none";
  homeScreen.style.display = "block";
  resetPanels();
}
function showGame() {
  homeScreen.style.display = "none";
  gameScreen.style.display = "block";
}

/* ========== Sound (WebAudio beeps) ========== */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq = 880, dur = 0.08, vol = 0.12, type = "sine") {
  // create oscillator + gain
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = 0;
  o.connect(g);
  g.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(vol, now + 0.003);
  o.start(now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.stop(now + dur + 0.02);
}

/* Subtle chained sounds for better demo feel */
function playReadySetGoSounds() {
  // low beep for READY, medium for SET, high for GO
  setTimeout(() => playBeep(220, 0.12, 0.14, "sine"), 60);
  setTimeout(() => playBeep(440, 0.12, 0.14, "sawtooth"), 1160);
  setTimeout(() => playBeep(880, 0.12, 0.18, "square"), 2160);
}

/* ========== Start / Signals / Open ========== */
startPVP.addEventListener("click", () => begin("pvp"));
startPVE.addEventListener("click", () => begin("pve"));
returnHomeBtn.addEventListener("click", () => {
  resetMatch();
  showHome();
});
exportCSVBtn.addEventListener("click", exportHistoryCSV);

function begin(selectedMode) {
  mode = selectedMode;
  roundsForMatch = parseInt(matchBestOfSelect.value, 10) || 5;
  wins = { p1: 0, p2: 0 };
  roundNumber = 0;
  wins1El.textContent = "0";
  wins2El.textContent = "0";
  label2.textContent = mode === "pve" ? "AI" : "Player 2";
  // avatar color for P2 -> AI different color class
  avatar2.className = "avatar " + (mode === "pve" ? "ai" : "p2");
  modeTitle.textContent = mode === "pvp" ? "Player vs Player" : "Player vs AI";
  resetPanels();
  showGame();
  startNextRound();
}

function startNextRound() {
  roundNumber += 1;
  resetPanels();
  runSignals().then(() => {
    const preDelay = Math.floor(Math.random() * 1400) + 500; // 500 - 1900 ms
    roundState.textContent = "...";
    setTimeout(openForReaction, preDelay);
  });
}

function runSignals() {
  return new Promise((resolve) => {
    tlOverlay.style.display = "grid";
    sigText.style.display = "grid";
    lightRed.classList.remove("on");
    lightYellow.classList.remove("on");
    lightGreen.classList.remove("on");
    sigTxt.className = "txt";
    sigTxt.textContent = "READY";
    sigTxt.classList.add("red");
    roundState.textContent = "Get Ready";

    // play sounds
    try {
      playReadySetGoSounds();
    } catch (e) {}
    // Sequence
    setTimeout(() => {
      lightRed.classList.add("on");
      setTimeout(() => {
        lightRed.classList.remove("on");
        sigTxt.classList.remove("red");
        lightYellow.classList.add("on");
        sigTxt.textContent = "SET";
        sigTxt.classList.add("yellow");
        roundState.textContent = "Set";
        setTimeout(() => {
          lightYellow.classList.remove("on");
          sigTxt.classList.remove("yellow");
          lightGreen.classList.add("on");
          sigTxt.textContent = "GO!";
          sigTxt.classList.add("green");
          roundState.textContent = "GO (soon)";
          setTimeout(() => {
            lightGreen.classList.remove("on");
            tlOverlay.style.display = "none";
            sigText.style.display = "none";
            resolve();
          }, 1000);
        }, 1000);
      }, 1000);
    }, 80);
  });
}

function openForReaction() {
  panel1.classList.add("go");
  panel2.classList.add("go");
  startTime = Date.now();
  reactionOpen = true;
  roundState.textContent = "React!";
  // schedule AI if needed
  if (mode === "pve") {
    const diff = aiDifficultySelect.value;
    let min, max;
    if (diff === "easy") {
      min = 300;
      max = 600;
    } else if (diff === "medium") {
      min = 200;
      max = 400;
    } else {
      min = 120;
      max = 250;
    }
    const aiDelay = Math.floor(Math.random() * (max - min)) + min;
    setTimeout(() => {
      if (reactionOpen) {
        const t = Date.now() - startTime;
        time2.textContent = `${t} ms`;
        if (!firstReaction) {
          firstReaction = { who: "AI", time: t };
          highlight("panel2");
          startLateWindow();
        } else {
          // if a first reaction already present, we leave finalize to other logic
        }
      }
    }, aiDelay);
  }
}

/* ========== Reaction handlers ========== */
function handleReact(who) {
  if (!reactionOpen && !lateWindow) return;
  if (!startTime) return;
  const t = Date.now() - startTime;

  if (!firstReaction) {
    firstReaction = { who, time: t };
    if (who === "p1") {
      time1.textContent = `${t} ms`;
    } else {
      time2.textContent = `${t} ms`;
    }
    highlight(who === "p1" ? "panel1" : "panel2");
    startLateWindow();
  } else if (lateWindow) {
    if (who === "p1" && time1.textContent === "—")
      time1.textContent = `${t} ms`;
    if (who === "p2" && time2.textContent === "—")
      time2.textContent = `${t} ms`;
    finalizeRound();
  }
}

/* Click/touch events */
panel1.addEventListener("click", () => handleReact("p1"));
panel2.addEventListener("click", () => {
  if (mode === "pvp") handleReact("p2");
});
touchP1.addEventListener("click", () => handleReact("p1"));
touchP2.addEventListener("click", () => {
  if (mode === "pvp") handleReact("p2");
});

window.addEventListener("keydown", (e) => {
  if (!mode) return;
  if (reactionOpen || lateWindow) {
    if (mode === "pve" && e.code === "Space") {
      e.preventDefault();
      handleReact("p1");
    }
    if (mode === "pvp") {
      if (e.key === "a" || e.key === "A") handleReact("p1");
      if (e.key === "l" || e.key === "L") handleReact("p2");
    }
  }
});

/* Late window to allow both players' times */
function startLateWindow() {
  reactionOpen = false;
  lateWindow = true;
  clearTimeout(lateTimer);
  lateTimer = setTimeout(() => {
    lateWindow = false;
    finalizeRound();
  }, 1100);
}

/* ========== Finalize round and match logic ========== */
function finalizeRound() {
  lateWindow = false;
  reactionOpen = false;
  clearTimeout(lateTimer);
  const p1t = parseInt(time1.textContent) || null;
  const p2t = parseInt(time2.textContent) || null;
  let winner = "Tie";
  if (p1t !== null && p2t !== null) {
    if (p1t < p2t) winner = "Player 1";
    else if (p2t < p1t) winner = mode === "pve" ? "AI" : "Player 2";
    else winner = "Tie";
  } else if (p1t !== null) winner = "Player 1";
  else if (p2t !== null) winner = mode === "pve" ? "AI" : "Player 2";
  else winner = "No one";

  // highlight & animate winner
  if (winner === "Player 1") {
    panel1.classList.add("highlight", "winner-anim");
  } else if (winner === "Player 2" || winner === "AI") {
    panel2.classList.add("highlight", "winner-anim");
  }

  // update wins
  if (winner === "Player 1") wins.p1 += 1;
  else if (winner === "Player 2" || winner === "AI") wins.p2 += 1;
  wins1El.textContent = wins.p1;
  wins2El.textContent = wins.p2;

  // best score check
  const candidateTimes = [p1t, p2t].filter((v) => v !== null);
  if (candidateTimes.length) {
    const bestThisRound = Math.min(...candidateTimes);
    if (!best || bestThisRound < best) {
      best = bestThisRound;
      localStorage.setItem("bestScore", best);
      updateBestDisplay();
      bestBadge.classList.add("best-glow");
      setTimeout(() => bestBadge.classList.remove("best-glow"), 1400);
    }
  }

  // add to history
  addHistoryItem({
    round: `#${roundNumber}`,
    mode: mode,
    winner: winner,
    p1: p1t,
    p2: p2t,
  });

  // confetti from side
  if (winner === "Player 1") {
    createConfetti("left");
  } else if (winner === "Player 2" || winner === "AI") {
    createConfetti("right");
  }

  // check match end
  const needed = Math.ceil(roundsForMatch / 2);
  if (wins.p1 >= needed || wins.p2 >= needed) {
    const matchWinner =
      wins.p1 >= needed ? "Player 1" : mode === "pve" ? "AI" : "Player 2";
    showMatchWinner(matchWinner);
  } else {
    // continue next round
    setTimeout(() => {
      panel1.classList.remove("winner-anim");
      panel2.classList.remove("winner-anim");
      setTimeout(() => startNextRound(), 900);
    }, 700);
  }
}

/* Match winner behavior */
function showMatchWinner(winner) {
  matchBanner.style.display = "block";
  matchBanner.textContent = `${winner} wins the match!`;
  createConfetti(winner === "Player 1" ? "left" : "right", true);
  setTimeout(() => {
    matchBanner.style.display = "none";
    resetMatch();
    showHome();
  }, 2500);
}
function resetMatch() {
  wins = { p1: 0, p2: 0 };
  wins1El.textContent = "0";
  wins2El.textContent = "0";
  roundNumber = 0;
  roundsForMatch = parseInt(matchBestOfSelect.value, 10) || 5;
}

/* Highlight helper */
function highlight(panelId) {
  panel1.classList.remove("highlight");
  panel2.classList.remove("highlight");
  if (panelId === "panel1") panel1.classList.add("highlight");
  else panel2.classList.add("highlight");
}

/* ========== Confetti ========== */
function createConfetti(side = "center", big = false) {
  clearConfetti();
  const colors = [
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#60a5fa",
    "#a78bfa",
    "#fb7185",
  ];
  const count = big ? 60 : 30;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "piece";
    const left =
      side === "left"
        ? Math.random() * 40
        : side === "right"
        ? 60 + Math.random() * 40
        : Math.random() * 100;
    const tx = (Math.random() * 200 - 100).toFixed(0) + "px";
    const delay = (Math.random() * 0.4).toFixed(2) + "s";
    const duration = (Math.random() * 1.6 + 1.2).toFixed(2) + "s";
    el.style.left = left + "%";
    el.style.top = "-10%";
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.setProperty("--tx", tx);
    el.style.animationDuration = duration;
    el.style.animationDelay = delay;
    confettiRoot.appendChild(el);
  }
  setTimeout(clearConfetti, big ? 4000 : 3000);
}
function clearConfetti() {
  while (confettiRoot.firstChild)
    confettiRoot.removeChild(confettiRoot.firstChild);
}

/* ========== CSV Export ========== */
function exportHistoryCSV() {
  if (history.length === 0) {
    alert("No history to export");
    return;
  }
  const rows = [["Round", "Mode", "Winner", "Player1(ms)", "Player2(ms)"]];
  // reverse so oldest first
  history
    .slice()
    .reverse()
    .forEach((h) => {
      rows.push([h.round, h.mode, h.winner, h.p1 ?? "", h.p2 ?? ""]);
    });
  const csv = rows
    .map((r) =>
      r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reaction_history.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ========== Init & Load ========== */
function init() {
  panel1.tabIndex = 0;
  panel2.tabIndex = 0;
  renderHistory();
  updateBestDisplay();
  // Unlock audio context on first user gesture for mobile
  window.addEventListener(
    "click",
    function unlockAudio() {
      try {
        if (audioCtx.state === "suspended") audioCtx.resume();
      } catch (e) {}
      window.removeEventListener("click", unlockAudio);
    },
    { once: true }
  );
}
init();

/* Expose debug API if needed */
window.reactionTrainer = { begin, resetPanels, history };
