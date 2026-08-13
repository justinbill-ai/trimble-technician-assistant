(function () {
  'use strict';

  function renderMeasureReference() {
    if (typeof renderMeasureTheoryPanel === 'function') {
      renderMeasureTheoryPanel(CTL_MEASUREUP, 'measureReference');
    }
  }

  window.CtlMeasureNotesInit = renderMeasureReference;
})();
