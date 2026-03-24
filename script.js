
const players = [
  { name:"Игрок 1", score:0, sticks:0, stars:0, start:false },
  { name:"Игрок 2", score:0, sticks:0, stars:0, start:false }
];

let current = 0;
let diceLeft = 5;
let turnScore = 0;
let mustRollAll = false;

function log(t){
  const el=document.getElementById("log");
  el.innerHTML+=t+"<br>";
  el.scrollTop=el.scrollHeight;
}

function getTarget(score){
  if(score>=205 && score<=300) return 300;
  if(score>=505 && score<=600) return 600;
  if(score>=805 && score<=900) return 900;
  return null;
}

function updateUI(){
  document.getElementById("currentPlayer").innerText="Ход: "+players[current].name;
  document.getElementById("turnScore").innerText=turnScore;

  document.getElementById("players").innerHTML =
    players.map(p=>`${p.name}: ${p.score} 💀${p.sticks} ⭐${p.stars}`).join(" | ");

  const btn=document.querySelector("button[onclick='takeScore()']");
  let minTake = players[current].start ? 25 : 50;

  let future = players[current].score + turnScore;

  let blockNear1000 = (1000 - future) < 25 && future < 1000;

  let target = getTarget(players[current].score);
  let rangeBlock = target && future < target;

  btn.disabled =
    turnScore < minTake ||
    mustRollAll ||
    blockNear1000 ||
    rangeBlock;
}

function rollDice(n){
  return Array.from({length:n},()=>Math.floor(Math.random()*6)+1);
}

function countScore(dice){
  let c={}, score=0, used=0;
  dice.forEach(d=>c[d]=(c[d]||0)+1);

  for(let n=1;n<=6;n++){
    let val = (n===1)?10:n;

    if(c[n]>=5){ score+=val*100; used+=5; c[n]-=5; }
    else if(c[n]>=4){ score+=val*20; used+=4; c[n]-=4; }
    else if(c[n]>=3){ score+=val*10; used+=3; c[n]-=3; }
  }

  if(c[1]){ score+=c[1]*10; used+=c[1]; }
  if(c[5]){ score+=c[5]*5; used+=c[5]; }

  return {score,used};
}

function roll(){
  const dice = rollDice(diceLeft);
  document.getElementById("dice").innerText=dice.join(" ");

  const {score,used} = countScore(dice);

  if(score===0){
    log("❌ Пусто — палка");
    players[current].sticks++;

    if(players[current].sticks>=3){
      players[current].score -= 50;
      players[current].sticks = 0;
      players[current].start = true; // 👈 важно
      log("💥 3 палки → -50");
    }

    nextPlayer();
    return;
  }

  turnScore += score;
  diceLeft -= used;

  let total = players[current].score + turnScore;

  log(`🎲 ${dice.join(", ")} → +${score}`);

  // перебор → звезда
  if(total > 1000){
    players[current].stars++;
    log("🌟 Перебор → звезда");

    if(players[current].stars>=3){
      players[current].score -= 100;
      players[current].stars = 0;
      players[current].start = true; // 👈 важно
      log("💥 3 звезды → -100");
    }

    turnScore = 0;
    nextPlayer();
    return;
  }

  // ровно 1000
  if(total === 1000){
    alert("🏆 Победил " + players[current].name);
    location.reload();
    return;
  }

  if(diceLeft===0){
    mustRollAll = true;
    diceLeft = 5;
    log("🔥 Все кубики сыграли — бросаешь снова");
  } else {
    mustRollAll = false;
  }

  updateUI();
}

function takeScore(){
  let minTake = players[current].start ? 25 : 50;
  let future = players[current].score + turnScore;

  let target = getTarget(players[current].score);

  if(
    turnScore < minTake ||
    mustRollAll ||
    ((1000 - future) < 25 && future < 1000) ||
    (target && future < target)
  ) return;

  const oldScores = players.map(p=>p.score);

  players[current].score += turnScore;
  players[current].start = true;

  if(players[current].sticks>0){
    players[current].sticks = 0;
    log("✨ Палки сгорели");
  }

  // обгон
  for(let i=0;i<players.length;i++){
    if(i===current) continue;

    if(
      oldScores[current] < oldScores[i] &&
      players[current].score > players[i].score
    ){
      players[i].score -= 50;
      players[i].start = true; // 👈 важно
      log(`⚠️ ${players[i].name} обогнан → -50`);
    }
  }

  log(`✅ +${turnScore}`);

  nextPlayer();
}

function nextPlayer(){
  current = (current + 1) % players.length;
  turnScore = 0;
  diceLeft = 5;
  mustRollAll = false;
  document.getElementById("dice").innerText = "– – – – –";
  updateUI();
}

updateUI();
