const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
const game = {
  running: true,
  frameCount: 0
};

// Crowd particles
let crowdMembers = [];
let particles = [];

// Initialize crowd
function initializeCrowd() {
  crowdMembers = [];
  // Create spectators in the background
  for (let i = 0; i < 30; i++) {
    crowdMembers.push({
      x: Math.random() * canvas.width,
      y: 50 + Math.random() * 80,
      size: 15 + Math.random() * 10,
      color: ['#FF4444', '#4444FF', '#44FF44', '#FFFF44'][Math.floor(Math.random() * 4)],
      cheer: 0,
      cheerDuration: Math.random() * 60 + 30
    });
  }
}

// Wrestler class
class Wrestler {
  constructor(x, y, color, isPlayer1) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.isPlayer1 = isPlayer1;
    this.width = 50;
    this.height = 70;
    this.health = 100;
    this.maxHealth = 100;
    this.vx = 0;
    this.vy = 0;
    this.speed = 5;
    this.attacking = false;
    this.attackCooldown = 0;
    this.attackRange = 80;
    this.attackDamage = 15;
    this.isHit = false;
    this.hitFlash = 0;
  }

  update(keys) {
    // Movement
    this.vx = 0;
    this.vy = 0;

    if (this.isPlayer1) {
      if (keys['w'] || keys['W']) this.vy = -this.speed;
      if (keys['s'] || keys['S']) this.vy = this.speed;
      if (keys['a'] || keys['A']) this.vx = -this.speed;
      if (keys['d'] || keys['D']) this.vx = this.speed;
      if (keys['g'] || keys['G'] && this.attackCooldown === 0) {
        this.attack(player2);
      }
    } else {
      if (keys['ArrowUp']) this.vy = -this.speed;
      if (keys['ArrowDown']) this.vy = this.speed;
      if (keys['ArrowLeft']) this.vx = -this.speed;
      if (keys['ArrowRight']) this.vx = this.speed;
      if (keys['l'] || keys['L'] && this.attackCooldown === 0) {
        this.attack(player1);
      }
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Boundary check
    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
    this.y = Math.max(150, Math.min(canvas.height - this.height - 20, this.y));

    // Cool down
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    if (this.hitFlash > 0) {
      this.hitFlash--;
    }
  }

  attack(opponent) {
    const distance = Math.hypot(
      this.x + this.width / 2 - (opponent.x + opponent.width / 2),
      this.y + this.height / 2 - (opponent.y + opponent.height / 2)
    );

    if (distance < this.attackRange) {
      opponent.takeDamage(this.attackDamage);
      this.attackCooldown = 30;
      this.attacking = true;
      
      // Add impact particles
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: opponent.x + opponent.width / 2,
          y: opponent.y + opponent.height / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 2,
          life: 20,
          color: '#FFD700'
        });
      }
      
      // Make crowd cheer
      crowdMembers.forEach(member => {
        member.cheer = member.cheerDuration;
      });
    }

    setTimeout(() => {
      this.attacking = false;
    }, 150);
  }

  takeDamage(damage) {
    this.health -= damage;
    this.hitFlash = 10;
    this.isHit = true;
    setTimeout(() => {
      this.isHit = false;
    }, 200);
  }

  draw() {
    ctx.save();

    // Flash when hit
    if (this.hitFlash > 0) {
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
    }

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Draw legs
    ctx.fillStyle = '#333333';
    ctx.fillRect(this.x + 8, this.y + 50, 12, 25);
    ctx.fillRect(this.x + 30, this.y + 50, 12, 25);

    // Draw shorts/trunks
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x + 5, this.y + 40, 40, 15);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x + 5, this.y + 40, 40, 15);

    // Draw muscular chest/body
    ctx.fillStyle = this.isPlayer1 ? '#CC6633' : '#333388';
    ctx.fillRect(this.x, this.y + 15, this.width, 30);

    // Draw muscles (chest definition)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x + 25, this.y + 15);
    ctx.lineTo(this.x + 25, this.y + 45);
    ctx.stroke();

    // Draw shoulders/arms
    ctx.fillStyle = this.isPlayer1 ? '#CC6633' : '#333388';
    // Left arm
    ctx.beginPath();
    ctx.ellipse(this.x - 5, this.y + 20, 8, 20, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Right arm
    ctx.beginPath();
    ctx.ellipse(this.x + this.width + 5, this.y + 20, 8, 20, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Draw biceps
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x - 5, this.y + 20, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x + this.width + 5, this.y + 20, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Draw neck
    ctx.fillStyle = this.isPlayer1 ? '#CC6633' : '#333388';
    ctx.fillRect(this.x + 18, this.y - 5, 14, 20);

    // Draw head
    ctx.fillStyle = this.isPlayer1 ? '#CC6633' : '#333388';
    ctx.beginPath();
    ctx.arc(centerX, this.y - 18, 18, 0, Math.PI * 2);
    ctx.fill();

    // Draw skin tone face area
    ctx.fillStyle = '#FFAA88';
    ctx.beginPath();
    ctx.arc(centerX, this.y - 15, 12, 0, Math.PI * 2);
    ctx.fill();

    // Draw hair
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX, this.y - 25, 18, 0, Math.PI);
    ctx.fill();

    // Draw eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX - 6, this.y - 18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 6, this.y - 18, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw pupils
    ctx.fillStyle = 'black';
    if (this.health < 30) {
      // Dazed look
      ctx.beginPath();
      ctx.arc(centerX - 6, this.y - 19, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + 6, this.y - 19, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(centerX - 6, this.y - 17, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + 6, this.y - 17, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw intense eyebrows
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 10, this.y - 22);
    ctx.lineTo(centerX - 2, this.y - 24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 10, this.y - 22);
    ctx.lineTo(centerX + 2, this.y - 24);
    ctx.stroke();

    // Draw nose
    ctx.beginPath();
    ctx.moveTo(centerX, this.y - 15);
    ctx.lineTo(centerX - 2, this.y - 10);
    ctx.lineTo(centerX + 2, this.y - 10);
    ctx.closePath();
    ctx.fillStyle = '#DD9966';
    ctx.fill();

    // Draw mouth
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (this.health > 50) {
      // Confident smile
      ctx.arc(centerX, this.y - 5, 6, 0, Math.PI);
    } else if (this.health > 25) {
      // Grimace
      ctx.moveTo(centerX - 5, this.y - 5);
      ctx.lineTo(centerX + 5, this.y - 5);
    } else {
      // Pain expression
      ctx.moveTo(centerX - 5, this.y - 3);
      ctx.lineTo(centerX + 5, this.y - 3);
    }
    ctx.stroke();

    // Draw attack indicator
    if (this.attacking) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.attackRange, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Initialize wrestlers
const player1 = new Wrestler(100, 300, '#FF4444', true);
const player2 = new Wrestler(canvas.width - 150, 300, '#4444FF', false);

// Keyboard tracking
const keys = {};
document.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// Draw functions
function drawBackground() {
  // Stadium background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1a3a52');
  gradient.addColorStop(1, '#0d1f2d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Crowd in background
  ctx.fillStyle = '#333333';
  ctx.fillRect(0, 0, canvas.width, 150);

  drawCrowd();

  // Ring floor
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(50, 300, canvas.width - 100, 200);

  // Ring border
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 4;
  ctx.strokeRect(50, 300, canvas.width - 100, 200);

  // Ropes
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(50, 330 + i * 40);
    ctx.lineTo(canvas.width - 50, 330 + i * 40);
    ctx.stroke();
  }
}

function drawCrowd() {
  crowdMembers.forEach(member => {
    ctx.save();

    // Body
    ctx.fillStyle = member.color;
    ctx.fillRect(member.x - member.size / 2, member.y, member.size, member.size);

    // Head
    ctx.fillStyle = '#FFCC99';
    ctx.beginPath();
    ctx.arc(member.x, member.y - 8, member.size / 3, 0, Math.PI * 2);
    ctx.fill();

    // Cheer animation
    if (member.cheer > 0) {
      member.cheer--;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🙌', member.x, member.y - 25 - (member.cheerDuration - member.cheer) * 0.5);
    }

    ctx.restore();
  });
}

function drawHealthBars() {
  const barWidth = 200;
  const barHeight = 20;
  const padding = 20;

  // Player 1 health bar
  ctx.fillStyle = '#444444';
  ctx.fillRect(padding, padding, barWidth, barHeight);
  ctx.fillStyle = '#FF4444';
  ctx.fillRect(padding, padding, (player1.health / player1.maxHealth) * barWidth, barHeight);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.strokeRect(padding, padding, barWidth, barHeight);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px Arial';
  ctx.fillText(`Player 1: ${Math.max(0, Math.floor(player1.health))}`, padding + barWidth / 2, padding + 15);

  // Player 2 health bar
  ctx.fillStyle = '#444444';
  ctx.fillRect(canvas.width - padding - barWidth, padding, barWidth, barHeight);
  ctx.fillStyle = '#4444FF';
  ctx.fillRect(canvas.width - padding - barWidth, padding, (player2.health / player2.maxHealth) * barWidth, barHeight);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.strokeRect(canvas.width - padding - barWidth, padding, barWidth, barHeight);

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'right';
  ctx.fillText(`Player 2: ${Math.max(0, Math.floor(player2.health))}`, canvas.width - padding - barWidth / 2, padding + 15);
}

function drawParticles() {
  particles = particles.filter(p => p.life > 0);

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3; // gravity
    p.life--;

    ctx.save();
    ctx.globalAlpha = p.life / 20;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawGameOver() {
  const winner = player1.health > player2.health ? 'Player 1 (Red)' : 'Player 2 (Blue)';
  
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2 - 50);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px Arial';
  ctx.fillText(`${winner} WINS!`, canvas.width / 2, canvas.height / 2 + 20);

  ctx.font = '20px Arial';
  ctx.fillText('Refresh the page to play again', canvas.width / 2, canvas.height / 2 + 70);

  ctx.restore();
}

// Game loop
function gameLoop() {
  // Update
  player1.update(keys);
  player2.update(keys);

  // Check game over
  if (player1.health <= 0 || player2.health <= 0) {
    game.running = false;
  }

  // Draw
  drawBackground();
  player1.draw();
  player2.draw();
  drawParticles();
  drawHealthBars();

  if (!game.running) {
    drawGameOver();
  } else {
    requestAnimationFrame(gameLoop);
  }
}

// Start game
initializeCrowd();
gameLoop();