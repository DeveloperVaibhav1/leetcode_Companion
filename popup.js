
document.addEventListener("DOMContentLoaded", () => {
  loadProgress();
  setupActions();
});

function loadProgress() {
  chrome.runtime.sendMessage({ type: "GET_PROGRESS" }, (res) => {
    const loadingEl = document.getElementById("loading-state");
    const mainEl = document.getElementById("main-content");

    if (!res || !res.success) {
  
      if (loadingEl) loadingEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-text">No progress tracked yet.<br>Open a LeetCode problem to get started!</div>
        </div>
      `;
      return;
    }

    const { counts, streak } = res.data;

    setTimeout(() => {
      if (loadingEl) loadingEl.style.display = "none";
      if (mainEl) {
        mainEl.style.display = "block";
        mainEl.style.animation = "none"; 
        mainEl.offsetHeight; 
        mainEl.style.animation = "";
      }

      
      animateCount("total-count", counts.total);
      animateCount("easy-count", counts.easy);
      animateCount("medium-count", counts.medium);
      animateCount("hard-count", counts.hard);
      animateCount("streak-stat", streak || 0);
      animateCount("streak-count", streak || 0);

      
      setDonutChart(counts.easy, counts.medium, counts.hard);
      document.getElementById("donut-total").textContent = counts.total;


      document.getElementById("legend-easy").textContent = counts.easy;
      document.getElementById("legend-medium").textContent = counts.medium;
      document.getElementById("legend-hard").textContent = counts.hard;

      
      setProgressBar("prog-easy-n", "prog-easy-bar", counts.easy, 800);
      setProgressBar("prog-med-n", "prog-med-bar", counts.medium, 1600);
      setProgressBar("prog-hard-n", "prog-hard-bar", counts.hard, 700);

    }, 300);
  });
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 900;
  const start = performance.now();
  const from = 0;

  requestAnimationFrame(function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (target - from) * ease);
    if (progress < 1) requestAnimationFrame(tick);
  });
}

function setDonutChart(easy, medium, hard) {
  const total = easy + medium + hard;
  const circumference = 2 * Math.PI * 38; 
  const C = circumference;

  if (total === 0) return;

  const easyFrac = easy / total;
  const medFrac = medium / total;
  const hardFrac = hard / total;

  

  const easyLen = easyFrac * C;
  const medLen = medFrac * C;
  const hardLen = hardFrac * C;

  const gapFactor = total > 1 ? 0.015 : 0;

  const arcEasy = document.getElementById("arc-easy");
  const arcMedium = document.getElementById("arc-medium");
  const arcHard = document.getElementById("arc-hard");

  setArc(arcEasy, easyLen, C, 0);
  setArc(arcMedium, medLen, C, easyLen + (gapFactor * C));
  setArc(arcHard, hardLen, C, easyLen + medLen + (gapFactor * C * 2));
}

function setArc(el, fillLen, C, offsetAngle) {
  if (!el) return;
  const gap = C - fillLen;
  el.setAttribute("stroke-dasharray", `${fillLen} ${gap}`);
  const deg = (offsetAngle / C) * 360;
  el.style.transform = `rotate(${-90 + deg}deg)`;
}

function setProgressBar(countId, barId, value, total) {
  const nEl = document.getElementById(countId);
  const barEl = document.getElementById(barId);
  if (nEl) nEl.textContent = value;
  if (barEl) {
    const pct = Math.min((value / total) * 100, 100);
    setTimeout(() => { barEl.style.width = pct + "%"; }, 100);
  }
}

function setupActions() {
  document.getElementById("open-lc-btn")?.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://leetcode.com/problemset/" });
  });

  document.getElementById("toggle-sidebar-btn")?.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "TOGGLE_SIDEBAR" }, () => {
          if (chrome.runtime.lastError) {
            chrome.tabs.create({ url: "https://leetcode.com/problems/two-sum/" });
          }
        });
      }
    });
    window.close();
  });
}
