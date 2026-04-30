// Reality Break side column disabled.
// The third column was exposing late-game panels too early and caused layout duplicates.
// Late-game panels stay in Settings until the layout is rebuilt cleanly.
(function(){
  window.__rbRealityColumnDisabled = true;
})();
