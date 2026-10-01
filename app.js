/* The Kokumi — participant board */
(function(){
"use strict";
var C = window.THKO, B = window.BLOCKS;
var KEY = "thko_" + C.session;

var S = { name:"", role:"", i:0, a:{}, sent:{} };
try { var raw = localStorage.getItem(KEY); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch(e){}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }

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
    '<p class="lede">Six blocks. You answer on your own — nobody sees your answers until we reveal them together.</p>'+
    '<hr style="margin:34px 0 26px">'+
    '<label class="mono" style="display:block;margin-bottom:9px">Your name</label>'+
    '<input type="text" id="gn" autocomplete="name" value="'+esc(S.name)+'">'+
    '<label class="mono" style="display:block;margin:20px 0 9px">Your role</label>'+
    '<div id="gr">'+ C.roles.map(function(r){
      return '<label class="opt'+(S.role===r?" on":"")+'"><input type="radio" name="role" value="'+esc(r)+'"'+
             (S.role===r?" checked":"")+'><span>'+esc(r)+'</span></label>'; }).join('') +'</div>'+
    '<div class="row" style="margin-top:22px"><button id="go" disabled>Begin</button></div>'+
  '</div></div>';

  var n=$("#gn"), go=$("#go");
  function chk(){ go.disabled = !(n.value.trim() && S.role); }
  n.addEventListener("input", function(){ S.name=n.value.trim(); save(); chk(); });
  $("#gr").addEventListener("change", function(e){
    S.role = e.target.value; save();
    [].forEach.call(document.querySelectorAll("#gr .opt"), function(l){
      l.classList.toggle("on", l.querySelector("input").checked); });
    chk();
  });
  chk();
  go.addEventListener("click", function(){ S.i = firstUnsent(); save(); render(); });
}
function firstUnsent(){ for (var k=0;k<B.length;k++) if(!S.sent[B[k].id]) return k; return B.length; }

/* ---------- cards ---------- */
function field(c){
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
    var set = (v!==undefined && v!==null && v!=="");
    return '<div class="sl-ends"><span>'+esc(c.l)+'</span><span>'+esc(c.r)+'</span></div>'+
      '<input type="range" min="-3" max="3" step="1" value="'+(set?v:0)+'" data-c="'+c.id+'">'+
      '<div class="ticks"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>'+
      '<div class="slv" data-v="'+c.id+'">'+(set?label(c,v):"drag to answer")+'</div>';
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
function render(){
  if (!S.name || !S.role) return gate();
  if (S.i >= B.length) return finished();

  var b = B[S.i], sent = !!S.sent[b.id];

  $("#app").innerHTML =
  '<div class="bar"><div class="bar-in">'+
    '<span class="who">'+esc(S.name)+' · '+esc(S.role)+'</span>'+
    '<span class="pips">'+ B.map(function(x,i){
      return '<i class="pip'+(S.sent[x.id]?" done":(i===S.i?" now":""))+'"></i>'; }).join('') +'</span>'+
  '</div></div>'+
  '<div class="wrap" style="padding-top:44px;padding-bottom:70px">'+
    '<p class="eyebrow">Block '+b.n+' · '+b.mins+' minutes</p>'+
    '<h2 style="margin-top:12px">'+esc(b.name)+'</h2>'+
    '<p class="lede">'+esc(b.intro)+'</p>'+
    '<hr style="margin:32px 0 26px">'+
    b.cards.map(function(c,i){
      return '<div class="card"><span class="cnum">'+b.n+'.'+(i+1)+'</span>'+
        '<h3>'+esc(c.q)+'</h3>'+
        (c.note?'<p class="note">'+esc(c.note)+'</p>':'')+
        '<div class="cbody">'+field(c)+'</div></div>'; }).join('')+
    '<div class="row" style="margin-top:26px">'+
      '<button id="sub"'+(sent?" disabled":"")+'>'+(sent?"Already submitted":"Submit block "+b.n)+'</button>'+
      (S.i>0?'<button id="back" class="ghost sm">Back</button>':'')+
    '</div>'+
    '<p class="note" style="margin-top:14px">Your answers save as you type. Submitting sends the block to the host.</p>'+
  '</div>';

  wire(b);
  window.scrollTo(0,0);
}

function wire(b){
  var app = $("#app");

  app.addEventListener("input", function(e){
    var t = e.target, id = t.getAttribute("data-c");
    if (!id) return;
    var k = t.getAttribute("data-k"), p = t.getAttribute("data-p");

    if (p !== null && p !== undefined && k){
      S.a[id] = S.a[id] || {};
      S.a[id][p] = S.a[id][p] || {};
      S.a[id][p][k] = t.value;
    } else if (k){
      S.a[id] = S.a[id] || {};
      S.a[id][k] = t.value;
    } else if (t.type === "range"){
      S.a[id] = +t.value;
      var card = cardById(b, id), out = app.querySelector('[data-v="'+id+'"]');
      if (out && card) out.textContent = label(card, t.value);
    } else {
      S.a[id] = t.value;
    }
    save();
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
    save();
  });

  app.addEventListener("click", function(e){
    var pb = e.target.closest("[data-p]");
    if (pb && pb.tagName === "BUTTON"){
      var n = pb.getAttribute("data-p");
      [].forEach.call(app.querySelectorAll("[data-pane]"), function(pane){
        pane.hidden = pane.getAttribute("data-pane") !== n; });
      [].forEach.call(app.querySelectorAll(".pool-nav button"), function(x){
        x.style.cssText = (x === pb) ? "background:var(--nuka);color:var(--shoyu)" : ""; });
    }
  });

  var back = $("#back");
  if (back) back.addEventListener("click", function(){ S.i--; save(); render(); });

  $("#sub").addEventListener("click", function(){
    var btn = this;
    btn.disabled = true; btn.textContent = "Sending…";
    var rows = b.cards.map(function(c){
      return { block:b.id, card:c.id, answer: (S.a[c.id]===undefined ? "" : S.a[c.id]) };
    });
    send(rows).then(function(){
      S.sent[b.id] = true; S.i++; save();
      status("Block " + b.n + " submitted");
      render();
    }).catch(function(){
      btn.disabled = false; btn.textContent = "Try again";
      status("Still could not reach the host. Your answers are saved on this device and will send themselves — or tap to retry now.", true);
    });
  });
}
setTimeout(flushOutbox, 1500);

function cardById(b,id){ for(var i=0;i<b.cards.length;i++) if(b.cards[i].id===id) return b.cards[i]; return null; }

function finished(){
  $("#app").innerHTML =
  '<div class="mid"><div class="mid-in" style="text-align:left">'+
    '<p class="eyebrow">The Kokumi · '+esc(C.client)+'</p>'+
    '<h1>Done</h1>'+
    '<p class="lede">All six blocks are in. Thank you — what you wrote becomes the creative brief.</p>'+
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
