
(function () {
  "use strict";
  if (document.getElementById("lcp-root")) return;

  const COMPANY_KEYS = {
    "Amazon":"amazon","Google":"google","Meta":"meta","Facebook":"meta",
    "Microsoft":"microsoft","Apple":"apple","Bloomberg":"bloomberg",
    "Goldman Sachs":"goldman-sachs","Uber":"uber","LinkedIn":"linkedin",
    "Airbnb":"airbnb","TikTok":"tiktok","Adobe":"adobe","Salesforce":"salesforce",
    "Nvidia":"nvidia","Walmart Labs":"walmart-labs","Snowflake":"snowflake",
    "Pinterest":"pinterest","Citadel":"citadel","Infosys":"infosys","Visa":"visa",
    "Lyft":"lyft","Twitter":"twitter","Oracle":"oracle","Netflix":"netflix",
  };

  const TRENDING = [
    {name:"Amazon",   count:1967, color:"#FF9900"},
    {name:"Google",   count:2259, color:"#4285F4"},
    {name:"Meta",     count:1385, color:"#1877F2"},
    {name:"Microsoft",count:1375, color:"#00A4EF"},
    {name:"Bloomberg",count:1180, color:"#E47400"},
    {name:"Apple",    count:311,  color:"#888888"},
    {name:"Goldman Sachs", count:260, color:"#7399C6"},
    {name:"TikTok",   count:356,  color:"#69C9D0"},
    {name:"Uber",     count:362,  color:"#555555"},
    {name:"LinkedIn", count:179,  color:"#0A66C2"},
    {name:"Salesforce",count:192, color:"#00A1E0"},
    {name:"Adobe",    count:158,  color:"#FF0000"},
    {name:"Airbnb",   count:62,   color:"#FF5A5F"},
    {name:"Nvidia",   count:134,  color:"#76B900"},
    {name:"Snowflake",count:101,  color:"#29B5E8"},
    {name:"Walmart Labs",count:143,color:"#0071CE"},
  ];

  const S = {
    slug:"", title:"", difficulty:"", tags:[],
    companies:[], frequency:7, theme:"dark",
    tab:"insights", collapsed:false,
    aiMsgs:[], note:"",
    companyData:null, companyProblems:null,
    companyView:null,   
    isProblems:false, isProblemset:false,
  };

  
  const $ = (s,c=document)=>c.querySelector(s);
  const $$ = (s,c=document)=>[...c.querySelectorAll(s)];
  const esc = s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const db = (fn,ms)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };
  const companyKey = name => COMPANY_KEYS[name] || name.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
  const diffClass = d => d==="Easy"?"lcp-easy":d==="Hard"?"lcp-hard":"lcp-medium";

  function md(s){
    return s.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
            .replace(/`([^`]+)`/g,"<code>$1</code>")
            .replace(/^### (.+)$/gm,"<h3>$1</h3>")
            .replace(/^## (.+)$/gm,"<h2>$1</h2>")
            .replace(/^# (.+)$/gm,"<h1>$1</h1>")
            .replace(/^> (.+)$/gm,"<blockquote>$1</blockquote>")
            .replace(/^[-*] (.+)$/gm,"<li>$1</li>")
            .replace(/\n{2,}/g,"<br><br>").replace(/\n/g,"<br>");
  }


  function detect(){
    const p=location.pathname;
    S.isProblems=/\/problems\/[^/]+/.test(p);
    S.isProblemset=p.startsWith("/problemset");
    S.theme=document.documentElement.classList.contains("dark")||
            window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";
  }

  
  function pushLayout(open, w=340){
    let s=document.getElementById("lcp-layout");
    if(!s){ s=document.createElement("style"); s.id="lcp-layout"; document.head.appendChild(s); }
    s.textContent=open
      ?`body{margin-right:${w}px!important;transition:margin-right .3s cubic-bezier(.32,.72,0,1)!important}`
      :`body{margin-right:0!important;transition:margin-right .3s cubic-bezier(.32,.72,0,1)!important}`;
  }

  
  function extractProblem(){
    const m=location.pathname.match(/\/problems\/([^/]+)/);
    S.slug=m?m[1]:"";
    
    const sels=['[data-cy="question-title"]','.text-title-large','h4[data-cypress="question-title"]',
                '.mr-2.text-label-1','.question-title'];
    for(const s of sels){ const el=$(s); if(el){ S.title=el.textContent.trim(); break; } }
    if(!S.title) S.title=S.slug.split("-").map(w=>w[0].toUpperCase()+w.slice(1)).join(" ");

    const dsels=['.text-difficulty-easy','.text-difficulty-medium','.text-difficulty-hard','[diff]','[class*="difficulty"]'];
    for(const s of dsels){ const el=$(s); if(el){
      const t=el.textContent; S.difficulty=t.includes("Easy")?"Easy":t.includes("Hard")?"Hard":"Medium"; break;
    }}
    if(!S.difficulty) S.difficulty="Medium";
    
    S.tags=$$("[href*='/tag/']").map(t=>t.textContent.trim()).filter(Boolean).slice(0,8);
    if(!S.tags.length) S.tags=guessTags(S.slug);
  }

  function guessTags(slug){
    const m={"two-sum":["Hash Table","Array"],"reverse-linked-list":["Linked List","Recursion"],
             "binary-search":["Binary Search","Array"],"maximum-subarray":["DP","Array"],
             "climbing-stairs":["DP","Math"],"number-of-islands":["DFS","BFS"],
             "valid-parentheses":["Stack","String"],"best-time-to-buy-and-sell-stock":["Array","DP"],
             "product-of-array-except-self":["Array","Prefix Sum"],
             "two-furthest-houses-with-different-colors":["Array","Greedy"]};
    return m[slug]||["Array","Algorithm"];
  }

  
  async function loadCompanyTags(){
    try{
      const r=await fetch(chrome.runtime.getURL("data/company_tags.json"));
      if(!r.ok) throw 0;
      S.companyData=await r.json();
      const e=S.companyData[S.slug];
      S.companies=e?.companies||[];
      S.frequency=e?.frequency??parseFloat((5+Math.random()*4).toFixed(1));
    }catch{ S.companies=[]; S.frequency=7; }
  }

  async function loadCompanyProblems(){
    try{
      const r=await fetch(chrome.runtime.getURL("data/company_problems.json"));
      if(!r.ok) throw 0;
      S.companyProblems=await r.json();
    }catch{ S.companyProblems={}; }
  }

  async function loadNote(){
    return new Promise(res=>chrome.storage.local.get([`note_${S.slug}`],d=>{
      S.note=d[`note_${S.slug}`]?.content||""; res();
    }));
  }


  function skeleton(){
    return `
    <div class="lcp-card">
      <div class="lcp-sk lcp-sk-title"></div>
      <div class="lcp-sk lcp-sk-badge"></div>
    </div>
    <div class="lcp-card">
      <div class="lcp-sk" style="height:11px;width:55%;margin-bottom:9px"></div>
      <div class="lcp-sk" style="height:4px"></div>
    </div>
    <div class="lcp-card">
      <div class="lcp-sk" style="height:11px;width:45%;margin-bottom:9px"></div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        <div class="lcp-sk" style="height:22px;width:65px;border-radius:6px"></div>
        <div class="lcp-sk" style="height:22px;width:85px;border-radius:6px"></div>
        <div class="lcp-sk" style="height:22px;width:55px;border-radius:6px"></div>
      </div>
    </div>`;
  }

  function buildSidebar(){
    return `
<div id="lcp-root" class="lcp-${S.theme}">
  <div class="lcp-panel">
    <div id="lcp-dragger"></div>

    <div class="lcp-header">
      <div class="lcp-brand">
        <div class="lcp-brand-icon">⚡</div>
        <span class="lcp-brand-name">LC<span> Companion</span></span>
      </div>
      <div class="lcp-hbtns">
        <button class="lcp-hbtn" id="lcp-theme-btn" title="Toggle theme">🌙</button>
        <button class="lcp-hbtn" id="lcp-collapse-btn" title="Collapse  Alt+S">✕</button>
      </div>
    </div>

    <div class="lcp-tabs">
      ${['insights','companies','ai','notes'].map((t,i)=>
        `<button class="lcp-tab${i===0?' lcp-tab-active':''}" data-tab="${t}">
           <span>${['📊','🏢','🤖','📝'][i]}</span>${t[0].toUpperCase()+t.slice(1)}
         </button>`).join('')}
    </div>

    <div class="lcp-body">

      <div class="lcp-pane lcp-pane-active" id="lcp-pane-insights">
        <div id="lcp-sk-wrap">${skeleton()}</div>
        <div id="lcp-ins-content" style="display:none">
          <div class="lcp-card">
            <div class="lcp-lbl">Current Problem</div>
            <div class="lcp-prob-title" id="lcp-ptitle">—</div>
            <span class="lcp-diff" id="lcp-diff">—</span>
          </div>
          <div class="lcp-card">
            <div class="lcp-section-hd">📈 Interview Frequency</div>
            <div class="lcp-freq-row">
              <span class="lcp-freq-lbl">Score</span>
              <div class="lcp-freq-track"><div class="lcp-freq-fill" id="lcp-freq-fill"></div></div>
              <span class="lcp-freq-val" id="lcp-freq-val">—</span>
            </div>
          </div>
          <div class="lcp-card">
            <div class="lcp-section-hd">🏷️ Topics</div>
            <div class="lcp-tags" id="lcp-tags"></div>
          </div>
          <div class="lcp-card" id="lcp-ins-companies" style="display:none">
            <div class="lcp-section-hd">🏢 Asked by Companies</div>
            <div class="lcp-company-chips" id="lcp-ins-chips"></div>
          </div>
          <div class="lcp-card">
            <div class="lcp-section-hd">✅ Track Progress</div>
            <button class="lcp-btn lcp-btn-primary" id="lcp-solved-btn" style="width:100%">Mark as Solved</button>
          </div>
        </div>
      </div>

      <div class="lcp-pane" id="lcp-pane-companies">
        <div id="lcp-co-list">
          <div class="lcp-card" id="lcp-this-prob-co">
            <div class="lcp-section-hd">🏢 This Problem — Asked by</div>
            <p class="lcp-muted" style="margin-bottom:10px;font-size:11px">Click any company to browse their full problem list — no premium needed.</p>
            <div class="lcp-company-chips" id="lcp-co-chips"></div>
            <div id="lcp-co-nodata" style="display:none;text-align:center;padding:12px 0">
              <div style="font-size:26px;margin-bottom:6px">🔍</div>
              <p style="font-size:11px;color:var(--lcp-muted)">No data for this problem yet.</p>
            </div>
          </div>
          <div class="lcp-card">
            <div class="lcp-section-hd">🔥 All Companies — Browse Problems</div>
            <p class="lcp-muted" style="margin-bottom:10px;font-size:11px">Click to view company-specific problems. Works without LeetCode Premium!</p>
            <div class="lcp-company-chips" id="lcp-trending-chips">
              ${TRENDING.map(c=>`
                <button class="lcp-co-chip lcp-co-clickable" data-company="${esc(c.name)}" title="${esc(c.name)} — ${c.count} problems">
                  <span class="lcp-co-dot" style="background:${c.color}"></span>
                  ${esc(c.name)}
                  <span class="lcp-co-cnt">${c.count}</span>
                </button>`).join('')}
            </div>
          </div>
        </div>

        <div id="lcp-co-detail" style="display:none">
          <div class="lcp-detail-header">
            <button class="lcp-back-btn" id="lcp-back-btn">← Back</button>
            <span class="lcp-detail-title" id="lcp-detail-title">Company</span>
          </div>
          <div class="lcp-search-wrap">
            <input class="lcp-search" id="lcp-prob-search" type="text" placeholder="Filter problems…">
          </div>
          <div class="lcp-prob-count" id="lcp-prob-count"></div>
          <div class="lcp-prob-list" id="lcp-prob-list"></div>
        </div>
      </div>

      <div class="lcp-pane" id="lcp-pane-ai">
        <div class="lcp-card" style="margin-bottom:9px">
          <div class="lcp-section-hd">🤖 AI Assistant</div>
          <p class="lcp-muted" style="margin-bottom:11px;font-size:11px">Get strategic hints without spoiling the solution.</p>
          <div style="display:flex;gap:7px">
            <button class="lcp-btn lcp-btn-primary" id="lcp-hint-btn" style="flex:1">💡 Get Hint</button>
            <button class="lcp-btn lcp-btn-ghost" id="lcp-explain-btn" style="flex:1">🧠 Explain</button>
          </div>
        </div>
        <div class="lcp-card" style="min-height:120px">
          <div class="lcp-chat" id="lcp-chat">
            <div class="lcp-msg lcp-msg-ai">
              <div class="lcp-avatar lcp-avatar-ai">⚡</div>
              <div class="lcp-bubble">Hey! Click <strong>Get Hint</strong> for a nudge, or <strong>Explain</strong> for a walkthrough.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="lcp-pane" id="lcp-pane-notes">
        <div class="lcp-card">
          <div class="lcp-section-hd">📝 Problem Notes</div>
          <div class="lcp-toggle-row">
            <span class="lcp-muted" style="font-size:11px">Preview Markdown</span>
            <label class="lcp-switch">
              <input type="checkbox" id="lcp-md-toggle">
              <span class="lcp-track"></span>
            </label>
          </div>
          <textarea class="lcp-textarea" id="lcp-textarea"
            placeholder="## Notes&#10;- Key insight:&#10;- Approach:&#10;- Time: O(n) / Space: O(1)&#10;&#10;Use **markdown** for formatting."></textarea>
          <div class="lcp-preview" id="lcp-preview"></div>
          <div class="lcp-save-status" id="lcp-save-status">Auto-saved per problem</div>
        </div>
        <div class="lcp-card">
          <div class="lcp-section-hd">⌨️ Markdown</div>
          <div style="font-size:10px;color:var(--lcp-muted);line-height:2;font-family:var(--lcp-mono)">
            <code>**bold**</code> · <code>*italic*</code> · <code>\`code\`</code><br>
            <code># H1</code> · <code>- list</code> · <code>> quote</code>
          </div>
        </div>
      </div>

    </div>
    <div class="lcp-footer">
      <span>LeetCode Companion Pro</span>
      <span>Alt+S to toggle</span>
    </div>
  </div>
</div>
<div id="lcp-fab" title="Open Companion (Alt+S)" style="display:none">
  <div class="lcp-fab-dot"></div><div class="lcp-fab-dot"></div><div class="lcp-fab-dot"></div>
</div>`;
  }

  function buildProblemsetPanel(){
    return `
<div id="lcp-root" class="lcp-${S.theme}">
  <div class="lcp-panel">
    <div id="lcp-dragger"></div>
    <div class="lcp-header">
      <div class="lcp-brand">
        <div class="lcp-brand-icon">⚡</div>
        <span class="lcp-brand-name">LC<span> Companion</span></span>
      </div>
      <div class="lcp-hbtns">
        <button class="lcp-hbtn" id="lcp-theme-btn">🌙</button>
        <button class="lcp-hbtn" id="lcp-collapse-btn">✕</button>
      </div>
    </div>
    <div class="lcp-body">
      <div id="lcp-co-list">
        <div class="lcp-card">
          <div class="lcp-section-hd">🔥 Company Problem Lists</div>
          <p class="lcp-muted" style="margin-bottom:10px;font-size:11px">Browse problems by company — no LeetCode Premium needed!</p>
          <div class="lcp-company-chips" id="lcp-trending-chips">
            ${TRENDING.map(c=>`
              <button class="lcp-co-chip lcp-co-clickable" data-company="${esc(c.name)}" title="${esc(c.name)}">
                <span class="lcp-co-dot" style="background:${c.color}"></span>
                ${esc(c.name)}
                <span class="lcp-co-cnt">${c.count}</span>
              </button>`).join('')}
          </div>
        </div>
        <div class="lcp-card">
          <div class="lcp-section-hd">💡 Tip</div>
          <p class="lcp-muted" style="font-size:11px">Open any problem page for AI hints, notes, difficulty tracking and more.</p>
        </div>
      </div>
      <div id="lcp-co-detail" style="display:none">
        <div class="lcp-detail-header">
          <button class="lcp-back-btn" id="lcp-back-btn">← Back</button>
          <span class="lcp-detail-title" id="lcp-detail-title"></span>
        </div>
        <div class="lcp-search-wrap">
          <input class="lcp-search" id="lcp-prob-search" type="text" placeholder="Filter problems…">
        </div>
        <div class="lcp-prob-count" id="lcp-prob-count"></div>
        <div class="lcp-prob-list" id="lcp-prob-list"></div>
      </div>
    </div>
    <div class="lcp-footer"><span>LeetCode Companion Pro</span><span>Alt+S to toggle</span></div>
  </div>
</div>
<div id="lcp-fab" style="display:none">
  <div class="lcp-fab-dot"></div><div class="lcp-fab-dot"></div><div class="lcp-fab-dot"></div>
</div>`;
  }


  function renderCompanyDetail(root, companyName){
    S.companyView = companyName;
    const key = companyKey(companyName);
    const problems = (S.companyProblems && S.companyProblems[key]) || [];

    const listEl = $("#lcp-co-list", root);
    const detailEl = $("#lcp-co-detail", root);
    const titleEl = $("#lcp-detail-title", root);
    const countEl = $("#lcp-prob-count", root);
    const probList = $("#lcp-prob-list", root);

    if(!detailEl) return;
    if(listEl) listEl.style.display = "none";
    detailEl.style.display = "block";
    if(titleEl) titleEl.textContent = companyName;

    function renderList(filter=""){
      const f = filter.toLowerCase();
      const filtered = filter
        ? problems.filter(p=>p.title.toLowerCase().includes(f)||String(p.id).includes(f))
        : problems;
      if(countEl) countEl.textContent = `${filtered.length} problem${filtered.length!==1?"s":""} found`;
      if(!probList) return;
      if(!filtered.length){
        probList.innerHTML = `<div class="lcp-no-probs">No problems found${filter?' for "'+esc(filter)+'"':' for this company'}.</div>`;
        return;
      }
      probList.innerHTML = filtered.map(p=>`
        <a class="lcp-prob-row" href="https://leetcode.com/problems/${p.slug}/" target="_blank" rel="noopener">
          <span class="lcp-prob-num">${p.id}</span>
          <span class="lcp-prob-name">${esc(p.title)}</span>
          <span class="lcp-prob-diff ${diffClass(p.difficulty)}">${p.difficulty}</span>
        </a>`).join('');
    }

    renderList();

    const searchEl = $("#lcp-prob-search", root);
    if(searchEl){
      searchEl.value = "";
      searchEl.removeEventListener("input", searchEl._lcpHandler);
      searchEl._lcpHandler = db(()=>renderList(searchEl.value), 200);
      searchEl.addEventListener("input", searchEl._lcpHandler);
    }

    const backBtn = $("#lcp-back-btn", root);
    if(backBtn){
      backBtn.onclick = ()=>{
        S.companyView = null;
        detailEl.style.display = "none";
        if(listEl) listEl.style.display = "block";
      };
    }
  }


  function populateInsights(root){
    const t=$("#lcp-ptitle",root), d=$("#lcp-diff",root),
          ff=$("#lcp-freq-fill",root), fv=$("#lcp-freq-val",root),
          tags=$("#lcp-tags",root);
    if(t) t.textContent=S.title;
    if(d){ d.textContent=S.difficulty; d.className=`lcp-diff ${S.difficulty}`; }
    const f=parseFloat(S.frequency)||7;
    if(ff){ ff.style.width="0%"; requestAnimationFrame(()=>requestAnimationFrame(()=>{ ff.style.width=`${f*10}%`; })); }
    if(fv) fv.textContent=f.toFixed(1);
    if(tags) tags.innerHTML=S.tags.map(t=>`<span class="lcp-tag">${esc(t)}</span>`).join('');
    const insCoCard = $("#lcp-ins-companies", root);
    const insChips = $("#lcp-ins-chips", root);
    if(S.companies.length && insCoCard && insChips){
      insCoCard.style.display="block";
      insChips.innerHTML = S.companies.map(c=>`
        <button class="lcp-co-chip lcp-co-clickable" data-company="${esc(c.name)}" data-goto-companies="1"
                style="border-color:${c.color}22">
          <span class="lcp-co-dot" style="background:${c.color}"></span>${esc(c.name)}
          <span class="lcp-co-cnt">${c.frequency}%</span>
        </button>`).join('');
    }
    
    const sk=$("#lcp-sk-wrap",root), ct=$("#lcp-ins-content",root);
    if(sk) sk.style.display="none";
    if(ct) ct.style.display="block";
  }

 
  function populateCompanies(root){
    const chips=$("#lcp-co-chips",root), nodata=$("#lcp-co-nodata",root);
    if(!chips) return;
    if(!S.companies.length){
      chips.style.display="none";
      if(nodata) nodata.style.display="block";
      return;
    }
    chips.innerHTML=S.companies.map(c=>`
      <button class="lcp-co-chip lcp-co-clickable" data-company="${esc(c.name)}" style="border-color:${c.color}33">
        <span class="lcp-co-dot" style="background:${c.color}"></span>
        ${esc(c.name)}
        <span class="lcp-co-cnt">${c.frequency}%</span>
      </button>`).join('');
  }


  function setupTabs(root){
    $$(".lcp-tab",root).forEach(btn=>{
      btn.addEventListener("click",()=>{
        const t=btn.dataset.tab;
        $$(".lcp-tab",root).forEach(b=>b.classList.remove("lcp-tab-active"));
        $$(".lcp-pane",root).forEach(p=>p.classList.remove("lcp-pane-active"));
        btn.classList.add("lcp-tab-active");
        const pane=$(`#lcp-pane-${t}`,root);
        if(pane) pane.classList.add("lcp-pane-active");
        S.tab=t;
      });
    });
  }


  function setupCompanyClicks(root){
    root.addEventListener("click", e=>{
      const chip = e.target.closest(".lcp-co-clickable");
      if(!chip) return;
      const name = chip.dataset.company;
      if(!name) return;

      if(chip.dataset.gotoCompanies){
        $$(".lcp-tab",root).forEach(b=>b.classList.remove("lcp-tab-active"));
        $$(".lcp-pane",root).forEach(p=>p.classList.remove("lcp-pane-active"));
        const btn=$('.lcp-tab[data-tab="companies"]',root);
        const pane=$("#lcp-pane-companies",root);
        if(btn) btn.classList.add("lcp-tab-active");
        if(pane) pane.classList.add("lcp-pane-active");
        S.tab="companies";
      }
      renderCompanyDetail(root, name);
    });
  }


  function appendMsg(role, html, root){
    const chat=$("#lcp-chat",root); if(!chat) return;
    const d=document.createElement("div");
    d.className=`lcp-msg lcp-msg-${role}`;
    d.innerHTML=`<div class="lcp-avatar lcp-avatar-${role}">${role==="ai"?"⚡":"👤"}</div><div class="lcp-bubble">${html}</div>`;
    chat.appendChild(d); chat.scrollTop=chat.scrollHeight;
  }

  function appendTyping(root){
    const chat=$("#lcp-chat",root); if(!chat) return null;
    const d=document.createElement("div");
    d.className="lcp-msg lcp-msg-ai"; d.id="lcp-typing";
    d.innerHTML=`<div class="lcp-avatar lcp-avatar-ai">⚡</div><div class="lcp-bubble lcp-typing"><span></span><span></span><span></span></div>`;
    chat.appendChild(d); chat.scrollTop=chat.scrollHeight;
    return d;
  }

  async function doAI(type, root){
    const hb=$("#lcp-hint-btn",root), eb=$("#lcp-explain-btn",root);
    [hb,eb].forEach(b=>b&&(b.disabled=true));
    appendMsg("user", esc(type==="Get Hint"?"💡 Give me a hint":"🧠 Explain the approach"), root);
    const t=appendTyping(root);
    try{
      const r=await new Promise((res,rej)=>{
        chrome.runtime.sendMessage({type:"GET_AI_RESPONSE",payload:{type,problemTitle:S.title,difficulty:S.difficulty,tags:S.tags}},
          x=>{ if(chrome.runtime.lastError) rej(chrome.runtime.lastError); else if(!x.success) rej(new Error(x.error)); else res(x.data); });
      });
      t?.remove(); appendMsg("ai",md(r),root);
    }catch(e){ t?.remove(); appendMsg("ai",`Sorry, I hit an error: ${esc(e.message)}`,root); }
    [hb,eb].forEach(b=>b&&(b.disabled=false));
  }


  function setupNotes(root){
    const ta=$("#lcp-textarea",root), pr=$("#lcp-preview",root),
          tg=$("#lcp-md-toggle",root), st=$("#lcp-save-status",root);
    if(ta&&S.note) ta.value=S.note;
    const save=db(()=>{
      const v=ta?.value||"";
      if(st){st.textContent="Saving…";st.className="lcp-save-status saving";}
      chrome.storage.local.set({[`note_${S.slug}`]:{content:v,updatedAt:Date.now()}},()=>{
        if(st){st.textContent="✓ Saved";st.className="lcp-save-status saved";}
        setTimeout(()=>{ if(st){st.textContent="Auto-saved per problem";st.className="lcp-save-status";} },2e3);
      });
    },1200);
    ta?.addEventListener("input",()=>{ if(tg?.checked&&pr) pr.innerHTML=md(ta.value); save(); });
    tg?.addEventListener("change",()=>{
      if(tg.checked){ if(pr){pr.innerHTML=md(ta?.value||"");pr.classList.add("active");} if(ta) ta.style.display="none"; }
      else{ if(pr) pr.classList.remove("active"); if(ta) ta.style.display=""; }
    });
  }


  function setupResize(root){
    const h=$("#lcp-dragger",root); if(!h) return;
    let sx,sw;
    h.addEventListener("mousedown",e=>{ e.preventDefault(); sx=e.clientX; sw=root.offsetWidth;
      document.addEventListener("mousemove",mv); document.addEventListener("mouseup",up,{once:true});
    });
    function mv(e){ const w=Math.min(500,Math.max(280,sw+(sx-e.clientX))); root.style.width=w+"px"; pushLayout(!S.collapsed,w); }
    function up(){ document.removeEventListener("mousemove",mv); }
  }

  function toggle(){
    const root=document.getElementById("lcp-root"), fab=document.getElementById("lcp-fab");
    if(!root) return;
    S.collapsed=!S.collapsed;
    root.classList.toggle("lcp-hidden",S.collapsed);
    if(fab) fab.style.display=S.collapsed?"flex":"none";
    const btn=$("#lcp-collapse-btn",root);
    if(btn) btn.textContent=S.collapsed?"▶":"✕";
    pushLayout(!S.collapsed, root.offsetWidth||340);
    chrome.storage.local.set({lcp_collapsed:S.collapsed});
  }


  function setupSolved(root){
    const btn=$("#lcp-solved-btn",root); if(!btn) return;
    chrome.storage.local.get(["lcp_progress"],r=>{
      if(r.lcp_progress?.solved?.[S.slug]){
        btn.textContent="✓ Already Solved!"; btn.disabled=true;
      }
    });
    btn.addEventListener("click",()=>{
      chrome.runtime.sendMessage({type:"UPDATE_PROGRESS",payload:{slug:S.slug,difficulty:S.difficulty}},()=>{
        btn.textContent="✓ Marked as Solved!"; btn.disabled=true;
        btn.style.background="var(--lcp-green)";
      });
    });
  }

 
  function setupTheme(root){
    const btn=$("#lcp-theme-btn",root); if(!btn) return;
    btn.addEventListener("click",()=>{
      S.theme=S.theme==="dark"?"light":"dark";
      root.className=`lcp-${S.theme}`;
      btn.textContent=S.theme==="dark"?"🌙":"☀️";
    });
  }


  function inject(){
    if(document.getElementById("lcp-root")) return;
    detect();

    const wrap=document.createElement("div");
    wrap.innerHTML=S.isProblemset?buildProblemsetPanel():buildSidebar();
    while(wrap.firstElementChild) document.body.appendChild(wrap.firstElementChild);

    const root=document.getElementById("lcp-root");
    const fab=document.getElementById("lcp-fab");

    setupTabs(root);
    setupResize(root);
    setupTheme(root);
    setupCompanyClicks(root);

    const colBtn=$("#lcp-collapse-btn",root);
    if(colBtn) colBtn.addEventListener("click",toggle);
    if(fab) fab.addEventListener("click",toggle);

    if(S.isProblems){
      $("#lcp-hint-btn",root)?.addEventListener("click",()=>doAI("Get Hint",root));
      $("#lcp-explain-btn",root)?.addEventListener("click",()=>doAI("Explain Solution",root));
      setupNotes(root);
      setupSolved(root);
    }

    chrome.storage.local.get(["lcp_collapsed"],r=>{
      if(r.lcp_collapsed){
        S.collapsed=true; root.classList.add("lcp-hidden");
        if(fab) fab.style.display="flex"; pushLayout(false);
      } else {
        pushLayout(true, root.offsetWidth||340);
      }
    });

    if(S.isProblems) loadAll(root);
    if(S.isProblemset) loadCompanyProblems();
  }

  async function loadAll(root){
    extractProblem();
    await Promise.all([loadCompanyTags(), loadCompanyProblems(), loadNote()]);
    populateInsights(root);
    populateCompanies(root);
    setupNotes(root);
  }

  
  chrome.runtime.onMessage.addListener(m=>{ if(m.type==="TOGGLE_SIDEBAR") toggle(); });


  let lastUrl=location.href;
  new MutationObserver(()=>{
    if(location.href!==lastUrl){
      lastUrl=location.href;
      const p=location.pathname;
      if(/\/problems\/[^/]+/.test(p)||p.startsWith("/problemset")){
        ["lcp-root","lcp-fab","lcp-layout"].forEach(id=>document.getElementById(id)?.remove());
        setTimeout(inject,900);
      }
    }
  }).observe(document.body,{childList:true,subtree:true});

  if(document.readyState==="loading")
    document.addEventListener("DOMContentLoaded",()=>setTimeout(inject,700));
  else setTimeout(inject,700);
})();














// ne