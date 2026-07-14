/**
 * Make the Trimble header logo link back to the hub categories home page.
 */
(function () {
  'use strict';

  function hubHomeHref() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (!parts.length) return './index.html';
    var last = parts[parts.length - 1];
    var depth = /\.html?$/i.test(last) ? parts.length - 2 : parts.length - 1;
    if (depth <= 0) return './index.html';
    var prefix = '';
    for (var i = 0; i < depth; i++) prefix += '../';
    return prefix + 'index.html';
  }

  function isHubIndexPage() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (!parts.length) return true;
    var last = parts[parts.length - 1];
    return last === '' || /^index\.html?$/i.test(last);
  }

  function initHeaderHomeLinks() {
    var homeHref = hubHomeHref();
    document.querySelectorAll('.tc-header__logo').forEach(function (img) {
      if (!img || img.closest('a')) return;

      var link = document.createElement('a');
      link.className = 'tc-header__home-link';
      link.href = homeHref;
      link.setAttribute('aria-label', 'Technician Assistant home — all categories');
      link.title = 'Home — all categories';

      if (isHubIndexPage()) {
        link.addEventListener('click', function (e) {
          if (window.HubNav && typeof window.HubNav.openHome === 'function') {
            e.preventDefault();
            window.HubNav.openHome(true);
          }
        });
      }

      var parent = img.parentNode;
      if (!parent) return;
      parent.insertBefore(link, img);
      link.appendChild(img);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderHomeLinks);
  } else {
    initHeaderHomeLinks();
  }
})();
