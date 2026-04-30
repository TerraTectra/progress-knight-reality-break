// Reality Break meta-layer.
// Keeps the original Progress Knight loop intact while adding a small, stable meta column.

var REALITY_BREAK_SAVE_KEY = "progress-knight-reality-break-meta-v2";
var REALITY_BREAK_ADMIN_SPEED_KEY = "progress-knight-reality-break-admin-speed-v1";

var REALITY_BREAK_UPGRADES = {
    stableMemory: {name: "Stable Memory", description: "+8% all XP per level", baseCost: 5, growth: 1.85},
    universalLabor: {name: "Universal Labor", description: "+10% income per level", baseCost: 6, growth: 1.9},
    longEcho: {name: "Long Echo", description: "+5% lifespan per level", baseCost: 8, growth: 2.0},
    darkDividend: {name: "Dark Dividend", description: "+15% Evil gain per level", baseCost: 10, growth: 2.1},
};

var REALITY_BREAK_UNIVERSES = [
    {id: 1, name: "Prime World", cost: 0, xp: 1, income: 1, expense: 1, mp: 1, rule: "Original Progress Knight rules."},
    {id: 2, name: "Strained Kingdom", cost: 10, xp: 0.95, income: 0.9, expense: 1.1, mp: 1.75, rule: "Guild paperwork slows progress and taxes bite harder."},
    {id: 3, name: "Taxed Crown", cost: 35, xp: 0.9, income: 0.84, expense: 1.22, mp: 2.4, rule: "Comfort costs more; economy planning matters earlier."},
    {id: 4, name: "Slow Hourglass", cost: 90, xp: 0.82, income: 0.88, expense: 1.28, mp: 3.2, rule: "Time feels heavier; skill routing becomes important."},
    {id: 5, name: "War Ledger", cost: 180, xp: 0.78, income: 0.82, expense: 1.38, mp: 4.2, rule: "Military paths strain the realm, but collapse rewards grow."},
    {id: 6, name: "Arcane Debt", cost: 360, xp: 0.72, income: 0.8, expense: 1.5, mp: 5.5, rule: "Magic is powerful but the world charges interest."},
    {id: 7, name: "Cracked Lifeline", cost: 750, xp: 0.68, income: 0.78, expense: 1.65, mp: 7.2, rule: "Lifespan pressure rises; rebirth planning becomes central."},
    {id: 8, name: "Inverted Guilds", cost: 1500, xp: 0.62, income: 0.72, expense: 1.85, mp: 9.5, rule: "Work and study pacing no longer line up cleanly."},
    {id: 9, name: "Broken Chronicle", cost: 3200, xp: 0.56, income: 0.68, expense: 2.1, mp: 12.5, rule: "Most old assumptions are punished; meta upgrades are required."},
    {id: 10, name: "Reality Soup", cost: 7000, xp: 0.5, income: 0.62, expense: 2.5, mp: 18, rule: "The final universe is unstable enough to reveal the Observer."},
];

var REALITY_BREAK_DEFAULT_META = {
    version: 2,
    realityBroken: false,
    breaks: 0,
    highestUniverse: 1,
    currentUniverse: 1,
    unlockedUniverses: [1],
    metaversePoints: 0,
    observerUnlocked: false,
    observerPoints: 0,
    observerLastAt: null,
    passiveMpLastAt: null,
    universeRecords: {},
    globalUpgrades: {
        stableMemory: 0,
        universalLabor: 0,
        longEcho: 0,
        darkDividend: 0,
    },
    unlockedAt: null,
};

function rbCloneDefaultMeta() {
    return JSON.parse(JSON.stringify(REALITY_BREAK_DEFAULT_META));
}

function rbLoadMeta() {
    try {
        var raw = localStorage.getItem(REALITY_BREAK_SAVE_KEY);
        if (!raw) {
            var legacy = localStorage.getItem("progress-knight-reality-break-meta-v1");
            raw = legacy;
        }
        if (!raw) return rbCloneDefaultMeta();
        var parsed = JSON.parse(raw);
        var meta = rbCloneDefaultMeta();
        for (var key in parsed) meta[key] = parsed[key];
        meta.globalUpgrades = Object.assign({}, REALITY_BREAK_DEFAULT_META.globalUpgrades, parsed.globalUpgrades || {});
        if (!meta.unlockedUniverses || !meta.unlockedUniverses.length) meta.unlockedUniverses = [1];
        if (meta.currentUniverse > meta.highestUniverse) meta.highestUniverse = meta.currentUniverse;
        if (!meta.universeRecords) meta.universeRecords = {};
        return meta;
    } catch (error) {
        return rbCloneDefaultMeta();
    }
}

function rbSaveMeta(meta) {
    try {
        localStorage.setItem(REALITY_BREAK_SAVE_KEY, JSON.stringify(Object.assign(rbCloneDefaultMeta(), meta)));
    } catch (error) {}
}

function rbUpgradeLevel(id) {
    var meta = rbLoadMeta();
    return meta.globalUpgrades[id] || 0;
}

function rbUpgradeCost(id) {
    var upgrade = REALITY_BREAK_UPGRADES[id];
    var level = rbUpgradeLevel(id);
    return Math.max(1, Math.floor(upgrade.baseCost * Math.pow(upgrade.growth, level)));
}

function rbAllXpMultiplier() {
    var meta = rbLoadMeta();
    return rbUniverseRule(meta.currentUniverse).xp * (1 + (meta.globalUpgrades.stableMemory || 0) * 0.08);
}

function rbIncomeMultiplier() {
    var meta = rbLoadMeta();
    return rbUniverseRule(meta.currentUniverse).income * (1 + (meta.globalUpgrades.universalLabor || 0) * 0.1);
}

function rbExpenseMultiplier() {
    var meta = rbLoadMeta();
    return rbUniverseRule(meta.currentUniverse).expense;
}

function rbLifespanMultiplier() {
    var meta = rbLoadMeta();
    return 1 + (meta.globalUpgrades.longEcho || 0) * 0.05;
}

function rbEvilGainMultiplier() {
    var meta = rbLoadMeta();
    return 1 + (meta.globalUpgrades.darkDividend || 0) * 0.15;
}

function rbMetaverseGainMultiplier() {
    var meta = rbLoadMeta();
    return rbUniverseRule(meta.currentUniverse).mp;
}

function rbUniverseRecord(meta, id) {
    if (!meta.universeRecords) meta.universeRecords = {};
    if (!meta.universeRecords[id]) {
        meta.universeRecords[id] = {
            bestJobLevel: 0,
            bestSkillLevel: 0,
            bestEvil: 0,
            collapses: 0,
        };
    }
    return meta.universeRecords[id];
}

function rbCurrentUniversePower() {
    if (typeof gameData === "undefined" || !gameData.taskData) return {job: 0, skill: 0, evil: 0};
    var bestJobLevel = 0;
    var bestSkillLevel = 0;
    for (var taskName in gameData.taskData) {
        var task = gameData.taskData[taskName];
        if (task instanceof Job) bestJobLevel = Math.max(bestJobLevel, task.level || 0);
        if (task instanceof Skill) bestSkillLevel = Math.max(bestSkillLevel, task.level || 0);
    }
    return {
        job: bestJobLevel,
        skill: bestSkillLevel,
        evil: gameData.evil || 0,
    };
}

function rbUpdateCurrentUniverseRecord(meta) {
    var record = rbUniverseRecord(meta, meta.currentUniverse || 1);
    var power = rbCurrentUniversePower();
    record.bestJobLevel = Math.max(record.bestJobLevel || 0, power.job);
    record.bestSkillLevel = Math.max(record.bestSkillLevel || 0, power.skill);
    record.bestEvil = Math.max(record.bestEvil || 0, power.evil);
    return record;
}

function rbUniversePassiveRate(meta, id) {
    var universe = rbUniverseRule(id);
    var record = rbUniverseRecord(meta, id);
    var progressPower = Math.sqrt(Math.max(0, record.bestJobLevel || 0)) * 0.0025 +
        Math.sqrt(Math.max(0, record.bestSkillLevel || 0)) * 0.0025 +
        Math.log10(Math.max(1, (record.bestEvil || 0) + 1)) * 0.006 +
        (record.collapses || 0) * 0.01;
    var base = 0.002 * Math.pow(universe.id, 1.35);
    var rate = base * universe.mp * (1 + progressPower);
    return Math.max(0.0005, rate);
}

function rbTotalPassiveMpRate(meta) {
    if (!meta.realityBroken) return 0;
    var total = 0;
    for (var i = 0; i < meta.unlockedUniverses.length; i++) {
        total += rbUniversePassiveRate(meta, meta.unlockedUniverses[i]);
    }
    total *= 1 + (meta.globalUpgrades.stableMemory || 0) * 0.01;
    return total;
}

function rbUniverseRule(id) {
    for (var i = 0; i < REALITY_BREAK_UNIVERSES.length; i++) {
        if (REALITY_BREAK_UNIVERSES[i].id === id) return REALITY_BREAK_UNIVERSES[i];
    }
    return REALITY_BREAK_UNIVERSES[0];
}

function rbNextUniverseRule(meta) {
    var nextId = Math.min(10, (meta.highestUniverse || 1) + 1);
    if (nextId <= meta.highestUniverse) return null;
    return rbUniverseRule(nextId);
}

function rbInstallMetaEffectPatch() {
    if (window.__rbMetaEffectsInstalled) return;
    if (typeof Task === "undefined" || typeof Job === "undefined" || typeof Item === "undefined") return;
    window.__rbMetaEffectsInstalled = true;

    var baseTaskXp = Task.prototype.getXpGain;
    Task.prototype.getXpGain = function() {
        return Math.max(1, Math.round(baseTaskXp.call(this) * rbAllXpMultiplier()));
    };

    var baseJobIncome = Job.prototype.getIncome;
    Job.prototype.getIncome = function() {
        return Math.max(0, Math.round(baseJobIncome.call(this) * rbIncomeMultiplier()));
    };

    var baseItemExpense = Item.prototype.getExpense;
    Item.prototype.getExpense = function() {
        return Math.max(0, Math.round(baseItemExpense.call(this) * rbExpenseMultiplier()));
    };

    if (typeof getLifespan === "function") {
        var baseGetLifespan = getLifespan;
        getLifespan = function() {
            return baseGetLifespan() * rbLifespanMultiplier();
        };
        window.getLifespan = getLifespan;
    }

    if (typeof getEvilGain === "function") {
        var baseGetEvilGain = getEvilGain;
        getEvilGain = function() {
            return Math.max(1, Math.floor(baseGetEvilGain() * rbEvilGainMultiplier()));
        };
        window.getEvilGain = getEvilGain;
    }
}

function rbGetAdminSpeedMultiplier() {
    try {
        var targetSpeed = Number(localStorage.getItem(REALITY_BREAK_ADMIN_SPEED_KEY) || "5");
        if ([5, 10, 50, 100].indexOf(targetSpeed) < 0) targetSpeed = 5;
        return targetSpeed / 5;
    } catch (error) {
        return 1;
    }
}

function rbSetAdminSpeedMultiplier(value) {
    try {
        localStorage.setItem(REALITY_BREAK_ADMIN_SPEED_KEY, String(value));
    } catch (error) {}
}

function rbGetAdminTargetSpeed() {
    try {
        var targetSpeed = Number(localStorage.getItem(REALITY_BREAK_ADMIN_SPEED_KEY) || "5");
        return [5, 10, 50, 100].indexOf(targetSpeed) >= 0 ? targetSpeed : 5;
    } catch (error) {
        return 5;
    }
}

function rbInstallAdminSpeedPatch() {
    if (window.__rbOriginalGetGameSpeed || typeof getGameSpeed !== "function") return;
    window.__rbOriginalGetGameSpeed = getGameSpeed;
    getGameSpeed = function() {
        return window.__rbOriginalGetGameSpeed() * rbGetAdminSpeedMultiplier();
    };
    window.getGameSpeed = getGameSpeed;
}

function rbCanBreakReality() {
    if (typeof gameData === "undefined" || !gameData.taskData) return false;
    var evil = gameData.evil || 0;
    var chairman = gameData.taskData["Chairman"] ? gameData.taskData["Chairman"].level : 0;
    var timeWarping = gameData.taskData["Time warping"] ? gameData.taskData["Time warping"].level : 0;
    var superImmortality = gameData.taskData["Super immortality"] ? gameData.taskData["Super immortality"].level : 0;
    return evil >= 1200 && chairman >= 10 && timeWarping >= 100 && superImmortality >= 35;
}

function rbGetMetaverseGain() {
    if (typeof gameData === "undefined" || !gameData.taskData) return 0;
    var highestJobLevel = 0;
    var highestSkillLevel = 0;
    for (var taskName in gameData.taskData) {
        var task = gameData.taskData[taskName];
        if (task instanceof Job) highestJobLevel = Math.max(highestJobLevel, task.level || 0);
        if (task instanceof Skill) highestSkillLevel = Math.max(highestSkillLevel, task.level || 0);
    }
    var raw = Math.sqrt(gameData.evil || 0) + highestJobLevel / 20 + highestSkillLevel / 25;
    return Math.max(1, Math.floor(raw * rbMetaverseGainMultiplier()));
}

function rbMissingRealityRequirementsText() {
    if (typeof gameData === "undefined" || !gameData.taskData) return "Game data is loading.";
    var missing = [];
    if ((gameData.evil || 0) < 1200) missing.push("Evil " + Math.floor(gameData.evil || 0) + "/1200");
    var chairman = gameData.taskData["Chairman"] ? gameData.taskData["Chairman"].level : 0;
    var timeWarping = gameData.taskData["Time warping"] ? gameData.taskData["Time warping"].level : 0;
    var superImmortality = gameData.taskData["Super immortality"] ? gameData.taskData["Super immortality"].level : 0;
    if (chairman < 10) missing.push("Chairman " + chairman + "/10");
    if (timeWarping < 100) missing.push("Time warping " + timeWarping + "/100");
    if (superImmortality < 35) missing.push("Super immortality " + superImmortality + "/35");
    return missing.length ? missing.join(", ") : "Ready.";
}

function rbResetCurrentRun() {
    if (typeof gameData === "undefined") return;
    gameData.coins = 0;
    gameData.days = 365 * 14;
    gameData.evil = 0;
    gameData.currentJob = gameData.taskData["Beggar"];
    gameData.currentSkill = gameData.taskData["Concentration"];
    gameData.currentProperty = gameData.itemData["Homeless"];
    gameData.currentMisc = [];
    for (var taskName in gameData.taskData) {
        gameData.taskData[taskName].level = 0;
        gameData.taskData[taskName].xp = 0;
        gameData.taskData[taskName].maxLevel = 0;
    }
    for (var key in gameData.requirements) {
        if (permanentUnlocks.indexOf(key) >= 0) continue;
        gameData.requirements[key].completed = false;
    }
    if (typeof saveGameData === "function") saveGameData();
}

function rbBreakReality() {
    if (!rbCanBreakReality()) return;
    var meta = rbLoadMeta();
    meta.realityBroken = true;
    meta.breaks = (meta.breaks || 0) + 1;
    meta.unlockedAt = meta.unlockedAt || Date.now();
    var record = rbUpdateCurrentUniverseRecord(meta);
    record.collapses = (record.collapses || 0) + 1;
    meta.metaversePoints += rbGetMetaverseGain();
    rbSaveMeta(meta);
    rbResetCurrentRun();
    rbRenderRealityColumn();
}

function rbBuyUpgrade(id) {
    var meta = rbLoadMeta();
    var cost = rbUpgradeCost(id);
    if (!meta.realityBroken || meta.metaversePoints < cost) return;
    meta.metaversePoints -= cost;
    meta.globalUpgrades[id] = (meta.globalUpgrades[id] || 0) + 1;
    rbSaveMeta(meta);
    rbRenderRealityColumn();
}

function rbUnlockNextUniverse() {
    var meta = rbLoadMeta();
    var next = rbNextUniverseRule(meta);
    if (!next || !meta.realityBroken || meta.metaversePoints < next.cost) return;
    meta.metaversePoints -= next.cost;
    meta.unlockedUniverses.push(next.id);
    meta.highestUniverse = Math.max(meta.highestUniverse, next.id);
    rbSaveMeta(meta);
    rbRenderRealityColumn();
}

function rbEnterUniverse(id) {
    var meta = rbLoadMeta();
    if (meta.unlockedUniverses.indexOf(id) < 0 || meta.currentUniverse === id) return;
    rbUpdateCurrentUniverseRecord(meta);
    meta.currentUniverse = id;
    rbSaveMeta(meta);
    rbResetCurrentRun();
    rbRenderRealityColumn();
}

function rbUnlockObserverSeed() {
    var meta = rbLoadMeta();
    if (!meta.realityBroken || meta.observerUnlocked || meta.metaversePoints < 10000 || meta.highestUniverse < 10) return;
    meta.metaversePoints -= 10000;
    meta.observerUnlocked = true;
    meta.observerLastAt = Date.now();
    rbSaveMeta(meta);
    rbRenderRealityColumn();
}

function rbTickObserver() {
    var meta = rbLoadMeta();
    if (!meta.observerUnlocked) return;
    var now = Date.now();
    var last = meta.observerLastAt || now;
    var elapsed = Math.min(3600, Math.max(0, (now - last) / 1000));
    meta.observerPoints += elapsed * 0.1 * (1 + (meta.breaks || 0) * 0.05);
    meta.observerLastAt = now;
    rbSaveMeta(meta);
}

function rbTickPassiveMetaverse() {
    var meta = rbLoadMeta();
    if (!meta.realityBroken) return;
    var now = Date.now();
    var last = meta.passiveMpLastAt || now;
    var elapsed = Math.min(3600, Math.max(0, (now - last) / 1000));
    rbUpdateCurrentUniverseRecord(meta);
    meta.metaversePoints += rbTotalPassiveMpRate(meta) * elapsed;
    meta.passiveMpLastAt = now;
    rbSaveMeta(meta);
}

function rbFindMainFrame() {
    var panels = document.getElementsByClassName("panel");
    for (var i = 0; i < panels.length; i++) {
        var style = panels[i].getAttribute("style") || "";
        if (style.indexOf("width: 900px") >= 0 && style.indexOf("height: 40px") >= 0) {
            return panels[i].parentElement;
        }
    }
    return document.querySelector(".w3-margin > div");
}

function rbCreateRealityColumn() {
    if (document.getElementById("realityBreakColumn")) return document.getElementById("realityBreakColumn");
    var frame = rbFindMainFrame();
    if (!frame) return null;
    frame.style.width = "1500px";
    var column = document.createElement("div");
    column.id = "realityBreakColumn";
    column.className = "panel w3-margin-left w3-padding";
    column.style.width = "260px";
    column.style.height = "auto";
    column.style.float = "left";
    frame.appendChild(column);
    return column;
}

function rbUpgradeHtml(id) {
    var upgrade = REALITY_BREAK_UPGRADES[id];
    var level = rbUpgradeLevel(id);
    var cost = rbUpgradeCost(id);
    return '<div class="rb-upgrade">' +
        '<b>' + upgrade.name + '</b> <span class="rb-muted">lvl ' + level + '</span>' +
        '<div class="rb-muted">' + upgrade.description + '</div>' +
        '<button class="w3-button button rb-buy-upgrade" data-rb-upgrade="' + id + '">Buy - ' + cost + ' MP</button>' +
    '</div>';
}

function rbUniverseHtml(meta) {
    var html = "";
    for (var i = 0; i < REALITY_BREAK_UNIVERSES.length; i++) {
        var universe = REALITY_BREAK_UNIVERSES[i];
        var unlocked = meta.unlockedUniverses.indexOf(universe.id) >= 0;
        var current = meta.currentUniverse === universe.id;
        html += '<div class="rb-universe' + (current ? ' current' : '') + (unlocked ? ' unlocked' : ' locked') + '">' +
            '<b>U-' + universe.id + ' ' + universe.name + '</b>' +
            '<div class="rb-muted">' + universe.rule + '</div>' +
            '<div class="rb-muted">XP x' + universe.xp.toFixed(2) + ', income x' + universe.income.toFixed(2) + ', expenses x' + universe.expense.toFixed(2) + ', MP x' + universe.mp.toFixed(2) + '</div>' +
            '<div class="rb-muted">Passive: +' + rbUniversePassiveRate(meta, universe.id).toFixed(3) + ' MP/s</div>';
        if (unlocked) {
            html += '<button class="w3-button button rb-enter-universe" data-rb-universe="' + universe.id + '"' + (current ? ' disabled' : '') + '>' + (current ? 'Current' : 'Enter') + '</button>';
        } else if (universe.id === (meta.highestUniverse || 1) + 1) {
            html += '<button id="rbUnlockNextUniverse" class="w3-button button" ' + (meta.metaversePoints >= universe.cost ? "" : "disabled") + '>Unlock - ' + universe.cost + ' MP</button>';
        } else {
            html += '<div class="rb-muted">Locked</div>';
        }
        html += '</div>';
    }
    return html;
}

function rbRenderAdminSpeedPanel() {
    var current = rbGetAdminTargetSpeed();
    var speeds = [5, 10, 50, 100];
    var html = '<div class="rb-title">Admin speed</div>';
    for (var i = 0; i < speeds.length; i++) {
        var speed = speeds[i];
        var label = speed === 5 ? "x5 base" : "x" + speed;
        html += '<button class="w3-button button rb-speed-button' + (current === speed ? ' active' : '') + '" data-rb-speed="' + speed + '">' + label + '</button>';
    }
    return html;
}

function rbRenderRealityColumn() {
    var column = rbCreateRealityColumn();
    if (!column) return;
    var meta = rbLoadMeta();
    var gain = rbGetMetaverseGain();
    rbUpdateCurrentUniverseRecord(meta);
    var passiveRate = rbTotalPassiveMpRate(meta);
    var html = '<h2 style="margin-top: 0">Reality Break</h2>' +
        '<div class="rb-note">Meta progression</div>' +
        '<div>Reality broken: <b>' + (meta.realityBroken ? "yes" : "no") + '</b></div>' +
        '<div>Universe: <b>' + meta.currentUniverse + '</b></div>' +
        '<div>Metaverse points: <b>' + meta.metaversePoints.toFixed(2) + '</b></div>' +
        '<div>Passive MP: <b>+' + passiveRate.toFixed(3) + '/s</b></div>' +
        '<div style="margin-top: 8px; color: gray">Requirements: ' + rbMissingRealityRequirementsText() + '</div>' +
        '<div style="margin-top: 4px">Estimated gain: <b>' + gain + ' MP</b></div>' +
        '<button id="rbBreakRealityButton" class="w3-button button" style="margin-top: 8px" ' + (rbCanBreakReality() ? "" : "disabled") + '>Break reality</button>';

    if (meta.realityBroken) {
        html += '<hr><div class="rb-title">Metaverse Upgrades</div>' +
            rbUpgradeHtml("stableMemory") +
            rbUpgradeHtml("universalLabor") +
            rbUpgradeHtml("longEcho") +
            rbUpgradeHtml("darkDividend") +
            '<hr><div class="rb-title">Universes</div>' +
            '<div class="rb-muted">Second meta layer: clear U-I through U-X. Each universe distorts the rules harder.</div>' +
            rbUniverseHtml(meta);
        html += '<hr><div class="rb-title">Observer Seed</div>';
        if (meta.observerUnlocked) {
            html += '<div>Observer points: <b>' + meta.observerPoints.toFixed(1) + '</b></div>' +
                '<div class="rb-muted">The Observer is awake. Simulacrums come after U-X is tuned.</div>';
        } else {
            html += '<div class="rb-muted">Locked until Universe X. Cost: 10000 MP.</div>' +
                '<button id="rbUnlockObserver" class="w3-button button" ' + (meta.highestUniverse >= 10 && meta.metaversePoints >= 10000 ? "" : "disabled") + '>Unlock Observer Seed - 10000 MP</button>';
        }
    }

    html += '<hr>' + rbRenderAdminSpeedPanel();
    column.innerHTML = html;

    var breakButton = document.getElementById("rbBreakRealityButton");
    if (breakButton) breakButton.onclick = rbBreakReality;

    var buyButtons = column.getElementsByClassName("rb-buy-upgrade");
    for (var i = 0; i < buyButtons.length; i++) {
        buyButtons[i].onclick = function() { rbBuyUpgrade(this.getAttribute("data-rb-upgrade")); };
    }

    var speedButtons = column.getElementsByClassName("rb-speed-button");
    for (var j = 0; j < speedButtons.length; j++) {
        speedButtons[j].onclick = function() {
            rbSetAdminSpeedMultiplier(Number(this.getAttribute("data-rb-speed")));
            rbRenderRealityColumn();
        };
    }

    var unlockNextUniverse = document.getElementById("rbUnlockNextUniverse");
    if (unlockNextUniverse) unlockNextUniverse.onclick = rbUnlockNextUniverse;

    var universeButtons = column.getElementsByClassName("rb-enter-universe");
    for (var k = 0; k < universeButtons.length; k++) {
        universeButtons[k].onclick = function() { rbEnterUniverse(Number(this.getAttribute("data-rb-universe"))); };
    }

    var observerButton = document.getElementById("rbUnlockObserver");
    if (observerButton) observerButton.onclick = rbUnlockObserverSeed;
}

function rbInstallRealityBreakMeta() {
    rbInstallAdminSpeedPatch();
    rbInstallMetaEffectPatch();
    rbRenderRealityColumn();
    setInterval(function() {
        rbInstallAdminSpeedPatch();
        rbInstallMetaEffectPatch();
        rbTickPassiveMetaverse();
        rbTickObserver();
        rbRenderRealityColumn();
    }, 1000);
}

window.addEventListener("load", rbInstallRealityBreakMeta);
