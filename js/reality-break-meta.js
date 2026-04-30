// Reality Break meta-layer scaffold.
// This file owns only the right-side meta column and admin speed controls.

var REALITY_BREAK_SAVE_KEY = "progress-knight-reality-break-meta-v1";
var REALITY_BREAK_ADMIN_SPEED_KEY = "progress-knight-reality-break-admin-speed-v1";

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

function rbCloneDefaultMeta() {
    return JSON.parse(JSON.stringify(REALITY_BREAK_DEFAULT_META));
}

function rbLoadMeta() {
    try {
        var raw = localStorage.getItem(REALITY_BREAK_SAVE_KEY);
        if (!raw) return rbCloneDefaultMeta();
        var parsed = JSON.parse(raw);
        var meta = rbCloneDefaultMeta();
        for (var key in parsed) meta[key] = parsed[key];
        meta.globalUpgrades = Object.assign({}, REALITY_BREAK_DEFAULT_META.globalUpgrades, parsed.globalUpgrades || {});
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
    return Math.max(0, Math.floor(Math.sqrt(gameData.evil || 0) + highestJobLevel / 20 + highestSkillLevel / 25));
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
    column.innerHTML =
        '<h2 style="margin-top: 0">Reality Break</h2>' +
        '<div class="rb-note">Meta progression</div>' +
        '<div id="rbRealityStatus"></div>' +
        '<div id="rbAdminSpeedPanel" style="margin-top: 12px"></div>';
    frame.appendChild(column);
    return column;
}

function rbRenderAdminSpeedPanel() {
    var panel = document.getElementById("rbAdminSpeedPanel");
    if (!panel) return;
    var current = rbGetAdminTargetSpeed();
    var speeds = [5, 10, 50, 100];
    var html = '<div class="rb-title">Admin speed</div>';
    for (var i = 0; i < speeds.length; i++) {
        var speed = speeds[i];
        var label = speed === 5 ? "x5 base" : "x" + speed;
        html += '<button class="w3-button button rb-speed-button' + (current === speed ? ' active' : '') + '" data-rb-speed="' + speed + '">' + label + '</button>';
    }
    panel.innerHTML = html;
    var buttons = panel.getElementsByClassName("rb-speed-button");
    for (var j = 0; j < buttons.length; j++) {
        buttons[j].onclick = function() {
            rbSetAdminSpeedMultiplier(Number(this.getAttribute("data-rb-speed")));
            rbRenderAdminSpeedPanel();
        };
    }
}

function rbRenderRealityStatus() {
    var meta = rbLoadMeta();
    var status = document.getElementById("rbRealityStatus");
    if (!status) return;
    var gain = rbGetMetaverseGain();
    status.innerHTML =
        '<div>Reality broken: <b>' + (meta.realityBroken ? "yes" : "no") + '</b></div>' +
        '<div>Universe: <b>' + meta.currentUniverse + '</b></div>' +
        '<div>Metaverse points: <b>' + meta.metaversePoints + '</b></div>' +
        '<div style="margin-top: 8px; color: gray">Requirements: ' + rbMissingRealityRequirementsText() + '</div>' +
        '<div style="margin-top: 4px">Estimated gain: <b>' + gain + ' MP</b></div>';
}

function rbInstallRealityBreakMeta() {
    rbInstallAdminSpeedPatch();
    rbCreateRealityColumn();
    rbRenderRealityStatus();
    rbRenderAdminSpeedPanel();
    setInterval(function() {
        rbInstallAdminSpeedPatch();
        rbCreateRealityColumn();
        rbRenderRealityStatus();
    }, 1000);
}

window.addEventListener("load", rbInstallRealityBreakMeta);
