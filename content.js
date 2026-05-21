(function () {
  "use strict";
  if (document.getElementById("lcp-root")) return;

  const COMPANY_COLOR_MAP = {
    
    "amazon":         "#FF9900", "google":          "#4285F4",
    "meta":           "#1877F2", "facebook":        "#1877F2",
    "microsoft":      "#00A4EF", "apple":           "#888888",
    "netflix":        "#E50914", "nvidia":          "#76B900",
    
    "bloomberg":      "#E47400", "goldman-sachs":   "#7399C6",
    "jpmorgan":       "#003087", "morgan-stanley":  "#0033A0",
    "jane-street":    "#2B5DA6", "citadel":         "#00305A",
    "two-sigma":      "#1A1A2E", "de-shaw":         "#1E4D8C",
    "palantir":       "#101010", "stripe":          "#6772E5",
    "square":         "#00D64F", "paypal":          "#003087",
    "visa":           "#1A1F71", "mastercard":      "#EB001B",
    
    "uber":           "#000000", "lyft":            "#FF00BF",
    "doordash":       "#FF3008", "instacart":       "#43B02A",
    "grubhub":        "#F63440",
    
    "twitter":        "#1DA1F2", "tiktok":          "#69C9D0",
    "snapchat":       "#FFFC00", "reddit":          "#FF4500",
    "pinterest":      "#E60023", "linkedin":        "#0A66C2",
    "discord":        "#5865F2",
    
    "salesforce":     "#00A1E0", "servicenow":      "#62D84E",
    "workday":        "#00467F", "snowflake":       "#29B5E8",
    "databricks":     "#FF3621", "cloudflare":      "#F6821F",
    "elastic":        "#00BFB3", "splunk":          "#65A637",
    "hashicorp":      "#7B42BC",
    
    "walmart-labs":   "#0071CE", "target":          "#CC0000",
    "shopify":        "#96BF48", "ebay":            "#E53238",
    "wayfair":        "#7B189F", "chewy":           "#F0531C",
    
    "adobe":          "#FF0000", "oracle":          "#C74634",
    "ibm":            "#006699", "intel":           "#0071C5",
    "qualcomm":       "#3253DC", "cisco":           "#049FD9",
    "vmware":         "#607078", "palo-alto-networks":"#FA582D",
    "crowdstrike":    "#EC1C24", "zscaler":         "#3D7DBF",
    "okta":           "#007DC1",
    
    "airbnb":         "#FF5A5F", "expedia":         "#FEC10E",
    "booking-com":    "#003580", "tripadvisor":     "#34E0A1",
    "zoom":           "#2D8CFF", "slack":           "#4A154B",
    "atlassian":      "#0052CC", "hubspot":         "#FF7A59",
    "zendesk":        "#03363D", "twilio":          "#F22F46",
    "coinbase":       "#0052FF", "robinhood":       "#00C805",
    "rippling":       "#3B6CE4", "gusto":           "#F45D2B",
    "figma":          "#A259FF", "notion":          "#000000",
    "asana":          "#FC636B", "dropbox":         "#0061FF",
    "box":            "#0061D5", "docusign":        "#2DB5B2",
    "infosys":        "#007CC3", "wipro":           "#341C74",
    "tcs":            "#C00", "cognizant":          "#0033A0",
    "accenture":      "#A100FF",
    
    "default":        "#6366F1",
  };

  function getCompanyColor(slug, name) {
    const key = (slug || "").toLowerCase();
    const nameKey = (name || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    return COMPANY_COLOR_MAP[key] || COMPANY_COLOR_MAP[nameKey] || COMPANY_COLOR_MAP["default"];
  }

  const TRENDING = [
    {name:"Amazon",   slug:"amazon",        count:1967},
    {name:"Google",   slug:"google",        count:2259},
    {name:"Meta",     slug:"meta",          count:1385},
    {name:"Microsoft",slug:"microsoft",     count:1375},
    {name:"Bloomberg",slug:"bloomberg",     count:1180},
    {name:"Apple",    slug:"apple",         count:311},
    {name:"Goldman Sachs",slug:"goldman-sachs",count:260},
    {name:"TikTok",   slug:"tiktok",        count:356},
    {name:"Uber",     slug:"uber",          count:362},
    {name:"LinkedIn", slug:"linkedin",      count:179},
    {name:"Salesforce",slug:"salesforce",   count:192},
    {name:"Adobe",    slug:"adobe",         count:158},
    {name:"Airbnb",   slug:"airbnb",        count:62},
    {name:"Nvidia",   slug:"nvidia",        count:134},
    {name:"Snowflake",slug:"snowflake",     count:101},
    {name:"Walmart Labs",slug:"walmart-labs",count:143},
    {name:"Netflix",  slug:"netflix",       count:89},
    {name:"Oracle",   slug:"oracle",        count:72},
    {name:"Twitter",  slug:"twitter",       count:165},
    {name:"Lyft",     slug:"lyft",          count:112},
    {name:"Pinterest",slug:"pinterest",     count:95},
    {name:"Citadel",  slug:"citadel",       count:88},
    {name:"Stripe",   slug:"stripe",        count:77},
    {name:"JPMorgan", slug:"jpmorgan",      count:145},
    {name:"Dropbox",  slug:"dropbox",       count:68},
  ].map(c => ({ ...c, color: getCompanyColor(c.slug, c.name) }));

  const S = {
    slug:"", title:"", difficulty:"", tags:[],
    companies:[], frequency:7, theme:"dark",
    tab:"insights", collapsed:false,
    aiMsgs:[], note:"",
    companyData:null, companyProblems:{},
    companyView:null,
    isProblems:false, isProblemset:false,
  };

  const $ = (s,c=document)=>c.querySelector(s);
  const $$ = (s,c=document)=>[...c.querySelectorAll(s)];
  const esc = s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const db = (fn,ms)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };
  const companyKey = name => name?.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"") || "";
  const diffClass = d => d==="Easy"?"lcp-easy":d==="Hard"?"lcp-hard":"lcp-medium";
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
      ?`body{margin-right:${w}px!important;overflow-x:hidden!important;transition:margin-right .3s cubic-bezier(.32,.72,0,1)!important}`
      :`body{margin-right:0!important;overflow-x:visible!important;transition:margin-right .3s cubic-bezier(.32,.72,0,1)!important}`;
  }

  function extractProblem(){
    const m=location.pathname.match(/\/problems\/([^/]+)/);
    S.slug=m?m[1]:"";
    const sels=['[data-cy="question-title"]','.text-title-large','h4[data-cypress="question-title"]',
                '.mr-2.text-label-1','.question-title'];
    for(const s of sels){ const el=$(s); if(el){ S.title=el.textContent.trim(); break; } }
    if(!S.title) S.title=S.slug.split("-").map(w=>w[0].toUpperCase()+w.slice(1)).join(" ");
    const dsels=['.text-difficulty-easy','.text-difficulty-medium','.text-difficulty-hard'];
    for(const s of dsels){ const el=$(s); if(el){
      const t=el.textContent; S.difficulty=t.includes("Easy")?"Easy":t.includes("Hard")?"Hard":"Medium"; break;
    }}
    if(!S.difficulty) S.difficulty="Medium";
    S.tags=$$("[href*='/tag/']").map(t=>t.textContent.trim()).filter(Boolean);
  }



  function getCsrfToken(){
    const m=document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return m?m[1]:"";
  }

  async function lcGraphQL(query, variables={}){
    const res = await fetch("https://leetcode.com/graphql/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-csrftoken": getCsrfToken(),
        "Referer": "https://leetcode.com/",
      },
      body: JSON.stringify({ query, variables }),
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if(json.errors?.length) throw new Error(json.errors[0]?.message || "GraphQL error");
    return json.data;
  }

  function cachedFetch(cacheKey, ttlMs, fetcher){
    return new Promise(resolve => {
      chrome.storage.local.get([cacheKey], async result => {
        const hit = result[cacheKey];
        if(hit && (Date.now() - hit.ts) < ttlMs){
          resolve(hit.data); return;
        }
        try{
          const data = await fetcher();
          if(data !== null && data !== undefined)
            chrome.storage.local.set({ [cacheKey]: { data, ts: Date.now() } });
          resolve(data);
        } catch(e){
          console.warn("[LCP] fetch failed, using stale cache:", e.message);
          resolve(hit?.data ?? null);
        }
      });
    });
  }


  const PROBLEM_QUERY = `
    query lcpProblemData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        difficulty
        topicTags { name slug }
      }
    }
  `;

  async function loadCompanyTagsFromGraphQL(){
    const data = await cachedFetch(
      `lcp_gql_prob_${S.slug}`, CACHE_TTL,
      () => lcGraphQL(PROBLEM_QUERY, { titleSlug: S.slug })
    );
    if(!data?.question) return false;

    const q = data.question;

    if(q.topicTags?.length){
      S.tags = q.topicTags.map(t => t.name);
    }

    if(q.difficulty) S.difficulty = q.difficulty;

    return true;
  }

  const COMPANY_PROBLEMS_QUERY = `
    query lcpCompanyTag($slug: String!) {
      companyTag(slug: $slug) {
        name
        slug
        questions {
          frequency
          question {
            questionFrontendId
            title
            titleSlug
            difficulty
            isPaidOnly
          }
        }
      }
    }
  `;

  async function fetchCompanyProblemsFromAPI(slug){
    const data = await cachedFetch(
      `lcp_gql_co_${slug}`, CACHE_TTL,
      () => lcGraphQL(COMPANY_PROBLEMS_QUERY, { slug })
    );

    const questions = data?.companyTag?.questions;
    if(!questions) return null; 

    return questions
      .filter(item => item?.question)
      .sort((a,b) => (b.frequency||0) - (a.frequency||0))
      .map(item => ({
        id:         item.question.questionFrontendId,
        slug:       item.question.titleSlug,
        title:      item.question.title,
        difficulty: item.question.difficulty,
        frequency:  item.frequency ? parseFloat(item.frequency.toFixed(2)) : null,
        isPaidOnly: item.question.isPaidOnly,
      }));
  }

  

  const SLUG_OVERRIDES = {
    "walmart":   "walmart-labs",
    "twitterx":  "twitter",
    "twitter/x": "twitter",
  };

  function resolveCompanySlug(name) {
    const raw = companyKey(name);
    return SLUG_OVERRIDES[raw] || raw;
  }

  async function loadCompanyTags(){
    try {
      await loadCompanyTagsFromGraphQL();
    } catch(e){
      console.warn("[LCP] GraphQL problem query failed:", e.message);
    }

   
    if(!S.companies.length){
      try{
        const r=await fetch(chrome.runtime.getURL("data/company_tags.json"));
        if(!r.ok) throw 0;
        S.companyData=await r.json();
        const e=S.companyData[S.slug];
        if(e?.companies){
          S.companies=e.companies.map(c=>({
            ...c,
            slug: c.slug || resolveCompanySlug(c.name),
            color: c.color || getCompanyColor(resolveCompanySlug(c.name), c.name),
          }));
        }
        if(e?.frequency) S.frequency=e.frequency;
        if(!S.tags.length && e?.tags) S.tags=e.tags;
      }catch(err){ console.warn("[LCP] JSON fallback failed:", err.message); }
    }
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

  function buildTrendingChips(){
    return TRENDING.map(c=>`
      <button class="lcp-co-chip lcp-co-clickable" data-company="${esc(c.name)}" data-slug="${esc(c.slug)}"
              title="${esc(c.name)} — ${c.count}+ problems">
        <span class="lcp-co-dot" style="background:${c.color}"></span>
        ${esc(c.name)}
        <span class="lcp-co-cnt">${c.count}+</span>
      </button>`).join('');
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
           <span>${['📊','🏢','✨','📝'][i]}</span>${t[0].toUpperCase()+t.slice(1)}
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
            <div class="lcp-section-hd">🏷️ Topics
              <span class="lcp-api-badge" id="lcp-tags-badge" style="display:none">live</span>
            </div>
            <div class="lcp-tags" id="lcp-tags"></div>
          </div>
          <div class="lcp-card" id="lcp-ins-companies" style="display:none">
            <div class="lcp-section-hd">🏢 Asked by Companies
              <span class="lcp-api-badge" id="lcp-co-badge" style="display:none">live</span>
            </div>
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
            <div class="lcp-section-hd">🏢 This Problem — Asked by
              <span class="lcp-api-badge" id="lcp-co-prob-badge" style="display:none">live</span>
            </div>
            <p class="lcp-muted" style="margin-bottom:10px;font-size:11px">
              Data fetched live from LeetCode. Click a company to see all their problems.
            </p>
            <div class="lcp-company-chips" id="lcp-co-chips">
              <div class="lcp-co-loading">
                <div class="lcp-sk" style="height:28px;border-radius:14px;width:80px;display:inline-block"></div>
                <div class="lcp-sk" style="height:28px;border-radius:14px;width:95px;display:inline-block"></div>
                <div class="lcp-sk" style="height:28px;border-radius:14px;width:70px;display:inline-block"></div>
              </div>
            </div>
            <div id="lcp-co-nodata" style="display:none;text-align:center;padding:12px 0">
              <div style="font-size:26px;margin-bottom:6px">🔍</div>
              <p style="font-size:11px;color:var(--lcp-muted)">Not tagged to any company in LeetCode's public data.</p>
            </div>
          </div>
          <div class="lcp-card">
            <div class="lcp-section-hd">🔥 All Companies — Browse Problems</div>
            <p class="lcp-muted" style="margin-bottom:10px;font-size:11px">
              Full problem lists fetched live from LeetCode's API, sorted by frequency.
            </p>
            <div class="lcp-company-chips" id="lcp-trending-chips">${buildTrendingChips()}</div>
          </div>
        </div>

        <div id="lcp-co-detail" style="display:none">
          <div class="lcp-detail-header">
            <button class="lcp-back-btn" id="lcp-back-btn">← Back</button>
            <span class="lcp-detail-title" id="lcp-detail-title">Company</span>
          </div>
          <div class="lcp-search-wrap" id="lcp-search-wrap" style="display:none">
            <input class="lcp-search" id="lcp-prob-search" type="text" placeholder="Filter problems…">
          </div>
          <div class="lcp-prob-count" id="lcp-prob-count"></div>
          <div class="lcp-prob-list" id="lcp-prob-list"></div>
        </div>
      </div>

      <div class="lcp-pane" id="lcp-pane-ai">
        <div class="lcp-card" style="margin-bottom:9px">
          <div class="lcp-section-hd">✨ AI Assistant</div>
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
          <div class="lcp-section-hd">⌨️ Markdown Quick Ref</div>
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
          <p class="lcp-muted" style="margin-bottom:10px;font-size:11px">
            All problems fetched live from LeetCode's API, sorted by interview frequency.
          </p>
          <div class="lcp-company-chips" id="lcp-trending-chips">${buildTrendingChips()}</div>
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
        <div class="lcp-search-wrap" id="lcp-search-wrap" style="display:none">
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


  async function renderCompanyDetail(root, companyName, companySlug){
    S.companyView = companyName;
    const slug = companySlug || resolveCompanySlug(companyName);

    const listEl   = $("#lcp-co-list", root);
    const detailEl = $("#lcp-co-detail", root);
    const titleEl  = $("#lcp-detail-title", root);
    const countEl  = $("#lcp-prob-count", root);
    const probList = $("#lcp-prob-list", root);
    const searchWrap = $("#lcp-search-wrap", root);
    const searchEl = $("#lcp-prob-search", root);
    if(!detailEl) return;

    if(listEl) listEl.style.display = "none";
    detailEl.style.display = "block";
    if(titleEl) titleEl.textContent = companyName;
    if(searchWrap) searchWrap.style.display = "none";
    if(countEl) countEl.textContent = "";

    if(probList) probList.innerHTML = `
      <div class="lcp-co-loading-full">
        <div class="lcp-spinner"></div>
        <div class="lcp-loading-text">Fetching all problems from LeetCode…</div>
        <div class="lcp-sk" style="height:40px;border-radius:8px;margin:4px 0"></div>
        <div class="lcp-sk" style="height:40px;border-radius:8px;margin:4px 0"></div>
        <div class="lcp-sk" style="height:40px;border-radius:8px;margin:4px 0;width:85%"></div>
      </div>`;

    let problems = S.companyProblems[slug] ?? null;

    if(!problems){
      try {
        problems = await fetchCompanyProblemsFromAPI(slug);
        if(problems) S.companyProblems[slug] = problems;
      } catch(e) {
        console.warn("[LCP] Company API failed:", e.message);
      }
    }

    if(!problems || !problems.length){
      try {
        const r = await fetch(chrome.runtime.getURL("data/company_problems.json"));
        if(r.ok){
          const json = await r.json();
          const raw = json[slug];
          problems = Array.isArray(raw) ? raw : (raw?.problems || []);
          if(problems.length) S.companyProblems[slug] = problems;
        }
      } catch{  }
    }

    if(S.companyView !== companyName) return;

    function renderList(filter=""){
      if(!problems || !problems.length){
        if(countEl) countEl.textContent = "";
        if(probList) probList.innerHTML = `
          <div class="lcp-no-probs">
            <div style="font-size:28px;margin-bottom:8px">🏢</div>
            No problem data found for ${esc(companyName)}.<br>
            <span style="color:var(--lcp-muted);font-size:10px">
              This company's data may require LeetCode Premium, or the slug may differ.
            </span>
          </div>`;
        return;
      }
      const f = filter.toLowerCase();
      const filtered = f
        ? problems.filter(p => p.title?.toLowerCase().includes(f) || String(p.id||"").includes(f))
        : problems;
      if(countEl) countEl.textContent = `${filtered.length} problem${filtered.length!==1?"s":""} — ${problems.length} total`;
      if(searchWrap) searchWrap.style.display = "block";
      if(!probList) return;
      if(!filtered.length){
        probList.innerHTML = `<div class="lcp-no-probs">No problems match "${esc(filter)}".</div>`;
        return;
      }
      probList.innerHTML = filtered.map(p=>`
        <a class="lcp-prob-row" href="https://leetcode.com/problems/${p.slug}/" target="_blank" rel="noopener">
          <span class="lcp-prob-num">${p.id||"—"}</span>
          <span class="lcp-prob-name">${esc(p.title||"Untitled")}${p.isPaidOnly?'<span class="lcp-premium">🔒</span>':''}</span>
          <span class="lcp-prob-right">
            ${p.frequency != null ? `<span class="lcp-freq-pill">${p.frequency.toFixed(1)}%</span>` : ''}
            <span class="lcp-prob-diff ${diffClass(p.difficulty)}">${p.difficulty||"?"}</span>
          </span>
        </a>`).join('');
    }

    renderList();

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


  function populateInsights(root, fromAPI=false){
    const t=$("#lcp-ptitle",root), d=$("#lcp-diff",root),
          ff=$("#lcp-freq-fill",root), fv=$("#lcp-freq-val",root),
          tags=$("#lcp-tags",root);
    if(t) t.textContent=S.title;
    if(d){ d.textContent=S.difficulty; d.className=`lcp-diff ${S.difficulty}`; }
    const f=parseFloat(S.frequency)||7;
    if(ff){ ff.style.width="0%"; requestAnimationFrame(()=>requestAnimationFrame(()=>{ ff.style.width=`${f*10}%`; })); }
    if(fv) fv.textContent=f.toFixed(1);

    if(tags){
      tags.innerHTML = S.tags.length
        ? S.tags.map(t=>`<span class="lcp-tag">${esc(t)}</span>`).join('')
        : `<span class="lcp-muted" style="font-size:11px">No tags found.</span>`;
    }
    const tagsBadge = $("#lcp-tags-badge", root);
    if(tagsBadge && fromAPI) tagsBadge.style.display = "inline-block";

    const insCoCard = $("#lcp-ins-companies", root);
    const insChips  = $("#lcp-ins-chips", root);
    const coBadge   = $("#lcp-co-badge", root);
    if(insCoCard && insChips){
      if(S.companies.length){
        insCoCard.style.display="block";
        insChips.innerHTML = S.companies.map(c=>`
          <button class="lcp-co-chip lcp-co-clickable" data-company="${esc(c.name)}"
                  data-slug="${esc(c.slug||companyKey(c.name))}" data-goto-companies="1"
                  style="border-color:${c.color}22">
            <span class="lcp-co-dot" style="background:${c.color}"></span>${esc(c.name)}
          </button>`).join('');
        if(coBadge && fromAPI) coBadge.style.display = "inline-block";
      } else {
        insCoCard.style.display="block";
        insChips.innerHTML = `<span class="lcp-muted" style="font-size:11px">No company data for this problem.</span>`;
      }
    }

    const sk=$("#lcp-sk-wrap",root), ct=$("#lcp-ins-content",root);
    if(sk) sk.style.display="none";
    if(ct) ct.style.display="block";
  }

  
  function populateCompanies(root, fromAPI=false){
    const chips  = $("#lcp-co-chips", root);
    const nodata = $("#lcp-co-nodata", root);
    const badge  = $("#lcp-co-prob-badge", root);
    if(!chips) return;

    if(!S.companies.length){
      chips.innerHTML = "";
      if(nodata) nodata.style.display="block";
      return;
    }
    if(badge && fromAPI) badge.style.display = "inline-block";
    chips.innerHTML = S.companies.map(c=>`
      <button class="lcp-co-chip lcp-co-clickable" data-company="${esc(c.name)}"
              data-slug="${esc(c.slug||companyKey(c.name))}" style="border-color:${c.color}33">
        <span class="lcp-co-dot" style="background:${c.color}"></span>
        ${esc(c.name)}
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
      const slug = chip.dataset.slug;
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
      renderCompanyDetail(root, name, slug);
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
    if(!S.collapsed) document.body.classList.add("lcp-sidebar-open");
    else document.body.classList.remove("lcp-sidebar-open");
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
        document.body.classList.add("lcp-sidebar-open");
        pushLayout(true, root.offsetWidth||340);
      }
    });

    if(S.isProblems) loadAll(root);
  }

  async function loadAll(root){
    extractProblem();
    await Promise.all([loadCompanyTags(), loadNote()]);
    const fromAPI = S.companies.length > 0 || S.tags.length > 0;
    populateInsights(root, fromAPI);
    populateCompanies(root, fromAPI);
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
        document.body.classList.remove("lcp-sidebar-open");
        setTimeout(inject,900);
      }
    }
  }).observe(document.body,{childList:true,subtree:true});

  if(document.readyState==="loading")
    document.addEventListener("DOMContentLoaded",()=>setTimeout(inject,700));
  else setTimeout(inject,700);
})();
