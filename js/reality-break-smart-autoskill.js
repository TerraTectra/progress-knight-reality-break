// Reality Break Smart Auto-learn.
// Current rule: train visible/unlocked skills by estimated real training-time progress.
// It does not simply compare raw levels. It compares cumulative XP needed versus current XP/day.
// A selected skill is kept until the nearest x5 checkpoint, then rotation continues.

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

function rbIsAtFiveCheckpoint(skill) {
  return (skill.level || 0) > 0 && (skill.level || 0) % 5 === 0;
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

function rbPlanForSkill(skill) {
  var target = rbNextMultipleOfFive(skill.level || 0);
  var gain = Math.max(0.001, skill.getXpGain ? skill.getXpGain() : 1);
  var currentEquivalentDays = rbCumulativeXpToCurrent(skill) / gain;
  var targetEquivalentDays = rbCumulativeXpToTarget(skill, target) / gain;
  var daysToTarget = Math.max(0.001, targetEquivalentDays - currentEquivalentDays);
  var checkpoint = Math.floor((skill.level || 0) / 5);

  return {
    skill: skill,
    target: target,
    days: daysToTarget,
    currentEquivalentDays: currentEquivalentDays,
    targetEquivalentDays: targetEquivalentDays,
    checkpoint: checkpoint,
    mode: "time-even"
  };
}

function rbPickEvenSkillPlan() {
  var skills = rbAvailableSkills();
  if (!skills.length) return null;

  var plans = skills.map(rbPlanForSkill);
  var current = gameData.currentSkill;
  var currentPlan = current ? plans.find(function(plan) { return plan.skill.name === current.name; }) : null;

  // Hold only until the next x5 checkpoint. At lvl 5/10/15/etc. immediately rotate.
  if (currentPlan && !rbIsAtFiveCheckpoint(current) && current.level < currentPlan.target) return currentPlan;

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
  note.textContent = "Time-even training: " + plan.skill.name + " → lvl " + plan.target + " (~" + rbFormatDays(plan.days) + ", invested ~" + rbFormatDays(plan.currentEquivalentDays) + ")";
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
