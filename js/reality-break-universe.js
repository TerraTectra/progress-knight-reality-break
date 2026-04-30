// Reality Break Universe Layer v1.
// Adds the first post-Reality-Break universe without touching the original Progress Knight core.
(function(){
  var RB_UNIVERSE_II_COST = 10;

  function rbMeta(){
    return typeof loadRealityBreakMeta === 'function' ? loadRealityBreakMeta() : null;
  }

  function rbSave(meta){
    if (typeof saveRealityBreakMeta === 'function') saveRealityBreakMeta(meta);
  }

  function rbCurrentUniverse(){
    var meta = rbMeta();
    return meta ? Number(meta.currentUniverse || 1) : 1;
  }

  function rbUniverseRules(id){
    if (Number(id) === 2) {
      return {
        name: 'Universe II · Strained Kingdom',
        desc: 'A harsher medieval world. Work and learning are slightly slower, expenses are sharper, but Reality Break rewards are higher.',
        xp: 0.95,
        income: 0.90,
        expense: 1.10,
        mp: 1.75
      };
    }
    return {
      name: 'Universe I · Prime World',
      desc: 'The original Progress Knight reality. No extra universe rules.',
      xp: 1,
      income: 1,
      expense: 1,
      mp: 1
    };
  }

  function rbUniverseXpMultiplier(){ return rbUniverseRules(rbCurrentUniverse()).xp; }
  function rbUniverseIncomeMultiplier(){ return rbUniverseRules(rbCurrentUniverse()).income; }
  function rbUniverseExpenseMultiplier(){ return rbUniverseRules(rbCurrentUniverse()).expense; }
  function rbUniverseMetaMultiplier(){ return rbUniverseRules(rbCurrentUniverse()).mp; }

  function rbPatchUniverseEffects(){
    if (typeof Task !== 'undefined' && !Task.prototype.__rbUniverseXpPatched) {
      Task.prototype.__rbUniverseOriginalGetXpGain = Task.prototype.getXpGain;
      Task.prototype.getXpGain = function(){
        return Math.max(1, Math.round(this.__rbUniverseOriginalGetXpGain.apply(this, arguments) * rbUniverseXpMultiplier()));
      };
      Task.prototype.__rbUniverseXpPatched = true;
    }

    if (typeof Job !== 'undefined' && !Job.prototype.__rbUniverseIncomePatched) {
      Job.prototype.__rbUniverseOriginalGetIncome = Job.prototype.getIncome;
      Job.prototype.getIncome = function(){
        return Math.max(0, Math.round(this.__rbUniverseOriginalGetIncome.apply(this, arguments) * rbUniverseIncomeMultiplier()));
      };
      Job.prototype.__rbUniverseIncomePatched = true;
    }

    if (typeof Item !== 'undefined' && !Item.prototype.__rbUniverseExpensePatched) {
      Item.prototype.__rbUniverseOriginalGetExpense = Item.prototype.getExpense;
      Item.prototype.getExpense = function(){
        return Math.max(0, Math.round(this.__rbUniverseOriginalGetExpense.apply(this, arguments) * rbUniverseExpenseMultiplier()));
      };
      Item.prototype.__rbUniverseExpensePatched = true;
    }

    if (typeof getRealityBreakMetaverseGain === 'function' && !window.__rbUniverseGainPatched) {
      window.__rbUniverseOriginalMetaGain = getRealityBreakMetaverseGain;
      getRealityBreakMetaverseGain = function(){
        return Math.max(1, Math.floor(window.__rbUniverseOriginalMetaGain.apply(this, arguments) * rbUniverseMetaMultiplier()));
      };
      window.getRealityBreakMetaverseGain = getRealityBreakMetaverseGain;
      window.__rbUniverseGainPatched = true;
    }
  }

  function rbCanSeeUniverseLayer(meta){
    return !!(meta && (meta.realityBroken || (meta.highestUniverse || 1) > 1 || (meta.metaversePoints || 0) > 0));
  }

  function rbCanUnlockUniverseII(meta){
    return !!(meta && meta.realityBroken && (meta.highestUniverse || 1) < 2 && (meta.metaversePoints || 0) >= RB_UNIVERSE_II_COST);
  }

  function rbUnlockUniverseII(){
    var meta = rbMeta();
    if (!rbCanUnlockUniverseII(meta)) return;
    meta.metaversePoints -= RB_UNIVERSE_II_COST;
    meta.highestUniverse = 2;
    meta.currentUniverse = 2;
    rbSave(meta);
    if (typeof resetRealityBreakRunState === 'function') resetRealityBreakRunState();
    rbUpdateUniversePanel();
    if (typeof updateRealityBreakMetaPanel === 'function') updateRealityBreakMetaPanel();
  }

  function rbEnterUniverse(id){
    var meta = rbMeta();
    if (!meta) return;
    id = Number(id);
    if (id < 1 || id > (meta.highestUniverse || 1)) return;
    if ((meta.currentUniverse || 1) === id) return;
    meta.currentUniverse = id;
    rbSave(meta);
    if (typeof resetRealityBreakRunState === 'function') resetRealityBreakRunState();
    rbUpdateUniversePanel();
    if (typeof updateRealityBreakMetaPanel === 'function') updateRealityBreakMetaPanel();
  }

  function rbGetColumnList(){
    return document.getElementById('realityBreakColumnList');
  }

  function rbInstallUniversePanel(){
    if (document.getElementById('realityBreakUniversePanel')) return;
    var list = rbGetColumnList();
    if (!list) return;
    var panel = document.createElement('li');
    panel.id = 'realityBreakUniversePanel';
    panel.style.listStyle = 'none';
    panel.style.margin = '0 0 14px 0';
    panel.style.padding = '0 0 12px 0';
    panel.style.borderBottom = '1px solid #444';
    panel.innerHTML = '' +
      '<h2>Universes</h2>' +
      '<div style="color: gray; margin-bottom: 8px">First universe layer. More universes will come later.</div>' +
      '<div>Current: <b id="rbUniverseCurrent"></b></div>' +
      '<div>Highest: <b id="rbUniverseHighest"></b></div>' +
      '<div>Rule: <b id="rbUniverseRule"></b></div>' +
      '<div style="color: gray; margin-top: 6px" id="rbUniverseDesc"></div>' +
      '<div style="margin-top: 8px" id="rbUniverseButtons"></div>';
    list.appendChild(panel);
  }

  function rbButton(text, onClick){
    var button = document.createElement('button');
    button.className = 'w3-button button';
    button.style.marginRight = '6px';
    button.style.marginBottom = '6px';
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  function rbUpdateUniversePanel(){
    rbPatchUniverseEffects();
    rbInstallUniversePanel();
    var panel = document.getElementById('realityBreakUniversePanel');
    if (!panel) return;

    var meta = rbMeta();
    var visible = rbCanSeeUniverseLayer(meta);
    panel.style.display = visible ? 'list-item' : 'none';
    if (!visible) return;

    var current = Number(meta.currentUniverse || 1);
    var highest = Number(meta.highestUniverse || 1);
    var rules = rbUniverseRules(current);

    var currentEl = document.getElementById('rbUniverseCurrent');
    var highestEl = document.getElementById('rbUniverseHighest');
    var ruleEl = document.getElementById('rbUniverseRule');
    var descEl = document.getElementById('rbUniverseDesc');
    var buttons = document.getElementById('rbUniverseButtons');

    if (currentEl) currentEl.textContent = current;
    if (highestEl) highestEl.textContent = highest;
    if (ruleEl) ruleEl.textContent = rules.name;
    if (descEl) descEl.textContent = rules.desc + ' XP x' + rules.xp.toFixed(2) + ', income x' + rules.income.toFixed(2) + ', expenses x' + rules.expense.toFixed(2) + ', MP x' + rules.mp.toFixed(2) + '.';

    if (buttons) {
      buttons.innerHTML = '';
      buttons.appendChild(rbButton('Enter U-I', function(){ rbEnterUniverse(1); }));
      if (highest >= 2) {
        buttons.appendChild(rbButton('Enter U-II', function(){ rbEnterUniverse(2); }));
      } else {
        var unlock = rbButton('Unlock U-II — ' + RB_UNIVERSE_II_COST + ' MP', rbUnlockUniverseII);
        unlock.disabled = !rbCanUnlockUniverseII(meta);
        buttons.appendChild(unlock);
      }
    }
  }

  function rbBootUniverseLayer(){
    rbPatchUniverseEffects();
    rbUpdateUniversePanel();
    if (!window.__rbUniverseInterval) {
      window.__rbUniverseInterval = setInterval(rbUpdateUniversePanel, 500);
    }
  }

  window.addEventListener('load', rbBootUniverseLayer);
  rbBootUniverseLayer();
})();
