// Reality Break meta-layer scaffold.
// Deployed from gh-pages. Keep this file self-contained and safe for the original Progress Knight runtime.

const REALITY_BREAK_SAVE_KEY = "progress-knight-reality-break-meta-v1";
const REALITY_BREAK_BASE_GAME_SPEED = 20;

const REALITY_BREAK_DEFAULT_META = {
  version: 1,
  realityBroken: false,
  highestUniverse: 1,
  currentUniverse: 1,
  metaversePoints: 0,
  observerUnlocked: false,
  observerPoints: 0,
  globalUpgrades: {
    stableMemory: 0,
    universalLabor: 0,
    arcaneCompass: 0,
    darkDividend: 0,
  },
  unlockedAt: null,
};

function cloneRealityBreakDefaultMeta() {
  return JSON.parse(JSON.stringify(REALITY_BREAK_DEFAULT_META));
}

function loadRealityBreakMeta() {
  try {
    const raw = localStorage.getItem(REALITY_BREAK_SAVE_KEY);
    if (!raw) return cloneRealityBreakDefaultMeta();
    return { ...cloneRealityBreakDefaultMeta(), ...JSON.parse(raw) };
  } catch {
    return cloneRealityBreakDefaultMeta();
  }
}

function saveRealityBreakMeta(meta) {
  localStorage.setItem(REALITY_BREAK_SAVE_KEY, JSON.stringify({ ...cloneRealityBreakDefaultMeta(), ...meta }));
}

function realityBreakTimeWarpSpeed() {
  if (typeof gameData === "undefined") return 1;
  const timeWarping = gameData.taskData?.["Time warping"];
  return gameData.timeWarpingEnabled && timeWarping ? timeWarping.getEffect() : 1;
}

function realityBreakAliveFlag() {
  return typeof isAlive === "function" ? +isAlive() : 1;
}

function realityBreakGameSpeed() {
  if (typeof gameData === "undefined") return 0;
  return REALITY_BREAK_BASE_GAME_SPEED * +!gameData.paused * realityBreakAliveFlag() * realityBreakTimeWarpSpeed();
}

function realityBreakApplySpeed(value) {
  const speed = realityBreakGameSpeed();
  const divisor = typeof updateSpeed === "number" ? updateSpeed : 20;
  return value * speed / divisor;
}

function installRealityBreakSpeedTuning() {
  if (typeof window === "undefined") return;

  try { getGameSpeed = realityBreakGameSpeed; } catch {}
  try { applySpeed = realityBreakApplySpeed; } catch {}

  window.getGameSpeed = realityBreakGameSpeed;
  window.applySpeed = realityBreakApplySpeed;
}

function canBreakReality() {
  if (typeof gameData === "undefined") return false;
  const evil = gameData.evil || 0;
  const chairman = gameData.taskData?.Chairman?.level || 0;
  const timeWarping = gameData.taskData?.["Time warping"]?.level || 0;
  const superImmortality = gameData.taskData?.["Super immortality"]?.level || 0;
  return evil >= 1200 && chairman >= 10 && timeWarping >= 100 && superImmortality >= 35;
}

function getRealityBreakMetaverseGain() {
  if (typeof gameData === "undefined") return 0;
  const evil = gameData.evil || 0;
  const highestJobLevel = Math.max(...Object.values(gameData.taskData || {}).filter((task) => task instanceof Job).map((task) => task.level || 0), 0);
  const highestSkillLevel = Math.max(...Object.values(gameData.taskData || {}).filter((task) => task instanceof Skill).map((task) => task.level || 0), 0);
  return Math.max(0, Math.floor(Math.sqrt(evil) + highestJobLevel / 20 + highestSkillLevel / 25));
}

function installRealityBreakMetaPanel() {
  const meta = loadRealityBreakMeta();
  const settings = document.getElementById("settings");
  if (!settings || document.getElementById("realityBreakMetaPanel")) return;

  const wrapper = document.createElement("li");
  wrapper.id = "realityBreakMetaPanel";
  wrapper.innerHTML = `
    <h2>Reality Break</h2>
    <div style="color: gray; margin-bottom: 8px">
      Early scaffold. This panel tracks the future multiverse layer without changing original Progress Knight yet.
    </div>
    <div>Base game speed: <b>x5</b></div>
    <div>Universe: <b id="rbUniverse">${meta.currentUniverse}</b></div>
    <div>Highest universe: <b id="rbHighestUniverse">${meta.highestUniverse}</b></div>
    <div>Metaverse points: <b id="rbMetaPoints">${meta.metaversePoints}</b></div>
    <div id="rbBreakHint" style="color: gray; margin-top: 8px"></div>
  `;
  settings.querySelector("ul")?.prepend(wrapper);
}

function updateRealityBreakMetaPanel() {
  const hint = document.getElementById("rbBreakHint");
  if (!hint) return;
  const gain = getRealityBreakMetaverseGain();
  hint.textContent = canBreakReality()
    ? `Reality Break is ready. Estimated collapse gain: ${gain} MP.`
    : "Reality Break locked. Progress through Evil, Chairman, Time warping and Super immortality first.";
}

function installRealityBreakMetaScaffold() {
  installRealityBreakSpeedTuning();
  installRealityBreakMetaPanel();
  setInterval(() => {
    installRealityBreakSpeedTuning();
    updateRealityBreakMetaPanel();
  }, 250);
}

installRealityBreakSpeedTuning();
window.addEventListener("load", installRealityBreakMetaScaffold);
