// CANVAS SETUP
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// DOM ELEMENTS
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const playerNameInput = document.getElementById("playerName");
const leaderboard = document.getElementById("leaderboard");
const gameOverScreen = document.getElementById("gameOver");
const finalScore = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");
const maxScoreDisplay = document.getElementById("maxScore");

// GLOBAL VARIABLES
let player = null;
let bots = [];
let bonus = [];
let mouse = {x:0,y:0};
let gameRunning = false;
let maxScore = parseFloat(localStorage.getItem("maxScore")) || 0;
maxScoreDisplay.innerText = maxScore;

// BOT NOMS ABRUSDES
const botNames = ["PatateNinja","FromageVolant","ChienArcEnCiel","LicorneFurieuse","ChatMutant","PandaMagique","BananeExplosive","CactusDansant"];

function randomColor(){ return `hsl(${Math.random()*360},80%,60%)`; }

// INIT GAME
function initGame(playerName){
  player = {x:canvas.width/2, y:canvas.height/2, r:20, color:"#0ff", name:playerName, score:0};
  bots = [];
  for(let i=0;i<5;i++){
    bots.push({
      x:Math.random()*canvas.width,
      y:Math.random()*canvas.height,
      r:20,
      color:randomColor(),
      name:botNames[Math.floor(Math.random()*botNames.length)],
      score:0
    });
  }
  bonus = [];
  spawnBonus();
}

// SPAWN BONUS
function spawnBonus(){
  for(let i=0;i<5;i++){
    bonus.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, r:5});
  }
}

// MOVEMENT
canvas.addEventListener("mousemove",e=>{mouse.x=e.clientX; mouse.y=e.clientY;});

// COLLISIONS
function distance(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }

// GAME LOOP
function loop(){
  if(!gameRunning) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // PLAYER MOVE
  let dx = mouse.x - player.x;
  let dy = mouse.y - player.y;
  let dist = Math.hypot(dx,dy);
  if(dist>1){ player.x += dx/dist*3; player.y += dy/dist*3; }

  // DRAW BONUS
  bonus.forEach((b,i)=>{
    ctx.beginPath();
    ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
    ctx.fillStyle = "#FFD700";
    ctx.fill();
    ctx.closePath();

    if(distance(player,b)<player.r+b.r){ player.r +=2; player.score+=2; bonus.splice(i,1); spawnBonus(); }
    bots.forEach(bot=>{ if(distance(bot,b)<bot.r+b.r){ bot.r+=2; bot.score+=2; bonus.splice(i,1); spawnBonus(); } });
  });

  // DRAW PLAYER
  ctx.beginPath();
  ctx.arc(player.x,player.y,player.r,0,Math.PI*2);
  ctx.fillStyle = player.color;
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.closePath();

  // DRAW BOTS
  bots.forEach(bot=>{
    // AI : move towards player or random direction if small
    let dx = player.x - bot.x;
    let dy = player.y - bot.y;
    let dist = Math.hypot(dx,dy);
    if(bot.r<player.r){ // fuir si plus petit
      bot.x -= dx/dist*2;
      bot.y -= dy/dist*2;
    }else{ // poursuivre joueur si plus gros
      bot.x += dx/dist*2;
      bot.y += dy/dist*2;
    }

    // DRAW
    ctx.beginPath();
    ctx.arc(bot.x,bot.y,bot.r,0,Math.PI*2);
    ctx.fillStyle = bot.color;
    ctx.shadowColor = bot.color;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();

    // COLLISION BOT-BOT
    bots.forEach(other=>{
      if(bot===other) return;
      let d = distance(bot,other);
      if(d<bot.r+other.r){
        let angle = Math.atan2(other.y-bot.y,other.x-bot.x);
        bot.x -= Math.cos(angle);
        bot.y -= Math.sin(angle);
      }
    });

    // COLLISION PLAYER-BOT
    if(distance(bot,player)<bot.r+player.r){
      if(bot.r>=player.r){
        // PLAYER DEAD
        gameOver();
      }else{
        player.r += bot.r/2;
        player.score += Math.floor(bot.r);
        bots.splice(bots.indexOf(bot),1);
      }
    }
  });

  // UPDATE LEADERBOARD
  updateLeaderboard();
  requestAnimationFrame(loop);
}

// LEADERBOARD
function updateLeaderboard(){
  let all = [player,...bots].sort((a,b)=>b.r - a.r).slice(0,5);
  let lb = "<strong>Leaderboard</strong><br>";
  all.forEach((p,i)=>{ lb += `${i+1}. ${p.name} - ${Math.floor(p.r)}<br>`; });
  leaderboard.innerHTML = lb;
}

// GAME OVER
function gameOver(){
  gameRunning=false;
  finalScore.innerText = `Ton score: ${Math.floor(player.score)}`;
  gameOverScreen.style.display="block";
  if(player.score>maxScore){ maxScore = Math.floor(player.score); localStorage.setItem("maxScore",maxScore); maxScoreDisplay.innerText=maxScore; }
}

// RESTART
restartBtn.addEventListener("click",()=>{
  gameOverScreen.style.display="none";
  menu.style.display="block";
});

// START GAME
startBtn.addEventListener("click",()=>{
  let name = playerNameInput.value || "Player";
  menu.style.display="none";
  gameOverScreen.style.display="none";
  initGame(name);
  gameRunning = true;
  loop();
});

