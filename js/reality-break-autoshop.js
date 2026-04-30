// Reality Break Auto Shop v2.
// Safe automatic shop buyer for Progress Knight: Reality Break.

const REALITY_BREAK_AUTOSHOP_KEY = "progress-knight-reality-break-autoshop-v1";
const REALITY_BREAK_AUTOSHOP_RESERVE = 0.1;

function rbReadAutoShopEnabled() {
  try { return localStorage.getItem(REALITY_BREAK_AUTOSHOP_KEY) === "1"; }
  catch (error) { return false; }
}

function rbWriteAutoShopEnabled(value) {
  try { localStorage.setItem(REALITY_BREAK_AUTOSHOP_KEY, value ? "1" : "0"); }
  catch (error) {}
}

function rbCanUseAutoShop() {
  if (typeof gameData === "undefined" || !gameData.taskData || !gameData.taskData.Merchant) return false;
  return (gameData.taskData.Merchant.level || 0) >= 100;
}

function rbCurrentIncome() {
  if (typeof gameData === "undefined" || !gameData.currentJob) return 0;
  return gameData.currentJob.getIncome();
}

function rbCurrentNet() {
  if (typeof getExpense !== "function") return 0;
  return rbCurrentIncome() - getExpense();
}

function rbReserveNet() {
  return Math.max(1, rbCurrentIncome() * REALITY_BREAK_AUTOSHOP_RESERVE);
}

function rbPropertyNetAfter(property) {
  var current = gameData.currentProperty;
  var currentExpense = current ? current.getExpense() : 0;
  var nextExpense = property.getExpense();
  return rbCurrentNet() + currentExpense - nextExpense;
}

function rbMiscNetAfter(misc) {
  return rbCurrentNet() - misc.getExpense();
}

function rbOwnedMiscNames() {
  return (gameData.currentMisc || []).map(function (item) { return item.name; });
}

function rbPropertyCandidates() {
  if (typeof itemCategories === "undefined" || !gameData || !gameData.itemData || !gameData.currentProperty) return [];
  var currentEffect = gameData.currentProperty.getEffect ? gameData.currentProperty.getEffect() : 1;
  return itemCategories.Properties
    .map(function (name) { return gameData.itemData[name]; })
    .filter(Boolean)
    .filter(function (item) { return item !== gameData.currentProperty; })
    .filter(function (item) { return item.getEffect() > currentEffect; })
    .map(function (item) {
      return { type: "property", item: item, afterNet: rbPropertyNetAfter(item), score: item.getEffect() / Math.max(1, item.getExpense()) };
    });
}

function rbMiscCandidates() {
  if (typeof itemCategories === "undefined" || !gameData || !gameData.itemData) return [];
  var owned = rbOwnedMiscNames();
  return itemCategories.Misc
    .map(function (name) { return gameData.itemData[name]; })
    .filter(Boolean)
    .filter(function (item) { return owned.indexOf(item.name) === -1; })
    .map(function (item) {
      return { type: "misc", item: item, afterNet: rbMiscNetAfter(item), score: item.getEffect() / Math.max(1, item.getExpense()) };
    });
}

function rbBestCandidate(list) {
  var reserve = rbReserveNet();
  var safe = list.filter(function (entry) { return entry.afterNet > reserve; });
  safe.sort(function (a, b) { return b.score - a.score; });
  return safe[0] || null;
}

function rbNextBlockedCandidate(list) {
  if (!list.length) return null;
  list.sort(function (a, b) { return b.score - a.score; });
  return list[0];
}

function rbPlanAutoShopPurchase() {
  if (!rbCanUseAutoShop()) {
    return { action: null, reason: "Unlocks at Merchant level 100." };
  }
  if (typeof gameData === "undefined" || !gameData.currentJob) {
    return { action: null, reason: "Waiting for game data." };
  }

  var properties = rbPropertyCandidates();
  var property = rbBestCandidate(properties);
  if (property) return { action: property, reason: "Ready." };

  var miscItems = rbMiscCandidates();
  var misc = rbBestCandidate(miscItems);
  if (misc) return { action: misc, reason: "Ready." };

  var blocked = rbNextBlockedCandidate(properties.concat(miscItems));
  if (blocked) {
    return { action: blocked, reason: "Waiting: would drop Net/day below the 10% reserve." };
  }

  return { action: null, reason: "All safe purchases are already active." };
}

function rbAutoShopTick() {
  if (!rbReadAutoShopEnabled()) return;
  var plan = rbPlanAutoShopPurchase();
  if (!plan.action || plan.reason !== "Ready.") return;

  if (plan.action.type === "property") setProperty(plan.action.item.name);
  else if (plan.action.type === "misc") setMisc(plan.action.item.name);
}

function rbInstallAutoShopPanel() {
  var automation = document.getElementById("automation");
  if (!automation || document.getElementById("realityBreakAutoShop")) return;

  var wrapper = document.createElement("span");
  wrapper.id = "realityBreakAutoShop";
  wrapper.innerHTML = '' +
    '<div class="rb-title">Auto-shop</div>' +
    '<label><span>Enabled</span><input type="checkbox" id="realityBreakAutoShopToggle"></label>' +
    '<div class="rb-note" id="realityBreakAutoShopNote"></div>';
  automation.appendChild(document.createElement("br"));
  automation.appendChild(wrapper);

  var toggle = document.getElementById("realityBreakAutoShopToggle");
  toggle.checked = rbReadAutoShopEnabled();
  toggle.addEventListener("change", function () { rbWriteAutoShopEnabled(toggle.checked); });
}

function rbUpdateAutoShopPanel() {
  var box = document.getElementById("realityBreakAutoShop");
  var toggle = document.getElementById("realityBreakAutoShopToggle");
  var note = document.getElementById("realityBreakAutoShopNote");
  if (!box || !toggle || !note) return;

  var unlocked = rbCanUseAutoShop();
  toggle.disabled = !unlocked;
  box.classList.toggle("locked", !unlocked);

  var plan = rbPlanAutoShopPurchase();
  if (!unlocked) {
    note.textContent = plan.reason;
  } else if (plan.action) {
    note.textContent = "Next: " + plan.action.item.name + " — " + plan.reason;
  } else {
    note.textContent = plan.reason;
  }
}

function installRealityBreakAutoShop() {
  rbInstallAutoShopPanel();
  rbUpdateAutoShopPanel();
  if (!window.__realityBreakAutoShopInterval) {
    window.__realityBreakAutoShopInterval = setInterval(function () {
      rbInstallAutoShopPanel();
      rbUpdateAutoShopPanel();
      rbAutoShopTick();
    }, 1000);
  }
}

window.addEventListener("load", installRealityBreakAutoShop);
installRealityBreakAutoShop();
