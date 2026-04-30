// Reality Break Smart Auto-learn.
// Keeps the original Progress Knight feel, but stops auto-learn from scattering XP randomly.
// The smart checkbox replaces the original autoLearn checkbox and supports route modes.
// Current rule: keep the current skill until the nearest x10 checkpoint, then choose the next target.

var RB_AUTOSKILL_MODE_KEY = "rbSmartAutoLearnMode";

var RB_AUTOSKILL_MODES = {
  balanced: { label: "Balanced", ru: "Баланс" },
  magic: { label: "Rush Magic", ru: "К магии" },
  economy: { label: "Economy", ru: "Экономика" },
  combat: { label: "Combat", ru: "Бой" }
};

var RB_AUTOSKILL_ROUTES = {
  magic: [
    { name: "Concentration", target: 50 },
    { name: "Productivity", target: 30 },
    { name: "Meditation", target: 50 },
    { name: "Concentration", target: 100 },
    { name: "Productivity", target: 60 },
    { name: "Meditation", target: 100 },
    { name: "Concentration", target: 200 },
    { name: "Meditation", target: 200 },
    { name: "Mana control", target: Infinity },
    { name: "Immortality", target: Infinity },
    { name: "Time warping", target: Infinity }
  ],
  economy: [
    { name: "Bargaining", target: 40 },
    { name: "Productivity", target: 40 },
    { name: "Concentration", target: 50 },
    { name: "Bargaining", target: 100 },
    { name: "Productivity", target: 100 },
    { name: "Meditation", target: 60 }
  ],
  combat: [
    { name: "Strength", target: 40 },
    { name: "Battle tactics", target: 30 },
    { name: "Muscle memory", target: 40 },
    { name: "Strength", target: 100 },
    { name: "Battle tactics", target: 80 },
    { name: "Muscle memory", target: 100 },
    { name: "Concentration", target: 60 },
    { name: "Productivity", target: 60 }
  ]
};

function rbTaskRow(taskName) {
  return document.getElementById("row " + taskName);
}

function rbTaskExists(taskName) {
  return typeof gameData !== "undefined" && gameData.taskData && !!gameData.taskData[taskName];
}

function rbTaskIsVisible(taskName) {
  var row = rbTaskRow(taskName);
  if (!row) return false;
  var style = window.getComputedStyle ? window.getComputedStyle(row) : null;
  return !row.classList.contains("hiddenTask") && row.style.display !== "none" && (!style || (style.display !== "none" && style.visibility !== "hidden"));
}

function rbTaskIsUnlocked(taskName) {
  if (typeof gameData === "undefined" || !gameData.requirements) return true;
  var req = gameData.requirements[taskName];
  return !req || req.isCompleted();
}

function rbSkillIsSkipped(skillName) {
  var row = rbTaskRow(skillName);
  if (!row) return false;
  var checkbox = row.getElementsByClassName("checkbox")[0];
  return !!(checkbox && checkbox.checked);
}

function rbSkillIsUsable(skillName) {
  return rbTaskExists(skillName) && rbTaskIsUnlocked(skillName) && rbTaskIsVisible(skillName) && !rbSkillIsSkipped(skillName);
}

function rbDetachOriginalAutoLearn() {
  if (window.__rbSmartAutoLearnDetached) return;
  var original = document.getElementById("autoLearn");
  if (!original) return;

  var smart = original.cloneNode(true);
  smart.id = "rbSmartAutoLearn";
  smart.checked = original.checked;
  smart.classList.add("sidebar-element");
  original.checked = false;
  original.style.display = "none";
  original.setAttribute("aria-hidden", "true");
  original.insertAdjacentElement("afterend", smart);

  window.__rbOriginalAutoLearnCheckbox = original;
  window.__rbSmartAutoLearnCheckbox = smart;
  window.__rbSmartAutoLearnDetached = true;
}

function rbKeepOriginalAutoLearnOff() {
  var original = window.__rbOriginalAutoLearnCheckbox || document.getElementById("autoLearn");
  if (original) {
    original.checked = false;
    original.style.display = "none";
  }
}

function rbAutoLearnEnabled() {
  rbDetachOriginalAutoLearn();
  rbKeepOriginalAutoLearnOff();
  var smart = window.__rbSmartAutoLearnCheckbox || document.getElementById("rbSmartAutoLearn");
  return !!(smart && smart.checked);
}

function rbAvailableSkills() {
  if (typeof gameData === "undefined" || !gameData.taskData) return [];
  return Object.values(gameData.taskData)
    .filter(function(task) { return task instanceof Skill; })
    .filter(function(skill) { return rbSkillIsUsable(skill.name); });
}

function rbNextMultipleOfTen(level) {
  return Math.floor((level || 0) / 10) * 10 + 10;
}

function rbIsAtTenCheckpoint(skill) {
  return (skill.level || 0) > 0 && (skill.level || 0) % 10 === 0;
}

function rbMaxXpAt(skill, level) {
  return Math.round(skill.baseData.maxXp * (level + 1) * Math.pow(1.01, level));
}

function rbCumulativeXpToCurrent(skill) {
  var total = 0;
  for (var level = 0; level < (skill.level || 0); level++) total += rbMaxXpAt(skill, level);
  total += Math.max(0, skill.xp || 0);
  return total;
}

function rbCumulativeXpToTarget(skill, target) {
  var total = 0;
  for (var level = 0; level < target; level++) total += rbMaxXpAt(skill, level);
  return total;
}

function rbPlanForSkill(skill, explicitTarget) {
  var nextCheckpoint = rbNextMultipleOfTen(skill.level || 0);
  var target = explicitTarget && Number.isFinite(explicitTarget) ? Math.max(nextCheckpoint, explicitTarget) : nextCheckpoint;
  var gain = Math.max(0.001, skill.getXpGain ? skill.getXpGain() : 1);
  var currentEquivalentDays = rbCumulativeXpToCurrent(skill) / gain;
  var targetEquivalentDays = rbCumulativeXpToTarget(skill, target) / gain;
  var daysToTarget = Math.max(0.001, targetEquivalentDays - currentEquivalentDays);

  return {
    skill: skill,
    target: target,
    days: daysToTarget,
    currentEquivalentDays: currentEquivalentDays,
    targetEquivalentDays: targetEquivalentDays,
    mode: "smart"
  };
}

function rbPickEvenSkillPlan() {
  var skills = rbAvailableSkills();
  if (!skills.length) return null;

  var plans = skills.map(function(skill) { return rbPlanForSkill(skill); });

  // Choose the skill with the lowest estimated real training-time already invested.
  // This balances level + XP requirements + XP/day instead of blindly following raw levels.
  plans.sort(function(a, b) {
    if (Math.abs(a.currentEquivalentDays - b.currentEquivalentDays) > 0.01) {
      return a.currentEquivalentDays - b.currentEquivalentDays;
    }
    if (Math.abs(a.days - b.days) > 0.01) return a.days - b.days;
    return (a.skill.level || 0) - (b.skill.level || 0);
  });

  return plans[0] || null;
}

function rbGetAutoSkillMode() {
  var select = document.getElementById("rbSmartAutoLearnMode");
  var saved = null;
  try { saved = localStorage.getItem(RB_AUTOSKILL_MODE_KEY); } catch (e) {}
  var mode = select ? select.value : saved;
  return RB_AUTOSKILL_MODES[mode] ? mode : "balanced";
}

function rbSaveAutoSkillMode(mode) {
  if (!RB_AUTOSKILL_MODES[mode]) mode = "balanced";
  try { localStorage.setItem(RB_AUTOSKILL_MODE_KEY, mode); } catch (e) {}
}

function rbPickRouteSkillPlan(mode) {
  var route = RB_AUTOSKILL_ROUTES[mode];
  if (!route || !route.length) return null;

  for (var i = 0; i < route.length; i++) {
    var step = route[i];
    if (!rbSkillIsUsable(step.name)) continue;
    var skill = gameData.taskData[step.name];
    if (step.target === Infinity || (skill.level || 0) < step.target) {
      return rbPlanForSkill(skill, step.target === Infinity ? null : step.target);
    }
  }

  return null;
}

function rbPickSmartSkillPlan() {
  var current = gameData && gameData.currentSkill ? gameData.currentSkill : null;

  // Never hop around before the current chosen skill reaches the next x10 checkpoint.
  // This keeps the Progress Knight rhythm: 0 -> 10 -> 20 -> 30, not chaotic one-level jumps.
  if (current && rbSkillIsUsable(current.name) && !rbIsAtTenCheckpoint(current)) {
    return rbPlanForSkill(current);
  }

  var mode = rbGetAutoSkillMode();
  if (mode !== "balanced") {
    var routePlan = rbPickRouteSkillPlan(mode);
    if (routePlan) return routePlan;
  }

  return rbPickEvenSkillPlan();
}

function rbSetSkill(skillName) {
  if (!skillName || !rbSkillIsUsable(skillName)) return;
  gameData.currentSkill = gameData.taskData[skillName];
}

function rbSmartAutoLearnTick() {
  rbDetachOriginalAutoLearn();
  rbKeepOriginalAutoLearnOff();
  if (!rbAutoLearnEnabled()) return;

  var plan = rbPickSmartSkillPlan();
  if (plan && gameData.currentSkill !== plan.skill) rbSetSkill(plan.skill.name);
}

function rbFormatDays(days) {
  if (!Number.isFinite(days)) return "?";
  if (days >= 365) return (days / 365).toFixed(1) + "y";
  if (days >= 30) return (days / 30).toFixed(1) + "m";
  return Math.max(0.1, days).toFixed(1) + "d";
}

function rbInstallSmartAutoLearnUi() {
  rbDetachOriginalAutoLearn();
  var automation = document.getElementById("automation");
  if (!automation) return;

  if (!document.getElementById("rbSmartAutoLearnMode")) {
    var wrapper = document.createElement("div");
    wrapper.id = "rbSmartAutoLearnModeWrap";
    wrapper.style.marginTop = "4px";
    wrapper.style.fontSize = "12px";
    wrapper.style.color = "gray";

    var label = document.createElement("span");
    label.textContent = "Auto-skill route: ";

    var select = document.createElement("select");
    select.id = "rbSmartAutoLearnMode";
    select.style.maxWidth = "145px";
    select.style.background = "#242424";
    select.style.color = "#fff";
    select.style.border = "1px solid #555";
    select.style.fontSize = "12px";

    Object.keys(RB_AUTOSKILL_MODES).forEach(function(mode) {
      var option = document.createElement("option");
      option.value = mode;
      option.textContent = RB_AUTOSKILL_MODES[mode].label;
      select.appendChild(option);
    });

    var saved = null;
    try { saved = localStorage.getItem(RB_AUTOSKILL_MODE_KEY); } catch (e) {}
    select.value = RB_AUTOSKILL_MODES[saved] ? saved : "balanced";
    select.addEventListener("change", function() { rbSaveAutoSkillMode(select.value); });

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    automation.appendChild(wrapper);
  }

  if (!document.getElementById("realityBreakSmartLearnNote")) {
    var note = document.createElement("div");
    note.id = "realityBreakSmartLearnNote";
    note.style.color = "gray";
    note.style.fontSize = "12px";
    note.style.marginTop = "4px";
    automation.appendChild(note);
  }
}

function rbUpdateSmartAutoLearnUi() {
  var note = document.getElementById("realityBreakSmartLearnNote");
  if (!note) return;
  var plan = rbPickSmartSkillPlan();
  if (!plan) {
    note.textContent = "Auto-learn: waiting for unlocked visible skills.";
    return;
  }
  var mode = rbGetAutoSkillMode();
  var modeLabel = RB_AUTOSKILL_MODES[mode] ? RB_AUTOSKILL_MODES[mode].label : "Balanced";
  note.textContent = modeLabel + ": " + plan.skill.name + " -> lvl " + plan.target + " (~" + rbFormatDays(plan.days) + ", invested ~" + rbFormatDays(plan.currentEquivalentDays) + ")";
}

function installRealityBreakSmartAutoLearn() {
  rbInstallSmartAutoLearnUi();
  if (!window.__rbSmartAutoLearnInterval) {
    window.__rbSmartAutoLearnInterval = setInterval(function() {
      rbInstallSmartAutoLearnUi();
      rbUpdateSmartAutoLearnUi();
      rbSmartAutoLearnTick();
    }, 100);
  }
}

installRealityBreakSmartAutoLearn();
window.addEventListener("load", installRealityBreakSmartAutoLearn);
