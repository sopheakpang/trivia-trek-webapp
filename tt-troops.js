/* Trivia Trek — cavalry heroes, spear squads, and battle choreography */
(function(){
  "use strict";
  var F = window.TTField, W = F.W, H = F.H;
  var HOME = [[340,300],[250,345],[430,365],[160,385],[340,410],[90,320],[250,440],[440,445],[150,470],[200,265],[60,430],[520,395]];
  var CLASH_HERO = [500,300], CLASH_ENEMY = [612,236];
  var ENEMY_SLOTS = [[706,160],[830,215],[770,305]];
  var SQUAD = [[0,0],[30,-14],[42,10],[12,22]];
  var ESCORT = [[-34,18],[-54,-8],[-14,34]];

  var T = window.TTTroops = { heroes:[], enemies:[], active:-1, foe:null, mode:"idle", finale:null };

  function depth(y){ return .7 + (y / H) * .5; }
  function lerp(a, b, k){ return a + (b - a) * Math.min(1, k); }

  T.setup = function(roster, enemyCount){
    T.heroes = roster.map(function(h, i){
      var p = HOME[i % HOME.length];
      return { hero:h, x:p[0] - 260, y:p[1] + 60, hx:p[0], hy:p[1], hp:1, shown:1, st:"march", alpha:1, t:Math.random()*6, tip:0, delay:i*.12 };
    });
    T.queue = enemyCount; T.enemies = []; T.active = -1; T.foe = null; T.finale = null; T.mode = "idle";
    refillEnemies();
  };
  function refillEnemies(){
    var waiting = T.enemies.filter(function(e){ return e.st === "wait" || e.st === "march"; });
    for(var s=0; s<ENEMY_SLOTS.length; s++){
      var taken = waiting.some(function(e){ return e.slot === s; });
      if(!taken && T.queue > 0){
        T.queue--; var p = ENEMY_SLOTS[s];
        T.enemies.push({ slot:s, x:p[0] + 240, y:p[1] - 120, hx:p[0], hy:p[1], hp:1, shown:1, st:"march", alpha:1, t:Math.random()*6, men:[1,1,1,1], knock:[0,0,0,0] });
      }
    }
  }

  T.engage = function(index){
    T.active = index; T.mode = "fight";
    var h = T.heroes[index]; if(h){ h.st = "advance"; h.hp = 1; }
    var pick = T.enemies.filter(function(e){ return e.st === "wait" || e.st === "march"; }).sort(function(a,b){ return a.slot - b.slot; })[0];
    T.foe = pick || null; if(T.foe){ T.foe.st = "advance"; T.foe.slot = -1; }
    refillEnemies();
  };
  T.pressure = function(frac){
    if(T.mode !== "fight") return;
    var h = T.heroes[T.active]; if(h) h.hp = .5 + .5*frac; if(T.foe) T.foe.hp = .5 + .5*frac;
  };
  T.resolve = function(win){
    var h = T.heroes[T.active], e = T.foe; T.mode = win ? "won" : "lost";
    if(win){
      if(e){ e.hp = 0; e.st = "broken"; e.brokenT = 0; e.men.forEach(function(_, i){ setTimeout(function(){ e.knock[i] = .01; F.poof(e.x + SQUAD[i][0], e.y + SQUAD[i][1] - 20); F.sparks(e.x + SQUAD[i][0], e.y + SQUAD[i][1] - 26, 8); }, 120 + i*130); }); }
      if(h){ h.st = "triumph"; h.stT = 0; }
      F.flashIt("255,220,130", .25);
    } else {
      if(h){ h.hp = 0; h.st = "fallen"; h.stT = 0; F.poof(h.x, h.y - 30); F.sparks(h.x + 10, h.y - 40, 16); }
      if(e){ e.st = "gloat"; e.stT = 0; }
      F.flashIt("200,30,20", .28); F.shakeIt(12);
    }
  };
  T.endBattle = function(win){ T.finale = win ? "charge" : "overrun"; T.finaleT = 0; if(!win) F.shakeIt(16); };

  /* ---------- update ---------- */
  function update(){
    var dt = F.dt;
    T.heroes.forEach(function(h, i){
      h.t += dt; h.shown = lerp(h.shown, h.hp, dt*3);
      if(h.st === "march"){ if(h.delay > 0){ h.delay -= dt; } else { h.x = lerp(h.x, h.hx, dt*1.8); h.y = lerp(h.y, h.hy, dt*1.8); if(Math.abs(h.x - h.hx) < 2) h.st = "idle"; } }
      else if(h.st === "advance"){ h.x = lerp(h.x, CLASH_HERO[0], dt*2.4); h.y = lerp(h.y, CLASH_HERO[1], dt*2.4); if(Math.abs(h.x - CLASH_HERO[0]) < 3) h.st = "fight"; }
      else if(h.st === "fight"){ h.x = CLASH_HERO[0] + Math.sin(h.t*6)*5; h.y = CLASH_HERO[1] + Math.cos(h.t*6)*2; if(Math.random() < dt*5) F.sparks(550 + Math.random()*24, 262 + Math.random()*20, 5); }
      else if(h.st === "triumph"){ h.stT += dt; if(h.stT > 1.3){ h.x = lerp(h.x, h.hx, dt*2); h.y = lerp(h.y, h.hy, dt*2); if(Math.abs(h.x - h.hx) < 2) h.st = "idle"; } }
      else if(h.st === "fallen"){ h.stT += dt; h.tip = Math.min(1, h.stT*2.2); if(h.stT > 1.4) h.alpha = Math.max(0, h.alpha - dt*.8); }
      if(T.finale === "charge" && h.st !== "fallen"){ h.x += 70*dt; h.y -= 42*dt; }
    });
    T.enemies.forEach(function(e){
      e.t += dt; e.shown = lerp(e.shown, e.hp, dt*3);
      if(e.st === "march"){ e.x = lerp(e.x, e.hx, dt*1.5); e.y = lerp(e.y, e.hy, dt*1.5); if(Math.abs(e.x - e.hx) < 2) e.st = "wait"; }
      else if(e.st === "advance"){ e.x = lerp(e.x, CLASH_ENEMY[0], dt*2.2); e.y = lerp(e.y, CLASH_ENEMY[1], dt*2.2); }
      else if(e.st === "broken"){ e.brokenT += dt; if(e.brokenT > 1) e.alpha = Math.max(0, e.alpha - dt*1.2); }
      else if(e.st === "gloat"){ e.stT += dt; if(e.stT > 1.2){ e.x += 90*dt; e.y -= 60*dt; e.alpha = Math.max(0, e.alpha - dt*.8); } }
      if(T.finale === "overrun" && e.st !== "broken"){ e.x -= 60*dt; e.y += 36*dt; }
    });
    T.enemies = T.enemies.filter(function(e){ return e.alpha > 0; });
  }

  /* ---------- drawing ---------- */
  function hpBar(x, cx, cy, v, ally){
    x.fillStyle = "rgba(0,0,0,.65)"; x.fillRect(cx - 27, cy - 1, 54, 8);
    x.fillStyle = ally ? "#3BD14B" : "#E0302A"; x.fillRect(cx - 26, cy, 52 * Math.max(0, v), 6);
    x.fillStyle = "rgba(255,255,255,.35)"; x.fillRect(cx - 26, cy, 52 * Math.max(0, v), 2);
  }

  function soldier(x, px, py, s, ally, thrust, knock, faction){
    x.save(); x.translate(px, py); x.scale(ally ? s : -s, s);
    if(knock > 0){ x.translate(-knock*30, -Math.sin(knock*Math.PI)*16); x.rotate(-knock*1.3); }
    x.fillStyle = "rgba(0,0,0,.28)"; x.beginPath(); x.ellipse(0, 0, 13, 4.5, 0, 0, Math.PI*2); x.fill();
    var armor = ally ? "#C9CED3" : "#5A2A22", plate = ally ? "#8E969E" : "#3E4A2E", skin = "#E2B48C";
    x.strokeStyle = "#2A1E16"; x.lineWidth = 3.2; x.lineCap = "round";
    x.beginPath(); x.moveTo(-3,-14); x.lineTo(-6,-1); x.moveTo(3,-14); x.lineTo(7,-1); x.stroke();
    x.fillStyle = ally ? "#E6E8EA" : "#6E2A20"; x.beginPath(); x.moveTo(-8,-12); x.lineTo(8,-12); x.lineTo(6,-22); x.lineTo(-6,-22); x.closePath(); x.fill();
    x.fillStyle = armor; x.beginPath(); x.roundRect ? x.roundRect(-7,-36,14,16,4) : x.rect(-7,-36,14,16); x.fill();
    x.fillStyle = plate; x.fillRect(-7,-30,14,3); x.fillRect(-7,-25,14,3);
    x.fillStyle = skin; x.beginPath(); x.arc(0,-42,5.5,0,Math.PI*2); x.fill();
    x.fillStyle = ally ? "#B7BDC3" : "#3A2A22"; x.beginPath(); x.moveTo(-6,-43); x.quadraticCurveTo(0,-54,6,-43); x.closePath(); x.fill();
    if(ally){ x.fillStyle = faction; x.beginPath(); x.moveTo(0,-50); x.quadraticCurveTo(-8,-58,-12,-50); x.lineTo(0,-48); x.fill(); }
    var th = thrust*8;
    x.strokeStyle = "#5A3E26"; x.lineWidth = 2; x.beginPath(); x.moveTo(-14 + th, -18); x.lineTo(34 + th, -40); x.stroke();
    x.fillStyle = "#DCE2E6"; x.beginPath(); x.moveTo(34 + th, -44); x.lineTo(46 + th, -45.5); x.lineTo(35 + th, -36); x.closePath(); x.fill();
    x.fillStyle = skin; x.beginPath(); x.arc(6 + th*.6, -27, 2.8, 0, Math.PI*2); x.fill();
    x.restore();
  }

  function weapon(x, type, swing){
    x.save(); x.rotate(swing);
    x.strokeStyle = "#5A3E26"; x.lineWidth = 2.6; x.lineCap = "round";
    if(type === "spear" || type === "halberd"){ x.beginPath(); x.moveTo(-22,10); x.lineTo(44,-30); x.stroke(); x.fillStyle = "#E6ECF0"; x.beginPath(); x.moveTo(44,-34); x.lineTo(58,-38); x.lineTo(46,-25); x.closePath(); x.fill();
      if(type === "halberd"){ x.fillStyle = "#C9D0D6"; x.beginPath(); x.moveTo(38,-30); x.quadraticCurveTo(46,-16,32,-18); x.closePath(); x.fill(); x.fillStyle = "#D63A3A"; x.fillRect(34,-30,4,6); } }
    else if(type === "blade"){ x.beginPath(); x.moveTo(-2,4); x.lineTo(6,-2); x.stroke(); x.fillStyle = "#E6ECF0"; x.beginPath(); x.moveTo(4,-2); x.quadraticCurveTo(30,-22,40,-40); x.quadraticCurveTo(26,-16,8,2); x.closePath(); x.fill(); }
    else if(type === "mace"){ x.beginPath(); x.moveTo(-4,6); x.lineTo(22,-20); x.stroke(); x.fillStyle = "#6E6A66"; x.beginPath(); x.arc(24,-22,7,0,Math.PI*2); x.fill(); x.fillStyle = "#B8B2AA"; x.beginPath(); x.arc(22,-24,2.5,0,Math.PI*2); x.fill(); }
    else if(type === "axe"){ x.beginPath(); x.moveTo(-4,6); x.lineTo(20,-26); x.stroke(); x.fillStyle = "#C9D0D6"; x.beginPath(); x.moveTo(16,-24); x.quadraticCurveTo(34,-26,30,-8); x.lineTo(14,-18); x.closePath(); x.fill(); }
    else if(type === "bow"){ x.strokeStyle = "#7A4A22"; x.lineWidth = 2.4; x.beginPath(); x.arc(10,-10,18,-1.3,1.3); x.stroke(); x.strokeStyle = "rgba(240,240,230,.8)"; x.lineWidth = 1; x.beginPath(); x.moveTo(15,-27); x.lineTo(15,7); x.stroke(); }
    else if(type === "fan"){ x.fillStyle = "#F2EEE4"; x.beginPath(); x.moveTo(4,0); x.arc(4,0,18,-1.9,-.5); x.closePath(); x.fill(); x.strokeStyle = "#B8902F"; x.lineWidth = 1; x.stroke(); }
    else if(type === "twin"){ x.fillStyle = "#E6ECF0"; x.beginPath(); x.moveTo(2,0); x.lineTo(30,-18); x.lineTo(4,4); x.closePath(); x.fill(); x.beginPath(); x.moveTo(-2,4); x.lineTo(22,-4); x.lineTo(0,8); x.closePath(); x.fill(); }
    x.restore();
  }

  function cavalry(x, g){
    var h = g.hero, s = depth(g.y) * 1.02, moving = g.st === "march" || g.st === "advance" || (g.st === "triumph" && g.stT > 1.3) || T.finale === "charge";
    var gait = moving ? Math.sin(g.t*14) : Math.sin(g.t*2)*.15, fight = g.st === "fight";
    var rear = g.st === "triumph" && g.stT < 1.2 ? Math.sin(Math.min(1, g.stT*1.6)*Math.PI) * .35 : 0;
    var fac = window.TT_HEROES.FACTIONS[h.faction].color;
    x.save(); x.globalAlpha = g.alpha;
    // escort infantry
    ESCORT.forEach(function(o, i){
      var k = g.st === "fallen" ? Math.min(1, Math.max(0, g.stT*1.8 - i*.2)) : 0;
      soldier(x, g.x + o[0]*s, g.y + o[1]*s, depth(g.y + o[1]) * .95, true, fight ? Math.max(0, Math.sin(g.t*7 + i*1.7)) : 0, k, fac);
    });
    x.translate(g.x, g.y); x.scale(s, s);
    if(g.tip > 0){ x.rotate(g.tip * .95); x.translate(g.tip*6, -g.tip*4); }
    x.rotate(-rear);
    x.fillStyle = "rgba(0,0,0,.3)"; x.beginPath(); x.ellipse(2, 2, 34, 9, 0, 0, Math.PI*2); x.fill();
    // horse
    var coat = h.horse, dark = "rgba(0,0,0,.28)";
    x.strokeStyle = coat; x.lineWidth = 5; x.lineCap = "round";
    [[-16,1],[-8,-1],[12,1],[20,-1]].forEach(function(l, i){ var sw = gait * (i%2 ? 7 : -7); x.beginPath(); x.moveTo(l[0], -24); x.lineTo(l[0] + sw, -2); x.stroke(); });
    x.fillStyle = "#2A1E16"; [[-16,1],[-8,-1],[12,1],[20,-1]].forEach(function(l, i){ var sw = gait * (i%2 ? 7 : -7); x.fillRect(l[0] + sw - 3, -3, 6, 3); });
    x.fillStyle = coat; x.beginPath(); x.ellipse(0, -30, 28, 13, 0, 0, Math.PI*2); x.fill();
    x.fillStyle = dark; x.beginPath(); x.ellipse(2, -24, 24, 6, 0, 0, Math.PI*2); x.fill();
    x.fillStyle = coat; x.beginPath(); x.moveTo(16,-38); x.quadraticCurveTo(26,-52,30,-62); x.lineTo(40,-58); x.quadraticCurveTo(34,-44,26,-28); x.closePath(); x.fill();
    x.beginPath(); x.ellipse(40, -61, 11, 6, .55, 0, Math.PI*2); x.fill();
    x.fillStyle = "#2A1E16"; x.beginPath(); x.moveTo(28,-64); x.quadraticCurveTo(22,-50,16,-40); x.lineTo(20,-38); x.quadraticCurveTo(26,-50,32,-62); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(-26,-34); x.quadraticCurveTo(-42,-30 + gait*4,-40,-12); x.quadraticCurveTo(-34,-24,-24,-28); x.closePath(); x.fill();
    x.fillStyle = "#1A1210"; x.beginPath(); x.arc(42,-63,1.4,0,Math.PI*2); x.fill();
    x.fillStyle = fac; x.fillRect(-12,-42,22,14); x.fillStyle = "#E7C46A"; x.fillRect(-12,-30,22,2.5);
    // cape
    var flow = Math.sin(g.t*(moving ? 9 : 3)) * 4;
    x.fillStyle = h.cape; x.beginPath(); x.moveTo(-6,-66); x.quadraticCurveTo(-30,-58 + flow,-44,-40 + flow); x.quadraticCurveTo(-24,-42,-2,-46); x.closePath(); x.fill();
    x.fillStyle = "rgba(0,0,0,.2)"; x.beginPath(); x.moveTo(-6,-60); x.quadraticCurveTo(-26,-52 + flow,-44,-40 + flow); x.lineTo(-30,-42); x.closePath(); x.fill();
    // rider
    x.fillStyle = "#2A1E16"; x.fillRect(-2,-46,6,14);
    x.fillStyle = h.armor; x.beginPath(); x.roundRect ? x.roundRect(-8,-68,17,24,5) : x.rect(-8,-68,17,24); x.fill();
    x.fillStyle = "#E7C46A"; x.fillRect(-8,-54,17,2.5);
    x.fillStyle = h.skin; x.beginPath(); x.arc(1,-75,7.5,0,Math.PI*2); x.fill();
    x.fillStyle = h.hair;
    if(h.style === "helmet" || h.style === "winged"){ x.fillStyle = h.style === "helmet" ? "#8C1F1A" : "#9AA4AC"; x.beginPath(); x.arc(1,-77,8.5,Math.PI,0); x.fill(); x.fillStyle = "#D63A3A"; x.beginPath(); x.moveTo(1,-85); x.quadraticCurveTo(-8,-96,-16,-88); x.lineTo(0,-83); x.fill(); }
    else if(h.style === "hood"){ x.fillStyle = h.cape; x.beginPath(); x.arc(1,-76,9,Math.PI*.9,Math.PI*2.1); x.fill(); }
    else if(h.style === "bald"){ x.fillStyle = h.hair; x.beginPath(); x.arc(1,-84,3,0,Math.PI*2); x.fill(); }
    else { x.beginPath(); x.arc(1,-78,7.8,Math.PI*1.05,Math.PI*1.95); x.fill();
      if(h.style === "topknot" || h.style === "bun"){ x.beginPath(); x.arc(0,-86,3.5,0,Math.PI*2); x.fill(); }
      if(h.style === "long" || h.style === "ribbon" || h.style === "crown"){ x.beginPath(); x.moveTo(-6,-80); x.quadraticCurveTo(-14,-66 + flow*.5,-10,-56); x.lineTo(-4,-62); x.fill(); }
      if(h.style === "feather"){ x.fillStyle = "#F2EEE4"; x.beginPath(); x.ellipse(-3,-92,2.5,9,-.3,0,Math.PI*2); x.fill(); }
      if(h.style === "crown"){ x.fillStyle = "#E7C46A"; x.fillRect(-4,-87,10,3); } }
    if(h.beard === "long" || h.beard === "big"){ x.fillStyle = h.hair; x.beginPath(); x.moveTo(-3,-72); x.quadraticCurveTo(4,-56,8,-72); x.fill(); }
    x.save(); x.translate(8,-60);
    var swing = fight ? Math.sin(g.t*8)*.45 : g.st === "triumph" && g.stT < 1.2 ? -.9 : 0;
    weapon(x, h.weapon, swing); x.restore();
    x.restore();
    if(g.st !== "fallen" || g.stT < .5){ hpBar(x, g.x, g.y - 104*s, g.shown, true); }
  }

  function squad(x, e){
    var s = depth(e.y), fight = e.st === "advance" && T.mode === "fight";
    x.save(); x.globalAlpha = e.alpha;
    SQUAD.slice().sort(function(a,b){ return a[1] - b[1]; }).forEach(function(o){
      var i = SQUAD.indexOf(o), thrust = fight ? Math.max(0, Math.sin(e.t*6.5 + i*1.3)) : (e.st === "gloat" ? .9 : 0);
      var knock = e.knock[i] ? Math.min(1, (e.knock[i] += F.dt*1.6)) : 0;
      soldier(x, e.x + o[0]*s, e.y + o[1]*s, depth(e.y + o[1]) * 1.05, false, thrust, knock, "#000");
    });
    x.restore();
    if(e.st !== "broken" || e.brokenT < .6){ x.save(); x.globalAlpha = e.alpha; hpBar(x, e.x + 20, e.y - 72*s, e.shown, false); x.restore(); }
  }

  F.drawUnits = function(x){
    update();
    var list = [];
    T.heroes.forEach(function(g){ if(g.alpha <= 0.01) return; list.push({ y:g.y, draw:function(){ cavalry(x, g); } }); });
    T.enemies.forEach(function(e){ list.push({ y:e.y, draw:function(){ squad(x, e); } }); });
    list.sort(function(a,b){ return a.y - b.y; }).forEach(function(it){ it.draw(); });
  };
})();
