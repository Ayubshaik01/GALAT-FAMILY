(function(){
  const ctx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;
  const storage_key = 'neub_snek_muted';
  let muted = false;
  try{ muted = JSON.parse(localStorage.getItem(storage_key)) || false }catch(e){ muted=false }

  function playTone(freq=440, type='sine', dur=0.08, vol=0.08){
    if(!ctx || muted) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  }

  function playEat(){ playTone(880, 'sawtooth', 0.12, 0.09) }
  function playDie(){ playTone(120, 'sine', 0.25, 0.2); playTone(240, 'square', 0.18, 0.12) }
  function playTick(){ playTone(440, 'triangle', 0.06, 0.04) }

  function toggleMute(){
    muted = !muted;
    try{ localStorage.setItem(storage_key, JSON.stringify(muted)) }catch(e){}
    return muted;
  }
  function isMuted(){ return muted }

  window.sound = {
    playEat, playDie, playTick, toggleMute, isMuted
  };
})();
