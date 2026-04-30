(function(){
  var ui=null;
  var old=null;
  function oldBox(){return document.getElementById('autoLearn')}
  function smartBox(){return document.getElementById('rbSmartAutoLearn')}
  function boot(){
    old=oldBox();
    ui=smartBox();
    if(!old&&!ui)return;
    if(!ui&&old){
      ui=document.createElement('input');
      ui.type='checkbox';
      ui.id='rbSmartAutoLearn';
      ui.className=old.className;
      ui.checked=old.checked;
      old.parentNode.insertBefore(ui,old.nextSibling);
    }
    if(old){
      old.checked=false;
      old.style.opacity='0';
      old.style.width='0px';
      old.style.margin='0px';
      old.style.pointerEvents='none';
      old.setAttribute('aria-hidden','true');
    }
  }
  function on(){boot();if(old)old.checked=false;return !!(ui&&ui.checked)}
  function tick(){
    if(!on())return;
    if(typeof rbPickSmartSkillPlan!=='function'||typeof gameData==='undefined')return;
    var p=rbPickSmartSkillPlan();
    if(p&&p.skill&&gameData.currentSkill!==p.skill)gameData.currentSkill=p.skill;
  }
  window.addEventListener('load',function(){boot();if(!window.__rbAutoLearnControl){window.__rbAutoLearnControl=setInterval(tick,80)}});
  if(!window.__rbAutoLearnControlEarly){window.__rbAutoLearnControlEarly=setInterval(tick,160)}
})();
