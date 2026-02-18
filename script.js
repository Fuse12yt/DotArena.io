const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Joueur
const player = {x:canvas.width/2, y:canvas.height/2, r:20, color:"#0ff", score:0};

// Bots
const bots = [];
for(let i=0;i<5;i++){
  bots.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, r:20, color:"#f0f", score:0});
}

// Bonus
const bonus = [];
function spawnBonus(){
  bonus.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, r:5});
}
setInterval(spawnBonus,2000);

// Mouvement joueur
let mouse = {x:player.x, y:player.y};
canvas.addEventListener("mousemove",e=>{mouse.x=e.clientX; mouse.y=e.clientY;});

// Leaderboard
function updateLeaderboard(){
  let all = [player, ...bots];
  all.sort((a,b)=>b.r - a.r);
  let lb = "<strong>Leaderboard</strong><br>";
  all.slice(0,5).forEach((p,i)=>{ lb += `${i+1}. ${p.color} - ${Math.floor(p.r)}<br>`; });
  document.getElementById("leaderboard").innerHTML = lb;
}

// Game Loop
function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Joueur suit souris
  let dx = mouse.x-player.x;
  let dy = mouse.y-player.y;
  let dist = Math.sqrt(dx*dx+dy*dy);
  if(dist>1){
    player.x += dx/dist*3;
    player.y += dy/dist*3;
  }

  // Bots suivent joueur
  bots.forEach(b=>{
    let dx = player.x - b.x;
    let dy = player.y - b.y;
    let dist = Math.sqrt(dx*dx+dy*dy);
    if(dist>1){
      b.x += dx/dist*2;
      b.y += dy/dist*2;
    }
  });

  // Dessin bonus
  bonus.forEach((b,i)=>{
    ctx.beginPath();
    ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
    ctx.fillStyle = "#FFD700";
    ctx.fill();
    ctx.closePath();

    // Collision avec joueur
    let dx = b.x-player.x;
    let dy = b.y-player.y;
    if(Math.sqrt(dx*dx+dy*dy)<player.r+b.r){
      player.r += 2;
      bonus.splice(i,1);
    }

    // Collision avec bots
    bots.forEach(bot=>{
      let dx = b.x-bot.x;
      let dy = b.y-bot.y;
      if(Math.sqrt(dx*dx+dy*dy)<bot.r+b.r){
        bot.r +=2;
        bonus.splice(i,1);
      }
    });
  });

  // Dessin joueur
  ctx.beginPath();
  ctx.arc(player.x,player.y,player.r,0,Math.PI*2);
  ctx.fillStyle = player.color;
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.closePath();

  // Dessin bots
  bots.forEach(b=>{
    ctx.beginPath();
    ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();
  });

  updateLeaderboard();
  requestAnimationFrame(loop);
}

loop();

