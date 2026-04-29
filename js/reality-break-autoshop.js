// Reality Break Auto Shop.
// Adds an optional safe buyer without rewriting original Progress Knight internals.

const REALITY_BREAK_AUTOSHOP_KEY = "progress-knight-reality-break-autoshop-v1";

function rbReadAutoShopEnabled() {
  try {
    return localStorage.getItem(REALITY_BREAK_AUTOSHOP_KEY) === "1";
  } catch {
    return false;
  }
}

function rbWriteAutoShopEnabled(value) {
  try {
    localStorage.setItem(REALITY_BREAK_AUTOSHOP_KEY, value ? "1" : "0");
  } catch {}
}

function rbCanUseAutoShop() {
  if (typeof gameData === "undefined") return false;
  return (gameData.taskData?.Merchant?.level || 0) >= 100;
}

function rbCurrentNet() {
  if (typeof gameData === "undefined" || !gameData.currentJob) return 0;
  return gameData.currentJob.getIncome() - getExpense();
}

function rbNetAfterProperty(property) {
  const current = gameData.currentProperty;
  const currentExpense = current ? current.getExpense() : 0;
  const nextExpense = property.getExpense();
  return rbCurrentNet() + currentExpense - nextExpense;
}

function rbNetAfterMisc(misc) {
  return rbCurrentNet() - misc.getExpense();
}

function rbFindPropertyUpgrade() {
  const current = gameData.currentProperty;
  const values = itemCategories.Properties
    .map((name) => gameData.itemData[name])
    .filter(Boolean)
    .filter((item) => item !== current)
    .filter((item) => item.getEffect() > (current?.getEffect?.() || 1))
    .filter((item) => rbNetAfterProperty(item) > Math.max(1, gameData.currentJob.getIncome() * 0.1));

  return values.sort((a, b) => b.getEffect() / Math.max(1, b.getExpense()) - a.getEffect() / Math.max(1, a.getExpense()))[0] || null;
}

function rbFindMiscUpgrade() {
  const owned = gameData.currentMisc || [];
  const values = itemCategories.Misc
    .map((name) => gameData.itemData[name])
    .filter(Boolean)
    .filter((item) => !owned.includes(item))
    .filter((item) => rbNetAfterMisc(item) > Math.max(1, gameData.currentJob.getIncome() * 0.1));

  return values.sort((a, b) => b.getEffect() / Math.max(1, b.getExpense()) - a.getEffect() / Math.max(1, a.getExpense()))[0] || null;
}

function rbAutoShopTick() {
  if (!rbReadAutoShopEnabled() || !rbCanUseAutoShop() || typeof gameData === "undefined" || !gameData.currentJob) return;

  const property = rbFindPropertyUpgrade();
  if (property) {
    setProperty(property.name);
    return;
  }

  const misc = rbFindMiscUpgrade();
  if (misc) setMisc(misc.name);
}

function rbInstallAutoShopPanel() {
  const automation = document.getElementById("automation");
  if (!automation || document.getElementById("realityBreakAutoShop")) return;

  const wrapper = document.createElement("span");
  wrapper.id = "realityBreakAutoShop";
  wrapper.innerHTML = `
    <div class="rb-title">Auto-shop</div>
    <label>
      <span>Enabled</span>
      <input type="checkbox" id="realityBreakAutoShopToggle">
    </label>
    <div class="rb-note" id="realityBreakAutoShopNote"></div>
  `;
  automation.appendChild(document.createElement("br"));
  automation.appendChild(wrapper);

  const toggle = document.getElementById("realityBreakAutoShopToggle");
  toggle.checked = rbReadAutoShopEnabled();
  toggle.addEventListener("change", () => rbWriteAutoShopEnabled(toggle.checked));
}

function rbUpdateAutoShopPanel() {
  const box = document.getElementById("realityBreakAutoShop");
  const toggle = document.getElementById("realityBreakAutoShopToggle");
  const note = document.getElementById("realityBreakAutoShopNote");
  if (!box || !toggle || !note) return;

  const unlocked = rbCanUseAutoShop();
  toggle.disabled = !unlocked;
  box.classList.toggle("locked", !unlocked);
  if (!unlocked) {
    note.textContent = "Unlocks at Merchant level 100.";
  } else {
    note.textContent = "Buys only if Net/day stays positive with a 10% reserve.";
  }
}

function installRealityBreakAutoShop() {
  rbInstallAutoShopPanel();
  rbUpdateAutoShopPanel();
  setInterval(() => {
    rbInstallAutoShopPanel();
    rbUpdateAutoShopPanel();
    rbAutoShopTick();
  }, 1000);
}

window.addEventListener("load", installRealityBreakAutoShop);
