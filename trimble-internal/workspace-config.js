/**
 * Internal package overlay — load after ../assets/workspace-config.js
 */
(function () {
  var base = window.WORKSPACE_CONFIG || {};
  window.WORKSPACE_CONFIG = Object.assign({}, base, {
    appName: 'Trimble Technician Assistant (Internal)',
    trimbleInternalLocalPreview: true,
    trimbleInternalIcon: 'compass-white-card',
  });
})();
