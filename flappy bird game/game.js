/* game.js - flappy • neu
   all ids and variables are lowercase.
   creates game, input, rendering, physics, and persistence.
*/

(() => {
  // ---- constants (lowercase) ----
  const canvas_width = 360;
  const canvas_height = 640;
  const gravity = 1200;            // pixels per second^2
  const flap_impulse = -360;       // pixels per second
  const pipe_speed_base = 140;     // px / s (modified by difficulty)
  const pipe_gap_default = 150;    // gap between top and bottom pipe
  const pipe_width = 56;
  const pipe_spawn_interval = 1.4; // secs
  const bird_radius = 14;
  const pixel_ratio = Math.max(1, window.devicePixelRatio || 1);

  // ---- state ----
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
  let bird = { x: 110, y: canvas_height / 2, vy: 0, radius: bird_radius, rotation: 0 };
  let settings = { difficulty: 'normal', pipe_speed: pipe_speed_base, pipe_gap: pipe_gap_default };
  let fps_counter = { frames: 0, last: 0, fps: 0 };
  let longpress_timer = null;
  let is_muted = soundengine.is_muted();
  let debug = { show_canvas_grid: false };

  // load best score
  try { best = parseInt(localStorage.getItem('flappy_neu_best') || '0', 10) || 0; } catch (e) { best = 0; }

  // ---- elements ----
  const el = {};
  function q(id) { return document.getElementById(id); }

  // position the small welcome 'o' over the bird in the canvas by converting
  // the bird's logical coordinates to CSS pixels and placing the marker
  function position_welcome_bird() {
    if (!el.welcome_bird || !el.canvas || !el.welcome_overlay || !el.welcome_text) return;
    const canvasRect = el.canvas.getBoundingClientRect();
    const overlayRect = el.welcome_overlay.getBoundingClientRect();
    const textRect = el.welcome_text.getBoundingClientRect();
    if (canvasRect.width <= 0 || canvas_width <= 0) return;
    const scale = canvasRect.width / canvas_width;
    // bird logical -> css px
    const birdCssX = bird.x * scale;
    const birdCssY = bird.y * scale;
    // compute bird position relative to the overlay top-left
    const birdLeftInOverlay = (canvasRect.left - overlayRect.left) + birdCssX;
    const birdTopInOverlay = (canvasRect.top - overlayRect.top) + birdCssY;
    // convert overlay-relative coords to text-relative coords (welcome-bird is inside .welcome-text)
    const leftWithinText = birdLeftInOverlay - textRect.left;
    const topWithinText = birdTopInOverlay - textRect.top;
    el.welcome_bird.style.left = Math.round(leftWithinText) + 'px';
    el.welcome_bird.style.top = Math.round(topWithinText) + 'px';
  }

  // ---- initialization ----
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
  // hamburger/menu moved inside canvas
  el.hamburger_btn = q('hamburger-btn');
  el.hamburger_menu = q('canvas-hamburger-menu');

  el.best.textContent = best;
  el.score.textContent = score;
  el.status.textContent = 'ready';
  // canvas stats overlay element (already in DOM)
  el.canvas_stats = q('canvas-stats');
  el.welcome_overlay = q('welcome-overlay');
  el.welcome_bird = q('welcome-bird');
  el.welcome_text = el.welcome_overlay ? el.welcome_overlay.querySelector('.welcome-text') : null;

    // difficulty applied
    el.difficulty.addEventListener('change', (e) => {
      settings.difficulty = e.target.value;
      apply_difficulty();
    });

  // buttons
  el.btn_start.addEventListener('click', start_game);
  // pause button removed from hamburger menu; use 'p' key or long-press
  el.btn_restart.addEventListener('click', restart_game);

    // grid toggles — css-grid-toggle in stats controls canvas grid
    if (el.css_grid_toggle) {
      el.css_grid_toggle.addEventListener('change', (e) => {
        debug.show_canvas_grid = e.target.checked;
      });
    }

    // hamburger/menu toggle
    if (el.hamburger_btn && el.hamburger_menu) {
      el.hamburger_btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = el.hamburger_btn.getAttribute('aria-expanded') === 'true';
        // opening the menu should pause the game; closing leaves state as-is
        toggle_hamburger(!expanded);
        if (!expanded) {
          // menu just opened -> pause game
          toggle_pause(true);
        }
      });
      // close menu when clicking outside
      document.addEventListener('click', (evt) => {
        if (!el.hamburger_menu) return;
        const target = evt.target;
        if (!el.hamburger_menu.contains(target) && target !== el.hamburger_btn) {
          toggle_hamburger(false);
        }
      });
    }

    // mute toggle
    is_muted = soundengine.is_muted();
    el.mute_toggle.checked = is_muted;
    el.mute_toggle.addEventListener('change', (e) => { is_muted = e.target.checked; soundengine.set_mute(is_muted); });

    // keyboard controls
    window.addEventListener('keydown', handle_keydown);

    // focus canvas to capture keyboard when clicked
    el.canvas.setAttribute('tabindex', '0');
    el.canvas.addEventListener('focus', () => {});
  // keep the welcome-bird aligned on resize
  window.addEventListener('resize', position_welcome_bird);
  }

  let welcomeVisible = false;
  function show_welcome() {
    if (!el.welcome_overlay) return;
    el.welcome_overlay.style.display = 'flex';
    el.welcome_overlay.setAttribute('aria-hidden', 'false');
    welcomeVisible = true;
    if (el.canvas_stats) el.canvas_stats.style.display = 'block';
  // position the welcome bird marker over the canvas bird
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

  // toggle hamburger menu visibility
  function toggle_hamburger(show) {
    if (!el.hamburger_btn || !el.hamburger_menu) return;
    const isShow = !!show;
    el.hamburger_btn.setAttribute('aria-expanded', String(isShow));
    el.hamburger_menu.setAttribute('aria-hidden', String(!isShow));
    el.hamburger_menu.style.display = isShow ? 'block' : 'none';
  // when menu is opened, show canvas stats and pause (handled by caller)
  if (el.canvas_stats) el.canvas_stats.style.display = isShow ? 'block' : (is_running && !is_paused ? 'none' : 'block');
  }

  function apply_difficulty() {
    if (settings.difficulty === 'easy') {
      settings.pipe_speed = pipe_speed_base * 0.85;
      settings.pipe_gap = pipe_gap_default + 18;
    } else if (settings.difficulty === 'hard') {
      settings.pipe_speed = pipe_speed_base * 1.25;
      settings.pipe_gap = pipe_gap_default - 20;
    } else {
      settings.pipe_speed = pipe_speed_base;
      settings.pipe_gap = pipe_gap_default;
    }
  }

  function setup_canvas() {
    canvas = el.canvas;
    ctx = canvas.getContext('2d');
    // crisp scaling for devicePixelRatio
    function resize() {
      const rect = canvas.getBoundingClientRect();
      const cssWidth = Math.max(1, rect.width);
      const cssHeight = Math.max(1, rect.height);
      // compute uniform scale so the logical game area (canvas_width x canvas_height)
      // fits inside the rendered CSS rect while preserving aspect ratio
      const scaleX = cssWidth / canvas_width;
      const scaleY = cssHeight / canvas_height;
      const scale = Math.min(scaleX, scaleY);
      // set backing buffer size using logical units scaled by device pixel ratio
      canvas.width = Math.floor(canvas_width * scale * pixel_ratio);
      canvas.height = Math.floor(canvas_height * scale * pixel_ratio);
      // set the displayed CSS size to the logical area scaled
      canvas.style.width = Math.round(canvas_width * scale) + 'px';
      canvas.style.height = Math.round(canvas_height * scale) + 'px';
      // set transform so drawing code can use logical units (360x640)
      const s = pixel_ratio * scale;
      ctx.setTransform(s, 0, 0, s, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
  }

  // ---- game control functions ----
  function start_game() {
    if (!is_running) {
  // prepare a new game but keep it paused so the player must press space/tap to begin
  reset_game_state();
  is_running = true;
  is_paused = true; // remain paused until player presses space or taps
  // don't start the RAF loop here; toggle_pause(false) will start it when player flaps
  spawn_timer = 0;
  score = 0;
  el.score.textContent = score;
  el.status.textContent = 'ready';
  if (el.canvas_stats) el.canvas_stats.style.display = 'block';
  show_welcome();
  // render one frame in the ready state
  render();
    } else if (is_paused) {
      toggle_pause(false);
    }
  }

  function restart_game() {
    reset_game_state();
    // reset but keep paused so the user must press space/tap to resume
    is_running = true;
    is_paused = true;
    spawn_timer = 0;
    score = 0;
    el.score.textContent = score;
  el.status.textContent = 'ready';
  if (el.canvas_stats) el.canvas_stats.style.display = 'block';
  show_welcome();
  render();
  }

  function reset_game_state() {
    pipes = [];
    bird.x = 110;
    bird.y = canvas_height / 2;
    bird.vy = 0;
    bird.rotation = 0;
    score = 0;
    spawn_timer = 0;
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
  // show stats when paused, hide during active play
  if (el.canvas_stats) el.canvas_stats.style.display = is_paused ? 'block' : 'none';
  }

  function game_over() {
    is_running = false;
    el.status.textContent = 'hit';
    soundengine.play_hit();
    // persist best
    if (score > best) {
      best = score;
      try { localStorage.setItem('flappy_neu_best', String(best)); } catch (e) {}
      el.best.textContent = best;
    }
  // show stats on game over
  if (el.canvas_stats) el.canvas_stats.style.display = 'block';
  }

  // ---- input ----
  function handle_keydown(e) {
    // close hamburger with Escape
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
      // toggle canvas grid (css-grid-toggle repurposed to control canvas grid)
      debug.show_canvas_grid = !debug.show_canvas_grid;
  const cssCheckbox = q('css-grid-toggle');
  if (cssCheckbox) cssCheckbox.checked = debug.show_canvas_grid;
    } else if (e.key.toLowerCase() === 'h') {
      show_hud = !show_hud;
      el.hud.style.display = show_hud ? 'block' : 'none';
      el.hud.setAttribute('aria-hidden', (!show_hud).toString());
    } else if (e.key.toLowerCase() === 'm') {
      is_muted = !is_muted;
      el.mute_toggle.checked = is_muted;
      soundengine.set_mute(is_muted);
    }
  }

  // mouse/touch
  function setup_touch_controls() {
    let touchstart_ts = 0;
    let longpress_threshold = 500; // ms

    // tap/flap & long-press pause on canvas
    el.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      touchstart_ts = performance.now();
      // start long-press timer
      longpress_timer = setTimeout(() => {
        toggle_pause();
      }, longpress_threshold);
    });

    el.canvas.addEventListener('pointerup', (e) => {
      e.preventDefault();
      const dt = performance.now() - touchstart_ts;
      if (longpress_timer) { clearTimeout(longpress_timer); longpress_timer = null; }
      if (dt < longpress_threshold) {
        // treat as tap
        do_flap();
      }
    });

    // make sure to cancel on leave
    el.canvas.addEventListener('pointerleave', () => { if (longpress_timer) { clearTimeout(longpress_timer); longpress_timer = null; }});
  }

  // ---- flap & physics ----
  function do_flap() {
    if (!is_running) start_game();
    // if welcome overlay is visible, hide it and start the game
    if (welcomeVisible) {
      hide_welcome_and_start();
      setTimeout(() => {
        bird.vy = flap_impulse;
        soundengine.play_flap();
      }, 220);
      return;
    }
    if (is_paused) toggle_pause(false);
    bird.vy = flap_impulse;
    soundengine.play_flap();
  }

  // ---- pipes ----
  function spawn_pipe() {
    // choose center y with margin
    const margin = 48;
    const minCenter = margin + settings.pipe_gap / 2;
    const maxCenter = canvas_height - margin - settings.pipe_gap / 2;
    const center = minCenter + Math.random() * (maxCenter - minCenter);
    const top = center - settings.pipe_gap / 2;
    const bottom = center + settings.pipe_gap / 2;
    const pipe = {
      x: canvas_width + 10,
      top: top,
      bottom: bottom,
      width: pipe_width,
      scored: false
    };
    pipes.push(pipe);
  }

  // ---- collision detection ----
  function check_collision() {
    // ground/ceiling
    if (bird.y - bird.radius <= 0 || bird.y + bird.radius >= canvas_height) {
      return true;
    }
    // pipes
    for (let p of pipes) {
      if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + p.width) {
        // overlapping horizontally -> check vertical
        if (bird.y - bird.radius < p.top || bird.y + bird.radius > p.bottom) {
          return true;
        }
      }
    }
    return false;
  }

  // ---- scoring ----
  function update_score() {
    for (let p of pipes) {
      if (!p.scored && p.x + p.width < bird.x - bird.radius) {
        p.scored = true;
        score += 1;
        el.score.textContent = score;
        soundengine.play_score();
      }
    }
  }

  // ---- update loop ----
  function update(dt) {
    if (!is_running || is_paused) return;
    // physics
    bird.vy += gravity * dt;
    bird.y += bird.vy * dt;
    bird.rotation = Math.max(-0.6, Math.min(1.2, bird.vy / 600));

    // pipes movement
    const speed = settings.pipe_speed;
    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= speed * dt;
      if (pipes[i].x + pipes[i].width < -20) { pipes.splice(i, 1); }
    }

    spawn_timer += dt;
    if (spawn_timer >= pipe_spawn_interval) {
      spawn_timer = 0;
      spawn_pipe();
    }

    // scoring
    update_score();
    // collision
    if (check_collision()) {
      game_over();
    }
  }

  // ---- render ----
  function clear() {
    ctx.clearRect(0, 0, canvas_width, canvas_height);
    // background (white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas_width, canvas_height);
  }

  function draw_bird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    // simple bird: circle + wing rectangle
    ctx.beginPath();
    ctx.fillStyle = '#0a0a0a';
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();
    // eye (white)
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(5, -4, 3, 0, Math.PI * 2);
    ctx.fill();
    // wing (rectangle)
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(-bird.radius / 1.2, 2, bird.radius * 0.9, 6);
    ctx.restore();
  }

  function draw_pipes() {
    ctx.fillStyle = '#0a0a0a';
    for (let p of pipes) {
      // top pipe
      ctx.fillRect(p.x, 0, p.width, p.top);
      // bottom pipe
      ctx.fillRect(p.x, p.bottom, p.width, canvas_height - p.bottom);
      // pipe border (inner)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x + 2, 2, p.width - 4, p.top - 4);
      ctx.strokeRect(p.x + 2, p.bottom + 2, p.width - 4, canvas_height - p.bottom - 4);
    }
  }

  function draw_foreground() {
    // ground marker
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, canvas_height - 12, canvas_width, 12);
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, canvas_height - 12, canvas_width, 12);
  }

  function draw_canvas_grid() {
    const step = 20;
    ctx.save();
    ctx.strokeStyle = 'rgba(107,114,128,0.12)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas_width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas_height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas_height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas_width, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function render() {
    clear();
    // draw pipes behind
    draw_pipes();
    // draw bird
    draw_bird();
    // foreground
    draw_foreground();

    // debug canvas grid
    if (debug.show_canvas_grid) draw_canvas_grid();

    // hud draw if visible (also separate element updates)
    if (show_hud) {
      // element hud values are updated in loop
    }
  }

  // ---- main loop ----
  function loop(now) {
    if (!last_time) last_time = now;
    const dt = Math.min(0.05, (now - last_time) / 1000);
    last_time = now;

    if (!is_paused && is_running) {
      update(dt);
      render();
    } else {
      // still render paused state
      render();
    }

    // fps
    fps_counter.frames++;
    if (now - fps_counter.last >= 500) {
      fps_counter.fps = Math.round((fps_counter.frames * 1000) / (now - fps_counter.last));
      fps_counter.frames = 0;
      fps_counter.last = now;
      el.fps.textContent = fps_counter.fps;
      el.pipes_count.textContent = pipes.length;
      el.bird_y.textContent = Math.round(bird.y);
      el.bird_v.textContent = Math.round(bird.vy);
    }

    if (is_running && !is_paused) requestAnimationFrame(loop);
  }

  // page grid feature removed — css-grid-toggle now toggles canvas grid

  // ---- boot ----
  function boot() {
    el.canvas = q('game-canvas');
    init_ui();
    apply_difficulty();
    setup_canvas();
    setup_touch_controls();

    // load mute from engine
    is_muted = soundengine.is_muted();
    el.mute_toggle.checked = is_muted;

    // click canvas to focus
    el.canvas.addEventListener('click', () => { el.canvas.focus(); });

    // accessibility: keyboard hints
    el.canvas.addEventListener('keydown', (e) => { handle_keydown(e); });

    // start paused (player presses start)
    render();
  }

  // run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // expose for debugging in console (lowercase)
  window.flappyneu = {
    start_game, restart_game, toggle_pause, do_flap, soundengine
  };

})();
