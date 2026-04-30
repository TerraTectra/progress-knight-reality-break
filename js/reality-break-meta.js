// Reality Break meta-layer.
// Keeps the original Progress Knight loop intact while adding the second meta layer as a normal tab.

var REALITY_BREAK_SAVE_KEY = "progress-knight-reality-break-meta-v2";
var REALITY_BREAK_ADMIN_SPEED_KEY = "progress-knight-reality-break-admin-speed-v1";

var REALITY_BREAK_UPGRADES = {
    stableMemory: {name: "Stable Memory", description: "+8% all XP per level", baseCost: 5, growth: 1.85},
    universalLabor: {name: "Universal Labor", description: "+10% income per level", baseCost: 6, growth: 1.9},
    longEcho: {name: "Long Echo", description: "+5% lifespan per level", baseCost: 8, growth: 2.0},
    darkDividend: {name: "Dark Dividend", description: "+15% Evil gain per level", baseCost: 10, growth: 2.1},
};

var REALITY_BREAK_UNIVERSES = [
    {id: 1, name: "Prime World", cost: 0, xp: 1, income: 1, expense: 1, mp: 1, rule: "Original Progress Knight rules. Low passive MP, but every record here still matters."},
    {id: 2, name: "Strained Kingdom", cost: 12, xp: 0.96, income: 0.92, expense: 1.08, mp: 1.6, rule: "Guild paperwork slows progress and taxes bite harder."},
    {id: 3, name: "Taxed Crown", cost: 45, xp: 0.92, income: 0.86, expense: 1.18, mp: 2.25, rule: "Comfort costs more; economy planning matters earlier."},
    {id: 4, name: "Slow Hourglass", cost: 120, xp: 0.86, income: 0.86, expense: 1.3, mp: 3.1, rule: "Time feels heavier; lifespan and Time warping carry more weight."},
    {id: 5, name: "War Ledger", cost: 280, xp: 0.8, income: 0.82, expense: 1.45, mp: 4.25, rule: "Military paths strain the realm, but collapse rewards grow."},
    {id: 6, name: "Arcane Debt", cost: 650, xp: 0.74, income: 0.78, expense: 1.62, mp: 5.9, rule: "Magic is powerful but the world charges interest."},
    {id: 7, name: "Cracked Lifeline", cost: 1400, xp: 0.68, income: 0.74, expense: 1.82, mp: 8.2, rule: "Lifespan pressure rises; rebirth planning becomes central."},
    {id: 8, name: "Inverted Guilds", cost: 3000, xp: 0.62, income: 0.69, expense: 2.05, mp: 11.4, rule: "Work and study pacing no longer line up cleanly."},
    {id: 9, name: "Broken Chronicle", cost: 6200, xp: 0.56, income: 0.64, expense: 2.35, mp: 15.8, rule: "Most old assumptions are punished; meta upgrades are required."},
    {id: 10, name: "Reality Soup", cost: 12500, xp: 0.5, income: 0.58, expense: 2.75, mp: 22, rule: "The final universe is unstable enough to reveal the Observer."},
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
    observerMode: false,
    observerPoints: 0,
    observerLastAt: null,
    simulacrums: [],
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
        if (!meta.simulacrums) meta.simulacrums = [];
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
    var progressPower = Math.sqrt(Math.max(0, record.bestJobLevel || 0)) * 0.006 +
        Math.sqrt(Math.max(0, record.bestSkillLevel || 0)) * 0.006 +
        Math.log10(Math.max(1, (record.bestEvil || 0) + 1)) * 0.02 +
        (record.collapses || 0) * 0.08;
    var base = 0.0012 * Math.pow(universe.id, 1.55);
    var rate = base * universe.mp * (1 + progressPower);
    return Math.max(0.0003, rate);
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

function rbPreviousUniverseCleared(meta, universeId) {
    if (universeId <= 2) return meta.realityBroken;
    var previousRecord = rbUniverseRecord(meta, universeId - 1);
    return (previousRecord.collapses || 0) > 0;
}

function rbCanUnlockUniverse(meta, universe) {
    return !!universe &&
        meta.realityBroken &&
        meta.metaversePoints >= universe.cost &&
        rbPreviousUniverseCleared(meta, universe.id);
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
    rbRenderMultiverseTab();
}

function rbBuyUpgrade(id) {
    var meta = rbLoadMeta();
    var cost = rbUpgradeCost(id);
    if (!meta.realityBroken || meta.metaversePoints < cost) return;
    meta.metaversePoints -= cost;
    meta.globalUpgrades[id] = (meta.globalUpgrades[id] || 0) + 1;
    rbSaveMeta(meta);
    rbRenderMultiverseTab();
}

function rbUnlockUniverse(id) {
    var meta = rbLoadMeta();
    var universe = rbUniverseRule(id);
    if (!rbCanUnlockUniverse(meta, universe)) return;
    meta.metaversePoints -= universe.cost;
    if (meta.unlockedUniverses.indexOf(universe.id) < 0) meta.unlockedUniverses.push(universe.id);
    meta.highestUniverse = Math.max(meta.highestUniverse, universe.id);
    rbSaveMeta(meta);
    rbRenderMultiverseTab();
}

function rbUnlockNextUniverse() {
    var meta = rbLoadMeta();
    var next = rbNextUniverseRule(meta);
    if (!next) return;
    rbUnlockUniverse(next.id);
}

function rbEnterUniverse(id) {
    var meta = rbLoadMeta();
    if (meta.unlockedUniverses.indexOf(id) < 0 || meta.currentUniverse === id) return;
    rbUpdateCurrentUniverseRecord(meta);
    meta.currentUniverse = id;
    rbSaveMeta(meta);
    rbResetCurrentRun();
    rbRenderMultiverseTab();
}

function rbUnlockObserverSeed() {
    var meta = rbLoadMeta();
    if (!meta.realityBroken || meta.observerUnlocked || meta.metaversePoints < 10000 || meta.highestUniverse < 10) return;
    meta.metaversePoints -= 10000;
    meta.observerUnlocked = true;
    meta.observerMode = true;
    meta.observerLastAt = Date.now();
    meta.simulacrums = meta.simulacrums && meta.simulacrums.length ? meta.simulacrums : [rbCreateFirstSimulacrum()];
    rbSaveMeta(meta);
    rbApplyObserverMode(meta);
    rbRenderMultiverseTab();
    rbRenderObserverTab();
}

function rbCreateFirstSimulacrum() {
    return {
        id: "first",
        name: "First Simulacrum",
        rank: "Trash",
        universe: 1,
        highestUniverse: 1,
        observerPerSecond: 0,
        note: "Free first subordinate. Full bot simulation comes after the Observer layer is implemented.",
    };
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

function rbCanShowMultiverse(meta) {
    if (!meta) meta = rbLoadMeta();
    return meta.realityBroken || (typeof gameData !== "undefined" && ((gameData.evil || 0) > 0 || (gameData.rebirthTwoCount || 0) > 0));
}

function rbApplyObserverMode(meta) {
    if (!meta) meta = rbLoadMeta();
    var body = document.getElementById("body");
    if (!body) return;
    if (meta.observerMode) {
        body.classList.add("rb-observer-mode");
        var observerButton = document.getElementById("observerTabButton");
        if (observerButton && typeof setTab === "function") setTab(observerButton, "observer");
    } else {
        body.classList.remove("rb-observer-mode");
    }
}

function rbUpdateMetaTabVisibility(meta) {
    var multiverseButton = document.getElementById("multiverseTabButton");
    var observerButton = document.getElementById("observerTabButton");
    if (!multiverseButton || !observerButton) return;

    if (rbCanShowMultiverse(meta)) {
        multiverseButton.classList.remove("hidden");
    } else {
        multiverseButton.classList.add("hidden");
    }

    if (meta && meta.observerUnlocked) {
        observerButton.classList.remove("hidden");
    } else {
        observerButton.classList.add("hidden");
    }

    rbApplyObserverMode(meta);
}

function rbUpgradeHtml(id) {
    var upgrade = REALITY_BREAK_UPGRADES[id];
    var level = rbUpgradeLevel(id);
    var cost = rbUpgradeCost(id);
    return '<tr>' +
        '<td><b>' + upgrade.name + '</b></td>' +
        '<td class="rb-muted">' + upgrade.description + '</td>' +
        '<td>Lvl ' + level + '</td>' +
        '<td><button class="w3-button button rb-buy-upgrade" data-rb-upgrade="' + id + '"' + (rbLoadMeta().metaversePoints >= cost ? "" : " disabled") + '>Buy - ' + cost + ' MP</button></td>' +
    '</tr>';
}

function rbUniverseHtml(meta) {
    var html = "";
    for (var i = 0; i < REALITY_BREAK_UNIVERSES.length; i++) {
        var universe = REALITY_BREAK_UNIVERSES[i];
        var unlocked = meta.unlockedUniverses.indexOf(universe.id) >= 0;
        var current = meta.currentUniverse === universe.id;
        var canUnlock = rbCanUnlockUniverse(meta, universe);
        var record = rbUniverseRecord(meta, universe.id);
        html += '<tr class="' + (current ? 'current ' : '') + (unlocked ? 'unlocked' : 'locked') + '">' +
            '<td><b>U-' + universe.id + ' ' + universe.name + '</b><br><span class="rb-muted">Clears: ' + (record.collapses || 0) + '</span></td>' +
            '<td>' + universe.rule + '<br><span class="rb-muted">XP x' + universe.xp.toFixed(2) + ', income x' + universe.income.toFixed(2) + ', expenses x' + universe.expense.toFixed(2) + ', MP x' + universe.mp.toFixed(2) + '</span></td>' +
            '<td class="' + (unlocked ? 'rb-mp' : 'rb-muted') + '">' + (unlocked ? '+' + rbUniversePassiveRate(meta, universe.id).toFixed(3) + ' MP/s' : 'Locked') + '</td>';
        if (unlocked) {
            html += '<td>' + (current ? '<b>Current</b>' : 'Unlocked') + '</td>' +
                '<td><button class="w3-button button rb-enter-universe" data-rb-universe="' + universe.id + '"' + (current ? ' disabled' : '') + '>' + (current ? 'Current' : 'Enter') + '</button></td>';
        } else if (universe.id === (meta.highestUniverse || 1) + 1) {
            var requirementText = rbPreviousUniverseCleared(meta, universe.id) ? 'Need ' + universe.cost + ' MP' : 'Clear U-' + (universe.id - 1);
            html += '<td>' + requirementText + '</td>' +
                '<td><button class="w3-button button rb-unlock-universe" data-rb-universe="' + universe.id + '" ' + (canUnlock ? "" : "disabled") + '>Unlock</button></td>';
        } else {
            html += '<td>Locked</td><td><button class="w3-button button" disabled>Locked</button></td>';
        }
        html += '</tr>';
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

function rbEnsureAdminSpeedPanel() {
    var settings = document.getElementById("settings");
    if (!settings) return;
    var panel = document.getElementById("rbAdminSpeedPanel");
    if (!panel) {
        panel = document.createElement("li");
        panel.id = "rbAdminSpeedPanel";
        settings.getElementsByTagName("ul")[0].appendChild(panel);
    }
    panel.innerHTML = '<h2>Admin panel</h2>' + rbRenderAdminSpeedPanel();
    var speedButtons = panel.getElementsByClassName("rb-speed-button");
    for (var i = 0; i < speedButtons.length; i++) {
        speedButtons[i].onclick = function() {
            rbSetAdminSpeedMultiplier(Number(this.getAttribute("data-rb-speed")));
            rbEnsureAdminSpeedPanel();
        };
    }
}

function rbRenderMultiverseTab() {
    var root = document.getElementById("rbMultiverseRoot");
    if (!root) return;
    var meta = rbLoadMeta();
    var gain = rbGetMetaverseGain();
    rbUpdateCurrentUniverseRecord(meta);
    rbSaveMeta(meta);
    rbUpdateMetaTabVisibility(meta);
    var passiveRate = rbTotalPassiveMpRate(meta);
    var currentUniverse = rbUniverseRule(meta.currentUniverse || 1);
    var html = '<div class="rb-section-title">Multiverse</div>' +
        '<div class="rb-summary">' +
            '<div><span class="rb-muted">Metaverse points</span><b class="rb-mp">' + meta.metaversePoints.toFixed(2) + '</b></div>' +
            '<div><span class="rb-muted">Passive MP/sec</span><b class="rb-good">+' + passiveRate.toFixed(3) + '</b></div>' +
            '<div><span class="rb-muted">Current universe</span><b>U-' + (meta.currentUniverse || 1) + '</b></div>' +
            '<div><span class="rb-muted">Highest universe</span><b>U-' + (meta.highestUniverse || 1) + '</b></div>' +
        '</div>' +
        '<div class="rb-multiverse-actions">' +
            '<div><b>Reality Break</b> <span class="rb-muted">Second meta layer. Break or collapse the current universe to earn MP.</span></div>' +
            '<div class="rb-muted">Requirements: ' + rbMissingRealityRequirementsText() + '</div>' +
            '<div>Estimated collapse gain: <b class="rb-mp">' + gain + ' MP</b> <span class="rb-muted">Current rule: ' + currentUniverse.rule + '</span></div>' +
            '<button id="rbBreakRealityButton" class="w3-button button" ' + (rbCanBreakReality() ? "" : "disabled") + '>' + (meta.realityBroken ? "Collapse universe" : "Break reality") + '</button>' +
        '</div>';

    if (meta.realityBroken) {
        html += '<table class="rb-multiverse-table">' +
            '<thead><tr><th style="width: 185px;">Universe</th><th>Distortion</th><th style="width: 145px;">Passive income</th><th style="width: 135px;">State</th><th style="width: 105px;"></th></tr></thead>' +
            '<tbody>' + rbUniverseHtml(meta) + '</tbody>' +
        '</table>' +
        '<div class="rb-grid-two">' +
            '<div class="rb-mini-panel"><div class="rb-section-title blue">Metaverse upgrades</div><table class="rb-multiverse-table rb-upgrade-table"><tbody>' +
                rbUpgradeHtml("stableMemory") +
                rbUpgradeHtml("universalLabor") +
                rbUpgradeHtml("longEcho") +
                rbUpgradeHtml("darkDividend") +
            '</tbody></table></div>' +
            rbObserverGateHtml(meta) +
        '</div>';
    }

    html += '<div class="rb-note-line">Universes are the second large meta layer. You can switch between every unlocked universe at any time; switching resets the current run but keeps meta progress.</div>';
    root.innerHTML = html;

    var breakButton = document.getElementById("rbBreakRealityButton");
    if (breakButton) breakButton.onclick = rbBreakReality;

    var buyButtons = root.getElementsByClassName("rb-buy-upgrade");
    for (var i = 0; i < buyButtons.length; i++) {
        buyButtons[i].onclick = function() { rbBuyUpgrade(this.getAttribute("data-rb-upgrade")); };
    }

    var unlockButtons = root.getElementsByClassName("rb-unlock-universe");
    for (var j = 0; j < unlockButtons.length; j++) {
        unlockButtons[j].onclick = function() { rbUnlockUniverse(Number(this.getAttribute("data-rb-universe"))); };
    }

    var universeButtons = root.getElementsByClassName("rb-enter-universe");
    for (var k = 0; k < universeButtons.length; k++) {
        universeButtons[k].onclick = function() { rbEnterUniverse(Number(this.getAttribute("data-rb-universe"))); };
    }

    var observerButton = document.getElementById("rbUnlockObserver");
    if (observerButton) observerButton.onclick = rbUnlockObserverSeed;
}

function rbObserverGateHtml(meta) {
    var canUnlock = meta.highestUniverse >= 10 && meta.metaversePoints >= 10000;
    if (meta.observerUnlocked) {
        return '<div class="rb-mini-panel"><div class="rb-section-title red">Observer</div>' +
            '<div class="rb-multiverse-actions">Status: <b>Awake</b><br>' +
            'Observer points: <b>' + meta.observerPoints.toFixed(1) + '</b><br>' +
            '<span class="rb-muted">Placeholder active. Full subordinate simulation comes after Universe X is tuned.</span><br>' +
            '<button id="rbEnterObserverMode" class="w3-button button">Enter Observer</button></div></div>';
    }
    return '<div class="rb-mini-panel"><div class="rb-section-title red">Observer</div>' +
        '<div class="rb-multiverse-actions">Status: <b>Locked</b><br>' +
        '<span class="rb-muted">Third global layer. Unlocks after Universe X and 10000 MP. Entering it hides the old game tabs and replaces the game with subordinate bot management.</span><br>' +
        '<button id="rbUnlockObserver" class="w3-button button" ' + (canUnlock ? "" : "disabled") + '>Unlock Observer - 10000 MP</button></div></div>';
}

function rbRenderObserverTab() {
    var root = document.getElementById("rbObserverRoot");
    if (!root) return;
    var meta = rbLoadMeta();
    if (!meta.observerUnlocked) {
        root.innerHTML = '<div class="rb-section-title red">Observer</div><div class="rb-multiverse-actions">Observer is locked until Universe X.</div>';
        return;
    }
    var simulacrums = meta.simulacrums && meta.simulacrums.length ? meta.simulacrums : [rbCreateFirstSimulacrum()];
    var html = '<div class="rb-section-title red">Observer</div>' +
        '<div class="rb-summary">' +
            '<div><span class="rb-muted">Observer points</span><b>' + meta.observerPoints.toFixed(1) + '</b></div>' +
            '<div><span class="rb-muted">Subordinates</span><b>' + simulacrums.length + '</b></div>' +
            '<div><span class="rb-muted">Goal</span><b>Reach U-X</b></div>' +
            '<div><span class="rb-muted">Layer</span><b>Third</b></div>' +
        '</div>' +
        '<div class="rb-multiverse-actions"><b>Placeholder</b><br>' +
        '<span class="rb-muted">In the full Observer layer, every subordinate starts from zero and plays Progress Knight automatically. Ranks from Trash to Legendary change bonuses, mistakes and route quality. Their progress generates Observer Points used for global subordinate buffs.</span></div>';
    for (var i = 0; i < simulacrums.length; i++) {
        var sim = simulacrums[i];
        html += '<div class="rb-simulacrum-row"><b>' + sim.name + '</b> <span class="rb-muted">Rank: ' + sim.rank + '</span><br>' +
            '<span class="rb-muted">Starts from U-I, goal U-X. ' + sim.note + '</span></div>';
    }
    root.innerHTML = html;

    var enterButton = document.getElementById("rbEnterObserverMode");
    if (enterButton) {
        enterButton.onclick = function() {
            var latest = rbLoadMeta();
            latest.observerMode = true;
            rbSaveMeta(latest);
            rbApplyObserverMode(latest);
            rbRenderObserverTab();
        };
    }
}

function rbRenderRealityColumn() {
    rbRenderMultiverseTab();
    rbRenderObserverTab();
}

function rbInstallRealityBreakMeta() {
    rbInstallAdminSpeedPatch();
    rbInstallMetaEffectPatch();
    rbRenderRealityColumn();
    rbEnsureAdminSpeedPanel();
    setInterval(function() {
        rbInstallAdminSpeedPatch();
        rbInstallMetaEffectPatch();
        rbTickPassiveMetaverse();
        rbTickObserver();
        rbRenderRealityColumn();
        rbEnsureAdminSpeedPanel();
    }, 1000);
}

window.addEventListener("load", rbInstallRealityBreakMeta);
