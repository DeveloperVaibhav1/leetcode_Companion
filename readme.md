# 🧩 LC Companion Pro

> AI-powered Chrome sidebar for LeetCode — hints, notes, company tags, and progress tracking without leaving the problem page.

![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=google-chrome&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)
![Status](https://img.shields.io/badge/Status-In%20Development-orange)

---

## ✨ Features

- 🤖 **AI Hints** — contextual hints and explanations on demand
- 📝 **Auto-save Notes** — persist across sessions via `chrome.storage`
- 🏢 **Company Tags** — see which companies asked this problem (local DB, no API key)
- 🔓 **All Company Questions Unlocked** — browse the full problem list for 50+ top companies (Google, Meta, Amazon, Microsoft & more) — no LeetCode Premium required
- ✅ **Progress Tracking** — mark solved; stats show in the popup
- ⌨️ **`Alt+S` Shortcut** — toggle sidebar from anywhere
- 🌗 **Dark / Light Theme** — built-in theme toggle
- 🔄 **SPA-aware** — re-injects automatically on every problem navigation

---

## 📁 Structure

```
leetcode-companion-pro/
├── manifest.json
├── background.js
├── content.js
├── styles.css
├── popup.html
├── popup.js
├── data/
│   ├── company_tags.json
│   └── company_problems.json
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## 🚀 Installation

```bash
# 1. Clone
git clone https://github.com/developervaibhav1/lc-companion-pro.git

# 2. Go to chrome://extensions → enable Developer Mode

# 3. Click "Load unpacked" → select the project folder

# 4. Open any LeetCode problem and press Alt+S
```

---

## 🏗️ Architecture

Three isolated contexts communicate via Chrome's message-passing API:

```
content.js  ──sendMessage──▶  background.js  ──chrome.storage──▶  popup.js
(DOM / UI)                    (AI API calls)                       (Stats)
```

> Content scripts are sandboxed — no access to page JS globals. All cross-context communication goes through `chrome.runtime.sendMessage`.

---

## 🛠️ Tech

`Chrome MV3` · `Vanilla JS` · `chrome.storage.local` · `MutationObserver` · `CSS Custom Properties`

---

## 📄 License

MIT © LC Companion Pro Contributors