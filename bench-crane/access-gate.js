/** @deprecated Use ../assets/tmc-access.js — kept for older bookmarks / sibling copies. */
(function (global) {
  if (global.TmcAccess) return;
  var script = document.createElement('script');
  script.src = '../assets/tmc-access.js';
  script.async = false;
  document.head.appendChild(script);
})(typeof window !== 'undefined' ? window : globalThis);
