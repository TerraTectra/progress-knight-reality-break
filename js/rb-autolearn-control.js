(function(){
  var ui=null;
  function src(){return document.getElementById('autoLearn')}
  function boot(){
    if(ui)return;
    var a=src();
    if(!a)return;
    ui=document.createElement('input');
    ui.type='checkbox';
    ui.id='rbSmartAutoLearn';
    ui.className=a.className;
    ui.checked=a.checked;
    a.checked=false;
    a.parentNode.insertBefore(ui,a.nextSibling);
    a.style.opacity='0';
    a.style.width='0px';
    a.style.margin='0px';
  }
  function on(){boot();var a=src();if(a)a.checked=false;return !!(ui&&ui.checked)}
  function tick(){
    if(!on())return;
    if(typeof rbPickSmartSkillPlan!=='function'||typeof gameData==='undefined')return;
    var p=rbPickSmartSkillPlan();
    if(p&&p.skill)gameData.currentSkill=p.skill;
  }
  window.addEventListener('load',function(){boot();setInterval(tick,80)});
  setInterval(tick,160);
})();
