(() => {
  // Game constants - Better tuned for smooth gameplay
  let canvas_width = 360;
  let canvas_height = 640;
  const gravity = 800;
  const flap_impulse = -280;
  const pipe_speed_base = 120;
  const pipe_gap_default = 180;
  const pipe_width = 52;
  const pipe_spawn_interval = 1.8;
  const bird_radius = 12;
  const pixel_ratio = Math.max(1, window.devicePixelRatio || 1);
  
  // Fixed timestep for consistent physics
  const FIXED_TIMESTEP = 1/60;
  const MAX_FRAME_TIME = 0.25;

  let canvas, ctx;
  let last_time = 0;
  let accumulator = 0;
  let is_running = false;
  let is_paused = false;
  let show_hud = false;
  let show_canvas_grid = false;
  let score = 0;
  let best = 0;
  let pipes = [];
  let spawn_timer = 0;
  let bird = { 
    x: 110, 
    y: canvas_height / 2, 
    vy: 0, 
    radius: bird_radius, 
    rotation: 0,
    display_y: canvas_height / 2,
    display_rotation: 0
  };
  let settings = { 
    difficulty: 'normal', 
    pipe_speed: pipe_speed_base, 
    pipe_gap: pipe_gap_default 
  };
  let fps_counter = { frames: 0, last: 0, fps: 0 };
  let longpress_timer = null;
  let is_muted = false;
  let debug = { show_canvas_grid: false };

  try { best = parseInt(localStorage.getItem('flappy_neu_best') || '0', 10) || 0; } catch (e) { best = 0; }

  const el = {};
  function q(id) { return document.getElementById(id); }
  
  function position_welcome_bird() {
    if (!el.welcome_bird || !el.canvas || !el.welcome_overlay || !el.welcome_text) return;
    const canvasRect = el.canvas.getBoundingClientRect();
    const overlayRect = el.welcome_overlay.getBoundingClientRect();
    const textRect = el.welcome_text.getBoundingClientRect();
    if (canvasRect.width <= 0 || canvas_width <= 0) return;
    const scale = canvasRect.width / canvas_width;
    const birdCssX = bird.x * scale;
    const birdCssY = bird.display_y * scale;
    const birdLeftInOverlay = (canvasRect.left - overlayRect.left) + birdCssX;
    const birdTopInOverlay = (canvasRect.top - overlayRect.top) + birdCssY;
    const leftWithinText = birdLeftInOverlay - textRect.left;
    const topWithinText = birdTopInOverlay - textRect.top;
    el.welcome_bird.style.left = Math.round(leftWithinText) + 'px';
    el.welcome_bird.style.top = Math.round(topWithinText) + 'px';
  }

  function init_ui() {
    el.score = q('score');
    el.best = q('best');
    el.status = q('status');
    el.canvas = q('game-canvas');
    el.css_grid_toggle = q('css-grid-toggle');
    el.btn_start = q('btn-start');
    el.btn_restart = q('btn-restart');
    el.difficulty = q('difficulty');
    el.hud = q('hud');
    el.fps = q('fps');
    el.pipes_count = q('pipes-count');
    el.bird_y = q('bird-y');
    el.bird_v = q('bird-v');
    el.mute_toggle = q('mute-toggle');
    el.hamburger_btn = q('hamburger-btn');
    el.hamburger_menu = q('canvas-hamburger-menu');
    el.canvas_stats = q('canvas-stats');
    el.welcome_overlay = q('welcome-overlay');
    el.welcome_bird = q('welcome-bird');
    el.welcome_text = el.welcome_overlay ? el.welcome_overlay.querySelector('.welcome-text') : null;

    el.best.textContent = best;
    el.score.textContent = score;
    el.status.textContent = 'ready';

    el.difficulty.addEventListener('change', (e) => {
      settings.difficulty = e.target.value;
      apply_difficulty();
    });

    el.btn_start.addEventListener('click', start_game);
    el.btn_restart.addEventListener('click', restart_game);

    if (el.css_grid_toggle) {
      el.css_grid_toggle.addEventListener('change', (e) => {
        debug.show_canvas_grid = e.target.checked;
      });
    }

    if (el.hamburger_btn && el.hamburger_menu) {
      el.hamburger_btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = el.hamburger_btn.getAttribute('aria-expanded') === 'true';
        toggle_hamburger(!expanded);
        if (!expanded && is_running && !is_paused) {
          toggle_pause(true);
        }
      });
      
      document.addEventListener('click', (evt) => {
        if (!el.hamburger_menu) return;
        const target = evt.target;
        if (!el.hamburger_menu.contains(target) && target !== el.hamburger_btn) {
          toggle_hamburger(false);
          if (is_running && is_paused) {
            toggle_pause(false);
          }
        }
      });
    }

    el.mute_toggle.checked = is_muted;
    el.mute_toggle.addEventListener('change', (e) => { 
      is_muted = e.target.checked; 
      if (typeof soundengine !== 'undefined') {
        soundengine.set_mute(is_muted); 
      }
    });

    window.addEventListener('keydown', handle_keydown);
    el.canvas.setAttribute('tabindex', '0');
    window.addEventListener('resize', position_welcome_bird);
  }

  let welcomeVisible = false;
  function show_welcome() {
    if (!el.welcome_overlay) return;
    el.welcome_overlay.style.display = 'flex';
    el.welcome_overlay.setAttribute('aria-hidden', 'false');
    welcomeVisible = true;
    if (el.canvas_stats) el.canvas_stats.style.display = 'flex';
    position_welcome_bird();
    if (el.welcome_bird) el.welcome_bird.style.display = 'block';
  }

  function hide_welcome_and_start() {
    if (!el.welcome_overlay) return;
    el.welcome_overlay.classList.add('fade-out');
    setTimeout(() => {
      el.welcome_overlay.style.display = 'none';
      el.welcome_overlay.classList.remove('fade-out');
      el.welcome_overlay.setAttribute('aria-hidden', 'true');
      welcomeVisible = false;
      if (el.welcome_bird) el.welcome_bird.style.display = 'none';
      toggle_pause(false);
    }, 420);
  }

  function toggle_hamburger(show) {
    if (!el.hamburger_btn || !el.hamburger_menu) return;
    const isShow = !!show;
    el.hamburger_btn.setAttribute('aria-expanded', String(isShow));
    el.hamburger_menu.setAttribute('aria-hidden', String(!isShow));
    el.hamburger_menu.style.display = isShow ? 'block' : 'none';
  }

  function apply_difficulty() {
    if (settings.difficulty === 'easy') {
      settings.pipe_speed = pipe_speed_base * 0.75;
      settings.pipe_gap = pipe_gap_default + 30;
    } else if (settings.difficulty === 'hard') {
      settings.pipe_speed = pipe_speed_base * 1.4;
      settings.pipe_gap = pipe_gap_default - 30;
    } else {
      settings.pipe_speed = pipe_speed_base;
      settings.pipe_gap = pipe_gap_default;
    }
  }

  function setup_canvas() {
    canvas = el.canvas;
    ctx = canvas.getContext('2d');
    
    ctx.imageSmoothingEnabled = false; // Pixel-perfect rendering for brutalist look
    
    function resize() {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let canvasWidth, canvasHeight;
      
      // Desktop: 70% width with max constraints
      if (viewportWidth > 768) {
        const maxWidth = Math.min(500, viewportWidth * 0.7);
        const maxHeight = Math.min(700, viewportHeight * 0.8);
        
        const aspectRatio = 360 / 640;
        if (maxWidth / maxHeight > aspectRatio) {
          canvasHeight = maxHeight;
          canvasWidth = canvasHeight * aspectRatio;
        } else {
          canvasWidth = maxWidth;
          canvasHeight = canvasWidth / aspectRatio;
        }
      } else {
        // Mobile: full viewport
        canvasWidth = viewportWidth;
        canvasHeight = viewportHeight;
      }
      
      // Set logical game dimensions
      canvas_width = Math.max(360, canvasWidth);
      canvas_height = Math.max(640, canvasHeight);
      
      // Set canvas display size
      canvas.style.width = canvasWidth + 'px';
      canvas.style.height = canvasHeight + 'px';
      
      // Set canvas resolution with device pixel ratio
      canvas.width = Math.floor(canvasWidth * pixel_ratio);
      canvas.height = Math.floor(canvasHeight * pixel_ratio);
      
      // Scale context for high DPI
      ctx.setTransform(pixel_ratio, 0, 0, pixel_ratio, 0, 0);
      ctx.imageSmoothingEnabled = false;
      
      // Update game dimensions to match canvas
      canvas_width = canvasWidth;
      canvas_height = canvasHeight;
      
      // Reset bird position if needed
      if (bird.y > canvas_height / 2 + 100) {
        bird.y = canvas_height / 2;
        bird.display_y = bird.y;
      }
    }
    
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => {
      setTimeout(resize, 100);
    });
  }

  function start_game() {
    if (!is_running) {
      reset_game_state();
      is_running = true;
      is_paused = true; 
      spawn_timer = 0;
      score = 0;
      el.score.textContent = score;
      el.status.textContent = 'ready';
      if (el.canvas_stats) el.canvas_stats.style.display = 'flex';
      show_welcome();
      render();
    } else if (is_paused) {
      toggle_pause(false);
    }
  }

  function restart_game() {
    reset_game_state();
    is_running = true;
    is_paused = true;
    spawn_timer = 0;
    score = 0;
    el.score.textContent = score;
    el.status.textContent = 'ready';
    if (el.canvas_stats) el.canvas_stats.style.display = 'flex';
    show_welcome();
    render();
  }

  function reset_game_state() {
    pipes = [];
    bird.x = canvas_width * 0.3;
    bird.y = canvas_height / 2;
    bird.display_y = bird.y;
    bird.vy = 0;
    bird.rotation = 0;
    bird.display_rotation = 0;
    score = 0;
    spawn_timer = 0;
    accumulator = 0;
    fps_counter.frames = 0;
    fps_counter.last = performance.now();
    fps_counter.fps = 0;
  }

  function toggle_pause(force) {
    if (typeof force === 'boolean') is_paused = force;
    else is_paused = !is_paused;
    el.status.textContent = is_paused ? 'paused' : (is_running ? 'playing' : 'ready');
    if (!is_paused && is_running) {
      last_time = performance.now();
      requestAnimationFrame(loop);
    }
  }

  function game_over() {
    is_running = false;
    el.status.textContent = 'hit';
    if (typeof soundengine !== 'undefined') {
      soundengine.play_hit();
    }
    if (score > best) {
      best = score;
      try { localStorage.setItem('flappy_neu_best', String(best)); } catch (e) {}
      el.best.textContent = best;
    }
    if (el.canvas_stats) el.canvas_stats.style.display = 'flex';
  }

  function handle_keydown(e) {
    if (e.key === 'Escape') {
      if (el && el.hamburger_menu) toggle_hamburger(false);
      return;
    }
    if (e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space' || e.key === 'ArrowUp') {
      e.preventDefault();
      do_flap();
    } else if (e.key.toLowerCase() === 'p') {
      toggle_pause();
    } else if (e.key.toLowerCase() === 'r') {
      restart_game();
    } else if (e.key.toLowerCase() === 'g') {
      debug.show_canvas_grid = !debug.show_canvas_grid;
      if (el.css_grid_toggle) el.css_grid_toggle.checked = debug.show_canvas_grid;
    } else if (e.key.toLowerCase() === 'h') {
      show_hud = !show_hud;
      el.hud.style.display = show_hud ? 'block' : 'none';
      el.hud.setAttribute('aria-hidden', (!show_hud).toString());
    } else if (e.key.toLowerCase() === 'm') {
      is_muted = !is_muted;
      el.mute_toggle.checked = is_muted;
      if (typeof soundengine !== 'undefined') {
        soundengine.set_mute(is_muted);
      }
    }
  }

  function setup_touch_controls() {
    let touchstart_ts = 0;
    let longpress_threshold = 500; 
    
    el.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      touchstart_ts = performance.now();
      longpress_timer = setTimeout(() => {
        toggle_pause();
      }, longpress_threshold);
    });

    el.canvas.addEventListener('pointerup', (e) => {
      e.preventDefault();
      const dt = performance.now() - touchstart_ts;
      if (longpress_timer) { clearTimeout(longpress_timer); longpress_timer = null; }
      if (dt < longpress_threshold) {
        do_flap();
      }
    });

    el.canvas.addEventListener('pointerleave', () => { 
      if (longpress_timer) { clearTimeout(longpress_timer); longpress_timer = null; }
    });
  }

  function do_flap() {
    if (!is_running) start_game();
    if (welcomeVisible) {
      hide_welcome_and_start();
      setTimeout(() => {
        bird.vy = flap_impulse;
        if (typeof soundengine !== 'undefined') {
          soundengine.play_flap();
        }
      }, 220);
      return;
    }
    if (is_paused) toggle_pause(false);
    bird.vy = flap_impulse;
    if (typeof soundengine !== 'undefined') {
      soundengine.play_flap();
    }
  }

  function spawn_pipe() {
    const margin = 60;
    const minCenter = margin + settings.pipe_gap / 2;
    const maxCenter = canvas_height - margin - settings.pipe_gap / 2;
    const center = minCenter + Math.random() * (maxCenter - minCenter);
    const top = center - settings.pipe_gap / 2;
    const bottom = center + settings.pipe_gap / 2;
    const pipe = {
      x: canvas_width + 20,
      top: top,
      bottom: bottom,
      width: pipe_width,
      scored: false
    };
    pipes.push(pipe);
  }

  function check_collision() {
    if (bird.y - bird.radius <= 10 || bird.y + bird.radius >= canvas_height - 10) {
      return true;
    }
    
    for (let p of pipes) {
      if (bird.x + bird.radius > p.x + 5 && bird.x - bird.radius < p.x + p.width - 5) {
        if (bird.y - bird.radius < p.top - 2 || bird.y + bird.radius > p.bottom + 2) {
          return true;
        }
      }
    }
    return false;
  }

  function update_score() {
    for (let p of pipes) {
      if (!p.scored && p.x + p.width < bird.x - bird.radius) {
        p.scored = true;
        score += 1;
        el.score.textContent = score;
        if (typeof soundengine !== 'undefined') {
          soundengine.play_score();
        }
      }
    }
  }

  function update(dt) {
    if (!is_running || is_paused) return;
    
    bird.vy += gravity * dt;
    bird.y += bird.vy * dt;
    
    const targetRotation = Math.max(-0.5, Math.min(1.2, bird.vy / 400));
    bird.rotation = bird.rotation + (targetRotation - bird.rotation) * dt * 8;

    const speed = settings.pipe_speed;
    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= speed * dt;
      if (pipes[i].x + pipes[i].width < -50) { 
        pipes.splice(i, 1); 
      }
    }

    spawn_timer += dt;
    if (spawn_timer >= pipe_spawn_interval) {
      spawn_timer = 0;
      spawn_pipe();
    }

    update_score();
    if (check_collision()) {
      game_over();
    }
  }

  function interpolate(alpha) {
    bird.display_y = bird.y;
    bird.display_rotation = bird.rotation;
  }

  function clear() {
    // Brutalist white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas_width, canvas_height);
  }

  function draw_bird() {
    ctx.save();
    ctx.translate(bird.x, bird.display_y);
    ctx.rotate(bird.display_rotation);
    
    // Brutalist bird - simple black circle
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Simple white eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, -3, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  function draw_pipes() {
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    
    for (let p of pipes) {
      // Simple black rectangles for brutalist look
      ctx.fillRect(p.x, 0, p.width, p.top);
      ctx.fillRect(p.x, p.bottom, p.width, canvas_height - p.bottom);
      
      // Pipe borders
      ctx.strokeRect(p.x, 0, p.width, p.top);
      ctx.strokeRect(p.x, p.bottom, p.width, canvas_height - p.bottom);
    }
  }

  function draw_foreground() {
    // Simple ground line
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, canvas_height - 20, canvas_width, 20);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, canvas_height - 20, canvas_width, 20);
  }

  function draw_canvas_grid() {
    const step = 20;
    ctx.save();
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas_width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas_height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas_height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas_width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function render() {
    clear();
    draw_pipes();
    draw_bird();
    draw_foreground();
    if (debug.show_canvas_grid) draw_canvas_grid();
  }

  function loop(now) {
    if (!last_time) last_time = now;
    
    let frameTime = (now - last_time) / 1000;
    frameTime = Math.min(frameTime, MAX_FRAME_TIME);
    last_time = now;
    
    accumulator += frameTime;
    
    while (accumulator >= FIXED_TIMESTEP) {
      update(FIXED_TIMESTEP);
      accumulator -= FIXED_TIMESTEP;
    }
    
    const alpha = accumulator / FIXED_TIMESTEP;
    interpolate(alpha);
    
    render();

    fps_counter.frames++;
    if (now - fps_counter.last >= 1000) {
      fps_counter.fps = Math.round((fps_counter.frames * 1000) / (now - fps_counter.last));
      fps_counter.frames = 0;
      fps_counter.last = now;
      if (el.fps) el.fps.textContent = fps_counter.fps;
      if (el.pipes_count) el.pipes_count.textContent = pipes.length;
      if (el.bird_y) el.bird_y.textContent = Math.round(bird.y);
      if (el.bird_v) el.bird_v.textContent = Math.round(bird.vy);
    }

    if (is_running || is_paused) requestAnimationFrame(loop);
  }

  function boot() {
    el.canvas = q('game-canvas');
    init_ui();
    apply_difficulty();
    setup_canvas();
    setup_touch_controls();

    if (typeof soundengine !== 'undefined') {
      is_muted = soundengine.is_muted();
      el.mute_toggle.checked = is_muted;
    }

    el.canvas.addEventListener('click', () => { el.canvas.focus(); });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.flappyneu = {
    start_game, restart_game, toggle_pause, do_flap, 
    soundengine: typeof soundengine !== 'undefined' ? soundengine : null
  };

})();