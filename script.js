let players = [],
  current = 0,
  diceLeft = 5,
  turnScore = 0,
  mustRollAll = false,
  lastRoll = [0, 0, 0, 0, 0];

// ===== SETUP =====
function addPlayer() {
  const name = document.getElementById("playerName").value.trim();
  if (!name) return;
  players.push({ name, score: 0, sticks: 0, stars: 0, start: false });
  document.getElementById("playerName").value = "";
  renderPlayerList();
}

function renderPlayerList() {
  document.getElementById("playerList").innerHTML = players
    .map((p) => "• " + p.name)
    .join("<br>");
}

function startGame() {
  if (players.length < 2) {
    alert("Минимум 2 игрока");
    return;
  }
  document.getElementById("setup").style.display = "none";
  document.getElementById("game").style.display = "block";
  updateUI();
}

// ===== GAME =====
function log(t) {
  const el = document.getElementById("log");
  el.innerHTML += t + "<br>";
  el.scrollTop = el.scrollHeight;
}
function getTarget(score) {
  if (score >= 205 && score < 300) return 300;
  if (score >= 505 && score < 600) return 600;
  if (score >= 805 && score < 900) return 900;
  return null;
}

function updateUI() {
  document.getElementById("players").innerHTML = players
    .map((p, i) => {
      let cls = [];
      if (i !== current) cls.push("inactive");
      if (getTarget(p.score)) cls.push("barrel");
      return `<div class="player ${cls.join(" ")}">${p.name}: ${p.score} 💀${p.sticks} ⭐${p.stars}</div>`;
    })
    .join("");

  document.getElementById("currentPlayer").innerText =
    "Ход: " + players[current].name;
  document.getElementById("turnScore").innerText = turnScore;

  const diceContainer = document.getElementById("dice");
  const used = getDiceUsage(lastRoll);
  diceContainer.innerHTML = lastRoll
    .map((d, i) => `<span class="${used[i] ? "" : "inactive"}">${d}</span>`)
    .join("");

  const btnTake = document.getElementById("takeBtn");
  const btnRoll = document.getElementById("rollBtn");

  let minTake = players[current].start ? 25 : 50;
  let future = players[current].score + turnScore;
  let blockNear1000 = 1000 - future < 25 && future < 1000;
  let target = getTarget(players[current].score);
  let rangeBlock = target && future < target;

  btnTake.disabled =
    turnScore < minTake || mustRollAll || blockNear1000 || rangeBlock;
  btnRoll.disabled = false;
}

// ===== Dice scoring =====
function rollDice(n) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 6) + 1);
}
function countScore(dice) {
  let c = {},
    score = 0,
    used = 0;
  dice.forEach((d) => (c[d] = (c[d] || 0) + 1));
  for (let n = 1; n <= 6; n++) {
    let val = n === 1 ? 10 : n;
    if (c[n] >= 5) {
      score += val * 100;
      used += 5;
      c[n] -= 5;
    } else if (c[n] >= 4) {
      score += val * 20;
      used += 4;
      c[n] -= 4;
    } else if (c[n] >= 3) {
      score += val * 10;
      used += 3;
      c[n] -= 3;
    }
  }
  if (c[1]) {
    score += c[1] * 10;
    used += c[1];
  }
  if (c[5]) {
    score += c[5] * 5;
    used += c[5];
  }
  return { score, used };
}

// Определяем, какие кубики использованы
function getDiceUsage(dice) {
  let c = {},
    usedDice = Array(dice.length).fill(false);
  dice.forEach((d) => (c[d] = (c[d] || 0) + 1));
  for (let n = 1; n <= 6; n++) {
    let val = n === 1 ? 10 : n;
    if (c[n] >= 5) {
      markUsed(n, 5);
      c[n] -= 5;
    } else if (c[n] >= 4) {
      markUsed(n, 4);
      c[n] -= 4;
    } else if (c[n] >= 3) {
      markUsed(n, 3);
      c[n] -= 3;
    }
  }
  dice.forEach((d, i) => {
    if ((d === 1 || d === 5) && !usedDice[i]) usedDice[i] = true;
  });
  function markUsed(num, count) {
    for (let i = 0; i < dice.length && count > 0; i++) {
      if (dice[i] === num && !usedDice[i]) {
        usedDice[i] = true;
        count--;
      }
    }
  }
  return usedDice;
}

// ===== ROLL =====
function roll() {
  lastRoll = rollDice(diceLeft);
  const { score, used } = countScore(lastRoll);
  if (score === 0) {
    log("❌ Пусто — палка");
    players[current].sticks++;
    if (players[current].sticks >= 3) {
      players[current].score -= 50;
      players[current].sticks = 0;
      players[current].start = true;
      log("💥 3 палки → -50");
    }
    turnScore = 0;
    diceLeft = 5;
    mustRollAll = false;
    updateUI();
    document.getElementById("rollBtn").disabled = true;
    setTimeout(nextPlayer, 1000);
    return;
  }
  turnScore += score;
  diceLeft -= used;
  let total = players[current].score + turnScore;
  log(`🎲 ${lastRoll.join(", ")} → +${score}`);
  if (total > 1000) {
    players[current].stars++;
    log("🌟 Перебор → звезда");
    if (players[current].stars >= 3) {
      players[current].score -= 100;
      players[current].stars = 0;
      players[current].start = true;
      log("💥 3 звезды → -100");
    }
    turnScore = 0;
    diceLeft = 5;
    mustRollAll = false;
    updateUI();
    document.getElementById("rollBtn").disabled = true;
    setTimeout(nextPlayer, 1000);
    return;
  }
  if (total === 1000) {
    alert("🏆 Победил " + players[current].name);
    location.reload();
    return;
  }
  if (diceLeft === 0) {
    mustRollAll = true;
    diceLeft = 5;
    log("🔥 Все кубики сыграли — бросаешь снова");
  } else mustRollAll = false;
  updateUI();
}

// ===== TAKE SCORE =====
function takeScore() {
  let minTake = players[current].start ? 25 : 50;
  let future = players[current].score + turnScore;
  let target = getTarget(players[current].score);
  if (
    turnScore < minTake ||
    mustRollAll ||
    (1000 - future < 25 && future < 1000) ||
    (target && future < target)
  )
    return;
  const oldScores = players.map((p) => p.score);
  players[current].score += turnScore;
  players[current].start = true;
  if (players[current].sticks > 0) players[current].sticks = 0;
  for (let i = 0; i < players.length; i++) {
    if (i === current) continue;
    if (
      oldScores[current] < oldScores[i] &&
      players[current].score > players[i].score
    ) {
      players[i].score -= 50;
      players[i].start = true;
      log(`⚠️ ${players[i].name} обогнан → -50`);
    }
  }
  log(`✅ +${turnScore}`);
  turnScore = 0;
  diceLeft = 5;
  mustRollAll = false;
  lastRoll = [0, 0, 0, 0, 0];
  updateUI();
  document.getElementById("rollBtn").disabled = true;
  setTimeout(nextPlayer, 500);
}

// ===== NEXT PLAYER =====
function nextPlayer() {
  current = (current + 1) % players.length;
  turnScore = 0;
  diceLeft = 5;
  mustRollAll = false;
  lastRoll = [0, 0, 0, 0, 0];
  updateUI();
}
