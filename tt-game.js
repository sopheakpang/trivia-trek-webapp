/* Trivia Trek — campaign flow: hero roster, one question per hero, war map, results */
(function(){
  "use strict";
  var F = window.TTField, T = window.TTTroops, BANK = window.TT_BANK, HX = window.TT_HEROES;
  var $ = function(id){ return document.getElementById(id); };

  var CAMPAIGNS = [
    { id:"easy",   name:"Green Valley",   tag:"Easy",   heroes:6,  pts:10, time:24, stops:["Pine Ford","Mill Road","Stone Bridge","Hill Watch","Valley Keep"] },
    { id:"medium", name:"Autumn Pass",    tag:"Medium", heroes:8,  pts:15, time:20, stops:["Maple Camp","Red Leaf Gate","Canyon Road","Eagle Ridge","Pass Citadel"] },
    { id:"hard",   name:"Scorched Front", tag:"Hard",   heroes:10, pts:20, time:16, stops:["Ash Field","Cinder Bridge","Burnt Gate","Iron Ruins","Ember Throne"] }
  ];
  var BONUS = [0, 4, 7, 10];
  var STOPS = [ {x:9,y:76}, {x:29,y:48}, {x:50,y:70}, {x:71,y:42}, {x:90,y:26} ];
  var PORTRAITS = {};

  var st = { view:"start", camp:"easy", roster:[], results:[], round:[], idx:0, wins:0, losses:0, gold:0, streak:0, best:0, mvp:null,
    answered:false, timer:null, left:0, auto:false, advanceFrom:null, autoT:null };

  function camp(){ return CAMPAIGNS.filter(function(c){ return c.id === st.camp; })[0] || CAMPAIGNS[0]; }
  function tier(s){ return s >= 6 ? 3 : s >= 4 ? 2 : s >= 2 ? 1 : 0; }
  function need(){ return Math.ceil(st.roster.length / 2); }
  function store(k, v){ try{ if(v === undefined) return parseInt(localStorage.getItem(k) || "0", 10); localStorage.setItem(k, String(v)); }catch(e){ return 0; } }
  function shuffle(a){ a = a.slice(); for(var i=a.length-1;i>0;i--){ var j = Math.floor(Math.random()*(i+1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function pic(h){ return PORTRAITS[h.id] || (PORTRAITS[h.id] = HX.portrait(h)); }

  /* ---------- views + HUD ---------- */
  function show(v){
    st.view = v;
    ["start","map","battle","results"].forEach(function(n){ $("view-" + n).hidden = n !== v; });
    $("hud-stats").hidden = !(v === "battle" || v === "results");
    $("tac-timer-wrap").hidden = v !== "battle";
    snapshot();
  }
  function banner(kind, big, small){
    var b = $("banner"); b.className = "stage-banner " + kind;
    b.innerHTML = esc(big) + (small ? "<small>" + esc(small) + "</small>" : ""); void b.offsetWidth; b.classList.add("show");
  }
  function hud(){
    var n = st.roster.length, alive = n - st.losses;
    $("hud-heroes").textContent = alive + "/" + n; $("hud-streak").textContent = st.streak; $("hud-gold").textContent = st.gold;
    var atk = n ? 50 + (st.wins - st.losses) / n * 50 : 50;
    $("bar-atk").style.width = Math.max(4, Math.min(100, atk)) + "%"; $("bar-def").style.width = Math.max(4, Math.min(100, 100 - atk)) + "%";
    $("chip-rank").textContent = "Morale ×" + (1 + tier(st.streak));
  }
  function waveLabel(){
    var n = Math.max(1, st.roster.length), per = Math.ceil(n / 3);
    $("tac-wave").textContent = "Wave " + Math.min(3, Math.floor(st.idx / per) + 1) + "/3";
    $("tac-count").textContent = Math.min(st.idx + 1, n) + "/" + n;
  }
  function renderRoster(){
    var box = $("roster"); box.innerHTML = "";
    st.roster.forEach(function(h, i){
      var res = st.results[i], f = HX.FACTIONS[h.faction];
      var d = document.createElement("div");
      d.className = "hero-card r" + h.stars + (res === "won" ? " won" : res === "down" ? " down" : "") + (st.view === "battle" && i === st.idx && !res ? " active" : "");
      d.title = h.name + " — " + h.title;
      d.innerHTML = '<div class="pic"><img alt="" src="' + pic(h) + '"><span class="fac" style="background:' + f.color + '"><b>' + f.label + '</b></span>' +
        '<span class="stars">' + "★★★".slice(0, h.stars) + '</span></div><span class="nm">' + esc(h.name) + '</span>' +
        '<div class="bars"><i style="--v:' + (res === "down" ? 0 : 100) + '%"></i><i style="--v:' + (res === "won" ? 100 : 15) + '%;--c:#FF9A2A"></i></div>';
      box.appendChild(d);
    });
  }
  function applyTheme(){
    F.setTheme(st.camp); $("chip-theme").textContent = camp().name;
    st.roster = shuffle(HX.LIST).slice(0, camp().heroes); st.results = []; st.idx = 0; st.wins = st.losses = st.streak = 0;
    T.setup(st.roster, 3); renderRoster(); hud(); waveLabel();
  }

  /* ---------- start ---------- */
  function renderCampaigns(){
    var wrap = $("campaigns"); wrap.innerHTML = "";
    CAMPAIGNS.forEach(function(c){
      var prog = Math.min(5, store("tt-war-progress-" + c.id)), b = document.createElement("button");
      b.type = "button"; b.className = "campaign " + c.id; b.setAttribute("aria-pressed", String(c.id === st.camp));
      b.innerHTML = '<span class="seal">' + c.tag + '</span><span class="name">' + c.name + '</span>' +
        '<span class="meta">' + c.heroes + ' heroes · ' + c.heroes + ' questions · ' + prog + '/5 forts</span>';
      b.addEventListener("click", function(){ st.camp = c.id; applyTheme(); renderCampaigns(); snapshot(); });
      wrap.appendChild(b);
    });
  }
  $("btn-to-map").addEventListener("click", function(){ renderMap(null); show("map"); });

  /* ---------- war map ---------- */
  function fortSVG(color){
    return '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 36V16h5v4h4v-4h5v4h4v-4h5v4h4v-4h1v20Z" fill="#6E5846" stroke="#3A2A1A" stroke-width="1.5"/>' +
      '<path d="M17 36v-8a3 3 0 0 1 6 0v8Z" fill="#3A2A1A"/><path d="M20 16V3" stroke="#3A2A1A" stroke-width="1.5"/><path d="M20 3h11l-3 3.5 3 3.5H20Z" fill="' + color + '" stroke="#3A2A1A" stroke-width="1"/></svg>';
  }
  function renderMap(from){
    var c = camp(), prog = Math.min(5, store("tt-war-progress-" + c.id)), done = prog >= 5, pos = Math.min(prog, 4);
    $("map-title").textContent = c.name + " Campaign";
    $("map-eyebrow").textContent = "War Map · " + prog + " of 5 forts captured";
    $("map-sub").textContent = done ? "Every fort is yours. Fight again to defend " + c.stops[4] + "." : "Next battle: " + c.stops[pos] + " · " + c.heroes + " heroes ride out";
    $("btn-attack").textContent = done ? "Defend the Realm" : "Attack " + c.stops[pos];
    var d = "M" + STOPS.map(function(p){ return p.x + "," + (p.y * .4375).toFixed(2); }).join(" L");
    var html = '<svg class="terrain" viewBox="0 0 100 43.75" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0,30 C20,26 30,38 48,33 S78,20 100,24" stroke="#6E9CB8" stroke-width="2.2" fill="none" opacity=".55"/>' +
      '<g fill="#A88A5E" opacity=".7"><path d="M14,14 l5,-8 l5,8Z"/><path d="M20,15 l4,-6 l4,6Z"/><path d="M58,10 l6,-9 l6,9Z"/><path d="M80,40 l4,-6 l4,6Z"/></g>' +
      '<g fill="#6E8A4A" opacity=".65"><circle cx="40" cy="12" r="2"/><circle cx="43" cy="13" r="1.6"/><circle cx="62" cy="36" r="2"/><circle cx="6" cy="18" r="1.8"/></g>' +
      '<path class="route" d="' + d + '"/></svg>';
    STOPS.forEach(function(p, i){
      var cls = i < prog ? "done" : i === pos && !done ? "current" : "locked";
      html += '<div class="fort ' + cls + '" style="left:' + p.x + '%;top:' + p.y + '%">' + fortSVG(i < prog ? "#3B8BD4" : "#C23A2C") + '<span>' + esc(c.stops[i]) + '</span></div>';
    });
    var lead = st.roster[0];
    html += '<div class="army-token" id="army-token"><img alt="" src="' + (lead ? pic(lead) : "") + '" style="width:100%;height:100%;border-radius:50%;border:3px solid #F6CB5E;box-shadow:0 2px 4px rgba(0,0,0,.5)"></div>';
    $("warmap").innerHTML = html;
    var tok = $("army-token"), start = STOPS[from == null ? pos : Math.min(from, 4)];
    tok.style.left = start.x + "%"; tok.style.top = start.y + "%";
    if(from != null && from !== pos){ requestAnimationFrame(function(){ requestAnimationFrame(function(){ tok.style.left = STOPS[pos].x + "%"; tok.style.top = STOPS[pos].y + "%"; }); }); }
  }
  $("btn-map-back").addEventListener("click", function(){ renderCampaigns(); show("start"); });
  $("btn-attack").addEventListener("click", startWar);

  /* ---------- questions ---------- */
  function drawRound(id, count){
    var pool = BANK[id], key = "tt-seen-" + id, seen = [];
    try{ seen = JSON.parse(localStorage.getItem(key) || "[]"); }catch(e){ seen = []; }
    var fresh = pool.filter(function(q){ return seen.indexOf(q.q) === -1; });
    if(fresh.length < count){ seen = []; fresh = pool.slice(); }
    var picked = shuffle(fresh).slice(0, count);
    try{ localStorage.setItem(key, JSON.stringify(seen.concat(picked.map(function(q){ return q.q; })))); }catch(e){}
    return picked.map(function(q){ var o = shuffle([0,1,2,3]); return { c:q.c, q:q.q, fact:q.fact, a:o.map(function(i){ return q.a[i]; }), k:o.indexOf(q.k) }; });
  }

  /* ---------- battle ---------- */
  function startWar(){
    var c = camp();
    F.setTheme(c.id);
    st.roster = shuffle(HX.LIST).slice(0, c.heroes); st.results = []; st.round = drawRound(c.id, c.heroes);
    st.idx = 0; st.wins = 0; st.losses = 0; st.gold = 0; st.streak = 0; st.best = 0; st.mvp = null;
    T.setup(st.roster, st.roster.length);
    show("battle"); hud(); renderRoster(); SND.play("march");
    setTimeout(ask, 700);
  }
  function ask(){
    clearTimeout(st.autoT);
    var q = st.round[st.idx], h = st.roster[st.idx], c = camp();
    st.answered = false;
    $("q-eyebrow").textContent = h.name + " rides out · Question " + (st.idx + 1) + " of " + st.round.length + " · " + q.c;
    $("q-text").textContent = q.q;
    $("report").hidden = true; $("next-row").hidden = true;
    var box = $("answers"); box.innerHTML = "";
    q.a.forEach(function(txt, i){
      var b = document.createElement("button"); b.type = "button"; b.className = "answer";
      b.innerHTML = '<span class="rune">' + "ABCD"[i] + '</span><span>' + esc(txt) + '</span>';
      b.addEventListener("click", function(){ answer(i); });
      box.appendChild(b);
    });
    T.engage(st.idx); waveLabel(); renderRoster(); hud();
    banner("info", h.name, h.title + " charges!");
    SND.play("horn"); SND.play("hooves", .15); setTimeout(function(){ if(!st.answered && st.view === "battle") SND.startClash(); }, 900);
    st.left = c.time; tick(); clearInterval(st.timer); st.timer = setInterval(countdown, 1000);
  }
  function countdown(){
    if(F.paused) return;
    st.left--; tick(); if(st.left <= 5 && st.left > 0) SND.play("tick");
    if(st.left <= 0){ clearInterval(st.timer); if(!st.answered) answer(-1); }
  }
  function tick(){ var f = Math.max(0, st.left / camp().time); $("tac-timer").style.width = (f * 100) + "%"; T.pressure(f); }

  function answer(i){
    if(st.answered || F.paused) return; st.answered = true; clearInterval(st.timer);
    var q = st.round[st.idx], h = st.roster[st.idx], c = camp(), ok = i === q.k, rep = $("report");
    Array.prototype.forEach.call($("answers").children, function(b, idx){
      b.disabled = true; b.classList.add(idx === q.k ? "is-correct" : idx === i ? "is-wrong" : "is-dim");
    });
    if(ok){
      st.wins++; st.streak++; var t = tier(st.streak), gain = c.pts + BONUS[t]; st.gold += gain;
      if(st.streak > st.best){ st.best = st.streak; st.mvp = h.name; } if(!st.mvp) st.mvp = h.name;
      st.results[st.idx] = "won"; T.resolve(true);
      SND.stopClash(); SND.play("clang"); SND.play("victory", .1); SND.play("coin", .45);
      banner("victory", "Victory!", h.name + " breaks the squad · +" + gain + " gold");
      rep.className = "report good";
      rep.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" fill="#5DBB5A"/><path d="m8.5 12 2.5 2.5 4.5-5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>' +
        '<div><strong>' + esc(h.name) + ' wins the clash' + (t ? " — morale ×" + (1 + t) : "") + '</strong><p>' + esc(q.fact) + '</p></div>';
      if(st.streak === 2 || st.streak === 4 || st.streak === 6){ confetti(24); SND.play("levelup", .6); }
    } else {
      st.losses++; st.streak = 0; st.results[st.idx] = "down"; T.resolve(false);
      SND.stopClash(); SND.play("defeat");
      banner("defeat", i === -1 ? "Too Slow!" : "Defeated!", h.name + " has fallen");
      rep.className = "report bad";
      rep.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" fill="#C23A2C"/><path d="M9 9l6 6M15 9l-6 6" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>' +
        '<div><strong>' + esc(h.name) + (i === -1 ? " ran out of time and fell" : " was defeated") + '</strong><p>The right answer was <b>' + esc(q.a[q.k]) + '</b>. ' + esc(q.fact) + '</p></div>';
    }
    rep.hidden = false; hud(); renderRoster();
    var n = st.roster.length, lostAll = st.losses > n - need(), last = st.idx === n - 1;
    var nextHero = st.roster[st.idx + 1];
    $("btn-next").textContent = (lostAll || last) ? "See War Report" : "Next Hero: " + nextHero.name;
    $("next-row").hidden = false; $("btn-next").focus({ preventScroll:true });
    if(st.auto) st.autoT = setTimeout(next, 2600 / F.speed);
    snapshot();
  }
  function next(){
    clearTimeout(st.autoT);
    if(st.view !== "battle" || !st.answered) return;
    var n = st.roster.length;
    if(st.losses > n - need() || st.idx === n - 1){ finish(); } else { st.idx++; ask(); }
  }
  $("btn-next").addEventListener("click", next);

  /* ---------- battle controls ---------- */
  $("btn-pause").addEventListener("click", function(){
    F.paused = !F.paused; this.setAttribute("aria-pressed", String(F.paused)); $("pause-veil").hidden = !F.paused;
    if(F.paused) SND.stopClash(); else if(!st.answered && st.view === "battle") SND.startClash();
    $("view-battle").style.visibility = F.paused ? "hidden" : "";
  });
  $("btn-auto").addEventListener("click", function(){
    st.auto = !st.auto; this.setAttribute("aria-pressed", String(st.auto));
    if(st.auto && st.answered && st.view === "battle") st.autoT = setTimeout(next, 1200);
  });
  var SND = window.TTAudio;
  function syncSoundBtn(){
    var on = !SND.muted; $("btn-sound").setAttribute("aria-pressed", String(on));
    ["wave-a","wave-b"].forEach(function(id){ $(id).hidden = !on; }); $("mute-x").hidden = on;
  }
  $("btn-sound").addEventListener("click", function(){ SND.setMuted(!SND.muted); syncSoundBtn(); if(!SND.muted) SND.play("click"); });
  document.addEventListener("click", function(e){ if(e.target.closest(".btn, .campaign, .answer, .orb")) SND.play("click"); }, true);
  $("btn-speed").addEventListener("click", function(){
    F.speed = F.speed === 1 ? 2 : 1; this.setAttribute("aria-pressed", String(F.speed === 2)); $("speed-label").textContent = "×" + F.speed;
  });

  /* ---------- results ---------- */
  function finish(){
    clearInterval(st.timer); clearTimeout(st.autoT);
    var c = camp(), n = st.roster.length, standing = n - st.losses, win = st.wins >= need(), prog = Math.min(5, store("tt-war-progress-" + c.id));
    st.advanceFrom = Math.min(prog, 4);
    if(win && prog < 5) store("tt-war-progress-" + c.id, prog + 1);
    var captured = c.stops[Math.min(prog, 4)], medals = !win ? 0 : standing === n ? 3 : standing >= n * .75 ? 2 : 1;
    T.endBattle(win); SND.stopClash(); SND.play(win ? "fanfare" : "retreat", .2);
    banner(win ? "victory" : "defeat", win ? "Fort Captured!" : "Retreat!", win ? captured : "Too many heroes have fallen");
    show("results");
    $("res-eyebrow").textContent = "War report · " + c.name;
    $("res-title").textContent = win ? captured + " is ours!" : "The army falls back from " + captured;
    $("res-sub").textContent = win
      ? standing + " of " + n + " heroes are still standing. You needed " + need() + " to take the fort."
      : "Only " + st.wins + " hero" + (st.wins === 1 ? "" : "es") + " won their clash — you need " + need() + " of " + n + ". Regroup and try again.";
    var m = ""; for(var i=0;i<3;i++){ m += '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="14" r="7" fill="' + (i < medals ? "#F6CB5E" : "none") + '" stroke="' + (i < medals ? "#C8922A" : "#B79B6E") + '" stroke-width="2"/><path d="M8 2l4 6 4-6" stroke="' + (i < medals ? "#C23A2C" : "#B79B6E") + '" stroke-width="2.5" fill="none"/></svg>'; }
    $("res-medals").innerHTML = m;
    $("res-won").textContent = standing + "/" + n; $("res-gold").textContent = st.gold; $("res-streak").textContent = st.best; $("res-mvp").textContent = st.mvp || "—";
    if(win) confetti(70);
  }
  $("btn-res-retry").addEventListener("click", startWar);
  $("btn-res-map").addEventListener("click", function(){ applyTheme(); renderMap(st.advanceFrom); st.advanceFrom = null; show("map"); });

  /* ---------- confetti ---------- */
  var layer = document.createElement("div"); layer.className = "confetti-layer"; document.body.appendChild(layer);
  function confetti(n){
    if(F.REDUCED) return;
    var cols = ["#F6CB5E","#C23A2C","#3B8BD4","#FFF1C4"];
    for(var i=0;i<n;i++){
      var el = document.createElement("div"), sz = 5 + Math.random()*6, dur = 1100 + Math.random()*900;
      el.className = "confetto"; el.style.cssText = "left:" + (20 + Math.random()*60) + "vw;top:-10px;width:" + sz + "px;height:" + (sz*.5+3) + "px;background:" + cols[i%4];
      el.animate([{ transform:"translate(0,0) rotate(0)" }, { transform:"translate(" + ((Math.random()-.5)*200) + "px," + (300 + Math.random()*400) + "px) rotate(" + (Math.random()*720) + "deg)", opacity:0 }], { duration:dur, easing:"cubic-bezier(.2,.6,.3,1)" });
      layer.appendChild(el); setTimeout(el.remove.bind(el), dur);
    }
  }

  /* ---------- boot ---------- */
  function snapshot(){ try{ window.claude && window.claude.hot && window.claude.hot.snapshot && window.claude.hot.snapshot({ view: st.view === "map" ? "map" : "start", camp: st.camp }); }catch(e){} }
  function boot(data){
    if(data && data.camp && CAMPAIGNS.some(function(c){ return c.id === data.camp; })) st.camp = data.camp;
    F.init($("battlefield")); applyTheme(); renderCampaigns(); syncSoundBtn();
    if(data && data.view === "map"){ renderMap(null); show("map"); } else { show("start"); }
  }
  try{
    if(window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(boot);
    else boot(window.claude && window.claude.hot ? window.claude.hot.data : null);
  }catch(e){ boot(null); }
})();
