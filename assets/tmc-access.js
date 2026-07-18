/**
 * TMC category access — email gate for in-house tools (domain check is not shown in the UI).
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'tmc-category-access-v1';
  var LEGACY_STORAGE_KEY = 'tmc-crane-access-v1';
  var ALLOWED_DOMAIN = 'trimble.com';
  var REMEMBER_DAYS = 30;

  function normalizeEmail(raw) {
    return String(raw || '').trim().toLowerCase();
  }

  function isAllowedEmail(email) {
    var e = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false;
    return e.split('@')[1] === ALLOWED_DOMAIN;
  }

  function readPayload(key) {
    try {
      var raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.email || !data.expiresAt) return null;
      if (Date.now() > data.expiresAt) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
        return null;
      }
      if (!isAllowedEmail(data.email)) return null;
      return data;
    } catch (err) {
      return null;
    }
  }

  function loadStored() {
    return readPayload(STORAGE_KEY) || readPayload(LEGACY_STORAGE_KEY);
  }

  function loadSession() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.email || !data.expiresAt) return null;
      if (Date.now() > data.expiresAt) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      if (!isAllowedEmail(data.email)) return null;
      return data;
    } catch (err) {
      return null;
    }
  }

  function saveAccess(email, remember) {
    var normalized = normalizeEmail(email);
    var payload = {
      email: normalized,
      verifiedAt: Date.now(),
      expiresAt: remember
        ? Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000
        : Date.now() + 12 * 60 * 60 * 1000,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return normalized;
  }

  function getStoredEmail() {
    if (global.AppAccess && typeof global.AppAccess.getEmail === 'function') {
      var appEmail = global.AppAccess.getEmail();
      if (appEmail) return appEmail;
    }
    var session = loadSession();
    if (session) return session.email;
    var stored = loadStored();
    return stored ? stored.email : '';
  }

  function isAuthorized() {
    if (global.AppAccess && typeof global.AppAccess.isAuthorized === 'function' && global.AppAccess.isAuthorized()) {
      return true;
    }
    return Boolean(loadSession() || loadStored());
  }

  function clearAccess() {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }

  function ensureSessionFromStorage() {
    var stored = loadStored();
    if (stored && !loadSession()) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  }

  function showError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.hidden = !message;
  }

  function bindAccessForm(options, onSuccess) {
    var form = document.getElementById(options.formId);
    var emailInput = document.getElementById(options.emailId);
    var rememberInput = document.getElementById(options.rememberId);
    var errorEl = document.getElementById(options.errorId);
    if (!form || !emailInput) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showError(errorEl, '');

      var email = normalizeEmail(emailInput.value);
      if (!email) {
        showError(errorEl, 'Enter your email address to continue.');
        emailInput.focus();
        return;
      }
      if (!isAllowedEmail(email)) {
        showError(
          errorEl,
          'We could not verify access for that email. Contact your supervisor if you believe you should have access.'
        );
        emailInput.focus();
        return;
      }

      var saved = saveAccess(email, rememberInput && rememberInput.checked);
      onSuccess(saved);
    });
  }

  function unlockPageGate(email) {
    document.body.classList.remove('access-locked');
    var gate = document.getElementById('accessGate');
    if (gate) {
      gate.hidden = true;
      gate.setAttribute('aria-hidden', 'true');
    }
    var badge = document.getElementById('accessUserBadge');
    if (badge) badge.hidden = true;
  }

  function bindSignOut(buttonId) {
    var btn = document.getElementById(buttonId || 'accessSignOut');
    if (!btn) return;
    btn.addEventListener('click', function () {
      clearAccess();
      window.location.reload();
    });
  }

  function initGate(onAuthorized) {
    if (typeof onAuthorized !== 'function') return;

    if (isAuthorized()) {
      ensureSessionFromStorage();
      unlockPageGate(getStoredEmail());
      onAuthorized(getStoredEmail());
      bindSignOut('accessSignOut');
      return;
    }

    document.body.classList.add('access-locked');
    bindAccessForm(
      {
        formId: 'accessGateForm',
        emailId: 'accessEmail',
        rememberId: 'accessRemember',
        errorId: 'accessGateError',
      },
      function (email) {
        unlockPageGate(email);
        onAuthorized(email);
      }
    );
    bindSignOut('accessSignOut');
    var emailInput = document.getElementById('accessEmail');
    if (emailInput) emailInput.focus();
  }

  function setModalContext(context) {
    var lead = document.querySelector('#tmcAccessModal .tmc-access-modal__lead');
    if (!lead) return;
    if (context === 'category') {
      lead.textContent = 'Enter your email to open the TMC section.';
    } else {
      lead.textContent = 'Enter your email to open this tool.';
    }
  }

  function promptForAccess(options) {
    options = options || {};
    if (isAuthorized()) {
      ensureSessionFromStorage();
      if (typeof options.onSuccess === 'function') options.onSuccess(getStoredEmail());
      return true;
    }

    pendingSuccess = options.onSuccess || null;
    pendingHref = options.href || '';
    setModalContext(options.context || (options.href ? 'tool' : 'category'));
    openHubModal(options.href || '');
    return false;
  }

  var pendingSuccess = null;
  var pendingHref = '';
  var hubGateModalReady = false;

  function openHubModal(targetHref) {
    var modal = document.getElementById('tmcAccessModal');
    if (!modal) {
      window.location.href = targetHref;
      return;
    }

    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tmc-access-modal-open');

    var pending = modal.querySelector('[data-tmc-pending-href]');
    if (pending) pending.textContent = targetHref;

    modal.dataset.pendingHref = targetHref;

    var emailInput = document.getElementById('tmcHubAccessEmail');
    if (emailInput) {
      emailInput.value = getStoredEmail();
      emailInput.focus();
    }
    showError(document.getElementById('tmcHubAccessError'), '');
  }

  function closeHubModal() {
    var modal = document.getElementById('tmcAccessModal');
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    delete modal.dataset.pendingHref;
    document.body.classList.remove('tmc-access-modal-open');
  }

  function updateHubAccessUi() {
    /* No visible locked/unlocked state on the hub — gate runs on click only. */
  }

  function initHubGate() {
    ensureSessionFromStorage();
    updateHubAccessUi();

    document.querySelectorAll('[data-tmc-gated]:not([data-tmc-bound])').forEach(function (link) {
      link.setAttribute('data-tmc-bound', '1');
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (!href) return;

        if (isAuthorized()) {
          return;
        }

        e.preventDefault();
        promptForAccess({ href: href, context: 'tool' });
      });
    });

    if (hubGateModalReady) return;
    hubGateModalReady = true;

    bindAccessForm(
      {
        formId: 'tmcHubAccessForm',
        emailId: 'tmcHubAccessEmail',
        rememberId: 'tmcHubAccessRemember',
        errorId: 'tmcHubAccessError',
      },
      function (email) {
        updateHubAccessUi();
        var modal = document.getElementById('tmcAccessModal');
        var href = (modal && modal.dataset.pendingHref) || pendingHref;
        var onSuccess = pendingSuccess;
        pendingSuccess = null;
        pendingHref = '';
        closeHubModal();
        if (typeof onSuccess === 'function') {
          onSuccess(email);
        } else if (href) {
          window.location.href = href;
        }
      }
    );

    var closeBtn = document.getElementById('tmcAccessModalClose');
    var backdrop = document.getElementById('tmcAccessModalBackdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeHubModal);
    if (backdrop) backdrop.addEventListener('click', closeHubModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var modal = document.getElementById('tmcAccessModal');
        if (modal && !modal.hidden) closeHubModal();
      }
    });
  }

  global.TmcAccess = {
    STORAGE_KEY: STORAGE_KEY,
    initGate: initGate,
    initHubGate: initHubGate,
    promptForAccess: promptForAccess,
    clearAccess: clearAccess,
    isAuthorized: isAuthorized,
    getStoredEmail: getStoredEmail,
    isAllowedEmail: isAllowedEmail,
    saveAccess: saveAccess,
  };

  // Backward compatibility for bench-crane app.js
  global.TmcCraneAccess = global.TmcAccess;
})(typeof window !== 'undefined' ? window : globalThis);
