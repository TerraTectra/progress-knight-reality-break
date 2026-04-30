// Reality Break Smart Auto-learn.
// Current rule: train all visible/unlocked skills evenly by real time-to-next-5-level checkpoint.
// No unlock chasing. Every selected skill is kept until the next level divisible by 5.

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

function rbNextMultipleOfFive(level) {
  return Math.floor((level || 0) / 5) * 5 + 5;
}

function rbXpToTarget(skill, target) {
  var need = Math.max(0, skill.getMaxXp() - skill.xp);
  function maxXpAt(level) {
    return Math.round(skill.baseData.maxXp * (level + 1) * Math.pow(1.01, level));
  }
  for (var level = skill.level + 1; level < target; level++) need += maxXpAt(level);
  return need;
}

function rbPlanForSkill(skill) {
  var target = rbNextMultipleOfFive(skill.level || 0);
  var need = rbXpToTarget(skill, target);
  var gain = Math.max(0.001, skill.getXpGain ? skill.getXpGain() : 1);
  var days = need / gain;
  var block = Math.floor((skill.level || 0) / 5);
  var progressInBlock = ((skill.level || 0) % 5) + Math.max(0, Math.min(0.999, skill.xp / Math.max(1, skill.getMaxXp())));
  return { skill: skill, target: target, days: days, block: block, progressInBlock: progressInBlock, mode: "even" };
}

function rbPickEvenSkillPlan() {
  var skills = rbAvailableSkills();
  if (!skills.length) return null;

  var plans = skills.map(rbPlanForSkill);
  var current = gameData.currentSkill;
  var currentPlan = current ? plans.find(function(plan) { return plan.skill.name === current.name; }) : null;

  // Hard rule: once selected, finish the next x5 checkpoint before switching.
  if (currentPlan && current.level < currentPlan.target) return currentPlan;

  var minBlock = Math.min.apply(null, plans.map(function(plan) { return plan.block; }));
  var lowestBlock = plans.filter(function(plan) { return plan.block === minBlock; });

  // Among the most behind checkpoint block, train the fastest-to-finish skill first.
  // This keeps all skills moving evenly by real training time, not just by raw level.
  lowestBlock.sort(function(a, b) {
    if (Math.abs(a.days - b.days) > 0.01) return a.days - b.days;
    return a.progressInBlock - b.progressInBlock;
  });

  return lowestBlock[0] || plans[0];
}

function rbPickSmartSkillPlan() {
  return rbPickEvenSkillPlan();
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
    note.textContent = "Auto-learn: waiting for unlocked visible skills.";
    return;
  }
  note.textContent = "Even training: " + plan.skill.name + " → lvl " + plan.target + " (~" + rbFormatDays(plan.days) + ")";
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
