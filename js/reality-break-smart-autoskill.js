// Reality Break Smart Auto-learn.
// Replaces the original rough auto-learn priority with a safer planner that considers unlocks, quick levels and useful passive bonuses.

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
  var originalLevel = skill.level;
  var originalXp = skill.xp;

  // Avoid mutating the real skill. Recreate the same max-xp curve locally.
  function maxXpAt(level) {
    return Math.round(skill.baseData.maxXp * (level + 1) * Math.pow(1.01, level));
  }

  for (var level = originalLevel + 1; level < target; level++) {
    need += maxXpAt(level);
  }
  skill.level = originalLevel;
  skill.xp = originalXp;
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

  // Early game: keep a soft bias toward reaching magic, but not at the cost of ignoring cheap useful levels.
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

function rbPickSmartSkill() {
  var skills = rbAvailableSkills();
  if (!skills.length) return null;

  var averageLevel = rbAverageSkillLevel(skills);
  var ranked = skills.map(function(skill) {
    var target = rbNextTargetForSkill(skill);
    var need = rbXpToTarget(skill, target);
    var gain = Math.max(0.001, skill.getXpGain ? skill.getXpGain() : 1);
    var days = need / gain;
    var catchUp = Math.sqrt((averageLevel + 12) / ((skill.level || 0) + 12));
    var unlock = rbUnlockScore(skill, target);
    var effect = rbEffectScore(skill) * Math.sqrt(Math.max(1, skill.getEffect ? skill.getEffect() : 1));
    var quick = rbQuickWinScore(days, skill.level || 0);
    var score = (unlock * 0.95 + effect * 1.35 + quick * 1.15) * catchUp / Math.pow(Math.max(0.35, days), 0.72);
    return { skill: skill, target: target, score: score };
  }).sort(function(a, b) { return b.score - a.score; });

  var best = ranked[0];
  var current = gameData.currentSkill;
  if (current) {
    var currentPlan = ranked.find(function(entry) { return entry.skill.name === current.name; });
    if (currentPlan && current.level < currentPlan.target && currentPlan.score >= best.score * 0.88) return current;
  }
  return best.skill;
}

function rbSmartAutoLearnTick() {
  var autoLearn = document.getElementById("autoLearn");
  if (!autoLearn || !autoLearn.checked || typeof setTask !== "function") return;
  var skill = rbPickSmartSkill();
  if (skill && gameData.currentSkill !== skill) setTask(skill.name);
}

function rbInstallSmartAutoLearnUi() {
  var automation = document.getElementById("automation");
  if (!automation || document.getElementById("realityBreakSmartLearnNote")) return;
  var note = document.createElement("div");
  note.id = "realityBreakSmartLearnNote";
  note.style.color = "gray";
  note.style.fontSize = "12px";
  note.style.marginTop = "4px";
  note.textContent = "Auto-learn uses smart priority.";
  automation.appendChild(note);
}

function installRealityBreakSmartAutoLearn() {
  rbInstallSmartAutoLearnUi();
  setInterval(function() {
    rbInstallSmartAutoLearnUi();
    rbSmartAutoLearnTick();
  }, 500);
}

window.addEventListener("load", installRealityBreakSmartAutoLearn);
