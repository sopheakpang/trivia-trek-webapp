/* Trivia Trek — original hero roster + painted portrait generator */
(function(){
  "use strict";
  var FACTIONS = {
    jade:  { label:"Jade",  color:"#3E9B4F", dark:"#1F5A2A" },
    ember: { label:"Ember", color:"#C4552B", dark:"#6E2A12" },
    azure: { label:"Azure", color:"#3565B8", dark:"#1A3566" }
  };

  // Original characters — names, looks and titles invented for Trivia Trek.
  var HEROES = [
    { id:"liang", name:"Liang Feng",  title:"Silver Spear",   faction:"jade",  stars:3, skin:"#F0C9A0", hair:"#1B1410", style:"topknot", beard:"none",  armor:"#2F7D46", cape:"#2E8B57", horse:"#EDEDE8", weapon:"spear" },
    { id:"tie",   name:"Elder Tie",   title:"Iron Veteran",   faction:"ember", stars:3, skin:"#E4B48C", hair:"#E9E4DA", style:"bald",    beard:"long",  armor:"#B8902F", cape:"#8A2F1C", horse:"#7A4A2A", weapon:"blade" },
    { id:"bao",   name:"Bao Shan",    title:"Mountain Fist",  faction:"azure", stars:2, skin:"#D9A276", hair:"#2A1E16", style:"band",    beard:"stubble", armor:"#3A4A66", cape:"#27406E", horse:"#3B2E28", weapon:"mace" },
    { id:"yue",   name:"Lady Yue",    title:"Moon Strategist",faction:"azure", stars:3, skin:"#F6D3B3", hair:"#1A1210", style:"crown",   beard:"none",  armor:"#6E4FA8", cape:"#7B3FC0", horse:"#F2F2EE", weapon:"fan" },
    { id:"mei",   name:"Mei Lin",     title:"Twin Blossom",   faction:"azure", stars:3, skin:"#F3CFAE", hair:"#15100E", style:"ribbon",  beard:"none",  armor:"#8FB4D8", cape:"#5C9AD6", horse:"#D8D8D2", weapon:"twin" },
    { id:"rong",  name:"Rong Jin",    title:"Hawk Rider",     faction:"jade",  stars:3, skin:"#E8BD93", hair:"#3A2618", style:"feather", beard:"none",  armor:"#8C6A3A", cape:"#4E7A3A", horse:"#9A5B34", weapon:"bow" },
    { id:"kang",  name:"Kang Wu",     title:"Red Halberd",    faction:"ember", stars:3, skin:"#DDA880", hair:"#1C1410", style:"helmet",  beard:"short", armor:"#9C2A22", cape:"#B32B22", horse:"#241C1A", weapon:"halberd" },
    { id:"su",    name:"Su Qing",     title:"Jade Blade",     faction:"jade",  stars:2, skin:"#F2CDAA", hair:"#231812", style:"long",    beard:"none",  armor:"#3E8E7A", cape:"#2A9D8F", horse:"#EFEFEA", weapon:"blade" },
    { id:"tian",  name:"Tian Hu",     title:"Tiger Axe",      faction:"ember", stars:2, skin:"#C99268", hair:"#2A1A10", style:"bald",    beard:"big",   armor:"#6B4A2A", cape:"#A0522D", horse:"#6A4028", weapon:"axe" },
    { id:"xiao",  name:"Xiao Ling",   title:"Swift Arrow",    faction:"azure", stars:2, skin:"#F1CBA6", hair:"#2B1D15", style:"hood",    beard:"none",  armor:"#4A6FA5", cape:"#3B5E9A", horse:"#9A9A94", weapon:"bow" },
    { id:"zhou",  name:"Zhou Ren",    title:"Winged Guard",   faction:"jade",  stars:3, skin:"#E2B289", hair:"#1A120C", style:"winged",  beard:"mustache", armor:"#A7B0B8", cape:"#3F7F4A", horse:"#C9B79A", weapon:"spear" },
    { id:"yan",   name:"Yan Hua",     title:"Scarlet Dancer", faction:"ember", stars:3, skin:"#F4D0B0", hair:"#1C0F0C", style:"bun",     beard:"none",  armor:"#C23A4E", cape:"#D63A3A", horse:"#F0EEE8", weapon:"twin" }
  ];

  function portrait(h){
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var x = c.getContext("2d"), f = FACTIONS[h.faction];
    var bg = x.createRadialGradient(64,50,6,64,64,96);
    if(h.stars >= 3){ bg.addColorStop(0,"#9A5AD0"); bg.addColorStop(1,"#2A0F45"); } else { bg.addColorStop(0,"#5A9AD8"); bg.addColorStop(1,"#10294A"); }
    x.fillStyle = bg; x.fillRect(0,0,128,128);
    x.globalAlpha = .12; x.fillStyle = "#fff";
    for(var r=0;r<6;r++){ x.beginPath(); x.moveTo(64,40); x.arc(64,40,120, r*1.05, r*1.05+.3); x.closePath(); x.fill(); }
    x.globalAlpha = 1;

    // long hair behind
    x.fillStyle = h.hair;
    if(h.style === "long" || h.style === "ribbon" || h.style === "crown"){ x.beginPath(); x.ellipse(64, 78, 34, 44, 0, 0, Math.PI*2); x.fill(); }
    // shoulders + armor
    x.fillStyle = h.armor; x.beginPath(); x.moveTo(8,128); x.quadraticCurveTo(14,94,44,90); x.lineTo(84,90); x.quadraticCurveTo(114,94,120,128); x.closePath(); x.fill();
    x.fillStyle = "rgba(0,0,0,.25)"; x.beginPath(); x.moveTo(64,92); x.lineTo(84,90); x.quadraticCurveTo(114,94,120,128); x.lineTo(64,128); x.closePath(); x.fill();
    x.strokeStyle = "#E7C46A"; x.lineWidth = 2.5; x.beginPath(); x.moveTo(20,108); x.quadraticCurveTo(64,98,108,108); x.stroke();
    x.fillStyle = f.color; x.beginPath(); x.moveTo(50,90); x.lineTo(64,112); x.lineTo(78,90); x.closePath(); x.fill();
    // neck + face
    x.fillStyle = h.skin; x.fillRect(55, 76, 18, 18);
    x.beginPath(); x.ellipse(64, 60, 21, 26, 0, 0, Math.PI*2); x.fill();
    x.fillStyle = "rgba(120,60,30,.16)"; x.beginPath(); x.ellipse(74, 64, 10, 22, 0, 0, Math.PI*2); x.fill();
    x.fillStyle = h.skin; x.beginPath(); x.ellipse(43, 62, 4, 7, 0, 0, Math.PI*2); x.ellipse(85, 62, 4, 7, 0, 0, Math.PI*2); x.fill();
    var fem = ["crown","ribbon","bun"].indexOf(h.style) > -1 || h.id === "su" || h.id === "xiao";
    // eyes + brows
    x.fillStyle = "#1A120E";
    [[55,58],[73,58]].forEach(function(p, i){
      x.beginPath(); x.ellipse(p[0], p[1], fem ? 4.2 : 3.6, fem ? 2.8 : 2.2, 0, 0, Math.PI*2); x.fill();
      x.fillStyle = "#fff"; x.beginPath(); x.arc(p[0]+1.2, p[1]-.8, .9, 0, Math.PI*2); x.fill(); x.fillStyle = "#1A120E";
      x.strokeStyle = h.style === "bald" && h.hair !== "#1C1410" ? h.hair : "#1A120E"; x.lineWidth = fem ? 1.4 : 2.6;
      x.beginPath(); if(i === 0){ x.moveTo(49, fem ? 52 : 53); x.lineTo(60, fem ? 51 : 54); } else { x.moveTo(68, fem ? 51 : 54); x.lineTo(79, fem ? 52 : 53); } x.stroke();
    });
    x.strokeStyle = "rgba(110,60,30,.55)"; x.lineWidth = 1.3; x.beginPath(); x.moveTo(64,60); x.lineTo(62,69); x.lineTo(65,70); x.stroke();
    x.strokeStyle = fem ? "#C2454A" : "#7A3B28"; x.lineWidth = fem ? 2.2 : 1.8; x.beginPath(); x.moveTo(59,76); x.quadraticCurveTo(64,78,69,76); x.stroke();
    // beards
    x.fillStyle = h.hair;
    if(h.beard === "long"){ x.beginPath(); x.moveTo(46,66); x.quadraticCurveTo(64,122,82,66); x.quadraticCurveTo(64,84,46,66); x.fill(); x.fillRect(54,72,20,3); }
    if(h.beard === "big"){ x.beginPath(); x.moveTo(44,62); x.quadraticCurveTo(64,108,84,62); x.quadraticCurveTo(64,80,44,62); x.fill(); }
    if(h.beard === "short"){ x.beginPath(); x.moveTo(52,74); x.quadraticCurveTo(64,94,76,74); x.quadraticCurveTo(64,82,52,74); x.fill(); }
    if(h.beard === "mustache"){ x.beginPath(); x.moveTo(54,74); x.quadraticCurveTo(64,68,74,74); x.quadraticCurveTo(64,72,54,74); x.fill(); x.fillRect(62,78,4,8); }
    if(h.beard === "stubble"){ x.fillStyle = "rgba(40,28,20,.28)"; x.beginPath(); x.ellipse(64,76,16,9,0,0,Math.PI); x.fill(); }
    // hair / headgear
    x.fillStyle = h.hair;
    var s = h.style;
    if(s !== "bald" && s !== "helmet" && s !== "hood" && s !== "winged"){ x.beginPath(); x.ellipse(64, 42, 23, 16, 0, Math.PI, 0); x.fill(); x.beginPath(); x.moveTo(41,44); x.quadraticCurveTo(52,34,64,44); x.quadraticCurveTo(76,34,87,44); x.lineTo(87,40); x.lineTo(41,40); x.fill(); }
    if(s === "topknot"){ x.beginPath(); x.arc(64,22,8,0,Math.PI*2); x.fill(); x.fillStyle = f.color; x.fillRect(41,42,46,5); x.fillStyle = "#E7C46A"; x.fillRect(60,16,8,4); }
    if(s === "band"){ x.fillStyle = "#2E5FA8"; x.fillRect(40,40,48,7); x.fillStyle = "#E7C46A"; x.beginPath(); x.arc(64,43,4,0,Math.PI*2); x.fill(); }
    if(s === "bald"){ x.fillStyle = h.skin; x.beginPath(); x.ellipse(64,42,21,15,0,Math.PI,0); x.fill(); x.fillStyle = h.hair; x.beginPath(); x.ellipse(64,24,6,5,0,0,Math.PI*2); x.fill(); x.fillStyle = "#E7C46A"; x.fillRect(58,26,12,3); }
    if(s === "crown"){ x.fillStyle = "#E7C46A"; x.beginPath(); x.moveTo(44,34); x.lineTo(50,18); x.lineTo(57,30); x.lineTo(64,12); x.lineTo(71,30); x.lineTo(78,18); x.lineTo(84,34); x.closePath(); x.fill();
      x.fillStyle = "#3FB07A"; x.beginPath(); x.arc(64,26,3.5,0,Math.PI*2); x.fill(); x.fillStyle = "#E7C46A"; x.fillRect(84,40,3,26); x.beginPath(); x.arc(85.5,68,3,0,Math.PI*2); x.fill(); }
    if(s === "ribbon"){ x.fillStyle = "#F4F1EA"; x.beginPath(); x.moveTo(78,28); x.lineTo(96,18); x.lineTo(92,36); x.closePath(); x.fill(); x.beginPath(); x.moveTo(78,30); x.lineTo(98,40); x.lineTo(84,44); x.closePath(); x.fill(); }
    if(s === "bun"){ x.beginPath(); x.arc(64,24,11,0,Math.PI*2); x.fill(); x.strokeStyle = "#E7C46A"; x.lineWidth = 2; x.beginPath(); x.moveTo(50,16); x.lineTo(80,30); x.stroke(); x.fillStyle = "#D63A3A"; x.beginPath(); x.arc(80,30,3,0,Math.PI*2); x.fill(); }
    if(s === "long"){ x.fillStyle = "#3FB07A"; x.fillRect(56,26,16,5); }
    if(s === "feather"){ x.fillStyle = "#F2EEE4"; [[-16,-30],[-4,-38],[8,-34]].forEach(function(p){ x.beginPath(); x.ellipse(64+p[0], 44+p[1]/1.3, 4, 16, p[0]/30, 0, Math.PI*2); x.fill(); });
      x.fillStyle = "#B8902F"; x.fillRect(41,38,46,6); x.fillStyle = "#3FB07A"; x.beginPath(); x.arc(64,41,3,0,Math.PI*2); x.fill(); }
    if(s === "helmet" || s === "winged"){ x.fillStyle = s === "helmet" ? "#8C1F1A" : "#9AA4AC"; x.beginPath(); x.ellipse(64,44,26,20,0,Math.PI,0); x.fill(); x.fillRect(38,42,52,6);
      x.fillStyle = "#E7C46A"; x.fillRect(38,44,52,3);
      if(s === "helmet"){ x.fillStyle = "#D63A3A"; x.beginPath(); x.moveTo(64,24); x.quadraticCurveTo(50,4,34,12); x.quadraticCurveTo(52,14,62,28); x.fill(); }
      else { x.fillStyle = "#E8E4DA"; x.beginPath(); x.moveTo(40,34); x.quadraticCurveTo(22,20,26,6); x.quadraticCurveTo(38,20,46,30); x.fill(); x.beginPath(); x.moveTo(88,34); x.quadraticCurveTo(106,20,102,6); x.quadraticCurveTo(90,20,82,30); x.fill(); } }
    if(s === "hood"){ x.fillStyle = h.cape; x.beginPath(); x.moveTo(36,70); x.quadraticCurveTo(34,24,64,20); x.quadraticCurveTo(94,24,92,70); x.quadraticCurveTo(86,40,64,38); x.quadraticCurveTo(42,40,36,70); x.fill(); }
    return c.toDataURL("image/png");
  }

  window.TT_HEROES = { FACTIONS:FACTIONS, LIST:HEROES, portrait:portrait };
})();
