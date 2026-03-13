/**
 * Traubenzuckermeister - Smooth Snake CAPTCHA
 * 
 * Ein hochglanzpoliertes, canvas-basiertes Snake-Spiel.
 * Fokus auf: smarte Animationen, Glow-Effekte, saubere Steuerung und Apple-like Design.
 */

class SnakeCAPTCHA {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimiere Performance
    
    // Spiel-Konfiguration
    this.gridSize = 20;
    this.targetScore = 10;
    this.baseSpeed = 120; // ms pro Frame (niedriger = schneller)
    
    // Farb-Palette (passend zum Glassmorphism der Hauptseite)
    this.colors = {
      bg: '#050505',
      grid: 'rgba(255, 255, 255, 0.03)',
      snakeHead: '#ffffff',
      snakeBody: '#a881ff',
      food: '#ff00aa',
      glow: 'rgba(168, 129, 255, 0.5)'
    };
    
    // Status
    this.isRunning = false;
    this.isWon = false;
    this.isDead = false;
    this.score = 0;
    this.lastRenderTime = 0;
    this.onWinCallback = null;
    this.onDieCallback = null;
    
    // Spiel-Entitäten
    this.snake = [];
    this.food = {};
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    
    // Animation/Interpolation (für extra smoothen Look)
    this.animationProgress = 0;
    this.particles = [];
    
    // Canvas Größe initialisieren
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());
    
    // Steuerung aufsetzen
    this._setupControls();
  }

  // --- Setup & Init ---

  _resizeCanvas() {
    // Hole die CSS-Größe des Canvas
    const rect = this.canvas.getBoundingClientRect();
    
    // Berücksichtige High-DPI Displays für absolute Schärfe
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    // Scale Context, damit wir logische Pixelgrößen (wie gridSize) nutzen können
    this.ctx.scale(dpr, dpr);
    
    // Berechne logische Dimensionen
    this.width = rect.width;
    this.height = rect.height;
    
    // Berechne wie viele Grid-Zellen reinpassen
    this.cols = Math.floor(this.width / this.gridSize);
    this.rows = Math.floor(this.height / this.gridSize);
    
    if (this.isRunning && !this.isDead) {
      this._draw(); // Direkt neu zeichnen gegen Flackern
    }
  }

  _setupControls() {
    // Tastatur
    document.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;
      
      const key = e.key;
      // Verhindere 180-Grad-Drehungen (suicide)
      if ((key === 'ArrowUp' || key === 'w') && this.direction.y === 0) {
        this.nextDirection = { x: 0, y: -1 };
        e.preventDefault();
      } else if ((key === 'ArrowDown' || key === 's') && this.direction.y === 0) {
        this.nextDirection = { x: 0, y: 1 };
        e.preventDefault();
      } else if ((key === 'ArrowLeft' || key === 'a') && this.direction.x === 0) {
        this.nextDirection = { x: -1, y: 0 };
        e.preventDefault();
      } else if ((key === 'ArrowRight' || key === 'd') && this.direction.x === 0) {
        this.nextDirection = { x: 1, y: 0 };
        e.preventDefault();
      }
    });

    // Touch Support (Swipe) für Mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    this.canvas.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, {passive: true});

    this.canvas.addEventListener('touchend', (e) => {
      if (!this.isRunning) return;
      
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      
      // Minimum Swipe Distanz (verhindert versehentliche Taps)
      if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (dx > 0 && this.direction.x === 0) this.nextDirection = { x: 1, y: 0 }; // Right
          else if (dx < 0 && this.direction.x === 0) this.nextDirection = { x: -1, y: 0 }; // Left
        } else {
          // Vertical swipe
          if (dy > 0 && this.direction.y === 0) this.nextDirection = { x: 0, y: 1 }; // Down
          else if (dy < 0 && this.direction.y === 0) this.nextDirection = { x: 0, y: -1 }; // Up
        }
      }
    }, {passive: true});
  }

  // --- Game API ---

  start(onWin, onDie) {
    this.onWinCallback = onWin;
    this.onDieCallback = onDie;
    this._reset();
    this.isRunning = true;
    window.requestAnimationFrame((time) => this._loop(time));
  }

  stop() {
    this.isRunning = false;
  }

  _reset() {
    this._resizeCanvas(); // Update grid falls modal sich geändert hat
    const startX = Math.floor(this.cols / 4);
    const startY = Math.floor(this.rows / 2);
    
    // Starte mit 3 Körperteilen
    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ];
    
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.isDead = false;
    this.isWon = false;
    this.particles = [];
    
    this._spawnFood();
    this._updateScoreDisplay();
  }

  _spawnFood() {
    let newFood;
    let isOnSnake = true;
    
    while (isOnSnake) {
      newFood = {
        x: Math.floor(Math.random() * this.cols),
        y: Math.floor(Math.random() * this.rows)
      };
      // Check ob Food auf Schlange spawnt
      isOnSnake = this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }
    
    this.food = newFood;
    this._createFoodSpawnParticles(this.food.x, this.food.y);
  }

  // --- Game Logik ---

  _loop(currentTime) {
    if (!this.isRunning) return;
    
    window.requestAnimationFrame((time) => this._loop(time));

    // Berechne fließende Animation (Glow-Pulsieren, Partikel)
    this._updateParticles();
    
    const secondsSinceLastRender = (currentTime - this.lastRenderTime);
    
    // Dynamische Geschwindigkeit (wird etwas schneller je mehr Score)
    const currentSpeed = Math.max(70, this.baseSpeed - (this.score * 3));
    
    // Update Logik nur alle X Millisekunden (Grid-basiert)
    if (secondsSinceLastRender >= currentSpeed) {
      this.lastRenderTime = currentTime;
      if (!this.isDead && !this.isWon) {
        this._update();
      }
    }
    
    // Rendering läuft jeden Frame (60/120fps) für smoothes Gefühl
    if (!this.isWon) {
        this._draw(secondsSinceLastRender / currentSpeed);
    }
  }

  _update() {
    this.direction = this.nextDirection;
    
    // Neuen Kopf berechnen
    const head = { ...this.snake[0] };
    head.x += this.direction.x;
    head.y += this.direction.y;
    
    // Wand-Kollision (Teleport zur anderen Seite, ist moderner als sterben)
    if (head.x < 0) head.x = this.cols - 1;
    if (head.x >= this.cols) head.x = 0;
    if (head.y < 0) head.y = this.rows - 1;
    if (head.y >= this.rows) head.y = 0;
    
    // Selbst-Kollision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this._die();
      return;
    }
    
    this.snake.unshift(head); // Kopf hinzufügen
    
    // Essen-Kollision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      this._updateScoreDisplay();
      this._createEatParticles(head.x, head.y);
      
      if (this.score >= this.targetScore) {
        this._win();
        return;
      }
      
      this._spawnFood();
    } else {
      this.snake.pop(); // Schwanz entfernen wenn nicht gegessen
    }
  }

  _die() {
    this.isDead = true;
    
    // Kopf-Explosions-Partikel
    this._createDeathParticles(this.snake[0].x, this.snake[0].y);
    
    // Rüttel-Effekt
    this.canvas.style.transform = "translate(5px, 5px)";
    setTimeout(() => this.canvas.style.transform = "translate(-5px, -5px)", 50);
    setTimeout(() => this.canvas.style.transform = "translate(5px, -5px)", 100);
    setTimeout(() => this.canvas.style.transform = "translate(0, 0)", 150);
    
    if (this.onDieCallback) this.onDieCallback();
    
    // Auto-Restart nach kurzer Pause
    setTimeout(() => {
        if(this.isRunning) this._reset();
    }, 1500);
  }

  _win() {
    // Erstmal NICHT sofort isWon setzen, damit der Draw-Loop weiterläuft
    // und die Partikel sichtbar sind!
    if (window.playWinSound) window.playWinSound();
    this.winFlash = 1.0; // Weißer Blitz
    
    // Riesige Partikel-Explosion über das ganze Feld
    for(let i = 0; i < 80; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        color: ['#a881ff', '#ff00aa', '#ffffff', '#4caf50'][Math.floor(Math.random() * 4)],
        size: Math.random() * 6 + 2
      });
    }
    
    // Stoppe das Gameplay, aber lass den Render-Loop laufen
    this.isDead = true; // Verhindert weitere Updates
    
    // Nach kurzer Feier-Zeit den Win-Callback auslösen
    setTimeout(() => {
      this.isWon = true;
      if (this.onWinCallback) this.onWinCallback();
    }, 800);
  }

  _updateScoreDisplay() {
    const scoreElement = document.getElementById('captcha-score');
    if (scoreElement) {
      scoreElement.innerHTML = `${this.score}/${this.targetScore}`;
      // Splashy update effect
      scoreElement.style.transform = 'scale(1.3)';
      scoreElement.style.color = this.colors.food;
      setTimeout(() => {
        scoreElement.style.transform = 'scale(1)';
        scoreElement.style.color = '';
      }, 200);
    }
  }

  // --- Visuals & Partikel ---
  
  _createFoodSpawnParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x * this.gridSize + this.gridSize / 2,
        y: y * this.gridSize + this.gridSize / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        color: this.colors.food,
        size: Math.random() * 3 + 1
      });
    }
  }

  _createEatParticles(x, y) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: x * this.gridSize + this.gridSize / 2,
        y: y * this.gridSize + this.gridSize / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color: this.colors.snakeBody,
        size: Math.random() * 4 + 2
      });
    }
  }

  _createDeathParticles(x, y) {
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: x * this.gridSize + this.gridSize / 2,
        y: y * this.gridSize + this.gridSize / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color: 'red',
        size: Math.random() * 5 + 2
      });
    }
  }

  _updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05; // Fade out speed
      p.size *= 0.95; // Shrink speed
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // --- Rendering ---

  _draw(interpolationFactor = 0) {
    // 1. Hintergrund zeichnen (Solid Dark, kein ClearRec, das vermeidet Artefakte)
    this.ctx.fillStyle = this.colors.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // 2. Subtiles Grid zeichnen (Apple-Style)
    this.ctx.strokeStyle = this.colors.grid;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let x = 0; x <= this.width; x += this.gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
    }
    for (let y = 0; y <= this.height; y += this.gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
    }
    this.ctx.stroke();

    // 3. Food zeichnen (Mit Glow-Pulsieren)
    const pulsate = Math.sin(Date.now() / 150) * 2;
    
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = this.colors.food;
    this.ctx.fillStyle = this.colors.food;
    
    this.ctx.beginPath();
    this.ctx.arc(
      this.food.x * this.gridSize + this.gridSize / 2, 
      this.food.y * this.gridSize + this.gridSize / 2, 
      (this.gridSize / 2) - 3 + (pulsate > 0 ? pulsate : 0), 
      0, 
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.shadowBlur = 0; // Reset Shadow

    // 4. Snake zeichnen
    if (this.snake.length > 0) {
        // Body (Gradients & weiche Kanten)
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.colors.glow;
        
        for (let i = 1; i < this.snake.length; i++) {
            const segment = this.snake[i];
            
            // Fade-Out des Schwanzes für eleganten Look
            const opacity = 1 - (i / (this.snake.length * 1.5));
            this.ctx.fillStyle = `rgba(168, 129, 255, ${opacity})`;
            
            // Abgerundete Rechtecke für den Körper
            this._drawRoundedRect(
                segment.x * this.gridSize + 1, 
                segment.y * this.gridSize + 1, 
                this.gridSize - 2, 
                this.gridSize - 2, 
                4
            );
            this.ctx.fill();
        }

        // Kopf zeichnen (Weiß & Heller)
        const head = this.snake[0];
        
        // Versuche Interpolation für smoothen Kopf (Optional, optisches Gimmick)
        // Aber nur wenn wir uns nicht durch Wände teleportieren
        let drawX = head.x;
        let drawY = head.y;
        
        this.ctx.fillStyle = this.colors.snakeHead;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#ffffff';
        
        this._drawRoundedRect(
            drawX * this.gridSize, 
            drawY * this.gridSize, 
            this.gridSize, 
            this.gridSize, 
            6
        );
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    // 5. Partikel zeichnen
    this.particles.forEach(p => {
        this.ctx.globalAlpha = Math.max(0, p.life);
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
    });
    this.ctx.globalAlpha = 1.0;

    // 6. Death/Win Flash Overlay
    if (this.isDead && !this.winFlash) {
        this.ctx.fillStyle = `rgba(255, 0, 0, 0.2)`;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // 7. Win Flash (weißer Blitz der ausblednet)
    if (this.winFlash && this.winFlash > 0) {
        this.ctx.fillStyle = `rgba(168, 129, 255, ${this.winFlash * 0.4})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.winFlash -= 0.02;
    }
  }
  
  // Helper für abgerundete Rechtecke im Canvas
  _drawRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }
}

// Global verfügbar machen
window.SnakeCAPTCHA = SnakeCAPTCHA;
