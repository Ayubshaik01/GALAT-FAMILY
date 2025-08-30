const soundengine = (function () {
  let audioctx = null;
  let mastergain = null;
  let ismuted = false;

  try { ismuted = localStorage.getItem('flappy_neu_muted') === '1'; } catch (e) { ismuted = false; }

  function init() {
    if (audioctx) return;
    try {
      audioctx = new (window.AudioContext || window.webkitAudioContext)();
      mastergain = audioctx.createGain();
      mastergain.gain.value = ismuted ? 0 : 1;
      mastergain.connect(audioctx.destination);
    } catch (e) {
      console.warn('web audio not supported', e);
      audioctx = null;
    }
  }

  function beep(frequency = 440, time = 0.08, type = 'sine', volume = 0.2) {
    if (!audioctx) return;
    const o = audioctx.createOscillator();
    const g = audioctx.createGain();
    o.type = type;
    o.frequency.value = frequency;
    g.gain.value = volume;
    o.connect(g);
    g.connect(mastergain);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioctx.currentTime + time);
    o.stop(audioctx.currentTime + time + 0.02);
  }

  function play_flap() { init(); if (!audioctx) return; beep(600, 0.06, 'square', 0.12); }
  function play_score() { init(); if (!audioctx) return; beep(900, 0.08, 'sine', 0.14); beep(1200, 0.04, 'sine', 0.08); }
  function play_hit() { init(); if (!audioctx) return; beep(160, 0.18, 'sawtooth', 0.2); }

  function set_mute(val) {
    ismuted = !!val;
    try { localStorage.setItem('flappy_neu_muted', ismuted ? '1' : '0'); } catch (e) {}
    if (mastergain) mastergain.gain.value = ismuted ? 0 : 1;
  }

  function is_muted() { return ismuted; }

  return {
    init, play_flap, play_score, play_hit, set_mute, is_muted
  };
})();
