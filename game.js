const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
const game = {
  running: true,
  frameCount: 0,
  arenaLeft: 100,
  arenaRight: canvas.width - 100,
  arenaTop: 200,
  arenaBottom: 450
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
    this.isJumping = false;
    this.jumpPower = 15;
    this.gravity = 0.6;
    this.isBlocking = false;
    this.blockDuration = 0;
    this.blockMaxDuration = 120; // 2 seconds of blocking max
    this.blockCooldown = 0;
    this.blockCooldownMax = 60; // 1 second cooldown after block breaks
    this.groundY = 420;
    this.lastAttackType = null; // 'punch' or 'kick'
    this.timeSinceDamage = 0;
    this.regenDelay = 120; // Start regenerating after 2 seconds
    this.regenRate = 0.3; // Health per frame
  }

  update(keys) {
    // Movement
    this.vx = 0;

    if (this.isPlayer1) {
      // Jump with W
      if ((keys['w'] || keys['W']) && !this.isJumping) {
        this.vy = -this.jumpPower;
        this.isJumping = true;
      }
      // Block with S
      if ((keys['s'] || keys['S']) && this.blockCooldown === 0) {
        if (this.blockDuration < this.blockMaxDuration) {
          this.isBlocking = true;
          this.blockDuration++;
        } else {
          // Block breaks after max duration
          this.blockCooldown = this.blockCooldownMax;
          this.isBlocking = false;
        }
      } else {
        this.isBlocking = false;
      }
      // Horizontal movement
      if (keys['a'] || keys['A']) this.vx = -this.speed;
      if (keys['d'] || keys['D']) this.vx = this.speed;
      // Punch with G
      if ((keys['g'] || keys['G']) && this.attackCooldown === 0 && !this.isBlocking) {
        this.punch(player2);
      }
      // Kick with Q
      if ((keys['q'] || keys['Q']) && this.attackCooldown === 0 && !this.isBlocking) {
        this.kick(player2);
      }
    } else {
      // Jump with Up Arrow
      if (keys['ArrowUp'] && !this.isJumping) {
        this.vy = -this.jumpPower;
        this.isJumping = true;
      }
      // Block with Down Arrow
      if (keys['ArrowDown'] && this.blockCooldown === 0) {
        if (this.blockDuration < this.blockMaxDuration) {
          this.isBlocking = true;
          this.blockDuration++;
        } else {
          // Block breaks after max duration
          this.blockCooldown = this.blockCooldownMax;
          this.isBlocking = false;
        }
      } else {
        this.isBlocking = false;
      }
      // Horizontal movement
      if (keys['ArrowLeft']) this.vx = -this.speed;
      if (keys['ArrowRight']) this.vx = this.speed;
      // Punch with L
      if ((keys['l'] || keys['L']) && this.attackCooldown === 0 && !this.isBlocking) {
        this.punch(player1);
      }
      // Kick with P
      if ((keys['p'] || keys['P']) && this.attackCooldown === 0 && !this.isBlocking) {
        this.kick(player1);
      }
    }

    // Reset block duration if not blocking
    if (!this.isBlocking) {
      this.blockDuration = 0;
    }

    // Apply gravity
    this.vy += this.gravity;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Ground collision
    if (this.y + this.height >= this.groundY) {
      this.y = this.groundY - this.height;
      this.vy = 0;
      this.isJumping = false;
    }

    // Boundary check (horizontal) - confined to arena
    this.x = Math.max(game.arenaLeft, Math.min(game.arenaRight - this.width, this.x));

    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    if (this.blockCooldown > 0) {
      this.blockCooldown--;
    }
    if (this.hitFlash > 0) {
      this.hitFlash--;
    }

    // Health regeneration
    this.timeSinceDamage++;
    if (this.timeSinceDamage > this.regenDelay && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + this.regenRate);
    }
  }

  punch(opponent) {
    const distance = Math.hypot(
      this.x + this.width / 2 - (opponent.x + opponent.width / 2),
      this.y + this.height / 2 - (opponent.y + opponent.height / 2)
    );

    const punchRange = 60;
    if (distance < punchRange) {
      // Reduce damage if opponent is blocking
      let damage = 10; // Punch damage
      if (opponent.isBlocking) {
        damage = 10 * 0.3;
      }
      
      opponent.takeDamage(damage);
      this.attackCooldown = 20;
      this.attacking = true;
      this.lastAttackType = 'punch';
      
      // Add punch particles
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: opponent.x + opponent.width / 2,
          y: opponent.y + opponent.height / 2,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6 - 2,
          life: 15,
          color: '#FF6666'
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

  kick(opponent) {
    const distance = Math.hypot(
      this.x + this.width / 2 - (opponent.x + opponent.width / 2),
      this.y + this.height / 2 - (opponent.y + opponent.height / 2)
    );

    const kickRange = 120;
    if (distance < kickRange) {
      // Reduce damage if opponent is blocking
      let damage = 20; // Kick damage
      if (opponent.isBlocking) {
        damage = 20 * 0.3;
      }
      
      opponent.takeDamage(damage);
      this.attackCooldown = 40; // Slower cooldown for kicks
      this.attacking = true;
      this.lastAttackType = 'kick';
      
      // Add kick particles (more particles)
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: opponent.x + opponent.width / 2,
          y: opponent.y + opponent.height / 2,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10 - 2,
          life: 20,
          color: '#FFD700'
        });
      }
      
      // Make crowd cheer more
      crowdMembers.forEach(member => {
        member.cheer = member.cheerDuration * 1.5;
      });
    }

    setTimeout(() => {
      this.attacking = false;
    }, 200);
  }

  takeDamage(damage) {
    this.health -= damage;
    this.hitFlash = 10;
    this.isHit = true;
    this.timeSinceDamage = 0; // Reset regen timer when taking damage
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

    // Draw blocking shield
    if (this.isBlocking) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.attackRange * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Show block durability
      const blockPercent = this.blockDuration / this.blockMaxDuration;
      ctx.fillStyle = blockPercent > 0.8 ? '#00FF00' : blockPercent > 0.5 ? '#FFFF00' : '#FF0000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Block: ${Math.round((1 - blockPercent) * 100)}%`, centerX, this.y - 40);
    }

    // Show block cooldown
    if (this.blockCooldown > 0) {
      ctx.fillStyle = '#FF0000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Block Broken!', centerX, this.y - 40);
    }

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
    if (this.isBlocking) {
      // Determined look while blocking
      ctx.moveTo(centerX - 5, this.y - 5);
      ctx.lineTo(centerX + 5, this.y - 5);
    } else if (this.health > 50) {
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
  ctx.fillRect(game.arenaLeft, game.arenaTop, game.arenaRight - game.arenaLeft, game.arenaBottom - game.arenaTop);

  // Ring border - solid walls
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 8;
  ctx.strokeRect(game.arenaLeft, game.arenaTop, game.arenaRight - game.arenaLeft, game.arenaBottom - game.arenaTop);

  // Arena walls (filled barriers)
  ctx.fillStyle = 'rgba(200, 50, 50, 0.8)';
  // Left wall
  ctx.fillRect(0, game.arenaTop, game.arenaLeft, game.arenaBottom - game.arenaTop);
  // Right wall
  ctx.fillRect(game.arenaRight, game.arenaTop, game.arenaLeft, game.arenaBottom - game.arenaTop);

  // Warning stripes on walls
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(game.arenaLeft - 20, game.arenaTop + i * 50);
    ctx.lineTo(game.arenaLeft + 5, game.arenaTop + i * 50 + 30);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(game.arenaRight + 20, game.arenaTop + i * 50);
    ctx.lineTo(game.arenaRight - 5, game.arenaTop + i * 50 + 30);
    ctx.stroke();
  }

  // Ropes
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(game.arenaLeft, game.arenaTop + 40 + i * 50);
    ctx.lineTo(game.arenaRight, game.arenaTop + 40 + i * 50);
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