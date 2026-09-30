/* The Kokumi — lite creative direction board · card definitions */
window.BLOCKS = [

{ id:"B1", n:"01", name:"Scope",
  intro:"Before anything else — how far this goes. Everything downstream depends on these three.",
  reveal:false, mins:5,
  cards:[
    { id:"b1-scope", type:"choice", q:"Is this an evolution of the current mark, or a rebuild from zero?",
      note:"There is no safe answer. Pick the one you would defend.",
      opts:["Evolution — keep what people recognise","Rebuild — start clean","Depends on what we see first"] },

    { id:"b1-equity", type:"write", q:"What in the current identity has to survive?",
      note:"The purple? The lowercase? The wordmark? Or nothing.", ph:"… or write: nothing" },

    { id:"b1-why", type:"write", q:"Why now? What happened that made you decide to do this?",
      note:"Not the official reason — the actual one.", ph:"…" }
  ]},

{ id:"B2", n:"02", name:"The tension",
  intro:"One sentence decides two hundred later arguments. Take the full five minutes on the first card.",
  reveal:true, mins:10,
  cards:[
    { id:"b2-tension", type:"two", q:"Finish this sentence.",
      note:"Brex answered “seriously optimistic” and settled every design argument for two years with it.",
      pre:"We are", mid:"but", a:"confident", b:"never cold" },

    { id:"b2-cfo", type:"write", q:"What would make a CFO not take lite seriously?",
      note:"Be specific. A colour? A word? A picture?", ph:"…" },

    { id:"b2-consumer", type:"write", q:"What would make lite look like a consumer app rather than business infrastructure?",
      note:"", ph:"…" }
  ]},

{ id:"B3", n:"03", name:"Six sliders",
  intro:"Mark each one alone. Do not discuss. The gap between your answers is what we are here to find.",
  reveal:true, mins:15,
  cards:[
    { id:"b3-authority", type:"slider", q:"Does lite stand beside the business, or above it?", l:"Friend", r:"Authority",
      note:"Does it stand beside the business, or above it?" },

    { id:"b3-expert", type:"slider", q:"Which one leads \u2014 simple, or expert?", l:"Simple", r:"Expert",
      note:"Your own personality list claims both. This settles which leads." },

    { id:"b3-bold", type:"slider", q:"How loud should lite be?", l:"Understated", r:"Bold",
      note:"Your list claims both of these too." },

    { id:"b3-saudi", type:"slider", q:"How visibly Saudi?", l:"Visibly Saudi", r:"Globally neutral",
      note:"Saudi-rooted is written into your foundation. Nobody has said how much of it shows." },

    { id:"b3-precise", type:"slider", q:"Is money handled warmly, or exactly?", l:"Warm", r:"Precise",
      note:"Money can be handled warmly or exactly. Rarely both at once." },

    { id:"b3-software", type:"slider", q:"What should it read as?", l:"Software", r:"Financial institution",
      note:"Mercury says “Product” instead of “Checking Account” for exactly this reason." }
  ]},

{ id:"B4", n:"04", name:"Enemy and negative space",
  intro:"People are far clearer about what they don’t want. This is the fastest route to a visual direction.",
  reveal:true, mins:15,
  cards:[
    { id:"b4-enemy", type:"write", q:"Who — or what — is the enemy?",
      note:"It can be a company, a habit, or a feeling.", ph:"…" },

    { id:"b4-notlike", type:"write", q:"Name one competitor lite must not look like.",
      note:"And in one line, why.", ph:"…" },

    { id:"b4-never", type:"write", q:"What is the one thing you never want a customer to feel when dealing with lite?",
      note:"", ph:"…" },

    { id:"b4-notfor", type:"write", q:"Who is this brand not for?",
      note:"“Everyone” is not an answer.", ph:"…" },

    { id:"b4-color", type:"color", q:"Colour boundaries.",
      note:"One colour lite must never use. One it must keep, if any." },

    { id:"b4-outside", type:"write", q:"Name a brand outside financial services you admire — and exactly what draws you to it.",
      note:"Outside. Not a fintech. And “exactly” matters more than the name.", ph:"…" }
  ]},

{ id:"B5", n:"05", name:"Hard constraints",
  intro:"Facts, not opinions. Discover any of these in two months and the work breaks.",
  reveal:false, mins:20,
  cards:[
    { id:"b5-master", type:"choice", q:"Is Arabic the master or the translation?",
      note:"Under SAMA rules the Arabic version of consumer-facing financial communication is the legally authoritative one.",
      opts:["Arabic is the master","English is the master","Equal authority, designed together","Not settled"] },

    { id:"b5-lockup", type:"choice", q:"What shape does the bilingual logo take?",
      note:"Four options. Only one can be primary.",
      opts:["One lockup carrying both scripts","Two separate logos sharing a DNA","A neutral symbol plus a wordmark per language","Not settled"] },

    { id:"b5-register", type:"choice", q:"Which Arabic register?",
      note:"Tamara generated separate routes per calligraphic style. The choice carries meaning, not just form.",
      opts:["Naskh — flowing, traditional, readable","Kufic — geometric, architectural, rooted","Ruqaa — quick, modern, everyday","Contemporary neutral","No view — show us"] },

    { id:"b5-neighbors", type:"multi", q:"Whose logos will lite’s sit next to?",
      note:"This governs weight and colour before a single sketch.",
      opts:["mada","Visa","Mastercard","SAMA","Partner banks","Merchant checkouts","Nobody’s"] },

    { id:"b5-smallest", type:"multi", q:"Where must the mark still work at its smallest?",
      note:"Tamara’s bilingual lockup had to share one width — because it lives inside a payment button.",
      opts:["16px app icon","POS terminal screen","Physical card face","Partner “powered by” strip","Inside a checkout button","Embroidery / single colour"] },

    { id:"b5-dark", type:"choice", q:"Is the product interface light or dark?",
      note:"",
      opts:["Light","Dark","Both — the user chooses","Not decided"] },

    { id:"b5-ratio", type:"choice", q:"Is the purple the page, or the button?",
      note:"Wise Platform reserved its brightest colour for calls to action only. Brex governs its orange by ratio.",
      opts:["The page — colour should dominate","The button — colour as a governed accent","Open — recommend to us"] }
  ]},

{ id:"B6", n:"06", name:"Visual vocabulary",
  intro:"Three images. No wrong answers. Write quickly and don’t edit yourself — the first word is usually the true one.",
  reveal:true, mins:25,
  cards:[
    { id:"b6-pool", type:"pool", q:"Describe each image.",
      note:"Four prompts per image. One or two words each is enough." },

    { id:"b6-title", type:"write", q:"Now take one word you SAW and one word you FELT, and put them together.",
      note:"That pair is the beginning of the stylescape.", ph:"e.g. quiet weight · warm structure" },

    { id:"b6-simple", type:"write", q:"When you use a word like “simple” about lite — what does it actually mean to you?",
      note:"And what colours come to mind with it?", ph:"…" }
  ]}

];
