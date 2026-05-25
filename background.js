const ALARM_FOCUS_COMPLETE = "focusTimerComplete";
const DIALOGUE_PATH = "assets/dialogue/dialogue.json";

const DEFAULT_STATE = {
  tasks: [],
  activeTaskId: null,
  timer: {
    mode: "idle",
    startTime: null,
    durationMinutes: 25,
    remainingMs: null
  },
  sessions: [],
  stats: {
    sessionsCompleted: 0,
    totalFocusMinutes: 0
  },
  companion: {
    mood: "idle",
    message: "Start when you're ready.",
    lastEventAt: null,
    lastReactionEvent: null,
    lastReactionMessage: null
  }
};

const FALLBACK_REACTIONS = {
  SESSION_COMPLETE: {
    mood: "celebrate",
    variants: [
      "That was a steady session.",
      "We made progress together.",
      "The work is enough for now."
    ]
  }
};

function mergeState(saved = {}) {
  return {
    ...DEFAULT_STATE,
    ...saved,
    timer: {
      ...DEFAULT_STATE.timer,
      ...(saved.timer || {})
    },
    stats: {
      ...DEFAULT_STATE.stats,
      ...(saved.stats || {})
    },
    companion: {
      ...DEFAULT_STATE.companion,
      ...(saved.companion || {})
    },
    tasks: Array.isArray(saved.tasks) ? saved.tasks : [],
    sessions: Array.isArray(saved.sessions) ? saved.sessions : []
  };
}

async function loadState() {
  const saved = await chrome.storage.local.get(DEFAULT_STATE);
  return mergeState(saved);
}

async function saveState(state) {
  await chrome.storage.local.set(state);
}

async function loadReactions() {
  try {
    const url = chrome.runtime.getURL(DIALOGUE_PATH);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Dialogue fetch failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.warn("[Dialogue] Falling back to built-in reactions", error);
    return FALLBACK_REACTIONS;
  }
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pickReaction(event, companion, reactions) {
  const reaction = reactions[event];

  if (!reaction || !Array.isArray(reaction.variants) || !reaction.variants.length) {
    return {
      mood: companion.mood,
      message: companion.message
    };
  }

  const available =
    reaction.variants.length > 1
      ? reaction.variants.filter(message => message !== companion.lastReactionMessage)
      : reaction.variants;

  const message = available[Math.floor(Math.random() * available.length)];

  return {
    mood: reaction.mood || companion.mood,
    message
  };
}

async function completeFocusSession() {
  const state = await loadState();
  const timer = state.timer;

  if (timer.mode !== "focus_active") return;

  const durationMinutes = timer.durationMinutes || DEFAULT_STATE.timer.durationMinutes;
  const endTime = Date.now();
  const reactions = await loadReactions();
  const reaction = pickReaction("SESSION_COMPLETE", state.companion, reactions);

  const nextState = {
    ...state,
    timer: {
      ...timer,
      mode: "session_complete",
      remainingMs: 0
    },
    sessions: [
      ...state.sessions,
      {
        id: createId(),
        taskId: state.activeTaskId,
        startTime: timer.startTime,
        endTime,
        durationMinutes,
        completed: true
      }
    ],
    stats: {
      sessionsCompleted: state.stats.sessionsCompleted + 1,
      totalFocusMinutes: state.stats.totalFocusMinutes + durationMinutes
    },
    companion: {
      mood: reaction.mood,
      message: reaction.message,
      lastEventAt: endTime,
      lastReactionEvent: "SESSION_COMPLETE",
      lastReactionMessage: reaction.message
    }
  };

  await saveState(nextState);
}

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name !== ALARM_FOCUS_COMPLETE) return;
  completeFocusSession();
});