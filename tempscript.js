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
  tasks: [],
  activeTaskId: null,
  mood: "idle",
  background: null
};

let taskListEl;

// ----------------------------
// TASK SYSTEM
// ----------------------------

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(state.tasks));
}

function loadTasks() {
  const saved = localStorage.getItem("tasks");
  if (!saved) return;

  try {
    state.tasks = JSON.parse(saved);
  } catch (e) {
    console.warn("Failed to load tasks", e);
    state.tasks = [];
  }
}

function addTask(text) {
  state.tasks.push({
    id: crypto.randomUUID(),
    text,
    completed: false
  });

  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;

  saveTasks();
  renderTasks();
}

function renderTasks() {
  if (!taskListEl) return;

  taskListEl.innerHTML = "";

  state.tasks.forEach(task => {
    const div = document.createElement("div");

    div.textContent = task.text;
    div.style.cursor = "pointer";
    div.style.textDecoration = task.completed ? "line-through" : "none";

    div.addEventListener("click", () => toggleTask(task.id));

    taskListEl.appendChild(div);
  });
}

// ----------------------------
// MOOD SYSTEM
// ----------------------------

function setMood(mood) {
  state.mood = mood;

  const scene = getEl(".scene");
  if (scene) scene.dataset.mood = mood;

  console.log("Mood:", mood);
}


// ----------------------------
// SPRITE MODULE (animations and that)
// ----------------------------

const Sprite = (() => {
  const el = document.querySelector(".sprite");

  const FRAME_WIDTH = 32;
  const TOTAL_FRAMES = 8;
  const FPS = 8; // animation speed

  let currentFrame = 0;
  let interval;

  function renderFrame() {
    const offset = currentFrame * FRAME_WIDTH;

    el.style.backgroundPosition = `-${offset}px 0px`;

    currentFrame = (currentFrame + 1) % TOTAL_FRAMES;
  }

  function start() {
    if (interval) return;

    interval = setInterval(renderFrame, 1000 / FPS);
  }

  function stop() {
    clearInterval(interval);
    interval = null;
  }

  return { start, stop };
})();

// ----------------------------
// TIMER MODULE (fixed state model)
// ----------------------------

const music = new Audio('assets/audio/Major3rd.wav');

const Timer = (() => {
  const DURATION = 25 * 60 * 1000;
  const el = () => getEl(".timer");

  function isChromeAvailable() {
    return typeof chrome !== "undefined" && chrome.storage?.local;
  }

function start() {
  if (!isChromeAvailable()) return;

  chrome.storage.local.get(["timer"], (res) => {
    const timer = res.timer;

    // CASE 1: resume from pause
    if (timer?.paused && typeof timer.remaining === "number") {
      chrome.storage.local.set({
        timer: {
          start: Date.now(),
          duration: timer.remaining,
          running: true,
          paused: false,
          remaining: null
        }
      });

      setMood("focus");
      
      render();
      return;
    }

    // CASE 2: fresh start
    chrome.storage.local.set({
      timer: {
        start: Date.now(),
        duration: DURATION,
        running: true,
        paused: false,
        remaining: null
      }
    });

    setMood("focus");
    music.volume = 0.1; 
    music.play();
    
    render();
  });
}

function stop() {
  if (!isChromeAvailable()) return;

  chrome.storage.local.get(["timer"], (res) => {
    const timer = res.timer;
    if (!timer) return;

    const elapsed = Date.now() - timer.start;
    const remaining = Math.max(0, timer.duration - elapsed);

    chrome.storage.local.set({
      timer: {
        ...timer,
        running: false,
        paused: true,
        remaining // freeze value at pause moment
      }
    });
  });

  setMood("idle");
}

  function reset() {
    if (!isChromeAvailable()) return;

    chrome.storage.local.set({
      timer: {
        start: null,
        duration: DURATION,
        running: false,
        paused: false
      }
    });

    setMood("idle");
    render(); // immediate UI update
  }

  function render() {
    const node = el();
    if (!node || !isChromeAvailable()) return;

    chrome.storage.local.get(["timer"], (res) => {
      const timer = res.timer;

      let remaining;

      if (!timer) {
        remaining = DURATION;
      } else if (timer.running) {
        const elapsed = Date.now() - timer.start;
        remaining = Math.max(0, timer.duration - elapsed);
      } else if (timer.paused && typeof timer.remaining === "number") {
        remaining = timer.remaining; //  frozen state
      } else {
        remaining = timer.duration;
      }

      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);

      node.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

      if (timer?.running && remaining <= 0) {
        chrome.storage.local.set({
          timer: { running: false, paused: false }
        });

        setMood("celebrate");
      }
    });
  }

  function init() {
    render();
    setInterval(render, 1000);
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

    state.background = url;
    el.style.backgroundImage = `url("${url}")`;
    localStorage.setItem("selectedBackground", url);
  }

  function load() {
    const saved = localStorage.getItem("selectedBackground");
    const bg = BACKGROUNDS.includes(saved) ? saved : DEFAULT;
    set(bg);
  }

  function next() {
    const current = localStorage.getItem("selectedBackground") || DEFAULT;
    const index = BACKGROUNDS.indexOf(current);
    const next = BACKGROUNDS[(index + 1) % BACKGROUNDS.length];

    set(next);
  }

  return { load, next };
})();

// ----------------------------
// UI BINDINGS
// ----------------------------

function bindUI() {
  const startBtn = getEl("#startBtn");
  const pauseBtn = getEl("#pauseBtn");
  const resetBtn = getEl("#resetBtn");
  const settingsBtn = getEl("#settingsBtn");
  const addTaskBtn = getEl("#addTaskBtn");

  startBtn?.addEventListener("click", Timer.start);
  pauseBtn?.addEventListener("click", Timer.stop);
  resetBtn?.addEventListener("click", Timer.reset);

  settingsBtn?.addEventListener("click", () => {
    Background.next();
    alert("Background changed");
  });

  addTaskBtn?.addEventListener("click", () => {
    const task = prompt("Enter task:");
    if (task) addTask(task);
  });
}

// ----------------------------
// INIT
// ----------------------------

function init() {
  taskListEl = getEl(".task-list");

  Sprite.start();

  loadTasks();
  renderTasks();

  Timer.init();
  Background.load();
  bindUI();

  setMood("idle");
}

init();