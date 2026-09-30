/* The Kokumi — host dashboard */
(function(){
"use strict";
var C = window.THKO, B = window.BLOCKS;
var rows = [], people = [], bi = 0, timer = null;

var $ = function(s){ return document.querySelector(s); };
function esc(t){ return String(t==null?"":t).replace(/[&<>"]/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }

function pull(){
  var u = C.endpoint + (C.endpoint.indexOf("?")>-1?"&":"?") + "cb=" + Date.now();
  return fetch(u, { redirect:"follow" }).then(function(r){ return r.text(); }).then(function(t){
    var j = JSON.parse(t);
    if (!j.ok) throw new Error(j.error);
    rows = (j.rows||[]).filter(function(r){ return String(r.session) === C.session; });
    var seen = {};
    people = [];
    rows.forEach(function(r){
      var k = r.name + "|" + r.role;
      if (r.name && !seen[k]) { seen[k] = 1; people.push({ name:r.name, role:r.role }); }
    });
    return rows;
  });
}
function answersFor(cardId){
  var byP = {};
  rows.forEach(function(r){ if (r.card === cardId) byP[r.name + "|" + r.role] = r.answer; });
  return people.map(function(p){
    return { name:p.name, role:p.role, v: byP[p.name + "|" + p.role] };
  }).filter(function(x){ return x.v !== undefined && x.v !== ""; });
}
function parse(v){ if (typeof v !== "string") return v;
  var s = v.trim(); if (s.charAt(0)==="{"||s.charAt(0)==="["){ try{ return JSON.parse(s); }catch(e){} } return v; }
function first(n){ return String(n||"?").split(" ")[0]; }

/* ---- renderers ---- */
function slider(c, list){
  if (!list.length) return '<p class="note">No answers yet.</p>';
  var vals = list.map(function(x){ return +x.v; });
  var spread = Math.max.apply(null, vals) - Math.min.apply(null, vals);
  var bump = {};
  return '<div class="axis">'+
    '<div class="sl-ends"><span>'+esc(c.l)+'</span><span>'+esc(c.r)+'</span></div>'+
    '<div class="axis-line">'+ list.map(function(x){
        var v = +x.v, pct = 5 + ((v+3)/6)*90;
        bump[v] = (bump[v]||0) + 1;
        return '<div class="mk" style="left:'+pct.toFixed(1)+'%;top:'+(2+(bump[v]-1)*17)+'px">'+
               '<b></b><span>'+esc(first(x.name))+'</span></div>'; }).join('') +'</div>'+
    '<p class="spread">'+ (spread>=4 ? "Split — "+spread+" points apart. This is the conversation."
                        : spread===0 ? "Unanimous." : "Spread of "+spread+" point"+(spread>1?"s":"")+".") +'</p>'+
  '</div>';
}
function cloud(list){
  var freq = {}, order = [];
  list.forEach(function(x){
    var o = parse(x.v); if (!o || typeof o !== "object") return;
    Object.keys(o).forEach(function(k){
      var f = o[k]; if (!f || typeof f !== "object") return;
      Object.keys(f).forEach(function(kk){
        String(f[kk]).split(/[,\s]+/).forEach(function(w){
          w = w.trim().toLowerCase(); if (w.length < 3) return;
          if (!freq[w]) { freq[w] = 0; order.push(w); }
          freq[w]++;
        });
      });
    });
  });
  if (!order.length) return '<p class="note">No words yet.</p>';
  order.sort(function(a,b){ return freq[b]-freq[a]; });
  return '<div class="cloud">'+ order.map(function(w){
    return '<span class="'+(freq[w]>1?"hot":"")+'">'+esc(w)+(freq[w]>1?' ×'+freq[w]:'')+'</span>'; }).join('') +'</div>';
}
function plain(list){
  return '<div class="hgrid">'+ list.map(function(x){
    var v = parse(x.v), t;
    if (Array.isArray(v)) t = v.join(" · ");
    else if (v && typeof v === "object"){
      if (v.a !== undefined) t = "We are " + v.a + " but " + v.b;
      else t = Object.keys(v).map(function(k){ return k + ": " + v[k]; }).join("\n");
    } else t = v;
    return '<div class="ans"><div class="nm">'+esc(x.name)+' · '+esc(x.role)+'</div>'+
           '<div class="tx">'+esc(t)+'</div></div>'; }).join('') +'</div>';
}

function draw(){
  var b = B[bi];
  var submitted = people.filter(function(p){
    return rows.some(function(r){ return r.name===p.name && r.block===b.id; }); });

  $("#head").innerHTML =
    '<p class="eyebrow">Block '+b.n+' · '+b.name+(b.reveal?' · reveal':' · collect only')+'</p>'+
    '<h2 style="margin-top:10px">'+submitted.length+' of '+(people.length||0)+' submitted</h2>'+
    '<p class="note" style="margin-top:8px">'+
      (people.length ? people.map(function(p){
        var ok = submitted.some(function(s){ return s.name===p.name; });
        return '<span style="color:'+(ok?"var(--negi)":"var(--nuka)")+'">●</span> '+esc(p.name);
      }).join(" &nbsp; ") : "Nobody has started yet.") +'</p>';

  $("#nav").innerHTML = B.map(function(x,i){
    return '<button class="'+(i===bi?"":"ghost")+' sm" data-b="'+i+'">'+x.n+'</button>'; }).join('');

  $("#body").innerHTML = b.cards.map(function(c){
    var list = answersFor(c.id);
    var view = c.type === "slider" ? slider(c, list)
             : c.type === "pool"   ? cloud(list)
             : plain(list);
    return '<div style="margin-bottom:38px">'+
      '<h3 style="margin-bottom:4px">'+esc(c.q)+'</h3>'+
      '<p class="mono" style="margin:0 0 14px">'+list.length+' answered</p>'+
      view + '</div>';
  }).join('');
}

function refresh(){
  $("#rf").textContent = "Refreshing…";
  pull().then(function(){ draw(); $("#rf").textContent = "Refresh"; })
        .catch(function(){ $("#rf").textContent = "Failed — retry"; });
}

$("#nav").addEventListener("click", function(e){
  var t = e.target.closest("[data-b]"); if (!t) return;
  bi = +t.getAttribute("data-b"); draw();
});
$("#rf").addEventListener("click", refresh);
$("#auto").addEventListener("change", function(){
  if (this.checked) { timer = setInterval(refresh, 12000); this.parentNode.lastChild.textContent = " auto · on"; }
  else { clearInterval(timer); this.parentNode.lastChild.textContent = " auto"; }
});
$("#brief").addEventListener("click", function(){
  var out = "CREATIVE BRIEF — " + C.client + "\nSession " + C.session + "\nGenerated " + new Date().toISOString().slice(0,16).replace("T"," ") + "\n";
  out += "Participants: " + people.map(function(p){ return p.name+" ("+p.role+")"; }).join(", ") + "\n";
  B.forEach(function(b){
    out += "\n\n" + "=".repeat(64) + "\n" + b.n + " — " + b.name.toUpperCase() + "\n" + "=".repeat(64);
    b.cards.forEach(function(c){
      out += "\n\n" + c.q + "\n" + "-".repeat(Math.min(64, c.q.length));
      var list = answersFor(c.id);
      if (!list.length) { out += "\n  (no answers)"; return; }
      if (c.type === "slider"){
        var vals = list.map(function(x){ return +x.v; });
        var spread = Math.max.apply(null,vals) - Math.min.apply(null,vals);
        var avg = (vals.reduce(function(a,b2){return a+b2;},0)/vals.length).toFixed(1);
        out += "\n  " + c.l + "  -3 ..... +3  " + c.r;
        list.forEach(function(x){ out += "\n  " + x.name + ": " + x.v; });
        out += "\n  average " + avg + " · spread " + spread + (spread>=4 ? "  <-- SPLIT" : "");
      } else {
        list.forEach(function(x){
          var v = parse(x.v);
          if (Array.isArray(v)) v = v.join(" · ");
          else if (v && typeof v === "object"){
            v = (v.a !== undefined) ? ("We are "+v.a+" but "+v.b)
              : Object.keys(v).map(function(k){
                  var f = v[k];
                  return (f && typeof f==="object") ? k+" {"+Object.keys(f).map(function(z){return f[z];}).filter(Boolean).join(", ")+"}" : k+": "+f;
                }).join(" | ");
          }
          out += "\n  " + x.name + ": " + v;
        });
      }
    });
  });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([out], {type:"text/plain"}));
  a.download = C.client + "-creative-brief.txt";
  a.click();
});

if (!C.endpoint || C.endpoint.indexOf("PASTE") === 0){
  $("#body").innerHTML = '<h2>config.js is not set</h2><p class="lede">Paste the Apps Script /exec URL into <code>endpoint</code>.</p>';
} else refresh();
})();
