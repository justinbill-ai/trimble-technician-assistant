/**
 * Trimble Internal — verified @trimble.com users see all dealer + internal tools.
 * Header badge indicates personnel mode (not a separate hub toggle).
 */
(function (global) {
  'use strict';

  var INTERNAL_ONLY_PATHS = [
    '/trimble-internal/bench-crane/',
    '/trimble-internal/groundworks/csv-formatter/',
  ];

  function cfg(key, fallback) {
    var c = global.WORKSPACE_CONFIG || {};
    return c[key] != null && c[key] !== '' ? c[key] : fallback;
  }

  function isLocalPreviewHost() {
    var protocol = global.location.protocol || '';
    if (protocol === 'file:') return true;
    var host = (global.location.hostname || '').toLowerCase();
    return !host || host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function isTrimbleEmailAddress(email) {
    return normalizeEmail(email).split('@')[1] === 'trimble.com';
  }

  function isTrimblePersonnel() {
    if (cfg('trimbleInternalLocalPreview', false) && isLocalPreviewHost()) return true;
    if (!global.AppAccess) return false;
    if (typeof global.AppAccess.isAuthorized === 'function' && !global.AppAccess.isAuthorized()) return false;
    if (typeof global.AppAccess.isTrimblePersonnel === 'function') return global.AppAccess.isTrimblePersonnel();
    if (typeof global.AppAccess.isTrimbleEmail === 'function') return global.AppAccess.isTrimbleEmail();
    var email = typeof global.AppAccess.getEmail === 'function' ? global.AppAccess.getEmail() : '';
    return isTrimbleEmailAddress(email);
  }

  /** @deprecated Hub mode toggle removed — personnel always see integrated hub */
  function getHubMode() {
    return isTrimblePersonnel() ? 'trimble' : 'dealer';
  }

  function applyPersonnelBodyClass() {
    document.body.classList.toggle('tta-trimble-personnel', isTrimblePersonnel());
    document.body.classList.remove('tta-hub-mode-internal', 'tta-hub-mode-dealer');
  }

  function isInternalOnlyPath() {
    var path = (global.location.pathname || '').toLowerCase().replace(/\\/g, '/');
    var i;
    for (i = 0; i < INTERNAL_ONLY_PATHS.length; i++) {
      if (path.indexOf(INTERNAL_ONLY_PATHS[i]) !== -1) return true;
    }
    return false;
  }

  function guardInternalToolPages() {
    if (!isInternalOnlyPath()) return;
    if (isTrimblePersonnel()) return;
    if (isLocalPreviewHost() && cfg('trimbleInternalLocalPreview', false)) return;
    global.location.replace(resolveHubUrl());
  }

  function resolveHubUrl() {
    var parts = global.location.pathname.split('/').filter(Boolean);
    var depth = parts.length;
    if (depth && /\.html?$/i.test(parts[parts.length - 1])) depth -= 1;
    var prefix = '';
    var i;
    for (i = 0; i < depth; i++) prefix += '../';
    return prefix + 'index.html';
  }

  function ensureHeaderMount() {
    var mount = document.getElementById('trimbleInternalHeaderMount');
    if (mount) return mount;
    var inner = document.querySelector('.tc-app-header .tc-header__inner');
    if (!inner) return null;
    mount = document.createElement('div');
    mount.id = 'trimbleInternalHeaderMount';
    mount.className = 'trimble-internal-header-mount';
    var help = inner.querySelector('.help-trigger');
    var actions = inner.querySelector('.tc-header__actions');
    if (actions) {
      actions.insertBefore(mount, actions.firstChild);
    } else if (help && help.parentNode === inner) {
      inner.insertBefore(mount, help);
    } else {
      mount.style.marginLeft = 'auto';
      inner.appendChild(mount);
    }
    return mount;
  }

  function getBadgeIconHtml() {
    if (global.TrimbleInternalIcons && typeof global.TrimbleInternalIcons.getIconSvg === 'function') {
      return global.TrimbleInternalIcons.getIconSvg();
    }
    return '<span class="trimble-personnel-badge__fallback" aria-hidden="true">T</span>';
  }

  function getPersonnelEmail() {
    if (global.AppAccess && typeof global.AppAccess.getEmail === 'function') {
      return global.AppAccess.getEmail() || '';
    }
    return '';
  }

  function renderHeaderBadge() {
    var mount = ensureHeaderMount();
    if (!mount) return;
    mount.innerHTML = '';

    if (!isTrimblePersonnel()) {
      mount.hidden = true;
      return;
    }

    mount.hidden = false;
    var email = getPersonnelEmail();
    var iconId =
      global.TrimbleInternalIcons && typeof global.TrimbleInternalIcons.getIconId === 'function'
        ? global.TrimbleInternalIcons.getIconId()
        : 'shield-t';

    var badge = document.createElement('div');
    badge.className = 'trimble-personnel-badge trimble-personnel-badge--' + iconId;
    if (
      global.TrimbleInternalIcons &&
      global.TrimbleInternalIcons.ICONS &&
      global.TrimbleInternalIcons.ICONS[iconId] &&
      global.TrimbleInternalIcons.ICONS[iconId].badgeStyle === 'white-card'
    ) {
      badge.classList.add('trimble-personnel-badge--white-card');
    }
    badge.setAttribute('role', 'status');
    badge.title = email
      ? 'Trimble personnel — signed in as ' + email + '. Internal tools are unlocked.'
      : 'Trimble personnel — internal tools unlocked.';
    badge.setAttribute('aria-label', badge.title);
    badge.innerHTML =
      '<span class="trimble-personnel-badge__icon">' +
      getBadgeIconHtml() +
      '</span>' +
      '<span class="trimble-personnel-badge__text">' +
      '<span class="trimble-personnel-badge__label">Internal</span>' +
      (email ? '<span class="trimble-personnel-badge__email">' + email + '</span>' : '') +
      '</span>';

    mount.appendChild(badge);
  }

  function ensureHubBanner() {
    var banner = document.getElementById('trimbleInternalHubBanner');
    if (banner || !document.body.hasAttribute('data-app-access-entry')) return banner;
    banner = document.createElement('div');
    banner.id = 'trimbleInternalHubBanner';
    banner.className = 'trimble-internal-hub-banner';
    banner.hidden = true;
    banner.innerHTML =
      '<span class="trimble-internal-hub-banner__icon" aria-hidden="true"></span>' +
      '<span><strong>Trimble personnel access</strong> — dealer tools plus TMC, Bench Crane, and Groundworks CSV formatter are available. No separate internal menu required.</span>';
    var main = document.querySelector('.tc-main');
    if (main) document.body.insertBefore(banner, main);
    else document.body.appendChild(banner);
    return banner;
  }

  function updateHubBanner() {
    var banner = ensureHubBanner();
    if (!banner) return;
    var show = isTrimblePersonnel() && document.body.hasAttribute('data-app-access-entry');
    banner.hidden = !show;
    if (show) {
      var iconSlot = banner.querySelector('.trimble-internal-hub-banner__icon');
      if (iconSlot) {
        iconSlot.innerHTML = getBadgeIconHtml();
        var iconId =
          global.TrimbleInternalIcons && typeof global.TrimbleInternalIcons.getIconId === 'function'
            ? global.TrimbleInternalIcons.getIconId()
            : '';
        var useWhite =
          iconId &&
          global.TrimbleInternalIcons.ICONS &&
          global.TrimbleInternalIcons.ICONS[iconId] &&
          global.TrimbleInternalIcons.ICONS[iconId].badgeStyle === 'white-card';
        iconSlot.classList.toggle('trimble-internal-hub-banner__icon--white-card', !!useWhite);
      }
    }
  }

  function refresh() {
    applyPersonnelBodyClass();
    guardInternalToolPages();
    renderHeaderBadge();
    updateHubBanner();
    if (global.HubNav && typeof global.HubNav.refresh === 'function') {
      global.HubNav.refresh();
    }
  }

  function init() {
    applyPersonnelBodyClass();
    guardInternalToolPages();
    renderHeaderBadge();
    updateHubBanner();

    document.addEventListener('tta:access-ready', refresh);
  }

  global.TrimbleInternal = {
    isTrimblePersonnel: isTrimblePersonnel,
    isTrimbleEmailAddress: isTrimbleEmailAddress,
    getHubMode: getHubMode,
    refresh: refresh,
    renderHeaderBadge: renderHeaderBadge,
    INTERNAL_ONLY_PATHS: INTERNAL_ONLY_PATHS,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
