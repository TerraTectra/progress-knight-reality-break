// Reality Break Smart Auto-learn disabled.
// The previous planner scanned cumulative XP too often and could freeze the main game tick.
// Keep this file as a safe no-op until the auto-learn route system is rebuilt in a separate stable patch.
(function(){
  window.__rbSmartAutoLearnDisabled = true;
})();
