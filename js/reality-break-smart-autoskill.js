// Reality Break Smart Auto-learn.
// Priority rule:
// 1) Train skills needed for the next visible unlocks.
// 2) If no unlock skill is currently needed, train all visible skills evenly.

function rbTaskRow(taskName) {
  return document.getElementById("row " + taskName);
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

function rbSkillLevel(skillName) {
  var skill = gameData && gameData.taskData && gameData.taskData[skillName];
  return skill ? skill.level || 0 : 0;
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
    .filter(function(skill) { return rbTaskIsUnlocked(skill.name); })
    .filter(function(skill) { return rbTaskIsVisible(skill.name); })
    .filter(function(skill) { return !rbSkillIsSkipped(skill.name); });
}

function rbRequirementReachableNow(req, focusSkillName) {
  if (!req || !req.requirements) return false;
  return req.requirements.every(function(part) {
    if (!part.task) return true;
    if (part.task === focusSkillName) return true;
    if (rbSkillLevel(part.task) >= part.requirement) return true;
    return rbTaskIsUnlocked(part.task) && rbTaskIsVisible(part.task);
  });
}

function rbCollectNextUnlockSkillTargets() {
  var targets = {};
  if (typeof gameData === "undefined" || !gameData.requirements) return targets;

  function scanCategory(category) {
    for (var i = 0; i < category.length; i++) {
      var entityName = category[i];
      var req = gameData.requirements[entityName];
      if (!req || req.isCompleted() || !req.requirements) continue;

      req.requirements.forEach(function(part) {
        if (!part.task) return;
        var skill = gameData.taskData[part.task];
        if (!(skill instanceof Skill)) return;
        if (!rbTaskIsUnlocked(skill.name) || !rbTaskIsVisible(skill.name) || rbSkillIsSkipped(skill.name)) return;
        if (!rbRequirementReachableNow(req, skill.name)) return;
        if (skill.level >= part.requirement) return;
        targets[skill.name] = Math.max(targets[skill.name] || 0, part.requirement);
      });
      return;
    }
  }

  if (typeof jobCategories !== "undefined") {
    Object.keys(jobCategories).forEach(function(categoryName) { scanCategory(jobCategories[categoryName]); });
  }
  if (typeof skillCategories !== "undefined") {
    Object.keys(skillCategories).forEach(function(categoryName) { scanCategory(skillCategories[categoryName]); });
  }
  return targets;
}

function rbXpToTarget(skill, target) {
  var need = Math.max(0, skill.getMaxXp() - skill.xp);
  function maxXpAt(level) {
    return Math.round(skill.baseData.maxXp * (level + 1) * Math.pow(1.01, level));
  }
  for (var level = skill.level + 1; level < target; level++) need += maxXpAt(level);
  return need;
}

function rbNextBalanceTarget(skill) {
  var nextFive = Math.ceil((skill.level + 1) / 5) * 5;
  var nextTen = Math.ceil((skill.level + 1) / 10) * 10;
  return skill.level < 50 ? nextFive : nextTen;
}

function rbAverageLevel(skills) {
  if (!skills.length) return 0;
  return skills.reduce(function(sum, skill) { return sum + (skill.level || 0); }, 0) / skills.length;
}

function rbPickUnlockPlan(skills, unlockTargets) {
  var plans = skills
    .filter(function(skill) { return unlockTargets[skill.name] && skill.level < unlockTargets[skill.name]; })
    .map(function(skill) {
      var target = unlockTargets[skill.name];
      var need = rbXpToTarget(skill, target);
      var gain = Math.max(0.001, skill.getXpGain ? skill.getXpGain() : 1);
      var days = need / gain;
      var missingRatio = (target - skill.level) / Math.max(1, target);
      var score = 10000 + missingRatio * 1000 - Math.sqrt(days);
      return { skill: skill, target: target, days: days, score: score, mode: "unlock" };
    })
    .sort(function(a, b) { return b.score - a.score; });

  if (!plans.length) return null;

  var current = gameData.currentSkill;
  if (current) {
    var currentPlan = plans.find(function(plan) { return plan.skill.name === current.name; });
    if (currentPlan && currentPlan.score >= plans[0].score * 0.92) return currentPlan;
  }
  return plans[0];
}

function rbPickBalancePlan(skills) {
  if (!skills.length) return null;
  var avg = rbAverageLevel(skills);
  var minLevel = Math.min.apply(null, skills.map(function(skill) { return skill.level || 0; }));

  var plans = skills.map(function(skill) {
    var target = rbNextBalanceTarget(skill);
    var need = rbXpToTarget(skill, target);
    var gain = Math.max(0.001, skill.getXpGain ? skill.getXpGain() : 1);
    var days = need / gain;
    var behind = Math.max(0, avg - skill.level) + Math.max(0, minLevel + 3 - skill.level) * 1.5;
    var quick = 1 / Math.sqrt(Math.max(0.25, days));
    var score = behind * 100 + quick * 25 - skill.level * 0.05;
    return { skill: skill, target: target, days: days, score: score, mode: "balance" };
  }).sort(function(a, b) { return b.score - a.score; });

  var current = gameData.currentSkill;
  if (current) {
    var currentPlan = plans.find(function(plan) { return plan.skill.name === current.name; });
    if (currentPlan && currentPlan.skill.level < currentPlan.target && currentPlan.score >= plans[0].score * 0.85) return currentPlan;
  }
  return plans[0];
}

function rbPickSmartSkillPlan() {
  var skills = rbAvailableSkills();
  if (!skills.length) return null;

  var unlockTargets = rbCollectNextUnlockSkillTargets();
  var unlockPlan = rbPickUnlockPlan(skills, unlockTargets);
  if (unlockPlan) return unlockPlan;

  return rbPickBalancePlan(skills);
}

function rbSetSkill(skillName) {
  if (!skillName || !rbTaskIsUnlocked(skillName) || !rbTaskIsVisible(skillName)) return;
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
  if (!automation || document.getElementById("realityBreakSmartLearnNote")) return;
  var note = document.createElement("div");
  note.id = "realityBreakSmartLearnNote";
  note.style.color = "gray";
  note.style.fontSize = "12px";
  note.style.marginTop = "4px";
  automation.appendChild(note);
}

function rbUpdateSmartAutoLearnUi() {
  var note = document.getElementById("realityBreakSmartLearnNote");
  if (!note) return;
  var plan = rbPickSmartSkillPlan();
  if (!plan) {
    note.textContent = "Smart auto-learn: waiting for unlocked visible skills.";
    return;
  }
  var prefix = plan.mode === "unlock" ? "Unlock priority" : "Balance training";
  note.textContent = prefix + ": " + plan.skill.name + " → lvl " + plan.target + " (~" + rbFormatDays(plan.days) + ")";
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
