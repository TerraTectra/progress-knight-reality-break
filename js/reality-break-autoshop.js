// Reality Break Auto Shop v3.1.
// Faster, progression-ordered, income-aware buyer for Progress Knight: Reality Break.
// Unlock is permanent after Merchant level 100, except hard/global reset.

const REALITY_BREAK_AUTOSHOP_KEY = "progress-knight-reality-break-autoshop-v1";
const REALITY_BREAK_AUTOSHOP_UNLOCK_KEY = "progress-knight-reality-break-autoshop-unlocked-v1";
const REALITY_BREAK_AUTOSHOP_RESERVE = 0.10;
const REALITY_BREAK_AUTOSHOP_TICK_MS = 250;
const REALITY_BREAK_AUTOSHOP_BURST_LIMIT = 12;

function rbReadAutoShopEnabled() {
  try { return localStorage.getItem(REALITY_BREAK_AUTOSHOP_KEY) === "1"; }
  catch (error) { return false; }
}

function rbWriteAutoShopEnabled(value) {
  try { localStorage.setItem(REALITY_BREAK_AUTOSHOP_KEY, value ? "1" : "0"); }
  catch (error) {}
}

function rbReadAutoShopUnlocked() {
  try { return localStorage.getItem(REALITY_BREAK_AUTOSHOP_UNLOCK_KEY) === "1"; }
  catch (error) { return false; }
}

function rbWriteAutoShopUnlocked(value) {
  try { localStorage.setItem(REALITY_BREAK_AUTOSHOP_UNLOCK_KEY, value ? "1" : "0"); }
  catch (error) {}
}

function rbClearAutoShopUnlockForGlobalReset() {
  try {
    localStorage.removeItem(REALITY_BREAK_AUTOSHOP_KEY);
    localStorage.removeItem(REALITY_BREAK_AUTOSHOP_UNLOCK_KEY);
  } catch (error) {}
}

function rbMerchantReachedAutoShopUnlock() {
  return !!(typeof gameData !== "undefined" && gameData.taskData && gameData.taskData.Merchant && (gameData.taskData.Merchant.level || 0) >= 100);
}

function rbCanUseAutoShop() {
  if (rbMerchantReachedAutoShopUnlock()) rbWriteAutoShopUnlocked(true);
  return rbReadAutoShopUnlocked();
}

function rbPatchGlobalResetForAutoShop() {
  if (window.__rbAutoShopResetPatched || typeof resetGameData !== "function") return;
  var originalResetGameData = resetGameData;
  resetGameData = function() {
    rbClearAutoShopUnlockForGlobalReset();
    return originalResetGameData.apply(this, arguments);
  };
  window.resetGameData = resetGameData;
  window.__rbAutoShopResetPatched = true;
}

function rbRowVisible(name) {
  var row = document.getElementById("row " + name);
  if (!row) return false;
  var style = window.getComputedStyle ? window.getComputedStyle(row) : null;
  return !row.classList.contains("hiddenTask") && row.style.display !== "none" && (!style || (style.display !== "none" && style.visibility !== "hidden"));
}

function rbCurrentIncome() {
  if (typeof gameData === "undefined" || !gameData.currentJob) return 0;
  return gameData.currentJob.getIncome();
}

function rbCurrentExpense() {
  if (typeof getExpense !== "function") return 0;
  return getExpense();
}

function rbCurrentNet() {
  return rbCurrentIncome() - rbCurrentExpense();
}

function rbReserveNet() {
  return Math.max(1, rbCurrentIncome() * REALITY_BREAK_AUTOSHOP_RESERVE);
}

function rbSafeNet(net) {
  return net > rbReserveNet();
}

function rbPropertyNetAfter(property) {
  var current = gameData.currentProperty;
  var currentExpense = current ? current.getExpense() : 0;
  return rbCurrentNet() + currentExpense - property.getExpense();
}

function rbMiscNetAfter(misc) {
  return rbCurrentNet() - misc.getExpense();
}

function rbOwnedMiscNames() {
  return (gameData.currentMisc || []).map(function(item) { return item.name; });
}

function rbCurrentPropertyIndex() {
  if (!gameData || !gameData.currentProperty || typeof itemCategories === "undefined") return -1;
  return itemCategories.Properties.indexOf(gameData.currentProperty.name);
}

function rbNextPropertyCandidate() {
  if (typeof itemCategories === "undefined" || !gameData || !gameData.itemData) return null;
  var currentIndex = rbCurrentPropertyIndex();
  for (var i = Math.max(0, currentIndex + 1); i < itemCategories.Properties.length; i++) {
    var name = itemCategories.Properties[i];
    var item = gameData.itemData[name];
    if (!item || !rbRowVisible(name)) continue;
    var afterNet = rbPropertyNetAfter(item);
    return { type: "property", item: item, afterNet: afterNet, reason: rbSafeNet(afterNet) ? "Ready." : "Waiting: property would drop Net/day below reserve." };
  }
  return null;
}

function rbMiscCandidateList() {
  if (typeof itemCategories === "undefined" || !gameData || !gameData.itemData) return [];
  var owned = rbOwnedMiscNames();
  return itemCategories.Misc
    .map(function(name, index) { return { item: gameData.itemData[name], index: index, name: name }; })
    .filter(function(entry) { return entry.item && rbRowVisible(entry.name); })
    .filter(function(entry) { return owned.indexOf(entry.name) === -1; })
    .map(function(entry) {
      var afterNet = rbMiscNetAfter(entry.item);
      return {
        type: "misc",
        item: entry.item,
        afterNet: afterNet,
        index: entry.index,
        score: entry.item.getEffect() / Math.max(1, entry.item.getExpense()),
        reason: rbSafeNet(afterNet) ? "Ready." : "Waiting: item would drop Net/day below reserve."
      };
    });
}

function rbBestSafeMiscCandidate() {
  var list = rbMiscCandidateList().filter(function(entry) { return rbSafeNet(entry.afterNet); });
  list.sort(function(a, b) {
    var tierA = Math.floor(a.index / 2);
    var tierB = Math.floor(b.index / 2);
    if (tierA !== tierB) return tierA - tierB;
    return b.score - a.score;
  });
  return list[0] || null;
}

function rbNextBlockedMiscCandidate() {
  var list = rbMiscCandidateList();
  list.sort(function(a, b) { return a.index - b.index; });
  return list[0] || null;
}

function rbPlanAutoShopPurchase() {
  if (!rbCanUseAutoShop()) return { action: null, reason: "Unlocks permanently at Merchant level 100." };
  if (typeof gameData === "undefined" || !gameData.currentJob) return { action: null, reason: "Waiting for game data." };

  var property = rbNextPropertyCandidate();
  if (property && rbSafeNet(property.afterNet)) return { action: property, reason: "Ready." };

  var misc = rbBestSafeMiscCandidate();
  if (misc) return { action: misc, reason: "Ready." };

  if (property) return { action: property, reason: property.reason };
  var blockedMisc = rbNextBlockedMiscCandidate();
  if (blockedMisc) return { action: blockedMisc, reason: blockedMisc.reason };
  return { action: null, reason: "All visible safe purchases are already active." };
}

function rbApplyAutoShopAction(action) {
  if (!action || !action.item) return false;
  if (action.type === "property") {
    if (!rbSafeNet(rbPropertyNetAfter(action.item))) return false;
    setProperty(action.item.name);
    return true;
  }
  if (action.type === "misc") {
    if (!rbSafeNet(rbMiscNetAfter(action.item))) return false;
    setMisc(action.item.name);
    return true;
  }
  return false;
}

function rbAutoShopTick() {
  if (!rbReadAutoShopEnabled() || !rbCanUseAutoShop()) return;
  for (var i = 0; i < REALITY_BREAK_AUTOSHOP_BURST_LIMIT; i++) {
    var plan = rbPlanAutoShopPurchase();
    if (!plan.action || plan.reason !== "Ready.") break;
    if (!rbApplyAutoShopAction(plan.action)) break;
  }
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
  toggle.addEventListener("change", function() { rbWriteAutoShopEnabled(toggle.checked); });
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
  if (!unlocked) note.textContent = plan.reason;
  else if (plan.action) note.textContent = "Next: " + plan.action.item.name + " — " + plan.reason + " Net after: " + Math.floor(plan.action.afterNet);
  else note.textContent = plan.reason;
}

function installRealityBreakAutoShop() {
  rbPatchGlobalResetForAutoShop();
  rbCanUseAutoShop();
  rbInstallAutoShopPanel();
  rbUpdateAutoShopPanel();
  if (!window.__realityBreakAutoShopInterval) {
    window.__realityBreakAutoShopInterval = setInterval(function() {
      rbPatchGlobalResetForAutoShop();
      rbCanUseAutoShop();
      rbInstallAutoShopPanel();
      rbAutoShopTick();
      rbUpdateAutoShopPanel();
    }, REALITY_BREAK_AUTOSHOP_TICK_MS);
  }
}

window.addEventListener("load", installRealityBreakAutoShop);
installRealityBreakAutoShop();
