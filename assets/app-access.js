/**
 * Technician Assistant — app-wide access gate.
 * @trimble.com auto-grants for 28 days; other emails require admin approval.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'tta-app-access-v1';
  var PENDING_EMAIL_KEY = 'tta-app-access-pending-email-v1';
  var readyPromise;
  var readyResolve;
  var authorized = false;

  function cfg(key, fallback) {
    var c = global.WORKSPACE_CONFIG || {};
    return c[key] != null && c[key] !== '' ? c[key] : fallback;
  }

  function normalizeEmail(raw) {
    return String(raw || '').trim().toLowerCase();
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isTrimbleEmail(email) {
    return normalizeEmail(email).split('@')[1] === 'trimble.com';
  }

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (err) {
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {}
  }

  function loadStoredAccess() {
    var data = readJson(STORAGE_KEY);
    if (!data || !data.email || !data.expiresAt) return null;
    if (Date.now() > new Date(data.expiresAt).getTime()) {
      clearStoredAccess();
      return null;
    }
    return data;
  }

  function saveStoredAccess(email, expiresAt, grantType) {
    writeJson(STORAGE_KEY, {
      email: normalizeEmail(email),
      expiresAt: expiresAt,
      grantType: grantType || '',
      savedAt: new Date().toISOString(),
    });
    try {
      localStorage.removeItem(PENDING_EMAIL_KEY);
    } catch (err) {}
  }

  function clearStoredAccess() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {}
  }

  function rememberPendingEmail(email) {
    try {
      localStorage.setItem(PENDING_EMAIL_KEY, normalizeEmail(email));
    } catch (err) {}
  }

  function getPendingEmail() {
    try {
      return localStorage.getItem(PENDING_EMAIL_KEY) || '';
    } catch (err) {
      return '';
    }
  }

  function grantDaysLabel() {
    var days = Number(cfg('accessGrantDays', 28));
    return days > 0 ? days : 28;
  }

  function ensureGate() {
    if (document.getElementById('appAccessGate')) return;
    var logoPath = resolveAssetPath('assets/brand/trimble-logo-blue.png');
    var gate = document.createElement('div');
    gate.id = 'appAccessGate';
    gate.className = 'app-access-gate';
    gate.hidden = true;
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'appAccessTitle');
    gate.innerHTML =
      '<div class="app-access-gate__panel card">' +
      '<img class="app-access-gate__logo" src="' +
      logoPath +
      '" alt="Trimble" width="120" height="32" />' +
      '<h2 id="appAccessTitle" class="app-access-gate__title">Request access</h2>' +
      '<p id="appAccessLead" class="app-access-gate__lead">Enter your work email to use the Technician Assistant.</p>' +
      '<div id="appAccessStatus" class="app-access-gate__status app-access-gate__status--pending" hidden></div>' +
      '<form id="appAccessForm" class="app-access-gate__form" novalidate>' +
      '<label class="app-access-gate__label" for="appAccessEmail">Work email</label>' +
      '<input class="app-access-gate__input" id="appAccessEmail" type="email" inputmode="email" autocomplete="email" placeholder="Work email" required />' +
      '<label class="app-access-gate__remember"><input type="checkbox" id="appAccessRemember" checked /> Remember this device until access expires (' +
      grantDaysLabel() +
      ' days)</label>' +
      '<p id="appAccessError" class="app-access-gate__error" hidden role="alert"></p>' +
      '<div class="app-access-gate__actions">' +
      '<button type="submit" class="btn-primary app-access-gate__submit" id="appAccessSubmit">Continue</button>' +
      '<button type="button" class="btn-secondary app-access-gate__secondary" id="appAccessCheckStatus" hidden>Check status</button>' +
      '</div>' +
      '</form>' +
      '<p class="app-access-gate__note" id="appAccessNote">After approval you will receive an email with a link to open the app. Return here with the same email address and tap <strong>Check status</strong>.</p>' +
      '</div>';
    document.body.appendChild(gate);

    document.getElementById('appAccessForm').addEventListener('submit', onSubmit);
    document.getElementById('appAccessCheckStatus').addEventListener('click', onCheckStatus);
  }

  function resolveAssetPath(relativePath) {
    var configScript = document.querySelector('script[src*="workspace-config"]');
    if (configScript) {
      var src = configScript.getAttribute('src') || '';
      var assetsBase = src.replace(/workspace-config\.js.*$/, '');
      return assetsBase + String(relativePath).replace(/^assets\//, '');
    }
    return './' + relativePath;
  }

  function showError(message) {
    var el = document.getElementById('appAccessError');
    if (!el) return;
    el.textContent = message || '';
    el.hidden = !message;
  }

  function setGateVisible(visible) {
    ensureGate();
    var gate = document.getElementById('appAccessGate');
    if (!gate) return;
    gate.hidden = !visible;
    document.body.classList.toggle('app-access-modal-open', visible);
    if (visible) {
      document.body.classList.add('app-access-locked');
    } else {
      document.body.classList.remove('app-access-locked');
    }
  }

  function showPendingState(email) {
    var status = document.getElementById('appAccessStatus');
    var checkBtn = document.getElementById('appAccessCheckStatus');
    var submitBtn = document.getElementById('appAccessSubmit');
    var form = document.getElementById('appAccessForm');
    var title = document.getElementById('appAccessTitle');
    if (title) title.textContent = 'Waiting for approval';
    if (status) {
      status.hidden = false;
      status.className = 'app-access-gate__status app-access-gate__status--pending';
      status.innerHTML =
        'Request sent for <span class="app-access-gate__email">' +
        escapeHtml(email) +
        '</span>. You will receive email when access is approved. Tap <strong>Check status</strong> after approval, or refresh this page.';
    }
    if (checkBtn) checkBtn.hidden = false;
    if (submitBtn) submitBtn.textContent = 'Resubmit request';
    if (form) {
      var emailInput = document.getElementById('appAccessEmail');
      if (emailInput && !emailInput.value) emailInput.value = email;
    }
  }

  function showDeniedState(email) {
    var status = document.getElementById('appAccessStatus');
    if (status) {
      status.hidden = false;
      status.className = 'app-access-gate__status app-access-gate__status--denied';
      status.textContent =
        'Access was not approved for ' + email + '. Contact the app administrator if you need help.';
    }
  }

  function showExpiredState(email) {
    var status = document.getElementById('appAccessStatus');
    if (status) {
      status.hidden = false;
      status.className = 'app-access-gate__status app-access-gate__status--expired';
      status.textContent =
        'Your ' + grantDaysLabel() + '-day access has expired. Submit your email again to request access.';
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function unlockAccess(email, expiresAt, grantType) {
    authorized = true;
    saveStoredAccess(email, expiresAt, grantType);
    setGateVisible(false);
    document.body.classList.remove('app-access-locked');
    if (global.WorkspaceApi && typeof global.WorkspaceApi.initPageTelemetry === 'function') {
      global.WorkspaceApi.initPageTelemetry();
    }
    if (readyResolve) {
      readyResolve({ email: normalizeEmail(email), expiresAt: expiresAt, grantType: grantType });
      readyResolve = null;
    }
    document.dispatchEvent(
      new CustomEvent('tta:access-ready', {
        detail: { email: normalizeEmail(email), expiresAt: expiresAt, grantType: grantType },
      })
    );
  }

  function lockAccess() {
    authorized = false;
    setGateVisible(true);
    document.body.classList.add('app-access-locked');
  }

  function applyCheckResult(result, email, remember) {
    if (!result || !result.ok) {
      showError((result && result.error) || 'Could not verify access. Try again in a moment.');
      return;
    }
    if (result.status === 'approved' && result.expiresAt) {
      if (remember !== false) saveStoredAccess(email, result.expiresAt, result.grantType);
      unlockAccess(email, result.expiresAt, result.grantType);
      return;
    }
    if (result.status === 'pending') {
      rememberPendingEmail(email);
      showPendingState(email);
      showError('');
      return;
    }
    if (result.status === 'denied') {
      showDeniedState(email);
      return;
    }
    if (result.status === 'expired') {
      clearStoredAccess();
      showExpiredState(email);
      return;
    }
    showError('');
  }

  function onCheckStatus() {
    var emailInput = document.getElementById('appAccessEmail');
    var email = normalizeEmail(emailInput && emailInput.value);
    if (!email) email = getPendingEmail();
    if (!isValidEmail(email)) {
      showError('Enter your work email first.');
      return;
    }
    showError('');
    if (!global.WorkspaceApi || typeof global.WorkspaceApi.checkAccess !== 'function') {
      showError('Access service is not configured yet.');
      return;
    }
    var remember = document.getElementById('appAccessRemember');
    global.WorkspaceApi.checkAccess(email).then(function (result) {
      applyCheckResult(result, email, !remember || remember.checked);
    });
  }

  function onSubmit(e) {
    e.preventDefault();
    showError('');
    var emailInput = document.getElementById('appAccessEmail');
    var rememberInput = document.getElementById('appAccessRemember');
    var email = normalizeEmail(emailInput && emailInput.value);
    if (!isValidEmail(email)) {
      showError('Enter a valid work email address.');
      return;
    }
    if (!global.WorkspaceApi || typeof global.WorkspaceApi.requestAccess !== 'function') {
      showError('Access service is not configured yet.');
      return;
    }
    var submitBtn = document.getElementById('appAccessSubmit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Please wait…';
    }
    global.WorkspaceApi.requestAccess(email)
      .then(function (result) {
        if (!result || !result.ok) {
          showError((result && result.error) || 'Could not submit your request. Try again.');
          return;
        }
        if (result.status === 'approved' && result.expiresAt) {
          applyCheckResult(result, email, !rememberInput || rememberInput.checked);
          return;
        }
        rememberPendingEmail(email);
        if (global.WorkspaceApi.logEvent) {
          global.WorkspaceApi.logEvent('access_requested', { email: email, detail: isTrimbleEmail(email) ? 'trimble' : 'external' });
        }
        showPendingState(email);
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Continue';
        }
      });
  }

  function bootstrap() {
    ensureGate();
    if (!global.WorkspaceApi || !global.WorkSPACE_CONFIG || !global.WORKSPACE_CONFIG.endpoint) {
      lockAccess();
      showError('Access service is not configured. Contact the app developer.');
      return;
    }

    var stored = loadStoredAccess();
    var pendingEmail = getPendingEmail();
    var emailInput = document.getElementById('appAccessEmail');
    if (stored && emailInput) emailInput.value = stored.email;
    else if (pendingEmail && emailInput) emailInput.value = pendingEmail;

    var submitBtn = document.getElementById('appAccessSubmit');

    var verifyEmail = stored ? stored.email : pendingEmail;
    if (!verifyEmail) {
      lockAccess();
      return;
    }

    global.WorkspaceApi.checkAccess(verifyEmail).then(function (result) {
      if (result && result.status === 'approved' && result.expiresAt) {
        unlockAccess(verifyEmail, result.expiresAt, result.grantType);
        return;
      }
      lockAccess();
      if (result && result.status === 'expired') {
        clearStoredAccess();
        showExpiredState(verifyEmail);
      } else if (result && result.status === 'pending') showPendingState(verifyEmail);
      else if (result && result.status === 'denied') showDeniedState(verifyEmail);
    });
  }

  function whenReady() {
    if (authorized) return Promise.resolve({ email: getEmail() });
    if (!readyPromise) {
      readyPromise = new Promise(function (resolve) {
        readyResolve = resolve;
      });
    }
    return readyPromise;
  }

  function isAuthorized() {
    return authorized;
  }

  function getEmail() {
    var stored = loadStoredAccess();
    return stored ? stored.email : '';
  }

  function signOut() {
    authorized = false;
    clearStoredAccess();
    try {
      localStorage.removeItem(PENDING_EMAIL_KEY);
    } catch (err) {}
    readyPromise = null;
    readyResolve = null;
    lockAccess();
    var emailInput = document.getElementById('appAccessEmail');
    if (emailInput) emailInput.value = '';
    var status = document.getElementById('appAccessStatus');
    if (status) status.hidden = true;
    var title = document.getElementById('appAccessTitle');
    if (title) title.textContent = 'Request access';
  }

  global.AppAccess = {
    whenReady: whenReady,
    isAuthorized: isAuthorized,
    getEmail: getEmail,
    signOut: signOut,
    bootstrap: bootstrap,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})(window);
