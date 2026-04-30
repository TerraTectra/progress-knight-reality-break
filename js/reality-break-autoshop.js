// Reality Break Auto-shop.
// Safe QoL buyer for the original Progress Knight runtime.

var REALITY_BREAK_AUTOSHOP_ENABLED_KEY = "progress-knight-reality-break-autoshop-enabled-v2";
var REALITY_BREAK_AUTOSHOP_UNLOCKED_KEY = "progress-knight-reality-break-autoshop-unlocked-v2";
var REALITY_BREAK_AUTOSHOP_RESERVE = 0.1;

function rbReadFlag(key) {
    try {
        return localStorage.getItem(key) === "1";
    } catch (error) {
        return false;
    }
}

function rbWriteFlag(key, value) {
    try {
        localStorage.setItem(key, value ? "1" : "0");
    } catch (error) {}
}

function rbAutoShopMerchantLevel() {
    if (typeof gameData === "undefined" || !gameData.taskData || !gameData.taskData["Merchant"]) return 0;
    return gameData.taskData["Merchant"].level || 0;
}

function rbAutoShopUnlocked() {
    if (rbAutoShopMerchantLevel() >= 100) rbWriteFlag(REALITY_BREAK_AUTOSHOP_UNLOCKED_KEY, true);
    return rbReadFlag(REALITY_BREAK_AUTOSHOP_UNLOCKED_KEY);
}

function rbAutoShopEnabled() {
    return rbReadFlag(REALITY_BREAK_AUTOSHOP_ENABLED_KEY);
}

function rbSetAutoShopEnabled(value) {
    rbWriteFlag(REALITY_BREAK_AUTOSHOP_ENABLED_KEY, value);
}

function rbAutoShopRow(item) {
    return item ? document.getElementById("row " + item.name) : null;
}

function rbAutoShopIsVisible(item) {
    var row = rbAutoShopRow(item);
    return !!row && !row.classList.contains("hidden");
}

function rbAutoShopIncome() {
    if (typeof getIncome !== "function") return 0;
    return getIncome();
}

function rbAutoShopExpense() {
    if (typeof getExpense !== "function") return 0;
    return getExpense();
}

function rbAutoShopNet() {
    return rbAutoShopIncome() - rbAutoShopExpense();
}

function rbAutoShopReserve() {
    return Math.max(1, rbAutoShopIncome() * REALITY_BREAK_AUTOSHOP_RESERVE);
}

function rbAutoShopNetAfterProperty(item) {
    var currentExpense = gameData.currentProperty ? gameData.currentProperty.getExpense() : 0;
    return rbAutoShopNet() + currentExpense - item.getExpense();
}

function rbAutoShopNetAfterMisc(item) {
    return rbAutoShopNet() - item.getExpense();
}

function rbAutoShopCanBuyProperty(item) {
    return item && rbAutoShopIsVisible(item) && rbAutoShopNetAfterProperty(item) > rbAutoShopReserve();
}

function rbAutoShopCanBuyMisc(item) {
    return item && rbAutoShopIsVisible(item) && gameData.currentMisc.indexOf(item) < 0 && rbAutoShopNetAfterMisc(item) > rbAutoShopReserve();
}

function rbAutoShopNextProperty() {
    if (!itemCategories || !itemCategories["Properties"]) return null;
    var properties = itemCategories["Properties"];
    var currentIndex = properties.indexOf(gameData.currentProperty ? gameData.currentProperty.name : "Homeless");
    for (var i = currentIndex + 1; i < properties.length; i++) {
        var item = gameData.itemData[properties[i]];
        if (item && rbAutoShopIsVisible(item)) return item;
    }
    return null;
}

function rbAutoShopBestMisc() {
    if (!itemCategories || !itemCategories["Misc"]) return null;
    var best = null;
    var bestScore = -Infinity;
    for (var i = 0; i < itemCategories["Misc"].length; i++) {
        var item = gameData.itemData[itemCategories["Misc"][i]];
        if (!rbAutoShopCanBuyMisc(item)) continue;
        var score = item.getEffect() / Math.max(1, item.getExpense());
        if (score > bestScore) {
            best = item;
            bestScore = score;
        }
    }
    return best;
}

function rbAutoShopDescribeNext() {
    var nextProperty = rbAutoShopNextProperty();
    if (nextProperty) {
        var afterProperty = rbAutoShopNetAfterProperty(nextProperty);
        if (rbAutoShopCanBuyProperty(nextProperty)) {
            return "Next: " + nextProperty.name + " ready. Net after: " + format(Math.floor(afterProperty)) + ".";
        }
        return "Next: " + nextProperty.name + " waiting. Net after would be " + format(Math.floor(afterProperty)) + ".";
    }

    var bestMisc = rbAutoShopBestMisc();
    if (bestMisc) {
        return "Next: " + bestMisc.name + " ready. Net after: " + format(Math.floor(rbAutoShopNetAfterMisc(bestMisc))) + ".";
    }

    return "Waiting for a safe visible purchase.";
}

function rbAutoShopTick() {
    if (!rbAutoShopUnlocked() || !rbAutoShopEnabled()) return;
    if (typeof gameData === "undefined" || !gameData.itemData || !gameData.currentJob) return;

    var purchases = 0;
    while (purchases < 8) {
        var nextProperty = rbAutoShopNextProperty();
        if (rbAutoShopCanBuyProperty(nextProperty)) {
            setProperty(nextProperty.name);
            purchases += 1;
            continue;
        }

        var bestMisc = rbAutoShopBestMisc();
        if (bestMisc) {
            setMisc(bestMisc.name);
            purchases += 1;
            continue;
        }

        break;
    }
}

function rbInstallAutoShopPanel() {
    var automation = document.getElementById("automation");
    if (!automation || document.getElementById("realityBreakAutoShop")) return;

    var wrapper = document.createElement("span");
    wrapper.id = "realityBreakAutoShop";
    wrapper.innerHTML =
        '<div class="rb-title">Auto-shop</div>' +
        '<label><span>Enabled</span> <input type="checkbox" id="realityBreakAutoShopToggle"></label>' +
        '<div class="rb-note" id="realityBreakAutoShopNote"></div>';
    automation.appendChild(document.createElement("br"));
    automation.appendChild(wrapper);

    var toggle = document.getElementById("realityBreakAutoShopToggle");
    toggle.checked = rbAutoShopEnabled();
    toggle.onchange = function() {
        rbSetAutoShopEnabled(toggle.checked);
    };
}

function rbUpdateAutoShopPanel() {
    var box = document.getElementById("realityBreakAutoShop");
    var toggle = document.getElementById("realityBreakAutoShopToggle");
    var note = document.getElementById("realityBreakAutoShopNote");
    if (!box || !toggle || !note) return;

    var unlocked = rbAutoShopUnlocked();
    toggle.disabled = !unlocked;
    box.classList.toggle("locked", !unlocked);

    if (!unlocked) {
        note.textContent = "Unlocks permanently at Merchant level 100.";
    } else {
        note.textContent = rbAutoShopEnabled()
            ? rbAutoShopDescribeNext()
            : "Unlocked permanently. Keeps Net/day above a 10% reserve.";
    }
}

function rbInstallAutoShop() {
    rbInstallAutoShopPanel();
    rbUpdateAutoShopPanel();
    setInterval(function() {
        rbInstallAutoShopPanel();
        rbUpdateAutoShopPanel();
        rbAutoShopTick();
    }, 250);
}

window.addEventListener("load", rbInstallAutoShop);
