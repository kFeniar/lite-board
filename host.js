/* The Kokumi — host dashboard */
(function(){
"use strict";
var C = window.THKO, B = window.BLOCKS;
var rows = [], people = [], bi = 0, timer = null, VIEW = "blocks";

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
    NAMES = shortNames(people);
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
var NAMES = {};
function shortNames(list){
  var byFirst = {}, map = {};
  list.forEach(function(p){
    var f = String(p.name||"?").trim().split(/\s+/)[0];
    (byFirst[f] = byFirst[f] || []).push(p);
  });
  list.forEach(function(p){
    var parts = String(p.name||"?").trim().split(/\s+/), f = parts[0];
    map[p.name + "|" + p.role] =
      (byFirst[f].length > 1 && parts[1]) ? f + " " + parts[1].charAt(0).toUpperCase() + "." : f;
  });
  return map;
}
function parse(v){ if (typeof v !== "string") return v;
  var s = v.trim(); if (s.charAt(0)==="{"||s.charAt(0)==="["){ try{ return JSON.parse(s); }catch(e){} } return v; }
function first(n){ return String(n||"?").split(" ")[0]; }


function isQ(c){ return c.type !== "read"; }
function flat(v){
  v = parse(v);
  if (Array.isArray(v)) return v.join(" \u00b7 ");
  if (v && typeof v === "object"){
    if (v.a !== undefined) return "We are " + v.a + " but " + v.b;
    return Object.keys(v).map(function(k){
      var f = v[k];
      return (f && typeof f === "object")
        ? k + " {" + Object.keys(f).map(function(z){ return f[z]; }).filter(Boolean).join(", ") + "}"
        : k + ": " + f;
    }).join(" | ");
  }
  return v == null ? "" : String(v);
}
function allQuestions(){
  var out = [];
  B.forEach(function(b){
    var n = 0;
    b.cards.forEach(function(c){
      if (!isQ(c)) return;
      n++;
      out.push({ b:b, c:c, no: b.n + "." + n });
    });
  });
  return out;
}
function valueFor(cardId, p){
  var v;
  rows.forEach(function(r){ if (r.card === cardId && r.name === p.name && r.role === p.role) v = r.answer; });
  return (v === undefined || v === "") ? null : flat(v);
}

/* ---- the matrix: one column per person, one row per question ----
   This is the view for reading the room: the same question across
   everybody, so agreement and disagreement sit next to each other. */
function drawGrid(){
  $("#head").innerHTML =
    '<p class="eyebrow">All blocks \u00b7 every answer</p>'+
    '<h2 style="margin-top:10px">'+people.length+(people.length===1?' participant':' participants')+'</h2>'+
    '<p class="note" style="margin-top:8px">Questions down the side, people across the top. '+
      'A dash means they have not answered it yet.</p>';
  $("#nav").innerHTML = '';

  if (!people.length){ $("#body").innerHTML = '<p class="note">Nobody has started yet.</p>'; return; }

  var qs = allQuestions(), lastBlock = null, trs = "";
  qs.forEach(function(q){
    if (q.b.id !== lastBlock){
      lastBlock = q.b.id;
      trs += '<tr class="brow"><th class="qcol">'+esc(q.b.n+" \u00b7 "+q.b.name)+'</th>'+
             people.map(function(){ return '<td></td>'; }).join('')+'</tr>';
    }
    trs += '<tr><th class="qcol"><span class="qn">'+esc(q.no)+'</span>'+esc(q.c.q)+'</th>'+
      people.map(function(p){
        var v = valueFor(q.c.id, p);
        return '<td>'+(v === null ? '<span class="no">\u2014</span>' : esc(v))+'</td>';
      }).join('') +'</tr>';
  });

  $("#body").innerHTML =
    '<div class="gwrap"><table class="gtab"><thead><tr>'+
      '<th class="qcol">Question</th>'+
      people.map(function(p){
        return '<th><div class="pn">'+esc(p.name)+'</div><div class="pr">'+esc(p.role)+'</div></th>';
      }).join('')+
    '</tr></thead><tbody>'+trs+'</tbody></table></div>';
}

function gridCSV(){
  var qs = allQuestions();
  function cell(t){ t = String(t == null ? "" : t); return '"' + t.replace(/"/g,'""') + '"'; }
  var lines = [];
  lines.push([cell("Block"), cell("No"), cell("Question")]
    .concat(people.map(function(p){ return cell(p.name + " (" + p.role + ")"); })).join(","));
  qs.forEach(function(q){
    lines.push([cell(q.b.n + " " + q.b.name), cell(q.no), cell(q.c.q)]
      .concat(people.map(function(p){ return cell(valueFor(q.c.id, p) || ""); })).join(","));
  });
  return "\ufeff" + lines.join("\r\n");
}

/* ---- renderers ---- */
/* The board records a square from 1 to 10. This used to map a -3..+3
   scale, which pushed every marker off the right-hand end of the track. */
function slider(c, list){
  var nums = list.filter(function(x){ return isFinite(+x.v) && +x.v >= 1 && +x.v <= 10; });
  if (!nums.length) return '<p class="note">No answers yet.</p>';
  var vals = nums.map(function(x){ return +x.v; });
  var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
  var spread = hi - lo;
  var mean = (vals.reduce(function(a,b){ return a+b; },0) / vals.length);
  var bump = {};
  return '<div class="axis">'+
    '<div class="sl-ends"><span>'+esc(c.l)+'</span><span>'+esc(c.r)+'</span></div>'+
    '<div class="axis-line">'+ nums.map(function(x){
        var v = +x.v, pct = 5 + ((v-1)/9)*90;
        bump[v] = (bump[v]||0) + 1;
        return '<div class="mk" style="left:'+pct.toFixed(1)+'%;top:'+(2+(bump[v]-1)*17)+'px">'+
               '<b></b><span>'+esc(NAMES[x.name+"|"+x.role] || first(x.name))+'</span></div>'; }).join('') +'</div>'+
    '<p class="spread">'+ (
        spread === 0 ? "Unanimous on " + lo + "."
      : spread >= 5  ? "Split — " + lo + " to " + hi + ", " + spread + " points apart. This is the conversation."
      : "Clustered " + lo + "\u2013" + hi + " (average " + mean.toFixed(1) + ")."
      ) +'</p>'+
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
  var readOnlyBlock = !b.cards.some(function(c){ return c.type !== "read"; });

  $("#head").innerHTML =
    '<p class="eyebrow">Block '+b.n+' · '+b.name+(b.reveal?' · reveal':' · collect only')+'</p>'+
    (readOnlyBlock
      ? '<h2 style="margin-top:10px">Reading only</h2>'
      : '<h2 style="margin-top:10px">'+submitted.length+' of '+(people.length||0)+' submitted</h2>')+
    '<p class="note" style="margin-top:8px">'+
      (people.length ? people.map(function(p){
        var ok = submitted.some(function(s){ return s.name===p.name; });
        return '<span style="color:'+(ok?"var(--negi)":"var(--nuka)")+'">●</span> '+esc(p.name);
      }).join(" &nbsp; ") : "Nobody has started yet.") +'</p>';

  $("#nav").innerHTML = B.map(function(x,i){
    return '<button class="'+(i===bi?"":"ghost")+' sm" data-b="'+i+'">'+x.n+'</button>'; }).join('');

  /* reading screens carry no answers; they would list as "0 answered" */
  var asked = b.cards.filter(function(c){ return c.type !== "read"; });
  if (!asked.length){
    $("#body").innerHTML = '<p class="note">This block is reading only \u2014 nothing to reveal.</p>';
    return;
  }
  $("#body").innerHTML = asked.map(function(c){
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

function paint(){ if (VIEW === "grid") drawGrid(); else draw(); }

function refresh(){
  $("#rf").textContent = "Refreshing…";
  pull().then(function(){ paint(); $("#rf").textContent = "Refresh"; })
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
$("#view").addEventListener("click", function(){
  VIEW = (VIEW === "grid") ? "blocks" : "grid";
  this.textContent = (VIEW === "grid") ? "By block" : "Grid";
  document.body.classList.toggle("gridview", VIEW === "grid");
  paint();
});
$("#csv").addEventListener("click", function(){
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([gridCSV()], {type:"text/csv;charset=utf-8"}));
  a.download = C.client + "-answers-grid.csv";
  a.click();
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
