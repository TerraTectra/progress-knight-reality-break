// Reality Break Magic Balance v1.
// Smooths the Arcane Association progression so it does not jump from playable mage growth to impossible Chairman grind.
(function(){
  var RB_MAGIC_JOB_XP = {
    'Student': 65000,
    'Apprentice mage': 180000,
    'Mage': 650000,
    'Wizard': 2400000,
    'Master wizard': 9000000,
    'Chairman': 45000000
  };

  var RB_MAGIC_SKILL_XP = {
    'Mana control': 90,
    'Immortality': 120,
    'Time warping': 160,
    'Super immortality': 220
  };

  function rbSetReq(name, list){
    if (!gameData || !gameData.requirements || !gameData.requirements[name]) return false;
    gameData.requirements[name].requirements = list;
    gameData.requirements[name].completed = false;
    return true;
  }

  function rbPatchBaseXp(){
    if (typeof gameData === 'undefined' || !gameData.taskData) return false;
    Object.keys(RB_MAGIC_JOB_XP).forEach(function(name){
      var task = gameData.taskData[name];
      if (task && task.baseData) task.baseData.maxXp = RB_MAGIC_JOB_XP[name];
    });
    Object.keys(RB_MAGIC_SKILL_XP).forEach(function(name){
      var task = gameData.taskData[name];
      if (task && task.baseData) task.baseData.maxXp = RB_MAGIC_SKILL_XP[name];
    });
    return true;
  }

  function rbPatchRequirements(){
    if (typeof gameData === 'undefined' || !gameData.requirements || !gameData.taskData) return false;

    // Keep the classic entry into magic, but make the arcane career ladder playable.
    rbSetReq('Student', [{ task: 'Mana control', requirement: 1 }]);
    rbSetReq('Apprentice mage', [{ task: 'Student', requirement: 10 }]);
    rbSetReq('Mage', [{ task: 'Apprentice mage', requirement: 10 }]);
    rbSetReq('Wizard', [{ task: 'Mage', requirement: 10 }]);
    rbSetReq('Master wizard', [{ task: 'Wizard', requirement: 10 }]);
    rbSetReq('Chairman', [{ task: 'Master wizard', requirement: 10 }, { task: 'Time warping', requirement: 25 }]);

    // Remove the brutal original Chairman 1000 wall. Super immortality should still be late, but reachable.
    rbSetReq('Super immortality', [
      { task: 'Immortality', requirement: 120 },
      { task: 'Time warping', requirement: 75 },
      { task: 'Chairman', requirement: 25 }
    ]);

    return true;
  }

  function rbPatchMagicTooltips(){
    if (typeof tooltips === 'undefined') return;
    tooltips['Chairman'] = 'Lead The Arcane Association after proving yourself as a master wizard. This is still a late-game role, but no longer requires an absurd thousand-level grind.';
    tooltips['Super immortality'] = 'A deeper immortality ritual unlocked by serious arcane authority, time warping and life-extension mastery.';
  }

  function rbInstallMagicBalanceNote(){
    if (document.getElementById('rbMagicBalanceNote')) return;
    var settings = document.getElementById('settings');
    if (!settings) return;
    var li = document.createElement('li');
    li.id = 'rbMagicBalanceNote';
    li.innerHTML = '<h2>Magic Balance</h2><div style="color: gray">Arcane jobs and Super immortality requirements are smoothed for Reality Break.</div>';
    settings.querySelector('ul')?.appendChild(li);
  }

  function rbApplyMagicBalance(){
    var okXp = rbPatchBaseXp();
    var okReq = rbPatchRequirements();
    rbPatchMagicTooltips();
    rbInstallMagicBalanceNote();
    return okXp && okReq;
  }

  function rbBootMagicBalance(){
    rbApplyMagicBalance();
    if (!window.__rbMagicBalanceInterval) {
      window.__rbMagicBalanceInterval = setInterval(rbApplyMagicBalance, 1000);
    }
  }

  window.addEventListener('load', rbBootMagicBalance);
  rbBootMagicBalance();
})();
