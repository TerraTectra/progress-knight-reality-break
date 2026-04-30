// Reality Break Metaverse Upgrades v1.
// Small first upgrade layer after the first Reality Break.

var REALITY_BREAK_UPGRADES = {
  stableMemory: {
    name: "Stable Memory",
    desc: "+8% all XP per level",
    baseCost: 1,
    scale: 2.15,
    effect: function(level) { return 1 + level * 0.08; }
  },
  universalLabor: {
    name: "Universal Labor",
    desc: "+10% job income per level",
    baseCost: 2,
    scale: 2.2,
    effect: function(level) { return 1 + level * 0.10; }
  },
  longEcho: {
    name: "Long Echo",
    desc: "+5% lifespan per level",
    baseCost: 3,
    scale: 2.35,
    effect: function(level) { return 1 + level * 0.05; }
  },
  darkDividend: {
    name: "Dark Dividend",
    desc: "+15% Evil gain per level",
    baseCost: 4,
    scale: 2.45,
    effect: function(level) { return 1 + level * 0.15; }
  }
};

function rbUpgradeLevel(id) {
  var meta = loadRealityBreakMeta();
  if (!meta.globalUpgrades) meta.globalUpgrades = {};
  return meta.globalUpgrades[id] || 0;
}

function rbUpgradeCost(id) {
  var up = REALITY_BREAK_UPGRADES[id];
  var level = rbUpgradeLevel(id);
  return Math.max(1, Math.floor(up.baseCost * Math.pow(up.scale, level)));
}

function rbUpgradeEffect(id) {
  var up = REALITY_BREAK_UPGRADES[id];
  return up.effect(rbUpgradeLevel(id));
}

function rbCanShowUpgrades() {
  var meta = loadRealityBreakMeta();
  return !!(meta.realityBroken || meta.metaversePoints > 0);
}

function rbBuyUpgrade(id) {
  var meta = loadRealityBreakMeta();
  if (!meta.globalUpgrades) meta.globalUpgrades = {};
  var cost = rbUpgradeCost(id);
  if ((meta.metaversePoints || 0) < cost) return;
  meta.metaversePoints -= cost;
  meta.globalUpgrades[id] = (meta.globalUpgrades[id] || 0) + 1;
  saveRealityBreakMeta(meta);
  rbUpdateUpgradePanel();
  if (typeof updateRealityBreakMetaPanel === "function") updateRealityBreakMetaPanel();
}

function rbPatchUpgradeEffects() {
  if (typeof Task !== "undefined" && !Task.prototype.__rbUpgradeXpPatched) {
    Task.prototype.__rbOriginalGetXpGain = Task.prototype.getXpGain;
    Task.prototype.getXpGain = function() {
      var value = this.__rbOriginalGetXpGain.apply(this, arguments);
      return Math.round(value * rbUpgradeEffect("stableMemory"));
    };
    Task.prototype.__rbUpgradeXpPatched = true;
  }

  if (typeof Job !== "undefined" && !Job.prototype.__rbUpgradeIncomePatched) {
    Job.prototype.__rbOriginalGetIncome = Job.prototype.getIncome;
    Job.prototype.getIncome = function() {
      var value = this.__rbOriginalGetIncome.apply(this, arguments);
      return Math.round(value * rbUpgradeEffect("universalLabor"));
    };
    Job.prototype.__rbUpgradeIncomePatched = true;
  }

  if (typeof getEvilGain === "function" && !window.__rbUpgradeEvilPatched) {
    window.__rbOriginalGetEvilGain = getEvilGain;
    getEvilGain = function() {
      return window.__rbOriginalGetEvilGain.apply(this, arguments) * rbUpgradeEffect("darkDividend");
    };
    window.getEvilGain = getEvilGain;
    window.__rbUpgradeEvilPatched = true;
  }

  if (typeof getLifespan === "function" && !window.__rbUpgradeLifespanPatched) {
    window.__rbOriginalGetLifespan = getLifespan;
    getLifespan = function() {
      return window.__rbOriginalGetLifespan.apply(this, arguments) * rbUpgradeEffect("longEcho");
    };
    window.getLifespan = getLifespan;
    window.__rbUpgradeLifespanPatched = true;
  }
}

function rbInstallUpgradePanel() {
  var settings = document.getElementById("settings");
  if (!settings || document.getElementById("realityBreakUpgradePanel")) return;
  var wrapper = document.createElement("li");
  wrapper.id = "realityBreakUpgradePanel";
  wrapper.innerHTML = '' +
    '<h2>Metaverse Upgrades</h2>' +
    '<div style="color: gray; margin-bottom: 8px">Permanent upgrades bought with Metaverse Points.</div>' +
    '<div>Metaverse points: <b id="rbUpgradePoints">0</b></div>' +
    '<div id="rbUpgradeList" style="margin-top: 8px"></div>';
  settings.querySelector("ul").prepend(wrapper);

  var list = document.getElementById("rbUpgradeList");
  Object.keys(REALITY_BREAK_UPGRADES).forEach(function(id) {
    var up = REALITY_BREAK_UPGRADES[id];
    var row = document.createElement("div");
    row.className = "rb-upgrade-row";
    row.style.marginBottom = "8px";
    row.innerHTML = '' +
      '<div><b>' + up.name + '</b> <span id="rbUpgradeLevel_' + id + '"></span></div>' +
      '<div style="color: gray">' + up.desc + '</div>' +
      '<div>Current: <b id="rbUpgradeEffect_' + id + '"></b></div>' +
      '<button class="w3-button button" id="rbUpgradeBuy_' + id + '" style="margin-top: 4px"></button>';
    list.appendChild(row);
    document.getElementById("rbUpgradeBuy_" + id).addEventListener("click", function() { rbBuyUpgrade(id); });
  });
}

function rbUpdateUpgradePanel() {
  var panel = document.getElementById("realityBreakUpgradePanel");
  if (panel) panel.style.display = rbCanShowUpgrades() ? "list-item" : "none";
  var meta = loadRealityBreakMeta();
  var points = document.getElementById("rbUpgradePoints");
  if (points) points.textContent = format(meta.metaversePoints || 0);

  Object.keys(REALITY_BREAK_UPGRADES).forEach(function(id) {
    var level = rbUpgradeLevel(id);
    var cost = rbUpgradeCost(id);
    var levelEl = document.getElementById("rbUpgradeLevel_" + id);
    var effectEl = document.getElementById("rbUpgradeEffect_" + id);
    var buy = document.getElementById("rbUpgradeBuy_" + id);
    if (levelEl) levelEl.textContent = "lvl " + level;
    if (effectEl) effectEl.textContent = "x" + rbUpgradeEffect(id).toFixed(2);
    if (buy) {
      buy.textContent = "Buy — " + format(cost) + " MP";
      buy.disabled = (meta.metaversePoints || 0) < cost;
    }
  });
}

function rbInstallMetaverseUpgrades() {
  rbPatchUpgradeEffects();
  rbInstallUpgradePanel();
  rbUpdateUpgradePanel();
  if (!window.__rbUpgradeInterval) {
    window.__rbUpgradeInterval = setInterval(function() {
      rbPatchUpgradeEffects();
      rbInstallUpgradePanel();
      rbUpdateUpgradePanel();
    }, 500);
  }
}

window.addEventListener("load", rbInstallMetaverseUpgrades);
rbInstallMetaverseUpgrades();
