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
let particles = [];
let mouse = {x:0,y:0};
let gameRunning = false;
let maxScore = parseFloat(localStorage.getItem("maxScore")) || 0;
maxScoreDisplay.innerText = maxScore;

// BOT NOMS ABRUSDES
const botNames = ["PatateNinja","FromageVolant","ChienArcEnCiel","LicorneFurieuse","ChatMutant","PandaMagique","BananeExplosive","CactusDansant"];
function randomColor(){ return `hsl(${Math.random()*360},80%,60%)`; }

// PARTICULES
class Particle{
  constructor(x,y,color){
    this.x=x;this.y=y;
    this.vx=(Math.random()-0.5)*4;
    this.vy=(Math.random()-0.5)*4;
    this.alpha=1;
    this.color=color;
    this.size=5+Math.random()*5;
  }
  update(){
    this.x+=this.vx;
    this.y+=this.vy;
    this.alpha-=0.03;
  }
  draw(ctx){
    ctx.save();
    ctx.globalAlpha=this.alpha;
    ctx.fillStyle=this.color;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }
}

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
  particles = [];
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

// RESPAWN POSITION
function randomPos(){
  return {x:Math.random()*canvas.width, y:Math.random()*canvas.height};
}

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

  // DRAW PARTICLES
  particles.forEach((p,i)=>{
    p.update();
    if(p.alpha<=0) particles.splice(i,1);
    else p.draw(ctx);
  });

  // DRAW PLAYER
  ctx.beginPath();
  ctx.arc(player.x,player.y,player.r,0,Math.PI*2);
  ctx.fillStyle = player.color;
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.closePath();
  ctx.fillStyle="white";
  ctx.font="16px Arial";
  ctx.textAlign="center";
  ctx.fillText(player.name,player.x,player.y- player.r -5);

  // DRAW BOTS
  bots.forEach(bot=>{
    // AI MOVE
    let dx = player.x - bot.x;
    let dy = player.y - bot.y;
    let dist = Math.hypot(dx,dy);
    if(bot.r<player.r){ bot.x -= dx/dist*2; bot.y -= dy/dist*2; } // fuir
    else{ bot.x += dx/dist*2; bot.y += dy/dist*2; } // poursuivre

    // COLLISION BOT-BOT
    bots.forEach(other=>{
      if(bot===other) return;
      let d = distance(bot,other);
      if(d<bot.r+other.r){
        if(bot.r>other.r){
          bot.r+=other.r/2; // plus gros gagne
          particles.push(new Particle(other.x,other.y,other.color));
          let pos = randomPos();
          other.x = pos.x; other.y = pos.y; other.r=20;
        }
      }
    });

    // COLLISION PLAYER-BOT
    if(distance(bot,player)<bot.r+player.r){
      if(bot.r>=player.r){
        particles.push(new Particle(player.x,player.y,player.color));
        gameOver();
      }else{
        player.r += bot.r/2;
        player.score += Math.floor(bot.r);
        particles.push(new Particle(bot.x,bot.y,bot.color));
        let pos = randomPos();
        bot.x=pos.x; bot.y=pos.y; bot.r=20;
      }
    }

    // DRAW BOT
    ctx.beginPath();
    ctx.arc(bot.x,bot.y,bot.r,0,Math.PI*2);
    ctx.fillStyle = bot.color;
    ctx.shadowColor = bot.color;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();
    ctx.fillStyle="white";
    ctx.font="14px Arial";
    ctx.textAlign="center";
    ctx.fillText(bot.name,bot.x,bot.y-bot.r-5);
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
