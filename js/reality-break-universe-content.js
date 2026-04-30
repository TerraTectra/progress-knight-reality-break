// Reality Break Universe Content v1.
// Adds real Universe II content: one unique rule, one skill and one item.
(function(){
  var RB_U2_SKILL = 'Royal administration';
  var RB_U2_ITEM = 'Royal ledger';

  function rbMeta(){ return typeof loadRealityBreakMeta === 'function' ? loadRealityBreakMeta() : null; }
  function rbUniverse(){ var meta = rbMeta(); return meta ? Number(meta.currentUniverse || 1) : 1; }
  function rbInUniverseII(){ return rbUniverse() === 2; }

  function rbHasTask(name){ return !!(typeof gameData !== 'undefined' && gameData.taskData && gameData.taskData[name]); }
  function rbHasItem(name){ return !!(typeof gameData !== 'undefined' && gameData.itemData && gameData.itemData[name]); }

  function rbBindTaskEffect(taskName){
    return function(){
      var task = gameData && gameData.taskData && gameData.taskData[taskName];
      return task && task.getEffect ? task.getEffect() : 1;
    };
  }

  function rbBindItemEffect(itemName){
    return function(){
      var item = gameData && gameData.itemData && gameData.itemData[itemName];
      return item && item.getEffect ? item.getEffect() : 1;
    };
  }

  function rbEnsureData(){
    if (typeof gameData === 'undefined' || typeof Skill === 'undefined' || typeof Item === 'undefined') return false;

    if (!rbHasTask(RB_U2_SKILL)) {
      var skill = new Skill({ name: RB_U2_SKILL, maxXp: 260, effect: 0.01, description: 'U-II income and expense control' });
      skill.id = 'row ' + RB_U2_SKILL;
      skill.xpMultipliers = [
        skill.getMaxLevelMultiplier.bind(skill),
        typeof getHappiness === 'function' ? getHappiness : function(){ return 1; },
        rbBindTaskEffect('Concentration'),
        rbBindItemEffect('Book'),
        rbBindItemEffect('Study desk'),
        rbBindItemEffect('Library'),
        rbBindItemEffect(RB_U2_ITEM)
      ];
      skill.getEffect = function(){ return 1 + Math.log10((this.level || 0) + 1) * 0.28; };
      skill.getEffectDescription = function(){ return 'x' + this.getEffect().toFixed(2) + ' U-II stability'; };
      gameData.taskData[RB_U2_SKILL] = skill;
    }

    if (!rbHasItem(RB_U2_ITEM)) {
      var item = new Item({ name: RB_U2_ITEM, expense: 2500, effect: 1.35, description: 'Royal administration xp' });
      item.id = 'row ' + RB_U2_ITEM;
      item.expenseMultipliers = [
        rbBindTaskEffect('Bargaining'),
        rbBindTaskEffect('Intimidation')
      ];
      item.getEffectDescription = function(){ return 'x1.35 Royal administration XP, x0.88 U-II expenses'; };
      gameData.itemData[RB_U2_ITEM] = item;
    }

    if (typeof skillCategories !== 'undefined' && skillCategories.Fundamentals && skillCategories.Fundamentals.indexOf(RB_U2_SKILL) < 0) {
      skillCategories.Fundamentals.push(RB_U2_SKILL);
    }
    if (typeof itemCategories !== 'undefined' && itemCategories.Misc && itemCategories.Misc.indexOf(RB_U2_ITEM) < 0) {
      itemCategories.Misc.push(RB_U2_ITEM);
    }
    if (typeof tooltips !== 'undefined') {
      tooltips[RB_U2_SKILL] = 'A Universe II discipline for surviving royal levies, guild paperwork and stricter medieval bureaucracy. Improves income and softens expenses only in Universe II.';
      tooltips[RB_U2_ITEM] = 'A stamped ledger used by royal clerks. It improves Royal administration training and lowers Universe II expenses when active.';
    }
    return true;
  }

  function rbInsertTaskRow(){
    if (!rbHasTask(RB_U2_SKILL) || document.getElementById('row ' + RB_U2_SKILL)) return;
    if (typeof createRow !== 'function' || typeof skillCategories === 'undefined') return;
    var template = document.getElementsByClassName('rowTaskTemplate')[0];
    var table = document.getElementById('skillTable');
    if (!template || !table) return;
    var row = createRow({ row: template }, RB_U2_SKILL, 'Fundamentals', skillCategories);
    var before = document.getElementById('Fundamentals');
    table.insertBefore(row, before || null);
  }

  function rbInsertItemRow(){
    if (!rbHasItem(RB_U2_ITEM) || document.getElementById('row ' + RB_U2_ITEM)) return;
    if (typeof createRow !== 'function' || typeof itemCategories === 'undefined') return;
    var template = document.getElementsByClassName('rowItemTemplate')[0];
    var table = document.getElementById('itemTable');
    if (!template || !table) return;
    var row = createRow({ row: template }, RB_U2_ITEM, 'Misc', itemCategories);
    var before = document.getElementById('Misc');
    table.insertBefore(row, before || null);
  }

  function rbAdminLevel(){
    var task = gameData && gameData.taskData && gameData.taskData[RB_U2_SKILL];
    return task ? task.level || 0 : 0;
  }

  function rbHasLedger(){
    var item = gameData && gameData.itemData && gameData.itemData[RB_U2_ITEM];
    return !!(item && gameData.currentMisc && gameData.currentMisc.indexOf(item) >= 0);
  }

  function rbU2ExpenseModifier(){
    if (!rbInUniverseII()) return 1;
    var admin = rbAdminLevel();
    var adminReduction = Math.max(0.72, 1 - Math.log10(admin + 1) * 0.12);
    var ledger = rbHasLedger() ? 0.88 : 1;
    return adminReduction * ledger;
  }

  function rbU2IncomeModifier(){
    if (!rbInUniverseII()) return 1;
    return gameData && gameData.taskData && gameData.taskData[RB_U2_SKILL] ? gameData.taskData[RB_U2_SKILL].getEffect() : 1;
  }

  function rbPatchEffects(){
    if (typeof Job !== 'undefined' && !Job.prototype.__rbU2ContentIncomePatched) {
      Job.prototype.__rbU2ContentOriginalGetIncome = Job.prototype.getIncome;
      Job.prototype.getIncome = function(){
        return Math.max(0, Math.round(this.__rbU2ContentOriginalGetIncome.apply(this, arguments) * rbU2IncomeModifier()));
      };
      Job.prototype.__rbU2ContentIncomePatched = true;
    }

    if (typeof Item !== 'undefined' && !Item.prototype.__rbU2ContentExpensePatched) {
      Item.prototype.__rbU2ContentOriginalGetExpense = Item.prototype.getExpense;
      Item.prototype.getExpense = function(){
        return Math.max(0, Math.round(this.__rbU2ContentOriginalGetExpense.apply(this, arguments) * rbU2ExpenseModifier()));
      };
      Item.prototype.__rbU2ContentExpensePatched = true;
    }
  }

  function rbRequirementMetForSkill(){
    if (!rbInUniverseII()) return false;
    var merchant = gameData && gameData.taskData && gameData.taskData.Merchant ? gameData.taskData.Merchant.level || 0 : 0;
    var bargaining = gameData && gameData.taskData && gameData.taskData.Bargaining ? gameData.taskData.Bargaining.level || 0 : 0;
    return merchant >= 10 && bargaining >= 20;
  }

  function rbRequirementMetForItem(){
    if (!rbInUniverseII()) return false;
    var admin = rbAdminLevel();
    return admin >= 10;
  }

  function rbSetRowLocked(row, locked, text){
    if (!row) return;
    row.classList.toggle('hiddenTask', false);
    row.style.opacity = locked ? '0.55' : '1';
    row.style.pointerEvents = locked ? 'none' : '';
    var tooltip = row.getElementsByClassName('tooltipText')[0];
    if (tooltip && text) tooltip.textContent = text;
  }

  function rbUpdateVisibility(){
    var skillRow = document.getElementById('row ' + RB_U2_SKILL);
    var itemRow = document.getElementById('row ' + RB_U2_ITEM);

    if (!rbInUniverseII()) {
      if (skillRow) skillRow.classList.add('hiddenTask');
      if (itemRow) itemRow.classList.add('hiddenTask');
      return;
    }

    var skillUnlocked = rbRequirementMetForSkill();
    rbSetRowLocked(skillRow, !skillUnlocked, 'Requires Universe II, Merchant level 10 and Bargaining level 20.');

    var itemUnlocked = rbRequirementMetForItem();
    rbSetRowLocked(itemRow, !itemUnlocked, 'Requires Universe II and Royal administration level 10.');
  }

  function rbUpdateUniversePanelExtra(){
    var panel = document.getElementById('realityBreakUniversePanel');
    if (!panel || document.getElementById('rbU2ContentHint')) return;
    var hint = document.createElement('div');
    hint.id = 'rbU2ContentHint';
    hint.style.color = 'gray';
    hint.style.marginTop = '8px';
    hint.textContent = 'U-II adds Royal administration and Royal ledger to counter royal levies.';
    panel.appendChild(hint);
  }

  function rbBootU2Content(){
    rbEnsureData();
    rbInsertTaskRow();
    rbInsertItemRow();
    rbPatchEffects();
    rbUpdateVisibility();
    rbUpdateUniversePanelExtra();
    if (!window.__rbU2ContentInterval) {
      window.__rbU2ContentInterval = setInterval(function(){
        rbEnsureData();
        rbInsertTaskRow();
        rbInsertItemRow();
        rbPatchEffects();
        rbUpdateVisibility();
        rbUpdateUniversePanelExtra();
      }, 500);
    }
  }

  window.addEventListener('load', rbBootU2Content);
  rbBootU2Content();
})();
