// Reality Break meta-layer scaffold.
// Deployed from gh-pages. Keep this file self-contained and safe for the original Progress Knight runtime.

var REALITY_BREAK_SAVE_KEY = "progress-knight-reality-break-meta-v1";
var REALITY_BREAK_ADMIN_SPEED_KEY = "progress-knight-reality-break-admin-speed-v1";
var REALITY_BREAK_ORIGINAL_BASE_SPEED = 4;
var REALITY_BREAK_DEFAULT_SPEED_MULTIPLIER = 5;
var REALITY_BREAK_ADMIN_SPEEDS = [5, 10, 50, 100];

var REALITY_BREAK_DEFAULT_META = {
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
    var raw = localStorage.getItem(REALITY_BREAK_SAVE_KEY);
    if (!raw) return cloneRealityBreakDefaultMeta();
    return { ...cloneRealityBreakDefaultMeta(), ...JSON.parse(raw) };
  } catch {
    return cloneRealityBreakDefaultMeta();
  }
}

function saveRealityBreakMeta(meta) {
  localStorage.setItem(REALITY_BREAK_SAVE_KEY, JSON.stringify({ ...cloneRealityBreakDefaultMeta(), ...meta }));
}

function getRealityBreakAdminSpeedMultiplier() {
  try {
    var stored = Number(localStorage.getItem(REALITY_BREAK_ADMIN_SPEED_KEY) || REALITY_BREAK_DEFAULT_SPEED_MULTIPLIER);
    return REALITY_BREAK_ADMIN_SPEEDS.indexOf(stored) >= 0 ? stored : REALITY_BREAK_DEFAULT_SPEED_MULTIPLIER;
  } catch (error) {
    return REALITY_BREAK_DEFAULT_SPEED_MULTIPLIER;
  }
}

function setRealityBreakAdminSpeedMultiplier(value) {
  var speed = Number(value);
  if (REALITY_BREAK_ADMIN_SPEEDS.indexOf(speed) < 0) speed = REALITY_BREAK_DEFAULT_SPEED_MULTIPLIER;
  try { localStorage.setItem(REALITY_BREAK_ADMIN_SPEED_KEY, String(speed)); } catch (error) {}
  updateRealityBreakAdminPanel();
}

function realityBreakTimeWarpSpeed() {
  if (typeof gameData === "undefined") return 1;
  var timeWarping = gameData.taskData && gameData.taskData["Time warping"];
  return gameData.timeWarpingEnabled && timeWarping ? timeWarping.getEffect() : 1;
}

function realityBreakAliveFlag() {
  return typeof isAlive === "function" ? +isAlive() : 1;
}

function realityBreakGameSpeed() {
  if (typeof gameData === "undefined") return 0;
  var adminMultiplier = getRealityBreakAdminSpeedMultiplier();
  return REALITY_BREAK_ORIGINAL_BASE_SPEED * adminMultiplier * +!gameData.paused * realityBreakAliveFlag() * realityBreakTimeWarpSpeed();
}

function realityBreakApplySpeed(value) {
  var divisor = typeof updateSpeed === "number" ? updateSpeed : 20;
  return value * realityBreakGameSpeed() / divisor;
}

function installRealityBreakSpeedTuning() {
  if (typeof window === "undefined") return;
  try { getGameSpeed = realityBreakGameSpeed; } catch (error) {}
  try { applySpeed = realityBreakApplySpeed; } catch (error) {}
  window.getGameSpeed = realityBreakGameSpeed;
  window.applySpeed = realityBreakApplySpeed;
}

function canBreakReality() {
  if (typeof gameData === "undefined") return false;
  var evil = gameData.evil || 0;
  var chairman = (gameData.taskData && gameData.taskData.Chairman && gameData.taskData.Chairman.level) || 0;
  var timeWarping = (gameData.taskData && gameData.taskData["Time warping"] && gameData.taskData["Time warping"].level) || 0;
  var superImmortality = (gameData.taskData && gameData.taskData["Super immortality"] && gameData.taskData["Super immortality"].level) || 0;
  return evil >= 1200 && chairman >= 10 && timeWarping >= 100 && superImmortality >= 35;
}

function getRealityBreakMetaverseGain() {
  if (typeof gameData === "undefined") return 0;
  var evil = gameData.evil || 0;
  var tasks = Object.values(gameData.taskData || {});
  var highestJobLevel = Math.max.apply(null, [0].concat(tasks.filter(function(task) { return task instanceof Job; }).map(function(task) { return task.level || 0; })));
  var highestSkillLevel = Math.max.apply(null, [0].concat(tasks.filter(function(task) { return task instanceof Skill; }).map(function(task) { return task.level || 0; })));
  return Math.max(0, Math.floor(Math.sqrt(evil) + highestJobLevel / 20 + highestSkillLevel / 25));
}

function installRealityBreakAdminPanel(settings) {
  if (!settings || document.getElementById("realityBreakAdminPanel")) return;
  var wrapper = document.createElement("li");
  wrapper.id = "realityBreakAdminPanel";
  wrapper.innerHTML = '' +
    '<h2>Admin Panel</h2>' +
    '<div style="color: gray; margin-bottom: 8px">Temporary testing controls.</div>' +
    '<div>Game speed: <b id="rbAdminSpeedLabel"></b></div>' +
    '<div id="rbAdminSpeedButtons" style="margin-top: 8px"></div>';
  settings.querySelector("ul")?.prepend(wrapper);

  var buttons = document.getElementById("rbAdminSpeedButtons");
  REALITY_BREAK_ADMIN_SPEEDS.forEach(function(speed) {
    var button = document.createElement("button");
    button.className = "w3-button button rb-admin-speed-button";
    button.style.marginRight = "6px";
    button.style.marginBottom = "6px";
    button.textContent = "x" + speed;
    button.addEventListener("click", function() { setRealityBreakAdminSpeedMultiplier(speed); });
    buttons.appendChild(button);
  });
}

function updateRealityBreakAdminPanel() {
  var active = getRealityBreakAdminSpeedMultiplier();
  var label = document.getElementById("rbAdminSpeedLabel");
  if (label) label.textContent = "x" + active;

  var buttons = Array.prototype.slice.call(document.getElementsByClassName("rb-admin-speed-button"));
  buttons.forEach(function(button) {
    var isActive = button.textContent === "x" + active;
    button.style.borderColor = isActive ? "rgb(225, 165, 0)" : "#dedede";
    button.style.color = isActive ? "rgb(225, 165, 0)" : "#ffffff";
    button.style.fontWeight = isActive ? "bold" : "normal";
  });
}

function installRealityBreakMetaPanel(settings) {
  var meta = loadRealityBreakMeta();
  if (!settings || document.getElementById("realityBreakMetaPanel")) return;

  var wrapper = document.createElement("li");
  wrapper.id = "realityBreakMetaPanel";
  wrapper.innerHTML = `
    <h2>Reality Break</h2>
    <div style="color: gray; margin-bottom: 8px">
      Early scaffold. This panel tracks the future multiverse layer without changing original Progress Knight yet.
    </div>
    <div>Base game speed: <b>x${getRealityBreakAdminSpeedMultiplier()}</b></div>
    <div>Universe: <b id="rbUniverse">${meta.currentUniverse}</b></div>
    <div>Highest universe: <b id="rbHighestUniverse">${meta.highestUniverse}</b></div>
    <div>Metaverse points: <b id="rbMetaPoints">${meta.metaversePoints}</b></div>
    <div id="rbBreakHint" style="color: gray; margin-top: 8px"></div>
  `;
  settings.querySelector("ul")?.prepend(wrapper);
}

function updateRealityBreakMetaPanel() {
  var hint = document.getElementById("rbBreakHint");
  if (!hint) return;
  var gain = getRealityBreakMetaverseGain();
  hint.textContent = canBreakReality()
    ? `Reality Break is ready. Estimated collapse gain: ${gain} MP.`
    : "Reality Break locked. Progress through Evil, Chairman, Time warping and Super immortality first.";

  var metaPanel = document.getElementById("realityBreakMetaPanel");
  if (metaPanel) {
    var speedLine = metaPanel.querySelector("div:nth-of-type(2) b");
    if (speedLine) speedLine.textContent = "x" + getRealityBreakAdminSpeedMultiplier();
  }
}

function installRealityBreakMetaScaffold() {
  installRealityBreakSpeedTuning();
  var settings = document.getElementById("settings");
  installRealityBreakAdminPanel(settings);
  installRealityBreakMetaPanel(settings);
  updateRealityBreakAdminPanel();
  if (!window.__realityBreakMetaInterval) {
    window.__realityBreakMetaInterval = setInterval(function() {
      installRealityBreakSpeedTuning();
      updateRealityBreakAdminPanel();
      updateRealityBreakMetaPanel();
    }, 250);
  }
}

installRealityBreakSpeedTuning();
window.addEventListener("load", installRealityBreakMetaScaffold);
