// Reality Break meta-layer.
// Keeps the original Progress Knight loop intact while adding the second meta layer as a normal tab.

var REALITY_BREAK_SAVE_KEY = "progress-knight-reality-break-meta-v2";
var REALITY_BREAK_ADMIN_SPEED_KEY = "progress-knight-reality-break-admin-speed-v1";

var REALITY_BREAK_UPGRADES = {
    stableMemory: {name: "Stable Memory", description: "+8% all XP per level", baseCost: 5, growth: 1.85},
    universalLabor: {name: "Universal Labor", description: "+10% income per level", baseCost: 6, growth: 1.9},
    longEcho: {name: "Long Echo", description: "+5% lifespan per level", baseCost: 8, growth: 2.0},
    darkDividend: {name: "Dark Dividend", description: "+15% Evil gain per level", baseCost: 10, growth: 2.1},
    chronalCartography: {name: "Chronal Cartography", description: "+7% game speed per level inside unlocked universes", baseCost: 18, growth: 2.25},
    universeEngine: {name: "Universe Engine", description: "+12% passive MP per level", baseCost: 22, growth: 2.35},
};

var REALITY_BREAK_EVIL_PERKS = [
    {id: "shadowDiscipline", name: "Shadow Discipline", cost: 25, description: "+12% all XP", requirements: []},
    {id: "darkPatronage", name: "Dark Patronage", cost: 75, description: "+15% income", requirements: [{task: "Dark influence", level: 40}]},
    {id: "wickedBargain", name: "Wicked Bargain", cost: 160, description: "-8% expenses", requirements: [{task: "Intimidation", level: 70}]},
    {id: "soulFurnace", name: "Soul Furnace", cost: 320, description: "+30% Evil gain", requirements: [{task: "Soul binding", level: 40}]},
    {id: "deathDefiance", name: "Death Defiance", cost: 620, description: "+18% lifespan", requirements: [{task: "Grave vitality", level: 60}]},
    {id: "demonicMomentum", name: "Demonic Momentum", cost: 950, description: "+12% game speed", requirements: [{task: "Dark haste", level: 80}]},
    {id: "realityRupture", name: "Reality Rupture", cost: 1500, description: "Required for Reality Break", requirements: [{task: "Reality fracture", level: 60}, {task: "Reality heretic", level: 10}]},
];

var REALITY_BREAK_UNIVERSES = [
    {id: 1, name: "Prime World", breakCost: 0, xp: 1, income: 1, expense: 1, mp: 1, focus: "Balanced record", stat: "balanced", rule: "Original Progress Knight rules. Low passive MP, but every record here still matters."},
    {id: 2, name: "Strained Kingdom", breakCost: 60, xp: 0.96, income: 0.92, expense: 1.08, mp: 1.55, focus: "Best job level", stat: "job", rule: "Guild paperwork slows progress and taxes bite harder. Passive MP scales mostly from best job level."},
    {id: 3, name: "Taxed Crown", breakCost: 180, xp: 0.92, income: 0.86, expense: 1.18, mp: 2.1, focus: "Best income route", stat: "job", rule: "Comfort costs more; economy planning matters earlier. Passive MP favors stronger work records."},
    {id: 4, name: "Slow Hourglass", breakCost: 480, xp: 0.86, income: 0.86, expense: 1.3, mp: 2.9, focus: "Game speed", stat: "speed", rule: "Time feels heavier; Time warping and Dark haste carry more weight."},
    {id: 5, name: "War Ledger", breakCost: 1100, xp: 0.8, income: 0.82, expense: 1.45, mp: 4.0, focus: "Combat and jobs", stat: "job", rule: "Military paths strain the realm, but strong work records improve passive MP."},
    {id: 6, name: "Arcane Debt", breakCost: 2600, xp: 0.74, income: 0.78, expense: 1.62, mp: 5.6, focus: "Best skill level", stat: "skill", rule: "Magic is powerful but the world charges interest. Passive MP favors skill records."},
    {id: 7, name: "Cracked Lifeline", breakCost: 6200, xp: 0.68, income: 0.74, expense: 1.82, mp: 7.8, focus: "Lifespan", stat: "lifespan", rule: "Lifespan pressure rises; endurance, immortality and grave vitality become central."},
    {id: 8, name: "Inverted Guilds", breakCost: 14500, xp: 0.62, income: 0.69, expense: 2.05, mp: 10.8, focus: "Mixed mastery", stat: "balanced", rule: "Work and study pacing no longer line up cleanly. Balanced records matter most."},
    {id: 9, name: "Broken Chronicle", breakCost: 33000, xp: 0.56, income: 0.64, expense: 2.35, mp: 15.0, focus: "Evil record", stat: "evil", rule: "Most old assumptions are punished; evil records and meta upgrades are required."},
    {id: 10, name: "Reality Soup", breakCost: 75000, xp: 0.5, income: 0.58, expense: 2.75, mp: 22, focus: "Everything", stat: "balanced", rule: "The final universe is unstable enough to reveal the Observer."},
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
        chronalCartography: 0,
        universeEngine: 0,
    },
    evilPerks: {},
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
        meta.evilPerks = Object.assign({}, REALITY_BREAK_DEFAULT_META.evilPerks, parsed.evilPerks || {});
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

function rbTaskLevel(name) {
    if (typeof gameData === "undefined" || !gameData.taskData || !gameData.taskData[name]) return 0;
    return gameData.taskData[name].level || 0;
}

function rbEvilPerkById(id) {
    for (var i = 0; i < REALITY_BREAK_EVIL_PERKS.length; i++) {
        if (REALITY_BREAK_EVIL_PERKS[i].id === id) return REALITY_BREAK_EVIL_PERKS[i];
    }
    return null;
}

function rbHasEvilPerk(id, meta) {
    if (!meta) meta = rbLoadMeta();
    return !!(meta.evilPerks && meta.evilPerks[id]);
}

function rbEvilPerkRequirementsText(perk) {
    if (!perk.requirements || !perk.requirements.length) return "No skill requirement.";
    var parts = [];
    for (var i = 0; i < perk.requirements.length; i++) {
        var requirement = perk.requirements[i];
        parts.push(requirement.task + " " + rbTaskLevel(requirement.task) + "/" + requirement.level);
    }
    return parts.join(", ");
}

function rbEvilPerkRequirementsMet(perk) {
    if (!perk || !perk.requirements) return true;
    for (var i = 0; i < perk.requirements.length; i++) {
        var requirement = perk.requirements[i];
        if (rbTaskLevel(requirement.task) < requirement.level) return false;
    }
    return true;
}

function rbCanBuyEvilPerk(id, meta) {
    if (!meta) meta = rbLoadMeta();
    var perk = rbEvilPerkById(id);
    return !!perk &&
        !rbHasEvilPerk(id, meta) &&
        typeof gameData !== "undefined" &&
        (gameData.evil || 0) >= perk.cost &&
        rbEvilPerkRequirementsMet(perk);
}

function rbBuyEvilPerk(id) {
    var meta = rbLoadMeta();
    var perk = rbEvilPerkById(id);
    if (!perk || !rbCanBuyEvilPerk(id, meta)) return;
    gameData.evil -= perk.cost;
    meta.evilPerks[id] = true;
    rbSaveMeta(meta);
    if (typeof saveGameData === "function") saveGameData();
    if (id === "realityRupture") {
        rbBreakReality(true);
        return;
    }
    rbRenderMultiverseTab();
}

function rbEvilPerkXpMultiplier(meta) {
    var multiplier = 1;
    if (rbHasEvilPerk("shadowDiscipline", meta)) multiplier *= 1.12;
    return multiplier;
}

function rbEvilPerkIncomeMultiplier(meta) {
    var multiplier = 1;
    if (rbHasEvilPerk("darkPatronage", meta)) multiplier *= 1.15;
    return multiplier;
}

function rbEvilPerkExpenseMultiplier(meta) {
    var multiplier = 1;
    if (rbHasEvilPerk("wickedBargain", meta)) multiplier *= 0.92;
    return multiplier;
}

function rbEvilPerkLifespanMultiplier(meta) {
    var multiplier = 1;
    if (rbHasEvilPerk("deathDefiance", meta)) multiplier *= 1.18;
    return multiplier;
}

function rbEvilPerkSpeedMultiplier(meta) {
    var multiplier = 1;
    if (rbHasEvilPerk("demonicMomentum", meta)) multiplier *= 1.12;
    return multiplier;
}

function rbEvilPerkEvilGainMultiplier(meta) {
    var multiplier = 1;
    if (rbHasEvilPerk("soulFurnace", meta)) multiplier *= 1.3;
    return multiplier;
}

function rbAllXpMultiplier() {
    var meta = rbLoadMeta();
    return rbUniverseRule(meta.currentUniverse).xp *
        (1 + (meta.globalUpgrades.stableMemory || 0) * 0.08) *
        rbEvilPerkXpMultiplier(meta);
}

function rbIncomeMultiplier() {
    var meta = rbLoadMeta();
    return rbUniverseRule(meta.currentUniverse).income *
        (1 + (meta.globalUpgrades.universalLabor || 0) * 0.1) *
        rbEvilPerkIncomeMultiplier(meta);
}

function rbExpenseMultiplier() {
    var meta = rbLoadMeta();
    return rbUniverseRule(meta.currentUniverse).expense * rbEvilPerkExpenseMultiplier(meta);
}

function rbLifespanMultiplier() {
    var meta = rbLoadMeta();
    return (1 + (meta.globalUpgrades.longEcho || 0) * 0.05) * rbEvilPerkLifespanMultiplier(meta);
}

function rbEvilGainMultiplier() {
    var meta = rbLoadMeta();
    return (1 + (meta.globalUpgrades.darkDividend || 0) * 0.15) * rbEvilPerkEvilGainMultiplier(meta);
}

function rbMetaverseGainMultiplier() {
    var meta = rbLoadMeta();
    var realityFracture = typeof gameData !== "undefined" && gameData.taskData && gameData.taskData["Reality fracture"] ?
        gameData.taskData["Reality fracture"].getEffect() : 1;
    var dimensionalMapping = typeof gameData !== "undefined" && gameData.taskData && gameData.taskData["Dimensional mapping"] ?
        gameData.taskData["Dimensional mapping"].getEffect() : 1;
    return rbUniverseRule(meta.currentUniverse).mp * realityFracture * dimensionalMapping;
}

function rbUniverseSpeedMultiplier() {
    var meta = rbLoadMeta();
    var chronoGeometry = typeof gameData !== "undefined" && gameData.taskData && gameData.taskData["Chrono geometry"] ?
        gameData.taskData["Chrono geometry"].getEffect() : 1;
    if (!meta.realityBroken) return rbEvilPerkSpeedMultiplier(meta);
    return rbEvilPerkSpeedMultiplier(meta) * (1 + (meta.globalUpgrades.chronalCartography || 0) * 0.07) * chronoGeometry;
}

function rbUniverseRecord(meta, id) {
    if (!meta.universeRecords) meta.universeRecords = {};
    if (!meta.universeRecords[id]) {
        meta.universeRecords[id] = {
            bestJobLevel: 0,
            bestSkillLevel: 0,
            bestEvil: 0,
            bestLifespanYears: 0,
            bestGameSpeed: 0,
            collapses: 0,
        };
    }
    return meta.universeRecords[id];
}

function rbCurrentUniversePower() {
    if (typeof gameData === "undefined" || !gameData.taskData) return {job: 0, skill: 0, evil: 0, lifespan: 0, speed: 0};
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
        lifespan: typeof getLifespan === "function" ? Math.floor(getLifespan() / 365) : 0,
        speed: typeof getGameSpeed === "function" ? getGameSpeed() : 0,
    };
}

function rbUpdateCurrentUniverseRecord(meta) {
    var record = rbUniverseRecord(meta, meta.currentUniverse || 1);
    var power = rbCurrentUniversePower();
    record.bestJobLevel = Math.max(record.bestJobLevel || 0, power.job);
    record.bestSkillLevel = Math.max(record.bestSkillLevel || 0, power.skill);
    record.bestEvil = Math.max(record.bestEvil || 0, power.evil);
    record.bestLifespanYears = Math.max(record.bestLifespanYears || 0, power.lifespan);
    record.bestGameSpeed = Math.max(record.bestGameSpeed || 0, power.speed);
    return record;
}

function rbUniversePassiveRate(meta, id) {
    var universe = rbUniverseRule(id);
    var record = rbUniverseRecord(meta, id);
    var jobPower = Math.sqrt(Math.max(0, record.bestJobLevel || 0)) * 0.014;
    var skillPower = Math.sqrt(Math.max(0, record.bestSkillLevel || 0)) * 0.014;
    var evilPower = Math.log10(Math.max(1, (record.bestEvil || 0) + 1)) * 0.045;
    var lifespanPower = Math.sqrt(Math.max(0, (record.bestLifespanYears || 0) / 100)) * 0.05;
    var speedPower = Math.sqrt(Math.max(0, (record.bestGameSpeed || 0) / 20)) * 0.045;
    var focusPower = 0;
    if (universe.stat === "job") focusPower = jobPower * 1.4;
    else if (universe.stat === "skill") focusPower = skillPower * 1.4;
    else if (universe.stat === "evil") focusPower = evilPower * 1.7;
    else if (universe.stat === "lifespan") focusPower = lifespanPower * 2.0;
    else if (universe.stat === "speed") focusPower = speedPower * 1.8;
    else focusPower = (jobPower + skillPower + evilPower + lifespanPower + speedPower) * 0.65;
    var progressPower = focusPower + (record.collapses || 0) * 0.1;
    var base = 0.001 * Math.pow(universe.id, 1.5);
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
    total *= 1 + (meta.globalUpgrades.universeEngine || 0) * 0.12;
    if (typeof gameData !== "undefined" && gameData.taskData && gameData.taskData["Universe attunement"]) {
        total *= gameData.taskData["Universe attunement"].getEffect();
    }
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
    return !!universe && meta.realityBroken && rbPreviousUniverseCleared(meta, universe.id);
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
        return window.__rbOriginalGetGameSpeed() * rbGetAdminSpeedMultiplier() * rbUniverseSpeedMultiplier();
    };
    window.getGameSpeed = getGameSpeed;
}

function rbCanBreakReality() {
    if (typeof gameData === "undefined" || !gameData.taskData) return false;
    if (rbLoadMeta().realityBroken) return false;
    return rbCanBuyEvilPerk("realityRupture", rbLoadMeta()) || rbHasEvilPerk("realityRupture", rbLoadMeta());
}

function rbCanCollapseCurrentUniverse(meta) {
    if (!meta) meta = rbLoadMeta();
    if (!meta.realityBroken) return false;
    var universe = rbUniverseRule(meta.currentUniverse || 1);
    return (meta.metaversePoints || 0) >= (universe.breakCost || 0);
}

function rbLegacyRealityRequirementsMet() {
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
    var perk = rbEvilPerkById("realityRupture");
    if ((gameData.evil || 0) < perk.cost) missing.push("Evil " + Math.floor(gameData.evil || 0) + "/" + perk.cost);
    for (var i = 0; i < perk.requirements.length; i++) {
        var requirement = perk.requirements[i];
        var level = rbTaskLevel(requirement.task);
        if (level < requirement.level) missing.push(requirement.task + " " + level + "/" + requirement.level);
    }
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

function rbBreakReality(fromEvilPerk) {
    if (!fromEvilPerk && !rbCanBreakReality()) return;
    var meta = rbLoadMeta();
    if (meta.realityBroken) return;
    meta.realityBroken = true;
    meta.breaks = (meta.breaks || 0) + 1;
    meta.unlockedAt = meta.unlockedAt || Date.now();
    var record = rbUpdateCurrentUniverseRecord(meta);
    record.collapses = (record.collapses || 0) + 1;
    meta.highestUniverse = Math.max(meta.highestUniverse || 1, 2);
    if (meta.unlockedUniverses.indexOf(2) < 0) meta.unlockedUniverses.push(2);
    meta.metaversePoints += rbGetMetaverseGain();
    rbSaveMeta(meta);
    rbResetCurrentRun();
    rbRenderMultiverseTab();
}

function rbCollapseCurrentUniverse() {
    var meta = rbLoadMeta();
    if (!rbCanCollapseCurrentUniverse(meta)) return;
    var universe = rbUniverseRule(meta.currentUniverse || 1);
    var cost = universe.breakCost || 0;
    meta.metaversePoints -= cost;
    var record = rbUpdateCurrentUniverseRecord(meta);
    record.collapses = (record.collapses || 0) + 1;
    meta.breaks = (meta.breaks || 0) + 1;
    meta.metaversePoints += rbGetMetaverseGain();
    var nextId = Math.min(10, (meta.currentUniverse || 1) + 1);
    if (nextId > (meta.highestUniverse || 1)) {
        meta.highestUniverse = nextId;
        if (meta.unlockedUniverses.indexOf(nextId) < 0) meta.unlockedUniverses.push(nextId);
    }
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
    return !!meta.realityBroken;
}

function rbCanShowEvilPerks() {
    return typeof gameData !== "undefined" && ((gameData.evil || 0) > 0 || (gameData.rebirthTwoCount || 0) > 0);
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
    var evilPerksButton = document.getElementById("evilPerksTabButton");
    var multiverseButton = document.getElementById("multiverseTabButton");
    var observerButton = document.getElementById("observerTabButton");
    if (!multiverseButton || !observerButton) return;

    if (evilPerksButton) {
        if (rbCanShowEvilPerks()) {
            evilPerksButton.classList.remove("hidden");
        } else {
            evilPerksButton.classList.add("hidden");
        }
    }

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

function rbEvilPerkHtml(meta, perk) {
    var owned = rbHasEvilPerk(perk.id, meta);
    var canBuy = rbCanBuyEvilPerk(perk.id, meta);
    var isRealityBreak = perk.id === "realityRupture";
    var buttonText = owned ? (isRealityBreak ? "Reality broken" : "Owned") : (isRealityBreak ? "Break reality - " : "Buy - ") + perk.cost + " Evil";
    return '<tr class="' + (owned ? 'unlocked' : '') + '">' +
        '<td><b>' + perk.name + '</b></td>' +
        '<td>' + perk.description + '<br><span class="rb-muted">Required: ' + rbEvilPerkRequirementsText(perk) + '</span></td>' +
        '<td>' + perk.cost + ' Evil</td>' +
        '<td><button class="w3-button button rb-buy-evil-perk" data-rb-evil-perk="' + perk.id + '"' + (canBuy ? "" : " disabled") + '>' + buttonText + '</button></td>' +
    '</tr>';
}

function rbRenderEvilPerksTab() {
    var root = document.getElementById("rbEvilPerksRoot");
    if (!root) return;
    rbUpdateMetaTabVisibility(rbLoadMeta());
    if (!rbCanShowEvilPerks()) {
        root.innerHTML = '<div class="rb-section-title red">Evil perks</div><div class="rb-multiverse-actions">Evil perks unlock after the first Evil rebirth.</div>';
        return;
    }
    var meta = rbLoadMeta();
    var html = '<div class="rb-section-title red">Evil perks</div>' +
        '<div class="rb-summary">' +
            '<div><span class="rb-muted">Evil</span><b style="color: rgb(200, 0, 0)">' + Math.floor(gameData.evil || 0) + '</b></div>' +
            '<div><span class="rb-muted">Owned perks</span><b>' + Object.keys(meta.evilPerks || {}).length + '/' + REALITY_BREAK_EVIL_PERKS.length + '</b></div>' +
            '<div><span class="rb-muted">Next layer</span><b>' + (meta.realityBroken ? 'Multiverse open' : 'Reality Break') + '</b></div>' +
            '<div><span class="rb-muted">Break requirement</span><b>' + rbMissingRealityRequirementsText() + '</b></div>' +
        '</div>' +
        '<div class="rb-multiverse-actions"><b>Evil phase</b><br>' +
        '<span class="rb-muted">These are permanent Evil purchases. The final perk is the first Reality Break and opens the Multiverse.</span></div>' +
        '<table class="rb-multiverse-table rb-upgrade-table"><thead><tr><th style="width: 190px;">Perk</th><th>Effect</th><th style="width: 90px;">Cost</th><th style="width: 165px;"></th></tr></thead><tbody>';
    for (var i = 0; i < REALITY_BREAK_EVIL_PERKS.length; i++) {
        html += rbEvilPerkHtml(meta, REALITY_BREAK_EVIL_PERKS[i]);
    }
    html += '</tbody></table>';
    root.innerHTML = html;
    var buttons = root.getElementsByClassName("rb-buy-evil-perk");
    for (var j = 0; j < buttons.length; j++) {
        buttons[j].onclick = function() { rbBuyEvilPerk(this.getAttribute("data-rb-evil-perk")); };
    }
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
            '<td>' + universe.rule + '<br><span class="rb-muted">Focus: ' + universe.focus + '. XP x' + universe.xp.toFixed(2) + ', income x' + universe.income.toFixed(2) + ', expenses x' + universe.expense.toFixed(2) + ', MP x' + universe.mp.toFixed(2) + '</span></td>' +
            '<td class="' + (unlocked ? 'rb-mp' : 'rb-muted') + '">' + (unlocked ? '+' + rbUniversePassiveRate(meta, universe.id).toFixed(3) + ' MP/s' : 'Locked') + '</td>';
        if (unlocked) {
            html += '<td>' + (current ? '<b>Current</b>' : 'Unlocked') + '</td>' +
                '<td><button class="w3-button button rb-enter-universe" data-rb-universe="' + universe.id + '"' + (current ? ' disabled' : '') + '>' + (current ? 'Current' : 'Enter') + '</button></td>';
        } else if (universe.id === (meta.highestUniverse || 1) + 1) {
            var previous = rbUniverseRule(universe.id - 1);
            var requirementText = rbPreviousUniverseCleared(meta, universe.id) ? 'Unlocked by collapse' : 'Break U-' + (universe.id - 1) + ' for ' + (previous.breakCost || 0) + ' MP';
            html += '<td>' + requirementText + '</td>' +
                '<td><button class="w3-button button rb-unlock-universe" data-rb-universe="' + universe.id + '" ' + (canUnlock ? "" : "disabled") + '>Claim</button></td>';
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
    if (!meta.realityBroken) {
        root.innerHTML = '<div class="rb-section-title">Multiverse</div><div class="rb-multiverse-actions">The Multiverse is locked until the final Evil perk breaks reality.</div>';
        rbUpdateMetaTabVisibility(meta);
        return;
    }
    var gain = rbGetMetaverseGain();
    rbUpdateCurrentUniverseRecord(meta);
    rbSaveMeta(meta);
    rbUpdateMetaTabVisibility(meta);
    var passiveRate = rbTotalPassiveMpRate(meta);
    var currentUniverse = rbUniverseRule(meta.currentUniverse || 1);
    var canCollapse = rbCanCollapseCurrentUniverse(meta);
    var html = '<div class="rb-section-title">Multiverse</div>' +
        '<div class="rb-summary">' +
            '<div><span class="rb-muted">Metaverse points</span><b class="rb-mp">' + meta.metaversePoints.toFixed(2) + '</b></div>' +
            '<div><span class="rb-muted">Passive MP/sec</span><b class="rb-good">+' + passiveRate.toFixed(3) + '</b></div>' +
            '<div><span class="rb-muted">Current universe</span><b>U-' + (meta.currentUniverse || 1) + '</b></div>' +
            '<div><span class="rb-muted">Highest universe</span><b>U-' + (meta.highestUniverse || 1) + '</b></div>' +
        '</div>' +
        '<div class="rb-multiverse-actions">' +
            '<div><b>Universe collapse</b> <span class="rb-muted">Second meta layer. Collapse the current universe to earn MP and unlock the next universe.</span></div>' +
            '<div>Collapse cost: <b class="rb-mp">' + (currentUniverse.breakCost || 0) + ' MP</b> · Estimated gain: <b class="rb-mp">' + gain + ' MP</b></div>' +
            '<div class="rb-muted">Current rule: ' + currentUniverse.rule + '</div>' +
            '<button id="rbCollapseUniverseButton" class="w3-button button" ' + (canCollapse ? "" : "disabled") + '>Collapse U-' + (meta.currentUniverse || 1) + '</button>' +
        '</div>';

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
                rbUpgradeHtml("chronalCartography") +
                rbUpgradeHtml("universeEngine") +
            '</tbody></table></div>' +
            rbObserverGateHtml(meta) +
        '</div>';

    html += '<div class="rb-note-line">Universes are the second large meta layer. You can switch between every unlocked universe at any time; switching resets the current run but keeps meta progress.</div>';
    root.innerHTML = html;

    var collapseButton = document.getElementById("rbCollapseUniverseButton");
    if (collapseButton) collapseButton.onclick = rbCollapseCurrentUniverse;

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
    rbRenderEvilPerksTab();
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
