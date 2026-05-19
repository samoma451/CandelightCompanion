console.log("SCRIPT LOADED");

// ----------------------------
// Safe DOM helper
// ----------------------------

function getEl(selector) {
  const el = document.querySelector(selector);
  if (!el) console.warn(`[UI] Missing element: ${selector}`);
  return el;
}

// ----------------------------
// Global state
// ----------------------------

const state = {
  task: "No task set",
  mood: "idle",
  background: null
};

// ----------------------------
// TIMER MODULE
// ----------------------------

const Timer = (() => {
  const data = {
    duration: 25 * 60,
    remaining: 25 * 60,
    interval: null,
    running: false
  };

  const el = getEl(".timer");

  function format(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function render() {
    if (!el) return;
    el.textContent = format(data.remaining);
  }

  function start(setMood) {
    if (data.running) return;

    data.running = true;
    setMood("focus");

    data.interval = setInterval(() => {
      data.remaining--;
      render();

      if (data.remaining <= 0) {
        stop();
        data.remaining = 0;
        render();
        setMood("celebrate");
        alert("Pomodoro complete 🎉");
      }
    }, 1000);
  }

  function stop(setMood) {
    data.running = false;
    clearInterval(data.interval);
    if (setMood) setMood("idle");
  }

  function reset(setMood) {
    stop();
    data.remaining = data.duration;
    render();
    if (setMood) setMood("idle");
  }

  function init() {
    render();
  }

  return { start, stop, reset, init };
})();

// ----------------------------
// BACKGROUND MODULE
// ----------------------------

const Background = (() => {
  const BACKGROUNDS = [
    "assets/images/bgRed.png",
    "assets/images/bgBlue.png",
    "assets/images/bgGreen.png"
  ];

  const DEFAULT = BACKGROUNDS[0];

  const el = getEl(".background");

  function set(url) {
    if (!el) return;

    el.style.backgroundImage = `url("${url}")`;
    localStorage.setItem("selectedBackground", url);
  }

  function load() {
    const saved = localStorage.getItem("selectedBackground");
    const bg = BACKGROUNDS.includes(saved) ? saved : DEFAULT;
    set(bg);
  }

  function next() {
    const current =
      localStorage.getItem("selectedBackground") || DEFAULT;

    const index = BACKGROUNDS.indexOf(current);
    const next = BACKGROUNDS[(index + 1) % BACKGROUNDS.length];

    set(next);
  }

  return { load, next };
})();

// ----------------------------
// MOOD SYSTEM
// ----------------------------

function setMood(mood) {
  state.mood = mood;

  const scene = getEl(".scene");
  if (scene) {
    scene.dataset.mood = mood;
  }

  console.log("Mood:", mood);
}

// ----------------------------
// UI BINDINGS
// ----------------------------

function bindUI() {
  const startBtn = getEl("#startBtn");
  const pauseBtn = getEl("#pauseBtn");
  const resetBtn = getEl("#resetBtn");

  const settingsBtn = getEl("#settingsBtn");
  const addTaskBtn = getEl("#addTaskBtn");

  startBtn?.addEventListener("click", () => Timer.start(setMood));
  pauseBtn?.addEventListener("click", () => Timer.stop(setMood));
  resetBtn?.addEventListener("click", () => Timer.reset(setMood));

  settingsBtn?.addEventListener("click", () => {
    Background.next();
    alert("Background changed");
  });

  addTaskBtn?.addEventListener("click", () => {
    const task = prompt("Enter task:");
    if (task) state.task = task
    console.log("Task added:", state.task);
  });
}

// ----------------------------
// INIT
// ----------------------------

function init() {
  Timer.init();
  Background.load();
  bindUI();
  setMood("idle");
}

init();