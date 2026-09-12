/* Trivia Trek — synthesised battle sound effects (no audio files, all Web Audio) */
(function(){
  "use strict";
  var A = window.TTAudio = { ready:false, muted:false, ctx:null };
  var ctx = null, master = null, clashTimer = null;

  try{ A.muted = localStorage.getItem("tt-muted") === "1"; }catch(e){}

  function boot(){
    if(ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
    try{
      ctx = new AC(); A.ctx = ctx;
      master = ctx.createGain(); master.gain.value = A.muted ? 0 : .75;
      var soft = ctx.createBiquadFilter(); soft.type = "lowpass"; soft.frequency.value = 9000;
      master.connect(soft); soft.connect(ctx.destination); A.ready = true;
    }catch(e){ ctx = null; }
    return ctx;
  }
  A.resume = function(){ var c = boot(); if(c && c.state === "suspended") c.resume(); };
  A.setMuted = function(m){
    A.muted = !!m; try{ localStorage.setItem("tt-muted", m ? "1" : "0"); }catch(e){}
    if(master) master.gain.setTargetAtTime(A.muted ? 0 : .75, ctx.currentTime, .02);
    if(A.muted) A.stopClash();
  };

  function env(node, t, peak, attack, decay){
    var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(.0001, t + attack + decay);
    node.connect(g); g.connect(master); return g;
  }
  function tone(type, f0, f1, t, dur, peak, attack){
    if(!ctx) return;
    var o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if(f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(o, t, peak, attack || .01, dur); o.start(t); o.stop(t + dur + .08);
  }
  function noise(t, dur, peak, type, freq, q){
    if(!ctx) return;
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur)), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for(var i=0;i<len;i++) d[i] = (Math.random()*2 - 1) * (1 - i/len);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = type || "bandpass"; f.frequency.value = freq || 1800; f.Q.value = q || 1;
    src.connect(f); env(f, t, peak, .005, dur); src.start(t); src.stop(t + dur + .05);
  }

  var S = {
    click: function(t){ tone("square", 620, 480, t, .06, .12); },
    horn: function(t){
      [196, 294].forEach(function(f, i){
        tone("sawtooth", f*.98, f, t + i*.12, .55, .16, .06);
        tone("sawtooth", f*1.01, f*1.005, t + i*.12, .55, .1, .06);
      });
      noise(t, .25, .05, "lowpass", 700, 1);
    },
    hooves: function(t){ for(var i=0;i<5;i++){ noise(t + i*.13, .08, .55, "lowpass", 240 + Math.random()*70, .8); tone("sine", 120, 70, t + i*.13, .07, .12); } },
    clang: function(t, loud){
      var p = loud ? .45 : .18;
      noise(t, .12, p*.8, "bandpass", 2400 + Math.random()*900, 1.4);
      tone("triangle", 3100 + Math.random()*500, 2400, t, .16, p*.5);
      tone("triangle", 4700, 3900, t, .12, p*.3);
    },
    coin: function(t){ tone("sine", 1180, 1180, t, .09, .2); tone("sine", 1760, 1760, t + .07, .18, .17); },
    victory: function(t){
      [523, 659, 784, 1047].forEach(function(f, i){
        tone("triangle", f, f, t + i*.09, .42, .2, .02);
        tone("sawtooth", f/2, f/2, t + i*.09, .38, .07, .03);
      });
      noise(t, .2, .06, "highpass", 5000, .7);
    },
    defeat: function(t){
      tone("sawtooth", 220, 96, t, .75, .2, .04);
      tone("sawtooth", 165, 72, t + .04, .7, .14, .04);
      noise(t, .35, .6, "lowpass", 190, .8);
    },
    levelup: function(t){ [784, 988, 1319].forEach(function(f, i){ tone("triangle", f, f, t + i*.07, .3, .16, .01); }); },
    fanfare: function(t){
      var mel = [[523,0],[523,.16],[659,.32],[784,.5],[1047,.74],[784,1.0],[1047,1.14]];
      mel.forEach(function(m){ tone("triangle", m[0], m[0], t + m[1], .38, .2, .02); tone("sawtooth", m[0]/2, m[0]/2, t + m[1], .34, .08, .03); });
      for(var i=0;i<3;i++) noise(t + i*.28, .18, .1, "lowpass", 120, 1);
    },
    retreat: function(t){
      for(var i=0;i<3;i++){ noise(t + i*.26, .3, .6, "lowpass", 170, .8); tone("sine", 96, 62, t + i*.26, .28, .2); }
      tone("sawtooth", 196, 130, t + .1, .9, .12, .06);
    },
    tick: function(t){ tone("sine", 1046, 1046, t, .05, .16); },
    march: function(t){ for(var i=0;i<4;i++){ noise(t + i*.22, .18, .5, "lowpass", 180, .8); tone("sine", 96, 58, t + i*.22, .16, .16); } }
  };

  A.play = function(name, delay){
    if(A.muted) return; var c = boot(); if(!c) return;
    if(c.state === "suspended") c.resume();
    try{ S[name] && S[name](c.currentTime + (delay || 0)); }catch(e){}
  };
  A.startClash = function(){
    A.stopClash(); if(A.muted) return; var c = boot(); if(!c) return;
    clashTimer = setInterval(function(){
      if(A.muted || window.TTField.paused) return;
      try{ S.clang(ctx.currentTime, false); }catch(e){}
    }, 320);
  };
  A.stopClash = function(){ if(clashTimer){ clearInterval(clashTimer); clashTimer = null; } };

  // browsers only allow audio after a gesture — wake the context on the first one
  ["pointerdown","keydown","touchstart"].forEach(function(ev){
    window.addEventListener(ev, function once(){ A.resume(); window.removeEventListener(ev, once); }, { once:true, passive:true });
  });
})();
