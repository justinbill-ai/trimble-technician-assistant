/** Defer excavator UI init until BETA access gate unlocks (same pattern as GW CSV Formatter). */
(function () {
  function runExcavatorInit() {
    if (typeof window.ExcavatorMeasureNotesInit === 'function') window.ExcavatorMeasureNotesInit();
    if (typeof bindCalcUi === 'function') bindCalcUi();
  }

  function startWhenBetaReady() {
    var betaToolId = document.body.getAttribute('data-beta-tool');
    if (!betaToolId || !document.body.classList.contains('beta-access-locked')) {
      runExcavatorInit();
      return;
    }
    document.addEventListener('tta:beta-access-ready', runExcavatorInit, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWhenBetaReady);
  } else {
    startWhenBetaReady();
  }
})();
