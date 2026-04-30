// Reality Break Smart Auto-learn.
// Replaces the original auto-learn priority with a planner that considers unlocks, quick levels and useful passive bonuses.
// The original game still calls setTask() from its own automation loop, so this script intercepts skill picks too.

function rbSkillIsVisible(skillName) {
  var row = document.getElementById("row " + skillName);
  if (!row) return false;
  return !row.classList.contains("hiddenTask") && row.style.display !== "none";
}

function rbSkillIsSkipped(skillName) {
  var row = document.getElementById("row " + skillName);
  if (!row) return false;
  var checkbox = row.getElementsByClassName("checkbox")[0];
  return !!(checkbox && checkbox.checked);
}

function rbIsSkillName(taskName) {
  if (typeof gameData === "undefined" || !gameData.taskData || !gameData.taskData[taskName]) return false;
  return gameData.taskData[taskName] instanceof Skill;
}

function rbAutoLearnEnabled() {
  var autoLearn = document.getElementById("autoLearn");
  return !!(autoLearn && autoLearn.checked);
}

function rbAvailableSkills() {
  if (typeof gameData === "undefined" || !gameData.taskData) return [];
  return Object.values(gameData.taskData)
    .filter(function(task) { return task instanceof Skill; })
    .filter(function(skill) { return rbSkillIsVisible(skill.name); })
    .filter(function(skill) { return !rbSkillIsSkipped(skill.name); });
}

function rbRequirementTargetsForSkill(skillName) {
  var targets = [5, 10, 15, 25, 40, 50, 75, 100, 150, 250];
  if (typeof gameData === "undefined" || !gameData.requirements) return targets;

  Object.keys(gameData.requirements).forEach(function(entityName) {
    var req = gameData.requirements[entityName];
    if (!req || !req.requirements || req.isCompleted()) return;
    req.requirements.forEach(function(part) {
      if (part.task === skillName && targets.indexOf(part.requirement) === -1) targets.push(part.requirement);
    });
  });

  return targets.filter(function(value) { return Number.isFinite(value) && value > 0; }).sort(function(a, b) { return a - b; });
}

function rbNextTargetForSkill(skill) {
  var targets = rbRequirementTargetsForSkill(skill.name);
  for (var i = 0; i < targets.length; i++) {
    if (targets[i] > skill.level) return targets[i];
  }
  return Math.ceil((skill.level + 1) / 25) * 25;
}

function rbXpToTarget(skill, target) {
  var need = Math.max(0, skill.getMaxXp() - skill.xp);
  function maxXpAt(level) {
    return Math.round(skill.baseData.maxXp * (level + 1) * Math.pow(1.01, level));
  }
  for (var level = skill.level + 1; level < target; level++) need += maxXpAt(level);
  return need;
}

function rbUnlockScore(skill, target) {
  if (typeof gameData === "undefined" || !gameData.requirements) return 1;
  var score = 1;

  Object.keys(gameData.requirements).forEach(function(entityName) {
    var req = gameData.requirements[entityName];
    if (!req || !req.requirements || req.isCompleted()) return;
    req.requirements.forEach(function(part) {
      if (part.task !== skill.name) return;
      var progress = target >= part.requirement ? 1 : target / Math.max(1, part.requirement);
      var entity = gameData.taskData[entityName] || gameData.itemData[entityName];
      var isJob = entity instanceof Job;
      var isSkill = entity instanceof Skill;
      score += progress * (isJob ? 2.6 : isSkill ? 2.0 : 1.2);
    });
  });

  return score;
}

function rbEffectScore(skill) {
  var desc = (skill.baseData.description || "").toLowerCase();
  var score = 1;

  if (desc.includes("skill xp")) score += 1.4;
  if (desc.includes("job xp")) score += 1.1;
  if (desc.includes("all xp")) score += 1.6;
  if (desc.includes("happiness")) score += 1.2;
  if (desc.includes("expenses")) score += 0.9;
  if (desc.includes("military")) score += 0.7;
  if (desc.includes("strength")) score += 0.55;
  if (desc.includes("magic") || desc.includes("t.a.a")) score += 1.15;
  if (desc.includes("lifespan")) score += 1.1;
  if (desc.includes("gamespeed")) score += 1.25;
  if (desc.includes("evil gain")) score += 1.2;
  if (desc.includes("job pay")) score += 0.75;

  var mana = gameData.taskData && gameData.taskData["Mana control"];
  if (!mana || mana.level <= 0) {
    if (["Concentration", "Productivity", "Meditation"].indexOf(skill.name) !== -1) score += 0.9;
    if (skill.name === "Bargaining" || skill.name === "Strength") score += 0.35;
  }

  return score;
}

function rbQuickWinScore(daysToTarget, level) {
  var quick = 1 / Math.sqrt(Math.max(0.25, daysToTarget));
  var early = level < 25 ? 0.65 : level < 50 ? 0.35 : 0.15;
  return 1 + quick * 1.8 + early;
}

function rbAverageSkillLevel(skills) {
  if (!skills.length) return 0;
  return skills.reduce(function(sum, skill) { return sum + (skill.level || 0); }, 0) / skills.length;
}

function rbRankSmartSkills() {
  var skills = rbAvailableSkills();
  if (!skills.length) return [];

  var averageLevel = rbAverageSkillLevel(skills);
  return skills.map(function(skill) {
    var target = rbNextTargetForSkill(skill);
    var need = rbXpToTarget(skill, target);
    var gain = Math.max(0.001, skill.getXpGain ? skill.getXpGain() : 1);
    var days = need / gain;
    var catchUp = Math.sqrt((averageLevel + 12) / ((skill.level || 0) + 12));
    var unlock = rbUnlockScore(skill, target);
    var effect = rbEffectScore(skill) * Math.sqrt(Math.max(1, skill.getEffect ? skill.getEffect() : 1));
    var quick = rbQuickWinScore(days, skill.level || 0);
    var score = (unlock * 0.95 + effect * 1.35 + quick * 1.15) * catchUp / Math.pow(Math.max(0.35, days), 0.72);
    return { skill: skill, target: target, days: days, score: score };
  }).sort(function(a, b) { return b.score - a.score; });
}

function rbPickSmartSkillPlan() {
  var ranked = rbRankSmartSkills();
  if (!ranked.length) return null;

  var best = ranked[0];
  var current = gameData.currentSkill;
  if (current) {
    var currentPlan = ranked.find(function(entry) { return entry.skill.name === current.name; });
    if (currentPlan && current.level < currentPlan.target && currentPlan.score >= best.score * 0.88) return currentPlan;
  }
  return best;
}

function rbSetSkillWithoutIntercept(skillName) {
  if (!skillName) return;
  var originalSetTask = window.__rbOriginalSetTask || window.setTask || setTask;
  window.__rbSmartAutoLearnBypass = true;
  try { originalSetTask(skillName); }
  finally { window.__rbSmartAutoLearnBypass = false; }
}

function rbInstallSetTaskInterceptor() {
  if (typeof setTask !== "function") return;
  if (window.__rbSmartSetTaskInstalled && window.__rbOriginalSetTask) return;

  window.__rbOriginalSetTask = window.__rbOriginalSetTask || setTask;
  var originalSetTask = window.__rbOriginalSetTask;

  setTask = function(taskName) {
    if (!window.__rbSmartAutoLearnBypass && rbAutoLearnEnabled() && rbIsSkillName(taskName)) {
      var plan = rbPickSmartSkillPlan();
      if (plan && plan.skill && plan.skill.name) return originalSetTask(plan.skill.name);
    }
    return originalSetTask(taskName);
  };

  window.setTask = setTask;
  window.__rbSmartSetTaskInstalled = true;
}

function rbSmartAutoLearnTick() {
  if (!rbAutoLearnEnabled()) return;
  rbInstallSetTaskInterceptor();
  var plan = rbPickSmartSkillPlan();
  if (plan && gameData.currentSkill !== plan.skill) rbSetSkillWithoutIntercept(plan.skill.name);
}

function rbFormatDays(days) {
  if (!Number.isFinite(days)) return "?";
  if (days >= 365) return (days / 365).toFixed(1) + "y";
  if (days >= 30) return (days / 30).toFixed(1) + "m";
  return Math.max(0.1, days).toFixed(1) + "d";
}

function rbInstallSmartAutoLearnUi() {
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
    note.textContent = "Smart auto-learn: waiting for visible skills.";
    return;
  }
  note.textContent = "Smart target: " + plan.skill.name + " → lvl " + plan.target + " (~" + rbFormatDays(plan.days) + ")";
}

function installRealityBreakSmartAutoLearn() {
  rbInstallSmartAutoLearnUi();
  rbInstallSetTaskInterceptor();
  if (!window.__rbSmartAutoLearnInterval) {
    window.__rbSmartAutoLearnInterval = setInterval(function() {
      rbInstallSmartAutoLearnUi();
      rbInstallSetTaskInterceptor();
      rbUpdateSmartAutoLearnUi();
      rbSmartAutoLearnTick();
    }, 200);
  }
}

installRealityBreakSmartAutoLearn();
window.addEventListener("load", installRealityBreakSmartAutoLearn);
