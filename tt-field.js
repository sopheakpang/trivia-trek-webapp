/* Trivia Trek — top-down battlefield: terrain painting, render loop, effects */
(function(){
  "use strict";
  var W = 960, H = 540;
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var THEMES = {
    easy:   { name:"Green Valley",   grass:["#86A84A","#5F8B38"], dapple:["#9DBA55","#6E9A3E","#557F31","#B5C46A"], road:"#CDB47C", roadDk:"#A98E5A",
              cliff:["#9C8A63","#7A6A4A","#5E5038"], tree:["#23461F","#2F5A2A","#3E7034"], rock:"#9A9A8C", mote:"255,255,210", motes:"pollen" },
    medium: { name:"Autumn Pass",    grass:["#B09A4E","#86733A"], dapple:["#C2A858","#9A8740","#7D6A30","#D0B46A"], road:"#D2AA70", roadDk:"#A9824E",
              cliff:["#A8764C","#86583A","#643E28"], tree:["#6E3A18","#A5561F","#C9782E"], rock:"#9C8C7A", mote:"230,120,40", motes:"leaf" },
    hard:   { name:"Scorched Front", grass:["#4E3E30","#2A2019"], dapple:["#5A4636","#3A2C22","#2E231B","#6A4A34"], road:"#6E5644", roadDk:"#4E3C30",
              cliff:["#4A3A30","#35291F","#221A14"], tree:["#1C1612","#2A221C","#3A2E24"], rock:"#5A4E46", mote:"255,120,40", motes:"ember", embers:true }
  };
  var ROAD = [[150,600],[330,440],[520,300],[700,190],[1000,70]];

  function rng(seed){ return function(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  function roadPoint(t){
    var n = ROAD.length - 1, i = Math.min(n - 1, Math.floor(t * n)), u = t * n - i, a = ROAD[i], b = ROAD[i+1];
    return [a[0] + (b[0]-a[0])*u, a[1] + (b[1]-a[1])*u];
  }

  function pine(x, px, py, s, th){
    x.fillStyle = "rgba(0,0,0,.28)"; x.beginPath(); x.ellipse(px + 14*s, py + 4*s, 20*s, 7*s, -.3, 0, Math.PI*2); x.fill();
    x.fillStyle = "#4A3222"; x.fillRect(px - 2*s, py - 10*s, 4*s, 12*s);
    for(var k=0;k<3;k++){
      var w = (22 - k*5) * s, top = py - (26 + k*16) * s, base = py - (6 + k*14) * s;
      x.fillStyle = th.tree[k]; x.beginPath(); x.moveTo(px, top); x.lineTo(px + w, base); x.lineTo(px - w, base); x.closePath(); x.fill();
      x.fillStyle = "rgba(0,0,0,.18)"; x.beginPath(); x.moveTo(px, top); x.lineTo(px + w, base); x.lineTo(px + w*.2, base); x.closePath(); x.fill();
    }
  }

  function paintGround(th){
    var c = document.createElement("canvas"); c.width = W*2; c.height = H*2;
    var x = c.getContext("2d"), r = rng(1234); x.scale(2,2);
    var g = x.createLinearGradient(0,0,W,H); g.addColorStop(0, th.grass[0]); g.addColorStop(1, th.grass[1]);
    x.fillStyle = g; x.fillRect(0,0,W,H);
    for(var i=0;i<2600;i++){
      x.globalAlpha = .08 + r()*.18; x.fillStyle = th.dapple[Math.floor(r()*4)];
      x.beginPath(); x.ellipse(r()*W, r()*H, 3 + r()*26, 2 + r()*12, r()*3, 0, Math.PI*2); x.fill();
    }
    // road
    for(var t=0;t<=1;t+=.004){
      var p = roadPoint(t), rad = 52 + Math.sin(t*23)*8 + r()*6;
      x.globalAlpha = .06; x.fillStyle = th.roadDk; x.beginPath(); x.ellipse(p[0], p[1], rad*1.35, rad*.8, -.6, 0, Math.PI*2); x.fill();
      x.globalAlpha = .12; x.fillStyle = th.road; x.beginPath(); x.ellipse(p[0], p[1], rad, rad*.55, -.6, 0, Math.PI*2); x.fill();
    }
    x.globalAlpha = .25; x.strokeStyle = th.roadDk; x.lineWidth = 2;
    [-14, 16].forEach(function(off){ x.beginPath(); for(var t2=0;t2<=1;t2+=.02){ var q = roadPoint(t2); x.lineTo(q[0] + off*.6, q[1] + off); } x.stroke(); });
    // pebbles and grass tufts
    x.globalAlpha = 1;
    for(var p2=0;p2<260;p2++){
      var gx = r()*W, gy = r()*H;
      x.strokeStyle = th.dapple[p2 % 4]; x.lineWidth = 1.2; x.globalAlpha = .55;
      x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx - 2, gy - 6); x.moveTo(gx + 2, gy); x.lineTo(gx + 3, gy - 7); x.moveTo(gx + 4, gy); x.lineTo(gx + 7, gy - 5); x.stroke();
    }
    x.globalAlpha = 1;
    for(var k=0;k<40;k++){
      var rx = r()*W, ry = r()*H, rs = 3 + r()*9;
      x.fillStyle = "rgba(0,0,0,.2)"; x.beginPath(); x.ellipse(rx + 3, ry + 3, rs, rs*.6, 0, 0, Math.PI*2); x.fill();
      x.fillStyle = th.rock; x.beginPath(); x.moveTo(rx - rs, ry); x.lineTo(rx - rs*.4, ry - rs*.7); x.lineTo(rx + rs*.6, ry - rs*.6); x.lineTo(rx + rs, ry); x.lineTo(rx + rs*.2, ry + rs*.5); x.closePath(); x.fill();
      x.fillStyle = "rgba(255,255,255,.18)"; x.beginPath(); x.moveTo(rx - rs*.4, ry - rs*.7); x.lineTo(rx + rs*.6, ry - rs*.6); x.lineTo(rx, ry - rs*.1); x.closePath(); x.fill();
    }
    // rocky ridge along the top
    x.fillStyle = th.cliff[2]; x.beginPath(); x.moveTo(170,0); x.lineTo(640,0); x.lineTo(600,60); x.lineTo(520,86); x.lineTo(400,100); x.lineTo(300,92); x.lineTo(220,60); x.closePath(); x.fill();
    x.fillStyle = th.cliff[1]; x.beginPath(); x.moveTo(190,0); x.lineTo(610,0); x.lineTo(570,48); x.lineTo(470,72); x.lineTo(360,80); x.lineTo(250,50); x.closePath(); x.fill();
    x.fillStyle = th.cliff[0];
    for(var s2=0;s2<9;s2++){ var sx = 230 + s2*42 + r()*12; x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx + 16, 0); x.lineTo(sx + 6 + r()*10, 40 + r()*30); x.closePath(); x.fill(); }
    // forest edges
    var trees = [];
    for(var tr=0;tr<70;tr++){
      var tx, ty, side = r();
      if(side < .38){ tx = r()*250; ty = 20 + r()*380; }
      else if(side < .7){ tx = 830 + r()*140; ty = 150 + r()*400; }
      else if(side < .85){ tx = 20 + r()*170; ty = 420 + r()*130; }
      else { tx = 640 + r()*220; ty = 10 + r()*90; }
      trees.push([tx, ty, .7 + r()*.6]);
    }
    trees.sort(function(a,b){ return a[1] - b[1]; }).forEach(function(tr2){ pine(x, tr2[0], tr2[1], tr2[2], th); });
    // soft light from top-left
    var lg = x.createLinearGradient(0,0,W,H); lg.addColorStop(0,"rgba(255,250,220,.14)"); lg.addColorStop(1,"rgba(0,0,0,.18)");
    x.fillStyle = lg; x.fillRect(0,0,W,H);
    return c;
  }

  var F = window.TTField = {
    W:W, H:H, REDUCED:REDUCED, t:0, dt:0, speed:1, paused:false,
    themeId:"easy", theme:THEMES.easy, ground:null, fx:[], texts:[], motes:[], clouds:[],
    shake:0, flash:0, flashColor:"255,215,120", THEMES:THEMES, roadPoint:roadPoint
  };

  F.setTheme = function(id){
    F.themeId = THEMES[id] ? id : "easy"; F.theme = THEMES[F.themeId]; F.ground = paintGround(F.theme);
  };
  F.shakeIt = function(a){ if(!REDUCED) F.shake = Math.max(F.shake, a); };
  F.flashIt = function(c, a){ F.flashColor = c; F.flash = a; };

  F.sparks = function(x, y, n){ for(var i=0;i<n;i++){ var a = Math.random()*Math.PI*2, sp = 60 + Math.random()*200; F.fx.push({ k:"spark", x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp - 50, life:.3 + Math.random()*.3, age:0 }); } };
  F.dust = function(x, y, n){ for(var i=0;i<n;i++){ F.fx.push({ k:"dust", x:x + (Math.random()-.5)*30, y:y, vx:(Math.random()-.5)*40, vy:-8 - Math.random()*16, r:5 + Math.random()*9, life:.8 + Math.random()*.5, age:0 }); } };
  F.poof = function(x, y){ for(var i=0;i<8;i++){ var a = i/8*Math.PI*2; F.fx.push({ k:"star", x:x, y:y, vx:Math.cos(a)*110, vy:Math.sin(a)*110, life:.6, age:0 }); } F.dust(x, y + 10, 5); };
  F.floatText = function(text, color, x, y){ F.texts.push({ text:text, color:color, x:x, y:y, age:0, life:1.4 }); };

  F.star = function(x, cx, cy, r, fill){
    x.fillStyle = fill; x.beginPath();
    for(var i=0;i<10;i++){ var rr = i%2 ? r*.45 : r, a = i/10*Math.PI*2 - Math.PI/2; x.lineTo(cx + Math.cos(a)*rr, cy + Math.sin(a)*rr); }
    x.closePath(); x.fill();
  };

  function drawFx(x){
    for(var i=F.fx.length-1;i>=0;i--){
      var f = F.fx[i]; f.age += F.dt; if(f.age > f.life){ F.fx.splice(i,1); continue; }
      var k = 1 - f.age/f.life; f.x += f.vx*F.dt; f.y += f.vy*F.dt;
      if(f.k === "spark"){ f.vy += 420*F.dt; x.strokeStyle = "rgba(255,226,130," + k + ")"; x.lineWidth = 2; x.beginPath(); x.moveTo(f.x, f.y); x.lineTo(f.x - f.vx*.03, f.y - f.vy*.03); x.stroke(); }
      else if(f.k === "dust"){ f.r += 16*F.dt; x.fillStyle = "rgba(225,205,160," + (k*.4) + ")"; x.beginPath(); x.arc(f.x, f.y, f.r, 0, Math.PI*2); x.fill(); }
      else { f.vx *= .92; f.vy *= .92; F.star(x, f.x, f.y, 6*k + 2, "rgba(255,236,140," + k + ")"); }
    }
    x.textAlign = "center";
    for(var j=F.texts.length-1;j>=0;j--){
      var tx = F.texts[j]; tx.age += F.dt; if(tx.age > tx.life){ F.texts.splice(j,1); continue; }
      var a = 1 - Math.max(0, (tx.age - .8)/.6), yy = tx.y - tx.age*36;
      x.font = "900 26px Cinzel, Georgia, serif"; x.lineWidth = 5; x.strokeStyle = "rgba(0,0,0," + a*.8 + ")"; x.strokeText(tx.text, tx.x, yy);
      x.globalAlpha = a; x.fillStyle = tx.color; x.fillText(tx.text, tx.x, yy); x.globalAlpha = 1;
    }
  }

  function drawAmbient(x){
    var th = F.theme;
    F.clouds.forEach(function(c){
      c.x += c.v*F.dt; if(c.x - 260 > W) c.x = -260;
      x.fillStyle = "rgba(20,30,10,.10)"; x.beginPath(); x.ellipse(c.x, c.y, 220, 90, -.3, 0, Math.PI*2); x.fill();
    });
    F.motes.forEach(function(m){
      if(th.motes === "ember"){ m.y -= m.v*F.dt; if(m.y < -10){ m.y = H + 10; m.x = Math.random()*W; } }
      else { m.x += m.v*F.dt*.7; m.y += Math.sin(F.t + m.p)*.3 + (th.motes === "leaf" ? m.v*.35*F.dt : 0); if(m.x > W + 10){ m.x = -10; } if(m.y > H) m.y = 0; }
      var tw = .4 + Math.sin(F.t*3 + m.p)*.3;
      x.fillStyle = "rgba(" + th.mote + "," + tw + ")";
      if(th.motes === "leaf"){ x.save(); x.translate(m.x, m.y); x.rotate(F.t*2 + m.p); x.fillRect(-3,-1.5,6,3); x.restore(); }
      else { x.beginPath(); x.arc(m.x, m.y, m.s, 0, Math.PI*2); x.fill(); }
    });
  }

  var canvas, ctx, last = 0;
  function resize(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2), rc = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rc.width*dpr)); canvas.height = Math.max(1, Math.round(rc.height*dpr));
  }
  function frame(now){
    var raw = Math.min(.05, (now - last)/1000 || 0); last = now;
    F.dt = F.paused ? 0 : raw * F.speed; F.t += F.dt;
    ctx.setTransform(canvas.width/W, 0, 0, canvas.height/H, 0, 0);
    ctx.save();
    if(F.shake > 0){ ctx.translate((Math.random()-.5)*F.shake, (Math.random()-.5)*F.shake); F.shake = Math.max(0, F.shake - 40*raw); }
    ctx.drawImage(F.ground, -8, -8, W + 16, H + 16);
    if(F.theme.embers){
      var eg = ctx.createRadialGradient(620, 160, 10, 620, 160, 260);
      eg.addColorStop(0, "rgba(255,110,40," + (.16 + Math.sin(F.t*2)*.05) + ")"); eg.addColorStop(1, "rgba(255,80,20,0)");
      ctx.fillStyle = eg; ctx.fillRect(0,0,W,H);
    }
    if(F.drawUnits) F.drawUnits(ctx);
    drawFx(ctx); drawAmbient(ctx);
    ctx.restore();
    var vg = ctx.createRadialGradient(W/2, H/2, H*.45, W/2, H/2, W*.7);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.35)"); ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
    if(F.flash > 0){ ctx.fillStyle = "rgba(" + F.flashColor + "," + F.flash + ")"; ctx.fillRect(0,0,W,H); F.flash = Math.max(0, F.flash - 1.3*raw); }
    requestAnimationFrame(frame);
  }

  F.init = function(el){
    canvas = el; ctx = canvas.getContext("2d");
    var r = rng(99);
    for(var i=0;i<(REDUCED?12:34);i++) F.motes.push({ x:r()*W, y:r()*H, v:10 + r()*26, p:r()*6, s:1 + r()*2 });
    for(var c=0;c<3;c++) F.clouds.push({ x:r()*W, y:80 + r()*380, v:6 + r()*6 });
    F.setTheme(F.themeId); resize();
    if(window.ResizeObserver) new ResizeObserver(resize).observe(canvas); else window.addEventListener("resize", resize);
    requestAnimationFrame(function(n){ last = n; frame(n); });
  };
})();
