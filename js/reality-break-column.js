// Reality Break side column.
// Moves Reality Break and Metaverse panels out of Settings into a dedicated third column.
(function(){
  function rbFindMainShell(){
    var existing = document.getElementById('realityBreakColumn');
    if (existing && existing.parentNode) return existing.parentNode;

    var candidates = Array.prototype.slice.call(document.querySelectorAll('body > div.w3-margin > div'));
    for (var i = 0; i < candidates.length; i++) {
      var style = candidates[i].getAttribute('style') || '';
      if (style.indexOf('width: 1220px') >= 0 || style.indexOf('width: 1530px') >= 0) return candidates[i];
    }
    return null;
  }

  function rbEnsureRealityColumn(){
    var shell = rbFindMainShell();
    if (!shell) return null;
    shell.style.width = '1530px';
    shell.style.minWidth = '1530px';
    shell.style.height = 'auto';

    var column = document.getElementById('realityBreakColumn');
    if (!column) {
      column = document.createElement('div');
      column.id = 'realityBreakColumn';
      column.className = 'panel w3-padding';
      column.style.width = '280px';
      column.style.height = 'auto';
      column.style.float = 'left';
      column.style.marginLeft = '16px';
      column.innerHTML = '' +
        '<h2 style="margin-top:0; color: rgb(225,165,0)">Reality Break</h2>' +
        '<div style="color: gray; margin-bottom: 8px">Meta progression</div>' +
        '<ul id="realityBreakColumnList" style="padding-left:0; margin:0; list-style:none"></ul>';
      shell.appendChild(column);
    }
    return column;
  }

  function rbMovePanel(panelId){
    var column = rbEnsureRealityColumn();
    var list = document.getElementById('realityBreakColumnList');
    var panel = document.getElementById(panelId);
    if (!column || !list || !panel) return;

    if (panel.parentNode !== list) list.appendChild(panel);

    panel.style.listStyle = 'none';
    panel.style.margin = '0 0 14px 0';
    panel.style.padding = '0 0 12px 0';
    panel.style.borderBottom = '1px solid #444';
    panel.style.display = panelId === 'realityBreakUpgradePanel' && panel.style.display === 'none' ? 'none' : 'list-item';
  }

  function rbUpdateColumnVisibility(){
    var column = rbEnsureRealityColumn();
    if (!column) return;

    rbMovePanel('realityBreakMetaPanel');
    rbMovePanel('realityBreakUpgradePanel');

    var list = document.getElementById('realityBreakColumnList');
    var hasVisiblePanel = false;
    if (list) {
      Array.prototype.slice.call(list.children).forEach(function(child){
        if (child.style.display !== 'none') hasVisiblePanel = true;
      });
    }
    column.style.display = hasVisiblePanel ? 'block' : 'block';
  }

  function rbBootRealityColumn(){
    rbUpdateColumnVisibility();
    if (!window.__rbRealityColumnInterval) {
      window.__rbRealityColumnInterval = setInterval(rbUpdateColumnVisibility, 200);
    }
  }

  window.addEventListener('load', rbBootRealityColumn);
  rbBootRealityColumn();
})();
