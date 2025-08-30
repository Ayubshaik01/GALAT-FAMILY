/* game.js */
/* Complete neub_snek core: renderer, engine, input, ui bindings, persistence */
(function(){
  /* ----------------------------
     config & persistent keys
     ---------------------------- */
  const STORAGE_KEYS = {
    highscore: 'neub_snek_highscore',
    settings: 'neub_snek_settings',
    muted: 'neub_snek_muted'
  };

  const default_settings = {
    showGrid: false,
    wrap: true,
    obstacles: false,
    baseSpeed: 3,
    tileSize: 20,
    muted: false
  };

  /* ----------------------------
     utility helpers
     ---------------------------- */
  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min }

  /* ----------------------------
     canvas & renderer
     ---------------------------- */
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let tile_size = default_settings.tileSize;
  let cols = Math.floor(canvas.width / tile_size);
  let rows = Math.floor(canvas.height / tile_size);

  function resizeCanvas(){
    // keep square, match CSS size
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.width * dpr); // square
    ctx.imageSmoothingEnabled = false;
    cols = Math.floor(canvas.width / (tile_size * dpr));
    rows = Math.floor(canvas.height / (tile_size * dpr));
    // expose css var for grid overlay
    document.documentElement.style.setProperty('--tile-size', (tile_size)+'px');
  }

  function clear(){
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  function draw_cell(x,y,fill,stroke){
    ctx.fillStyle = fill;
    ctx.fillRect(x*tile_size*dpr, y*tile_size*dpr, tile_size*dpr, tile_size*dpr);
    if(stroke){
      ctx.strokeStyle = stroke;
      ctx.lineWidth = Math.max(1,2*dpr);
      ctx.strokeRect(x*tile_size*dpr+0.5, y*tile_size*dpr+0.5, tile_size*dpr-1, tile_size*dpr-1);
    }
  }

  function draw_grid_lines(){
    ctx.strokeStyle = 'rgba(107,114,128,0.12)';
    ctx.lineWidth = 1*dpr;
    for(let x=0;x<=cols;x++){
      ctx.beginPath();
      ctx.moveTo(x*tile_size*dpr,0);
      ctx.lineTo(x*tile_size*dpr,rows*tile_size*dpr);
      ctx.stroke();
    }
    for(let y=0;y<=rows;y++){
      ctx.beginPath();
      ctx.moveTo(0,y*tile_size*dpr);
      ctx.lineTo(cols*tile_size*dpr,y*tile_size*dpr);
      ctx.stroke();
    }
  }

  /* ----------------------------
     game entities
     ---------------------------- */
  function make_food(occupied){
    // pick random empty cell
    let attempts = 0;
    while(attempts < 2000){
      const fx = randInt(0, cols-1);
      const fy = randInt(0, rows-1);
      const key = fx+','+fy;
      if(!occupied.has(key)) return { x:fx, y:fy, kind: 'food' };
      attempts++;
    }
    return null;
  }

  function make_powerup(occupied){
    // occasional powerup
    const fx = randInt(0, cols-1);
    const fy = randInt(0, rows-1);
    if(occupied.has(fx+','+fy)) return null;
    const kinds = ['slow','shrink','x2'];
    return { x:fx, y:fy, kind: kinds[randInt(0,kinds.length-1)] };
  }

  /* ----------------------------
     Game class (state + logic)
     ---------------------------- */
  class Game {
    constructor(){
      this.resetState();
      this.loadSettings();
      this.hi = this.loadHighscore();
      this.updateUIStats();
    }

    resetState(){
      this.score = 0;
      this.level = 1;
      this.tickAccumulator = 0;
      this.running = false;
      this.paused = false;
      this.lastTime = 0;
      this.baseSpeed = default_settings.baseSpeed;
      this.speed = this.baseSpeed;
      this.wrap = default_settings.wrap;
      this.showGrid = default_settings.showGrid;
      this.obstaclesOn = default_settings.obstacles;
      this.muted = default_settings.muted;
      this.tileSize = default_settings.tileSize;
      this.snake = { dir: {x:1,y:0}, nextDir: null, body: [{x:Math.floor(cols/2), y:Math.floor(rows/2)}] };
      this.spawnedObstacles = [];
      this.food = null;
      this.powerup = null;
      this.occupied = new Set();
      this.particles = [];
      this.doubleScore = false;
      this.tickInterval = 1000 / (this.baseSpeed * 1.5); // ms per tick (will be updated)
      this.updateTickInterval();
    }

    loadSettings(){
      try{
        const raw = localStorage.getItem(STORAGE_KEYS.settings);
        if(raw){
          const s = JSON.parse(raw);
          Object.assign(this, {
            showGrid: !!s.showGrid,
            wrap: !!s.wrap,
            obstaclesOn: !!s.obstacles,
            baseSpeed: Number(s.baseSpeed) || default_settings.baseSpeed,
            tileSize: Number(s.tileSize) || default_settings.tileSize,
            muted: !!s.muted
          });
          tile_size = this.tileSize;
          this.updateTickInterval();
          resizeCanvas();
        }
      }catch(e){}
    }

    saveSettings(){
      try{
        const s = {
          showGrid: this.showGrid,
          wrap: this.wrap,
          obstacles: this.obstaclesOn,
          baseSpeed: this.baseSpeed,
          tileSize: this.tileSize,
          muted: this.muted
        };
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(s));
      }catch(e){}
    }

    loadHighscore(){
      try{ return Number(localStorage.getItem(STORAGE_KEYS.highscore) || 0) }catch(e){ return 0 }
    }
    saveHighscore(){
      try{
        const current = Number(localStorage.getItem(STORAGE_KEYS.highscore) || 0);
        if(this.score > current) localStorage.setItem(STORAGE_KEYS.highscore, String(this.score));
      }catch(e){}
    }

    updateTickInterval(){
      // tick interval based on baseSpeed and level
      this.tickInterval = Math.max(60, 1200 / (this.baseSpeed + (this.level-1)*0.6));
    }

    placeFoodAndPower(){
      // rebuild occupied set
      this.occupied.clear();
      for(const s of this.snake.body) this.occupied.add(s.x+','+s.y);
      for(const o of this.spawnedObstacles) this.occupied.add(o.x+','+o.y);

      if(!this.food) this.food = make_food(this.occupied);
      if(!this.powerup && Math.random() < 0.04) this.powerup = make_powerup(this.occupied);
      // ensure food not null
      if(!this.food){
        // try to generate again (rare)
        this.food = make_food(this.occupied) || {x:0,y:0,kind:'food'};
      }
    }

    spawnObstacles(){
      if(!this.obstaclesOn){ this.spawnedObstacles = []; return; }
      const count = Math.min(12, Math.floor((cols*rows) / 80));
      const obstacles = [];
      let attempts=0;
      while(obstacles.length < count && attempts < 2000){
        const x = randInt(1, cols-2), y = randInt(1, rows-2);
        const key = x+','+y;
        if(this.occupied.has(key)) { attempts++; continue; }
        obstacles.push({x,y});
        this.occupied.add(key);
        attempts++;
      }
      this.spawnedObstacles = obstacles;
    }

    start(){
      if(this.running) return;
      this.running = true;
      this.paused = false;
      this.lastTime = performance.now();
      this.placeFoodAndPower();
      this.spawnObstacles();
      window.requestAnimationFrame(this.frame.bind(this));
    }

    pause(){
      this.paused = !this.paused;
      this.lastTime = performance.now();
      if(!this.paused) window.requestAnimationFrame(this.frame.bind(this));
    }

    restart(){
      this.resetState();
      this.loadSettings();
      this.hi = this.loadHighscore();
      this.updateUIStats();
    }

    applyInput(){
      if(!this.snake.nextDir) return;
      const nd = this.snake.nextDir;
      const cur = this.snake.dir;
      // prevent reverse
      if(cur.x + nd.x === 0 && cur.y + nd.y === 0) return;
      this.snake.dir = nd;
      this.snake.nextDir = null;
    }

    tick(){
      // deterministic tick: move snake
      this.applyInput();
      const head = Object.assign({}, this.snake.body[0]);
      head.x += this.snake.dir.x;
      head.y += this.snake.dir.y;

      // wrap or wall collision
      if(this.wrap){
        if(head.x < 0) head.x = cols-1;
        if(head.x >= cols) head.x = 0;
        if(head.y < 0) head.y = rows-1;
        if(head.y >= rows) head.y = 0;
      } else {
        if(head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows){
          return this.gameOver();
        }
      }

      // check obstacle collision
      for(const o of this.spawnedObstacles){
        if(o.x === head.x && o.y === head.y) return this.gameOver();
      }

      // check self collision
      for(let i=0;i<this.snake.body.length;i++){
        const s = this.snake.body[i];
        if(s.x === head.x && s.y === head.y) return this.gameOver();
      }

      // move
      this.snake.body.unshift(head);

      const ateFood = this.food && head.x === this.food.x && head.y === this.food.y;
      const atePower = this.powerup && head.x === this.powerup.x && head.y === this.powerup.y;

      if(ateFood){
        // grow automatically (already added)
        this.score += (this.doubleScore ? 2 : 1) * 10;
        this.level = Math.floor(this.score/50) + 1;
        this.updateTickInterval();
        this.food = null;
        window.sound && window.sound.playEat && window.sound.playEat();
        this.spawnParticles(head.x, head.y);
      } else {
        // normal move: remove tail
        this.snake.body.pop();
      }

      if(atePower){
        const kind = this.powerup.kind;
        if(kind === 'slow'){
          this.tickInterval *= 1.5;
          setTimeout(()=>{ this.updateTickInterval(); }, 5000);
        } else if(kind === 'shrink'){
          if(this.snake.body.length > 3) this.snake.body.splice(Math.floor(this.snake.body.length/2));
        } else if(kind === 'x2'){
          this.doubleScore = true;
          setTimeout(()=>{ this.doubleScore = false; }, 8000);
        }
        this.powerup = null;
      }

      // occasionally increase speed slightly
      this.speed = this.baseSpeed + Math.floor(this.level / 2);
      this.updateUIStats();
      this.placeFoodAndPower();
    }

    gameOver(){
      this.running = false;
      this.paused = false;
      window.sound && window.sound.playDie && window.sound.playDie();
      this.saveHighscore();
      this.updateUIStats();
      // show overlay hint
      const hint = document.getElementById('overlayHint');
      hint.textContent = 'game over — press restart';
    }

    spawnParticles(cx, cy){
      // simple particle burst, canvas-based
      for(let i=0;i<18;i++){
        this.particles.push({
          x: cx + 0.5,
          y: cy + 0.5,
          vx: (Math.random()-0.5)*2,
          vy: (Math.random()-0.5)*2,
          life: randInt(20,40)
        });
      }
    }

    updateParticles(){
      const p = this.particles;
      for(let i=p.length-1;i>=0;i--){
        p[i].life--;
        p[i].x += p[i].vx * 0.12;
        p[i].y += p[i].vy * 0.12;
        if(p[i].life <= 0) p.splice(i,1);
      }
    }

    render(){
      clear();
      // grid
      if(this.showGrid) draw_grid_lines();

      // obstacles
      for(const o of this.spawnedObstacles){
        draw_cell(o.x,o.y,'#d1d5db','#6b7280');
      }

      // food
      if(this.food) draw_cell(this.food.x,this.food.y,'#ef4444','#7f1d1d');

      // powerup
      if(this.powerup) draw_cell(this.powerup.x,this.powerup.y,'#10b981','#064e3b');

      // snake body
      for(let i=this.snake.body.length-1;i>=0;i--){
        const s = this.snake.body[i];
        const fill = (i===0) ? '#000000' : '#0a0a0a';
        draw_cell(s.x,s.y, fill, '#111827');
      }

      // particles
      this.updateParticles();
      for(const part of this.particles){
        const alpha = Math.max(0, part.life / 40);
        ctx.fillStyle = `rgba(10,10,10,${alpha})`;
        const px = part.x * tile_size * dpr;
        const py = part.y * tile_size * dpr;
        ctx.fillRect(px, py, Math.max(1,2*dpr), Math.max(1,2*dpr));
      }

      // update scoreboard DOM
      this.updateUIStats();
    }

    frame(now){
      if(!this.running || this.paused) return;
      const elapsed = now - this.lastTime;
      this.lastTime = now;
      this.tickAccumulator += elapsed;
      // tick loop
      while(this.tickAccumulator >= this.tickInterval){
        this.tick();
        this.tickAccumulator -= this.tickInterval;
        window.sound && window.sound.playTick && window.sound.playTick();
      }
      this.render();
      window.requestAnimationFrame(this.frame.bind(this));
    }

    updateUIStats(){
      try{
        document.getElementById('score').textContent = String(this.score);
        document.getElementById('highscore').textContent = String(Math.max(this.hi, this.score));
        document.getElementById('length').textContent = String(this.snake.body.length);
        document.getElementById('speedDisplay').textContent = String(this.baseSpeed);
        document.getElementById('level').textContent = String(this.level);
      }catch(e){}
    }
  }

  /* ----------------------------
     input handling (keyboard + swipe + on-screen)
     ---------------------------- */
  class InputHandler {
    constructor(game){
      this.game = game;
      this.bindKeyboard();
      this.bindTouch();
      this.bindOnscreen();
    }
    bindKeyboard(){
      window.addEventListener('keydown', (ev)=>{
        const k = ev.key.toLowerCase();
        const dir = {x:0,y:0};
        if(k === 'arrowup' || k==='w') Object.assign(dir,{x:0,y:-1});
        else if(k === 'arrowdown' || k==='s') Object.assign(dir,{x:0,y:1});
        else if(k === 'arrowleft' || k==='a') Object.assign(dir,{x:-1,y:0});
        else if(k === 'arrowright' || k==='d') Object.assign(dir,{x:1,y:0});
        else return;
        ev.preventDefault();
        // queue nextDir
        this.game.snake.nextDir = dir;
      });
    }
    bindTouch(){
      let startX=0,startY=0, moved=false;
      canvas.addEventListener('touchstart', (ev)=>{
        const t = ev.touches[0];
        startX = t.clientX; startY = t.clientY; moved=false;
      }, {passive:true});
      canvas.addEventListener('touchmove', (ev)=>{
        moved=true;
      }, {passive:true});
      canvas.addEventListener('touchend', (ev)=>{
        if(!moved) return;
        const end = ev.changedTouches[0];
        const dx = end.clientX - startX;
        const dy = end.clientY - startY;
        if(Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
        const dir = Math.abs(dx) > Math.abs(dy)
          ? (dx>0 ? {x:1,y:0} : {x:-1,y:0})
          : (dy>0 ? {x:0,y:1} : {x:0,y:-1});
        this.game.snake.nextDir = dir;
      }, {passive:true});
    }
    bindOnscreen(){
      document.getElementById('touchArrows')?.addEventListener('click', (ev)=>{
        const btn = ev.target.closest('button[data-dir]');
        if(!btn) return;
        const d = btn.dataset.dir;
        const map = {up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
        if(map[d]) this.game.snake.nextDir = map[d];
      });
    }
  }

  /* ----------------------------
     UI bindings & wiring
     ---------------------------- */
  const game = new Game();
  const input = new InputHandler(game);

  // setup resize
  function applyTileSize(size){
    tile_size = Number(size);
    resizeCanvas();
  }
  applyTileSize(game.tileSize);

  // initial dom elements
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');
  const showGridEl = document.getElementById('showGrid');
  const wrapEl = document.getElementById('wrapToggle');
  const obstaclesEl = document.getElementById('obstaclesToggle');
  const speedSlider = document.getElementById('speedSlider');
  const speedLabel = document.getElementById('speedLabel');
  const tileSelect = document.getElementById('tileSizeSelect');
  const muteBtn = document.getElementById('muteBtn');

  // apply saved settings to UI
  function initControlsFromSettings(){
    showGridEl.checked = !!game.showGrid;
    wrapEl.checked = !!game.wrap;
    obstaclesEl.checked = !!game.obstaclesOn;
    speedSlider.value = game.baseSpeed;
    speedLabel.textContent = String(game.baseSpeed);
    tileSelect.value = String(game.tileSize);
    muteBtn.textContent = (window.sound && window.sound.isMuted && window.sound.isMuted()) ? 'muted' : 'sound';
  }
  initControlsFromSettings();

  // event listeners
  startBtn.addEventListener('click', ()=>{
    game.start();
    document.getElementById('overlayHint').textContent = '';
    startBtn.setAttribute('aria-pressed','true');
  });
  pauseBtn.addEventListener('click', ()=>{
    game.pause();
    pauseBtn.setAttribute('aria-pressed', String(game.paused));
  });
  restartBtn.addEventListener('click', ()=>{
    game.restart();
    initControlsFromSettings();
    document.getElementById('overlayHint').textContent = 'press start';
  });

  showGridEl.addEventListener('change', (e)=>{
    game.showGrid = e.target.checked;
    game.saveSettings();
    // toggle css class for optional overlay (not required)
  });

  wrapEl.addEventListener('change', (e)=>{
    game.wrap = e.target.checked;
    game.saveSettings();
  });

  obstaclesEl.addEventListener('change', (e)=>{
    game.obstaclesOn = e.target.checked;
    game.saveSettings();
    game.spawnObstacles();
  });

  speedSlider.addEventListener('input', (e)=>{
    game.baseSpeed = Number(e.target.value);
    speedLabel.textContent = String(game.baseSpeed);
    game.updateTickInterval();
    game.saveSettings();
  });

  tileSelect.addEventListener('change', (e)=>{
    game.tileSize = Number(e.target.value);
    applyTileSize(game.tileSize);
    game.saveSettings();
  });

  muteBtn.addEventListener('click', ()=>{
    if(window.sound && window.sound.toggleMute){
      const m = window.sound.toggleMute();
      muteBtn.textContent = m ? 'muted' : 'sound';
    }
  });

  // make some globals as API surface
  window.startGame = ()=>startBtn.click();
  window.pauseGame = ()=>pauseBtn.click();
  window.restartGame = ()=>restartBtn.click();
  window.toggleWrap = ()=>{ wrapEl.checked = !wrapEl.checked; wrapEl.dispatchEvent(new Event('change')) };
  window.toggleGrid = ()=>{ showGridEl.checked = !showGridEl.checked; showGridEl.dispatchEvent(new Event('change')) };

  // reflow on resize
  window.addEventListener('resize', ()=>{ resizeCanvas(); });

  // initial render
  resizeCanvas();
  game.render();

  // ensure settings persistence on unload
  window.addEventListener('beforeunload', ()=>{ game.saveSettings(); game.saveHighscore(); });

})();
