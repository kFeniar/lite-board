/* The Kokumi — participant board */
(function(){
"use strict";
var C = window.THKO, B = window.BLOCKS;

/* ---- saved-state key, fingerprinted to the question set -----------------
   A saved answer is only meaningful against the question set it was given
   for. When the questions change, the old card ids no longer match and the
   restored answers submit as blanks. So the key carries a fingerprint of
   every block and card id: change one question and every old save is simply
   ignored instead of silently half-restored. Nothing to remember to bump. */
var FP = (function(){
  var s = "", i, j;
  for (i=0;i<B.length;i++){ s += B[i].id + ":";
    for (j=0;j<B[i].cards.length;j++) s += B[i].cards[j].id + ","; s += "|"; }
  var h = 5381;
  for (i=0;i<s.length;i++){ h = ((h*33) ^ s.charCodeAt(i)) >>> 0; }
  return h.toString(36);
})();
var PREFIX = "thko_" + C.session;
var KEY    = PREFIX + "_" + FP;

var S = { name:"", role:"", i:0, j:-1, a:{}, sent:{} };
try { var raw = localStorage.getItem(KEY); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch(e){}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }

/* ---- rescue, then retire, saves from an older question set --------------
   Old ANSWERS are dropped (their ids are meaningless now), but anything
   still sitting unsent in an old outbox is a real submission someone made
   and is carried over so it still reaches the sheet. Name and role are
   kept too, so a returning participant does not retype them.             */
(function(){
  var stale = [], k, i;
  try {
    for (i=0;i<localStorage.length;i++){
      k = localStorage.key(i);
      if (k && k.indexOf(PREFIX) === 0 && k !== KEY && k !== KEY + "_outbox") stale.push(k);
    }
  } catch(e){ return; }
  if (!stale.length) return;
  var carry = [];
  stale.forEach(function(k){
    try {
      var v = JSON.parse(localStorage.getItem(k) || "null");
      if (/_outbox$/.test(k)) { if (Array.isArray(v)) carry = carry.concat(v); }
      else if (v && typeof v === "object") {
        if (!S.name && v.name) S.name = v.name;
        if (!S.role && v.role) S.role = v.role;
      }
    } catch(e){}
    try { localStorage.removeItem(k); } catch(e){}
  });
  if (carry.length) {
    try {
      var cur = JSON.parse(localStorage.getItem(KEY + "_outbox") || "[]");
      localStorage.setItem(KEY + "_outbox", JSON.stringify(cur.concat(carry)));
    } catch(e){}
  }
  if (S.name || S.role) save();
})();


/* ---------- layout, shipped with the logic ----------
   Injected here, not in thko.css, so the new screens can never be
   served with an old stylesheet. ------------------------------------ */
(function(){
  var s = document.createElement("style");
  s.id = "thko-screen";
  s.textContent = "\n/* ---- injected by app.js so the layout can never fall out of sync ---- */\n.prog{height:3px;background:#E9E0D2}\n.prog i{display:block;height:3px;background:#C07A32;transition:width .25s ease}\n.wrap.screen{min-height:calc(100vh - 58px);display:flex;flex-direction:column;\n padding-top:40px;padding-bottom:26px;box-sizing:border-box}\n.scr-in{flex:1;display:flex;flex-direction:column;justify-content:center;\n max-width:34rem;margin:0 auto;width:100%;padding-bottom:26px}\n.scr-in h2{margin-top:14px}\n.qh{font-size:clamp(22px,3.4vw,30px);line-height:1.24;letter-spacing:-.018em;margin:14px 0 0;font-weight:700}\n.scr-in .note{margin-top:12px}\n.scr-in .cbody{margin-top:26px}\n.readonly{opacity:.7}\n.nav{display:flex;align-items:center;gap:12px;max-width:34rem;margin:0 auto;width:100%;\n border-top:1px solid #E9E0D2;padding-top:18px}\n.nav #next{margin-left:auto}\n.nav button:disabled{opacity:.3;cursor:not-allowed}\n.skip{font-family:\"IBM Plex Mono\",monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;\n color:#9A8B76;cursor:pointer;user-select:none}\n.skip:hover{color:#C07A32}\n.jump{color:#C07A32;text-decoration:none;border-bottom:1px solid currentColor}\n.sqs{display:flex;gap:7px;margin:16px 0 10px}\n.sq{flex:1 1 0;min-width:0;aspect-ratio:1/1;max-height:54px;border:1px solid #D9CFBC;\n background:none;border-radius:8px;font-family:\"IBM Plex Mono\",monospace;font-size:13px;\n color:#6B4526;padding:0;cursor:pointer;transition:border-color .12s,background .12s}\n.sq:hover{border-color:#C07A32;color:#C07A32}\n.sq.on{background:#16120E;border-color:#16120E;color:#FFFBF8}\n.sl-ends{display:flex;justify-content:space-between;gap:14px;\n font-family:\"IBM Plex Mono\",monospace;font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#6B4526}\n.slv{font-family:\"IBM Plex Mono\",monospace;font-size:10px;letter-spacing:.11em;text-transform:uppercase;\n color:#9A8B76;text-align:center}\n@media(max-width:620px){\n .wrap.screen{min-height:calc(100svh - 58px);padding-top:24px}\n .nav{position:sticky;bottom:0;background:#FFFBF8;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}\n .sqs{gap:5px} .sq{font-size:11px;border-radius:6px}\n}\n";
  document.head.appendChild(s);
  var s2 = document.createElement("style");
  s2.id = "thko-read";
  s2.textContent = "\n/* ---- read-only screens (injected with the logic, same reason) ---- */\n.wrap.isread .scr-in{justify-content:flex-start;max-width:48rem}\n.wrap.isread .qh{font-size:clamp(24px,3.8vw,34px)}\n.pub{margin:22px 0 0;font-size:15px;line-height:1.55;color:#4A3C2C;max-width:38rem}\n.rule{margin:22px 0 0;padding-left:14px;border-left:2px solid #C07A32;\n font-size:14px;line-height:1.5;color:#6B4526}\n\n.story{margin:4px 0 0;font-size:clamp(17px,2.3vw,21px);line-height:1.62;color:#2A2118;max-width:36rem}\n.bigline{margin:4px 0 0;font-size:clamp(20px,3.2vw,28px);line-height:1.4;letter-spacing:-.01em;color:#16120E;max-width:34rem}\n.shot{margin:0}\n.shot img{display:block;width:100%;height:auto;border-radius:10px}\n\n.words3{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px 14px;margin:6px 0 0}\n.words3 span{font-size:clamp(22px,4.4vw,40px);line-height:1.15;letter-spacing:-.02em;font-weight:700;\n color:#16120E;background:linear-gradient(transparent 62%,#F0D9B6 62%);padding:0 2px}\n.words3 i{font-style:normal;color:#9A8B76;font-size:clamp(16px,2.4vw,24px)}\n\n.cols3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;margin:6px 0 0}\n.col3{min-width:0}\n.c3h{font-size:17px;font-weight:700;letter-spacing:-.01em;color:#16120E}\n.c3s{font-family:\"IBM Plex Mono\",monospace;font-size:10px;letter-spacing:.13em;text-transform:uppercase;\n color:#9A8B76;margin-top:3px;padding-bottom:9px;border-bottom:1px solid #E9E0D2}\n.c3l{list-style:none;margin:11px 0 0;padding:0}\n.c3l li{font-size:13.5px;line-height:1.45;color:#4A3C2C;padding:5px 0;border-bottom:1px solid #F2EBDF}\n\n.archl{margin:6px 0 0}\n.archr{display:grid;grid-template-columns:13rem minmax(0,1fr);gap:16px;\n padding:13px 0;border-bottom:1px solid #EFE7DA;align-items:baseline}\n.archr dt{font-family:\"IBM Plex Mono\",monospace;font-size:10px;letter-spacing:.13em;\n text-transform:uppercase;color:#6B4526;margin:0}\n.archr dd{margin:0;font-size:14.5px;line-height:1.5;color:#2A2118}\n.archr.open dd{color:#9A8B76;font-style:italic}\n.tag{display:inline-block;margin-left:8px;padding:1px 6px;border:1px solid #C07A32;border-radius:3px;\n font-size:8px;letter-spacing:.1em;color:#C07A32;font-style:normal;vertical-align:1px}\n\n.arcg{display:grid;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:16px;margin:20px 0 0}\n.arci{border:1px solid #E9E0D2;border-radius:10px;padding:16px;min-width:0}\n.arcs{width:30px;height:30px;color:#C07A32;display:block}\n.arct{margin-top:11px;font-size:16px;font-weight:700;color:#16120E}\n.arck{font-family:\"IBM Plex Mono\",monospace;font-size:9.5px;letter-spacing:.11em;\n text-transform:uppercase;color:#9A8B76;margin-top:3px}\n.arcd{font-size:13px;line-height:1.45;color:#4A3C2C;margin-top:9px}\n.arcq{font-size:12.5px;line-height:1.4;color:#6B4526;font-style:italic;margin-top:9px}\n.arcb{font-size:11px;line-height:1.4;color:#9A8B76;margin-top:9px;\n padding-top:9px;border-top:1px solid #F2EBDF}\n\n.lgl{display:grid;gap:18px;margin:20px 0 0}\n.lgi{border:1px solid #E9E0D2;border-radius:10px;padding:18px;min-width:0}\n.lgart{margin-bottom:12px}\n.lgart svg{max-width:100%;height:auto;display:block}\n.lgt{font-size:17px;font-weight:700;color:#16120E}\n.lgd{font-size:13.5px;line-height:1.5;color:#4A3C2C;margin-top:6px}\n.lgw{font-size:12.5px;line-height:1.5;color:#4A3C2C;margin-top:8px}\n.lgw b{font-family:\"IBM Plex Mono\",monospace;font-size:9.5px;letter-spacing:.11em;\n text-transform:uppercase;color:#9A8B76;font-weight:400;margin-right:6px}\n.lgx{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px;padding-top:12px;border-top:1px solid #F2EBDF}\n.lgx a{font-size:11.5px;color:#6B4526;text-decoration:none;\n border:1px solid #E9E0D2;border-radius:20px;padding:3px 10px}\n.lgx a:hover{border-color:#C07A32;color:#C07A32}\n\n.cml{display:grid;gap:14px;margin:20px 0 0}\n.cmi{display:grid;grid-template-columns:34px minmax(0,1fr);gap:14px;\n padding-bottom:14px;border-bottom:1px solid #EFE7DA}\n.cmsw{width:34px;height:34px;border-radius:7px;border:1px solid rgba(0,0,0,.08)}\n.cmb{min-width:0}\n.cmn{font-size:15px;font-weight:700;color:#16120E;display:flex;flex-wrap:wrap;align-items:baseline;gap:8px}\n.cmc,.cmp{font-family:\"IBM Plex Mono\",monospace;font-size:10px;letter-spacing:.08em;\n color:#9A8B76;font-weight:400}\n.cmm{font-size:13.5px;line-height:1.45;color:#2A2118;margin-top:5px}\n.cms{font-size:12.5px;line-height:1.45;color:#6B4526;margin-top:5px}\n.cms b{font-family:\"IBM Plex Mono\",monospace;font-size:9.5px;letter-spacing:.11em;\n text-transform:uppercase;color:#9A8B76;font-weight:400;margin-right:6px}\n\n.csl{display:grid;gap:20px;margin:20px 0 0}\n.csi{border:1px solid #E9E0D2;border-radius:10px;padding:18px;min-width:0}\n.csart{margin-bottom:13px}\n.csart svg{max-width:100%;height:auto;display:block}\n.csh{display:flex;flex-wrap:wrap;align-items:center;gap:9px}\n.cssw{width:15px;height:15px;border-radius:4px;border:1px solid rgba(0,0,0,.08);flex:none}\n.csh a{font-size:16px;font-weight:700;color:#16120E;text-decoration:none;\n border-bottom:1px solid #D9CFBC}\n.csh a:hover{color:#C07A32;border-color:#C07A32}\n.cscat{font-family:\"IBM Plex Mono\",monospace;font-size:9.5px;letter-spacing:.11em;\n text-transform:uppercase;color:#9A8B76}\n.csn{font-size:13px;color:#6B4526;font-style:italic;margin-top:5px}\n.csw,.cslite{margin-top:11px;padding-top:11px;border-top:1px solid #F2EBDF}\n.cslite{border-top:1px solid #E9D9C2}\n.cswq{font-size:13px;font-weight:700;color:#16120E;line-height:1.4}\n.cswa{font-size:13px;line-height:1.5;color:#4A3C2C;margin-top:4px}\n.cslite .cswq{color:#C07A32}\n\n@media(max-width:760px){\n  .wrap.isread .scr-in{max-width:none}\n  .cols3{grid-template-columns:1fr;gap:18px}\n  .archr{grid-template-columns:1fr;gap:4px}\n  .arcg{grid-template-columns:1fr}\n  .cmi{grid-template-columns:26px minmax(0,1fr);gap:11px}\n  .cmsw{width:26px;height:26px}\n}\n\n/* the two halves of the top bar collide once a role is more than a word;\n   let each ellipsis instead of overlapping */\n.bar-in{display:flex;align-items:center;gap:12px;min-width:0}\n.bar-in .who{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.bar-in .who:first-child{flex:1 1 auto}\n.bar-in .who:last-child{flex:0 1 auto;text-align:right}\n@media(max-width:430px){ .bar-in .who:last-child{max-width:46%} }\n";
  document.head.appendChild(s2);
})();

var $ = function(s){ return document.querySelector(s); };
function esc(t){ return String(t==null?"":t).replace(/[&<>"]/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

/* ---------- built-in plates ---------- */
var PLATES = [
'<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Layered bands"><rect width="640" height="360" fill="#16120E"/><g>'+
 [0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(function(i){var y=i*26+4,h=2+i*1.6,o=(0.14+i*0.062).toFixed(3);
  return '<rect x="0" y="'+y+'" width="640" height="'+h.toFixed(1)+'" fill="#D9CFBC" opacity="'+o+'"/>';}).join('')+
 '</g><rect x="0" y="300" width="640" height="60" fill="#6B4526" opacity="0.55"/><rect x="0" y="336" width="640" height="24" fill="#D08A45" opacity="0.85"/></svg>',

'<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Light and edge"><defs><radialGradient id="g1" cx="27%" cy="38%" r="72%"><stop offset="0%" stop-color="#FFFBF8"/><stop offset="42%" stop-color="#D9CFBC"/><stop offset="100%" stop-color="#6B4526"/></radialGradient></defs><rect width="640" height="360" fill="url(#g1)"/><path d="M0 360 L390 0 L640 0 L640 360 Z" fill="#16120E" opacity="0.9"/><path d="M390 0 L0 360" stroke="#D08A45" stroke-width="1.5" fill="none"/><circle cx="173" cy="137" r="44" fill="none" stroke="#6B4526" stroke-width="1" opacity="0.5"/></svg>',

'<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Field of marks"><rect width="640" height="360" fill="#FFFBF8"/><g fill="#6B4526">'+
 (function(){var o='',c,r;for(r=0;r<9;r++){for(c=0;c<17;c++){var x=22+c*37,y=22+r*39,
  s=Math.max(.6,(c/16)*(c/16)*9.4+0.6),op=(0.2+(r/8)*0.62).toFixed(2);
  o+='<circle cx="'+x+'" cy="'+y+'" r="'+s.toFixed(2)+'" opacity="'+op+'"/>';}}return o;})()+
 '</g><rect x="0" y="176" width="640" height="1" fill="#D08A45"/></svg>'
];
function plate(i){
  if (C.images && C.images.length) {
    var u = C.images[i % C.images.length];
    return '<img src="'+esc(u)+'" alt="">';
  }
  return PLATES[i % PLATES.length];
}

/* ---------- network ---------- */
/* ---- ids -------------------------------------------------------------
   One batchId per block submission. If the phone retries after a timeout,
   the server sees the same id and refuses to write the block twice.      */
function uid(){
  return (Date.now().toString(36) + "-" +
          Math.random().toString(36).slice(2,8) + "-" +
          Math.random().toString(36).slice(2,8));
}

/* ---- one attempt ---- */
function post(payload){
  var ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
  var timer = ctrl ? setTimeout(function(){ ctrl.abort(); }, 25000) : null;
  return fetch(C.endpoint, {
    method:"POST",
    headers:{ "Content-Type":"text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    redirect:"follow",
    signal: ctrl ? ctrl.signal : undefined
  }).then(function(r){ return r.text(); }).then(function(t){
    if (timer) clearTimeout(timer);
    var j; try { j = JSON.parse(t); } catch(e){ throw new Error("bad response"); }
    if (!j.ok) { var err = new Error(j.error || "write failed"); err.retry = !!j.retry; throw err; }
    return j;
  }, function(e){ if (timer) clearTimeout(timer); throw e; });
}

/* ---- send with backoff -------------------------------------------------
   Eight people tapping Submit in the same second is the normal case, not
   the edge case. The server queues them; this queues the retries.
   Waits ~0.8s, 2s, 4.5s, 9s — spread by a random jitter so the eight
   retries do not land together a second time.                            */
function sendOnce(payload, attempt){
  attempt = attempt || 0;
  return post(payload).catch(function(err){
    var transient = err.retry || err.name === "AbortError" ||
                    /network|fetch|bad response|busy/i.test(String(err.message||err));
    if (!transient || attempt >= 3) throw err;
    var wait = [800, 2000, 4500][attempt] + Math.floor(Math.random()*900);
    status("The board is busy — retrying in " + Math.round(wait/1000) + "s…");
    return new Promise(function(res){ setTimeout(res, wait); })
      .then(function(){ return sendOnce(payload, attempt+1); });
  });
}

/* ---- outbox ------------------------------------------------------------
   Every payload is written to localStorage BEFORE the first attempt and
   removed only once the server confirms. If the tab is closed, the phone
   sleeps, or the wifi drops, the block is still here on reload.          */
var OUTBOX = KEY + "_outbox";
function outbox(){ try { return JSON.parse(localStorage.getItem(OUTBOX) || "[]"); } catch(e){ return []; } }
function outboxSet(v){ try { localStorage.setItem(OUTBOX, JSON.stringify(v)); } catch(e){} }
function outboxAdd(p){ var q = outbox(); q.push(p); outboxSet(q); }
function outboxDrop(id){ outboxSet(outbox().filter(function(p){ return p.batchId !== id; })); }

function send(rows){
  var payload = {
    batchId: uid(),
    session: C.session,
    name: S.name,
    role: S.role,
    rows: rows
  };
  outboxAdd(payload);
  return sendOnce(payload).then(function(j){
    outboxDrop(payload.batchId);
    return j;
  });
}

/* flush anything left over from a previous visit */
function flushOutbox(){
  var q = outbox();
  if (!q.length) return;
  status(q.length + " unsent " + (q.length===1?"block":"blocks") + " found — sending…");
  (function next(i){
    if (i >= q.length) { status("Caught up."); return; }
    sendOnce(q[i]).then(function(){ outboxDrop(q[i].batchId); })
      .catch(function(){})
      .then(function(){ next(i+1); });
  })(0);
}
window.addEventListener("online", flushOutbox);
var statT;
function status(msg, warn){
  var el = $("#stat");
  el.textContent = msg; el.className = "stat" + (warn ? " warn" : ""); el.hidden = false;
  clearTimeout(statT); statT = setTimeout(function(){ el.hidden = true; }, warn ? 9000 : 2600);
}

/* ---------- gate ---------- */
function gate(){
  $("#app").innerHTML =
  '<div class="mid"><div class="mid-in">'+
    '<p class="eyebrow">The Kokumi · '+esc(C.client)+'</p>'+
    '<h1>'+esc(C.title)+'</h1>'+
    '<p class="lede">'+B.length+' sections · '+B.reduce(function(s,b){return s+qCount(b);},0)+' questions · '+B.reduce(function(s,b){return s+(b.cards.length-qCount(b));},0)+' pages to read. You answer on your own — nobody sees your answers until we reveal them together.</p>'+
    '<hr style="margin:34px 0 26px">'+
    '<label class="mono" style="display:block;margin-bottom:9px">Your name</label>'+
    '<input type="text" id="gn" autocomplete="name" value="'+esc(S.name)+'">'+
    '<label class="mono" style="display:block;margin:20px 0 9px">Your role</label>'+
    '<input type="text" id="gr" autocomplete="organization-title" '+
      'placeholder="'+esc(C.rolePlaceholder || "How you would say it in a meeting")+'" '+
      'value="'+esc(S.role)+'">'+
    '<div class="row" style="margin-top:22px"><button id="go" disabled>Begin</button></div>'+
  '</div></div>';

  var n=$("#gn"), r=$("#gr"), go=$("#go");
  function chk(){ go.disabled = !(n.value.trim() && r.value.trim()); }
  n.addEventListener("input", function(){ S.name=n.value.trim(); save(); chk(); });
  r.addEventListener("input", function(){ S.role=r.value.trim(); save(); chk(); });
  n.addEventListener("keydown", function(e){ if(e.key==="Enter"){ e.preventDefault(); r.focus(); } });
  r.addEventListener("keydown", function(e){ if(e.key==="Enter" && !go.disabled){ e.preventDefault(); go.click(); } });
  chk();
  go.addEventListener("click", function(){ S.i = firstUnsent(); S.j = -1; save(); render(); });
}
/* First visit starts at the beginning, so nobody skips the reading.
   A returning phone jumps to the first block it has not submitted. */
function firstUnsent(){
  var k, resumed = false;
  for (k=0;k<B.length;k++) if (qCount(B[k])>0 && S.sent[B[k].id]) resumed = true;
  if (!resumed) return 0;
  for (k=0;k<B.length;k++) if (qCount(B[k])>0 && !S.sent[B[k].id]) return k;
  return B.length;
}

/* ---------- cards ---------- */

/* A read card carries no input. It is the teaching material from the guide,
   client-facing text only — the host's own notes never ship to the board. */
function isQ(c){ return c.type !== "read"; }
function pubLine(t){ return t ? '<p class="pub">'+esc(t)+'</p>' : ''; }

function readView(c){
  var d = c.data || {}, v = c.view;

  if (v === "story") return '<p class="story">'+esc(d.text||"")+'</p>';
  if (v === "line")  return '<p class="bigline">'+esc(d.text||"")+'</p>';
  if (v === "image") return '<figure class="shot"><img src="'+d.src+'" alt=""></figure>';

  if (v === "words")
    return '<div class="words3">'+ d.words.map(function(w){ return '<span>'+esc(w)+'</span>'; })
             .join('<i>·</i>') +'</div>'+ pubLine(d.pub);

  if (v === "cols")
    return '<div class="cols3">'+ d.head.map(function(h,i){
      return '<div class="col3"><div class="c3h">'+esc(h[0])+'</div>'+
        '<div class="c3s">'+esc(h[1])+'</div>'+
        '<ul class="c3l">'+ d.body[i].map(function(t){ return '<li>'+esc(t)+'</li>'; }).join('') +'</ul></div>';
    }).join('') +'</div>'+ pubLine(d.pub);

  if (v === "arch")
    return '<dl class="archl">'+ d.rows.map(function(r){
      return '<div class="archr'+(r[2]==="open"?" open":"")+'">'+
        '<dt>'+esc(r[0])+(r[2]==="open"?'<span class="tag">open</span>':'')+'</dt>'+
        '<dd>'+r[1]+'</dd></div>';
    }).join('') +'</dl>';

  if (v === "archetypes")
    return (d.intro?'<p class="note">'+esc(d.intro)+'</p>':'')+
      '<div class="arcg">'+ d.items.map(function(a){
        return '<div class="arci">'+
          '<svg viewBox="0 0 48 48" class="arcs" fill="none" stroke="currentColor" '+
            'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+a[5]+'</svg>'+
          '<div class="arct">'+esc(a[0])+'</div>'+
          '<div class="arck">'+esc(a[1])+'</div>'+
          '<div class="arcd">'+esc(a[2])+'</div>'+
          '<div class="arcq">&ldquo;'+esc(a[3])+'&rdquo;</div>'+
          '<div class="arcb">'+esc(a[4])+'</div></div>';
      }).join('') +'</div>'+
      (d.rule?'<p class="rule">'+esc(d.rule)+'</p>':'');

  if (v === "logotypes")
    return '<div class="lgl">'+ d.items.map(function(t){
      return '<div class="lgi"><div class="lgart">'+t[5]+'</div>'+
        '<div class="lgt">'+esc(t[0])+'</div>'+
        '<div class="lgd">'+esc(t[1])+'</div>'+
        '<div class="lgw"><b>Use when</b> '+esc(t[2])+'</div>'+
        '<div class="lgw"><b>Avoid when</b> '+esc(t[3])+'</div>'+
        '<div class="lgx">'+ (t[6]||[]).map(function(e){
          return '<a href="'+e[1]+'" target="_blank" rel="noopener">'+esc(e[0])+'</a>';
        }).join('') +'</div></div>';
    }).join('') +'</div>';

  if (v === "colormap")
    return '<div class="cml">'+ d.items.map(function(k){
      return '<div class="cmi"><span class="cmsw" style="background:'+k[1]+'"></span>'+
        '<div class="cmb"><div class="cmn">'+esc(k[0])+'<span class="cmc">'+esc(k[1])+
          '</span><span class="cmp">'+esc(k[3])+' of the board</span></div>'+
        '<div class="cmm">'+esc(k[4])+'</div>'+
        '<div class="cms">'+esc(k[5])+'</div>'+
        '<div class="cms"><b>Who owns it</b> '+esc(k[6])+'</div>'+
        '<div class="cms"><b>Risk</b> '+esc(k[7])+'</div></div></div>';
    }).join('') +'</div>';

  if (v === "cases")
    return '<div class="csl">'+ d.items.map(function(x){
      return '<div class="csi"><div class="csart">'+x[7]+'</div>'+
        '<div class="csh"><span class="cssw" style="background:'+x[1]+'"></span>'+
          '<a href="'+x[8]+'" target="_blank" rel="noopener">'+esc(x[0])+'</a>'+
          '<span class="cscat">'+esc(x[3])+'</span></div>'+
        '<div class="csn">'+esc(x[2])+'</div>'+
        (x[4]||[]).map(function(w){
          return '<div class="csw"><div class="cswq">'+esc(w[0])+'</div>'+
                 '<div class="cswa">'+esc(w[1])+'</div></div>'; }).join('')+
        '<div class="cslite"><div class="cswq">'+esc(x[5])+'</div>'+
          '<div class="cswa">'+esc(x[6])+'</div></div></div>';
    }).join('') +'</div>';

  return '';
}

function field(c){
  if (c.type === "read") return readView(c);
  var v = S.a[c.id];
  if (c.type==="write")
    return '<textarea data-c="'+c.id+'" placeholder="'+esc(c.ph||"")+'">'+esc(v||"")+'</textarea>';

  if (c.type==="two"){
    v = v || {};
    return '<div class="two"><span class="fix">'+esc(c.pre)+'</span>'+
      '<input type="text" data-c="'+c.id+'" data-k="a" placeholder="'+esc(c.a)+'" value="'+esc(v.a||"")+'">'+
      '<span class="fix">'+esc(c.mid)+'</span>'+
      '<input type="text" data-c="'+c.id+'" data-k="b" placeholder="'+esc(c.b)+'" value="'+esc(v.b||"")+'"></div>';
  }

  if (c.type==="choice")
    return c.opts.map(function(o,i){
      return '<label class="opt'+(v===o?" on":"")+'"><input type="radio" name="'+c.id+'" data-c="'+c.id+'" value="'+esc(o)+'"'+
             (v===o?" checked":"")+'><span>'+esc(o)+'</span></label>'; }).join('');

  if (c.type==="multi"){
    var arr = v || [];
    return c.opts.map(function(o){
      var on = arr.indexOf(o)>-1;
      return '<label class="opt'+(on?" on":"")+'"><input type="checkbox" data-c="'+c.id+'" value="'+esc(o)+'"'+
             (on?" checked":"")+'><span>'+esc(o)+'</span></label>'; }).join('');
  }

  if (c.type==="slider"){
    var sq = "";
    for (var k=1;k<=10;k++){
      sq += '<button type="button" class="sq'+(v===k?" on":"")+'" data-sq="'+c.id+'" data-n="'+k+'" '+
            'aria-label="'+k+' of 10, '+esc(c.l)+' to '+esc(c.r)+'">'+k+'</button>';
    }
    return '<div class="sl-ends"><span>'+esc(c.l)+'</span><span>'+esc(c.r)+'</span></div>'+
      '<div class="sqs">'+sq+'</div>'+
      '<div class="slv" data-v="'+c.id+'">'+(v?('You picked '+v+' of 10'):'Tap a number')+'</div>';
  }

  if (c.type==="color"){
    v = v || {};
    return '<div class="cgrid">'+
      '<div class="cg"><label>Never use</label><div class="swatch">'+
        '<input type="color" data-c="'+c.id+'" data-k="no" value="'+esc(v.no||"#6335EA")+'">'+
        '<input type="text" data-c="'+c.id+'" data-k="noWhy" placeholder="why" value="'+esc(v.noWhy||"")+'"></div></div>'+
      '<div class="cg"><label>Must keep</label><div class="swatch">'+
        '<input type="color" data-c="'+c.id+'" data-k="yes" value="'+esc(v.yes||"#6335EA")+'">'+
        '<input type="text" data-c="'+c.id+'" data-k="yesWhy" placeholder="why, or: nothing" value="'+esc(v.yesWhy||"")+'"></div></div>'+
    '</div>';
  }

  if (c.type==="pool"){
    v = v || {};
    var n = (C.images && C.images.length) ? C.images.length : 3;
    var out = '<div class="pool-nav">';
    for (var i=0;i<n;i++) out += '<button class="ghost sm" data-p="'+i+'"'+(i===0?' style="background:var(--nuka);color:var(--shoyu)"':'')+'>Image '+(i+1)+'</button>';
    out += '</div>';
    for (var j=0;j<n;j++){
      var pv = v[j] || {};
      out += '<div data-pane="'+j+'"'+(j?' hidden':'')+'>'+
        '<div class="plate">'+plate(j)+'</div><div class="pgrid">'+
        [["see","What do you see"],["feel","How does it feel"],["think","What does it remind you of"],["sense","Sound, texture, smell"]]
        .map(function(f){ return '<div><label>'+f[1]+'</label>'+
          '<input type="text" data-c="'+c.id+'" data-p="'+j+'" data-k="'+f[0]+'" value="'+esc(pv[f[0]]||"")+'"></div>'; }).join('')+
        '</div></div>';
    }
    return out;
  }
  return "";
}
function label(c,v){
  v = +v;
  if (v===0) return "dead centre";
  var side = v<0 ? c.l : c.r, n = Math.abs(v);
  return (n===3?"strongly ":n===2?"":"slightly ") + side.toLowerCase();
}

/* ---------- render ---------- */
function answered(c){
  var v = S.a[c.id];
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "number") return true;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object"){
    for (var k in v){ if (String(v[k]||"").trim() !== "") return true; }
    return false;
  }
  return false;
}
function qCount(b){ return b.cards.filter(isQ).length; }
function blockDone(b){ return b.cards.filter(isQ).filter(answered).length; }
function totalCards(){ return B.reduce(function(s,x){ return s + x.cards.length; }, 0); }
function cardsBefore(i){ var n=0; for(var k=0;k<i;k++) n += B[k].cards.length; return n; }

function topBar(b){
  var done = cardsBefore(S.i) + Math.max(0, S.j);
  var pct  = Math.round(done / totalCards() * 100);
  return '<div class="bar"><div class="bar-in">'+
    '<span class="who">'+esc(S.name)+' · '+esc(S.role)+'</span>'+
    '<span class="who" style="margin-left:auto">'+ (b ? 'Block '+b.n+' · '+esc(b.name) : '') +'</span>'+
  '</div><div class="prog"><i style="width:'+pct+'%"></i></div></div>';
}

/* ---------- read-only block opener ---------- */
function blockIntro(b){
  $("#app").innerHTML =
    topBar(b)+
    '<div class="wrap screen">'+
      '<div class="scr-in">'+
        '<p class="eyebrow">Block '+b.n+' · '+qCount(b)+(qCount(b)===1?' question':' questions')+(b.cards.length>qCount(b)?' · '+(b.cards.length-qCount(b))+' to read':'')+' · about '+b.mins+' minutes</p>'+
        '<h2 style="margin-top:14px">'+esc(b.name)+'</h2>'+
        '<p class="lede">'+esc(b.intro)+'</p>'+
        '<p class="note readonly">Nothing to answer on this screen.</p>'+
      '</div>'+
      '<div class="nav">'+
        (S.i>0 ? '<button id="back" class="ghost">Back</button>' : '<span></span>')+
        '<button id="next">Start block '+b.n+'</button>'+
      '</div>'+
    '</div>';
  $("#next").addEventListener("click", function(){ S.j=0; save(); render(); });
  var bk=$("#back");
  if (bk) bk.addEventListener("click", function(){ S.i--; S.j=B[S.i].cards.length-1; save(); render(); });
  window.scrollTo(0,0);
}

/* ---------- one question per screen ---------- */
function render(){
  if (!S.name || !S.role) return gate();
  if (S.i >= B.length) return finished();

  var b = B[S.i];

  /* a block that is pure reading has nothing to submit: walk past the
     review screen instead of offering a Submit that would send no rows */
  if (qCount(b) === 0 && S.j >= b.cards.length){
    S.sent[b.id] = true; S.i++; S.j = -1; save(); return render();
  }

  if (S.j < 0) return blockIntro(b);
  if (S.j >= b.cards.length) return blockEnd(b);

  var c = b.cards[S.j], last = (S.j === b.cards.length - 1);
  var readOnly = !isQ(c);

  /* question numbering counts questions, not screens, so a reference page
     never makes the room think it has skipped one */
  var qNo = 0, k;
  for (k = 0; k <= S.j; k++) if (isQ(b.cards[k])) qNo++;

  $("#app").innerHTML =
    topBar(b)+
    '<div class="wrap screen'+(readOnly?' isread':'')+'">'+
      '<div class="scr-in">'+
        '<p class="eyebrow">'+ (readOnly
            ? esc(c.kicker || 'Read')
            : b.n+'.'+qNo+' &nbsp;·&nbsp; '+qNo+' of '+qCount(b)) +'</p>'+
        '<h3 class="qh">'+esc(c.q)+'</h3>'+
        (c.note?'<p class="note">'+esc(c.note)+'</p>':'')+
        '<div class="cbody">'+field(c)+'</div>'+
        (readOnly?'<p class="note readonly">Nothing to answer on this screen.</p>':'')+
      '</div>'+
      '<div class="nav">'+
        '<button id="back" class="ghost">Back</button>'+
        (readOnly?'':'<span class="skip" id="skip">Skip</span>')+
        '<button id="next">'+(last ? (qCount(b) ? 'Review block '+b.n : 'Continue') : 'Next')+'</button>'+
      '</div>'+
    '</div>';

  wire(b, c);
  window.scrollTo(0,0);
}

/* ---------- block review + submit ---------- */
function blockEnd(b){
  var missing = b.cards.filter(function(c){ return isQ(c) && !answered(c); });
  var sent = !!S.sent[b.id];
  $("#app").innerHTML =
    topBar(b)+
    '<div class="wrap screen">'+
      '<div class="scr-in">'+
        '<p class="eyebrow">Block '+b.n+' · review</p>'+
        '<h2 style="margin-top:14px">'+ blockDone(b) +' of '+qCount(b)+' answered</h2>'+
        (missing.length
          ? '<p class="lede">Unanswered: '+ missing.map(function(c){
              var at = b.cards.indexOf(c), no = 0, k;
              for (k=0;k<=at;k++) if (isQ(b.cards[k])) no++;
              return '<a href="#" class="jump" data-j="'+at+'">'+(b.n+'.'+no)+'</a>';
            }).join(', ') +'</p>'
          : '<p class="lede">Everything answered.</p>')+
        '<p class="note readonly">Submitting sends this block to the host. You can still go back and change answers before you tap it.</p>'+
      '</div>'+
      '<div class="nav">'+
        '<button id="back" class="ghost">Back</button>'+
        '<button id="sub"'+(sent?' disabled':'')+'>'+(sent?'Already sent':'Submit block '+b.n)+'</button>'+
      '</div>'+
    '</div>';

  $("#back").addEventListener("click", function(){ S.j=b.cards.length-1; save(); render(); });
  [].forEach.call(document.querySelectorAll(".jump"), function(el){
    el.addEventListener("click", function(e){ e.preventDefault(); S.j=+el.getAttribute("data-j"); save(); render(); });
  });
  $("#sub").addEventListener("click", function(){
    var btn=this; btn.disabled=true; btn.textContent="Sending…";
    var rows = b.cards.filter(isQ).map(function(c){
      return { block:b.id, card:c.id, answer:(S.a[c.id]===undefined ? "" : S.a[c.id]) };
    });
    send(rows).then(function(){
      S.sent[b.id]=true; S.i++; S.j=-1; save();
      status("Block "+b.n+" submitted"); render();
    }).catch(function(){
      btn.disabled=false; btn.textContent="Try again";
      status("Still could not reach the host. Your answers are saved on this device and will send themselves — or tap to retry now.", true);
    });
  });
  window.scrollTo(0,0);
}

/* #app survives every render — only its innerHTML is replaced — so the three
   delegated listeners below are attached ONCE. Binding them per render stacked
   a new copy each time, and the ten-square picker is a toggle: with two
   listeners a tap set the value and then immediately cleared it, so every
   second personality scale refused to accept an answer. */
var CUR = null, BOUND = false;

function sync(){
  var n = $("#next"), s = $("#skip"), c = CUR;
  if (!n || !c) return;
  if (!isQ(c)) { n.disabled = false; return; }   /* a read screen never gates Next */
  var ok = answered(c);
  n.disabled = !ok;
  if (s) s.hidden = ok;
}

function bindApp(app){

  app.addEventListener("input", function(e){
    var t = e.target, id = t.getAttribute("data-c");
    if (!id) return;
    var k = t.getAttribute("data-k"), p = t.getAttribute("data-p");
    if (p !== null && p !== undefined && k){
      S.a[id] = S.a[id] || {}; S.a[id][p] = S.a[id][p] || {}; S.a[id][p][k] = t.value;
    } else if (k){
      S.a[id] = S.a[id] || {}; S.a[id][k] = t.value;
    } else if (t.type === "range"){
      S.a[id] = +t.value;
      var out = app.querySelector('[data-v="'+id+'"]');
      if (out) out.textContent = label(CUR, t.value);
    } else { S.a[id] = t.value; }
    save(); sync();
  });

  app.addEventListener("change", function(e){
    var t = e.target, id = t.getAttribute("data-c");
    if (!id) return;
    if (t.type === "radio"){
      S.a[id] = t.value;
      [].forEach.call(app.querySelectorAll('input[name="'+id+'"]'), function(r){
        r.closest(".opt").classList.toggle("on", r.checked); });
    }
    if (t.type === "checkbox"){
      var arr = S.a[id] || [], ix = arr.indexOf(t.value);
      if (t.checked && ix<0) arr.push(t.value);
      if (!t.checked && ix>-1) arr.splice(ix,1);
      S.a[id] = arr;
      t.closest(".opt").classList.toggle("on", t.checked);
    }
    save(); sync();
  });

  app.addEventListener("click", function(e){
    var sq = e.target.closest("[data-sq]");
    if (sq){
      var sid = sq.getAttribute("data-sq"), n = +sq.getAttribute("data-n");
      S.a[sid] = (S.a[sid] === n) ? undefined : n;
      if (S.a[sid] === undefined) delete S.a[sid];
      [].forEach.call(app.querySelectorAll('[data-sq="'+sid+'"]'), function(x){
        x.classList.toggle("on", +x.getAttribute("data-n") === S.a[sid]); });
      var out = app.querySelector('[data-v="'+sid+'"]');
      if (out) out.textContent = S.a[sid] ? ('You picked '+S.a[sid]+' of 10') : 'Tap a number';
      save(); sync(); return;
    }
    var pb = e.target.closest("[data-p]");
    if (pb && pb.tagName === "BUTTON"){
      var n = pb.getAttribute("data-p");
      [].forEach.call(app.querySelectorAll("[data-pane]"), function(pane){
        pane.hidden = pane.getAttribute("data-pane") !== n; });
      [].forEach.call(app.querySelectorAll(".pool-nav button"), function(x){
        x.style.cssText = (x === pb) ? "background:var(--nuka);color:var(--shoyu)" : ""; });
    }
  });
}

function wire(b, c){
  CUR = c;
  var app = $("#app");
  if (!BOUND){ BOUND = true; bindApp(app); }

  $("#next").addEventListener("click", function(){ S.j++; save(); render(); });
  $("#back").addEventListener("click", function(){
    if (S.j > 0){ S.j--; }
    else if (S.i > 0 || true){ S.j = -1; }
    save(); render();
  });
  var sk = $("#skip");
  if (sk) sk.addEventListener("click", function(){ S.j++; save(); render(); });

  sync();
}
setTimeout(flushOutbox, 1500);

function cardById(b,id){ for(var i=0;i<b.cards.length;i++) if(b.cards[i].id===id) return b.cards[i]; return null; }

function finished(){
  $("#app").innerHTML =
  '<div class="mid"><div class="mid-in" style="text-align:left">'+
    '<p class="eyebrow">The Kokumi · '+esc(C.client)+'</p>'+
    '<h1>Done</h1>'+
    '<p class="lede">All '+B.filter(function(b){return qCount(b)>0;}).length+' question sections are in. Thank you — what you wrote becomes the creative brief.</p>'+
    '<hr style="margin:30px 0 22px">'+
    '<div class="row"><button class="ghost sm" id="dl">Download my answers</button></div>'+
  '</div></div>';
  $("#dl").addEventListener("click", function(){
    var out = S.name + " · " + S.role + "\n\n" + B.map(function(b){
      return b.n + " — " + b.name + "\n" + b.cards.map(function(c){
        var v = S.a[c.id]; if (v && typeof v === "object") v = JSON.stringify(v);
        return "  " + c.q + "\n  > " + (v===undefined||v===""?"—":v);
      }).join("\n\n"); }).join("\n\n\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([out], {type:"text/plain"}));
    a.download = "lite-board-" + S.name.replace(/\s+/g,"-").toLowerCase() + ".txt";
    a.click();
  });
}

if (!C.endpoint || C.endpoint.indexOf("PASTE") === 0){
  document.getElementById("app").innerHTML =
    '<div class="mid"><div class="mid-in"><h2>config.js is not set</h2>'+
    '<p class="lede">Open <code>config.js</code> and paste the Apps Script /exec URL into <code>endpoint</code>.</p></div></div>';
} else {
  (S.name && S.role) ? render() : gate();
}
})();
