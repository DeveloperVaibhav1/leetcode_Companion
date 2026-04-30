
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-sidebar") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "TOGGLE_SIDEBAR" });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_AI_RESPONSE") {
    handleAIRequest(message.payload)
      .then((response) => sendResponse({ success: true, data: response }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; 
  }

  if (message.type === "GET_PROBLEM_DATA") {
    getProblemData(message.slug)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === "SAVE_NOTE") {
    saveNote(message.slug, message.content)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === "GET_NOTE") {
    getNote(message.slug)
      .then((note) => sendResponse({ success: true, data: note }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === "UPDATE_PROGRESS") {
    updateProgress(message.payload)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === "GET_PROGRESS") {
    getProgress()
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});


async function handleAIRequest({ type, problemTitle, difficulty, tags }) {
  await delay(1200 + Math.random() * 800);

  const hints = {
    "Get Hint": generateHint(problemTitle, difficulty, tags),
    "Explain Solution": generateExplanation(problemTitle, difficulty, tags),
  };
  return hints[type] || "Here is a helpful insight for this problem.";
}

function generateHint(title, difficulty, tags) {
  const tagStr = tags?.join(", ") || "arrays";
  const diffMap = {
    Easy: "Start with a simple brute-force approach, then optimize.",
    Medium: "Think about which data structure reduces lookup time to O(1).",
    Hard: "Consider a divide-and-conquer or dynamic programming approach.",
  };
  return `💡 **Hint for "${title}"**\n\n${diffMap[difficulty] || "Break the problem into smaller subproblems."}\n\nRelevant concepts: **${tagStr}**.\n\nTry drawing out the problem on paper first — visualizing the input/output often reveals the pattern.`;
}

function generateExplanation(title, difficulty, tags) {
  return `🧠 **Solution Approach for "${title}"**\n\n**Complexity:** This is a ${difficulty || "Medium"} problem.\n\n**Strategy:**\n1. Understand the constraints and edge cases\n2. Choose an optimal data structure (${tags?.[0] || "HashMap"} is often key here)\n3. Implement iteratively to avoid stack overflow\n\n**Time Complexity:** O(n) average case\n**Space Complexity:** O(n)\n\nThe key insight is to process each element exactly once using a sliding window / two-pointer / hash map pattern depending on the specific variant.`;
}

function saveNote(slug, content) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [`note_${slug}`]: { content, updatedAt: Date.now() } }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

function getNote(slug) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([`note_${slug}`], (result) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(result[`note_${slug}`] || null);
    });
  });
}

function updateProgress(payload) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["lcp_progress"], (result) => {
      const current = result.lcp_progress || { solved: {}, streak: 0, lastDate: null };
      const today = new Date().toDateString();

      if (!current.solved[payload.slug]) {
        current.solved[payload.slug] = { difficulty: payload.difficulty, solvedAt: Date.now() };
        if (current.lastDate === today) {
        } else if (current.lastDate === new Date(Date.now() - 86400000).toDateString()) {
          current.streak = (current.streak || 0) + 1;
        } else {
          current.streak = 1;
        }
        current.lastDate = today;
      }

      chrome.storage.local.set({ lcp_progress: current }, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve();
      });
    });
  });
}

function getProgress() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["lcp_progress"], (result) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else {
        const p = result.lcp_progress || { solved: {}, streak: 0 };
        const counts = { easy: 0, medium: 0, hard: 0, total: 0 };
        for (const v of Object.values(p.solved || {})) {
          const d = (v.difficulty || "").toLowerCase();
          if (counts[d] !== undefined) counts[d]++;
          counts.total++;
        }
        resolve({ ...p, counts });
      }
    });
  });
}

function getProblemData(slug) {
  return new Promise((resolve) => {
    chrome.storage.local.get([`problem_${slug}`], (result) => {
      resolve(result[`problem_${slug}`] || null);
    });
  });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

console.log("[LCP] Background service worker started.");
