(function () {
  'use strict';

  function renderMeasureReference() {
    if (typeof renderMeasureTheoryPanel === 'function') {
      renderMeasureTheoryPanel(EXCAVATOR_MEASUREUP, 'measureReference');
    }
  }

  window.ExcavatorMeasureNotesInit = renderMeasureReference;
})();
