/**
 * Technician Assistant — app-wide access gate.
 * Full gate UI only on the hub entry page (data-app-access-entry).
 * Tool pages trust stored/session access and redirect to the hub if missing.
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'tta-app-access-v1';
  var SESSION_KEY = 'tta-app-access-session-v1';
  var PENDING_EMAIL_KEY = 'tta-app-access-pending-email-v1';
  var readyPromise;
  var readyResolve;
  var authorized = false;

  function cfg(key, fallback) {
    var c = global.WORKSPACE_CONFIG || {};
    return c[key] != null && c[key] !== '' ? c[key] : fallback;
  }

  function isEntryPage() {
    return !!(document.body && document.body.hasAttribute('data-app-access-entry'));
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

  function readJson(storage, key) {
    try {
      return JSON.parse(storage.getItem(key) || 'null');
    } catch (err) {
      return null;
    }
  }

  function writeJson(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (err) {}
  }

  function isAccessDataValid(data) {
    if (!data || !data.email || !data.expiresAt) return false;
    if (Date.now() > new Date(data.expiresAt).getTime()) return false;
    return true;
  }

  function loadStoredAccess() {
    var data = readJson(localStorage, STORAGE_KEY);
    if (!data) return null;
    if (!isAccessDataValid(data)) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {}
      return null;
    }
    return data;
  }

  function loadSessionAccess() {
    var data = readJson(sessionStorage, SESSION_KEY);
    if (!data) return null;
    if (!isAccessDataValid(data)) {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch (err) {}
      return null;
    }
    return data;
  }

  function loadAnyAccess() {
    return loadStoredAccess() || loadSessionAccess();
  }

  function persistAccess(email, expiresAt, grantType) {
    var record = {
      email: normalizeEmail(email),
      expiresAt: expiresAt,
      grantType: grantType || '',
      savedAt: new Date().toISOString(),
    };
    writeJson(localStorage, STORAGE_KEY, record);
    writeJson(sessionStorage, SESSION_KEY, record);
    try {
      localStorage.removeItem(PENDING_EMAIL_KEY);
    } catch (err) {}
  }

  function saveStoredAccess(email, expiresAt, grantType) {
    persistAccess(email, expiresAt, grantType);
  }

  function clearStoredAccess() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_KEY);
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

  function hubEntryUrl() {
    var configured = cfg('appUrl', '');
    if (configured) {
      return configured.replace(/\/?$/, '/') + 'index.html';
    }
    var script = document.querySelector('script[src*="app-access"]');
    if (script) {
      var src = script.getAttribute('src') || '';
      var depth = (src.match(/\.\.\//g) || []).length;
      var parts = location.pathname.split('/').filter(Boolean);
      var drop = depth + (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1]) ? 1 : 0);
      var rootParts = parts.slice(0, Math.max(0, parts.length - drop));
      return location.origin + '/' + rootParts.join('/') + '/index.html';
    }
    return './index.html';
  }

  function redirectToHub() {
    var returnPath = location.pathname + location.search + location.hash;
    var hub = hubEntryUrl();
    if (returnPath && !/\/index\.html$/i.test(returnPath) && returnPath !== '/') {
      var join = hub.indexOf('?') === -1 ? '?' : '&';
      hub += join + 'return=' + encodeURIComponent(returnPath);
    }
    location.replace(hub);
  }

  function maybeFollowReturnUrl() {
    if (!isEntryPage()) return;
    try {
      var params = new URLSearchParams(location.search);
      var target = params.get('return');
      if (!target || target.indexOf('//') !== -1) return;
      if (!target.startsWith('/')) return;
      params.delete('return');
      var clean =
        location.pathname +
        (params.toString() ? '?' + params.toString() : '') +
        location.hash;
      history.replaceState({}, '', clean);
      location.assign(target);
    } catch (err) {}
  }

  function codeMinutesLabel() {
    var minutes = Number(cfg('accessCodeMinutes', 15));
    return minutes > 0 ? minutes : 15;
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
      '<p id="appAccessLead" class="app-access-gate__lead">Submit your work email to request access to the Technician Assistant.</p>' +
      '<div id="appAccessStatus" class="app-access-gate__status app-access-gate__status--pending" hidden></div>' +
      '<form id="appAccessForm" class="app-access-gate__form" novalidate>' +
      '<div id="appAccessEmailSection" class="app-access-gate__email-step">' +
      '<label class="app-access-gate__label" for="appAccessEmail">Work email</label>' +
      '<input class="app-access-gate__input" id="appAccessEmail" type="email" inputmode="email" autocomplete="email" placeholder="Work email" required />' +
      '</div>' +
      '<div id="appAccessVerifySection" class="app-access-gate__verify" hidden>' +
      '<label class="app-access-gate__label" for="appAccessCode">Sign-in code</label>' +
      '<input class="app-access-gate__input app-access-gate__input--code" id="appAccessCode" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" placeholder="6-digit code" />' +
      '<label class="app-access-gate__remember" id="appAccessRememberWrap"><input type="checkbox" id="appAccessRemember" checked /> Remember this device</label>' +
      '</div>' +
      '<p id="appAccessError" class="app-access-gate__error" hidden role="alert"></p>' +
      '<div class="app-access-gate__actions">' +
      '<button type="submit" class="btn-primary app-access-gate__submit" id="appAccessSubmit">Submit for access</button>' +
      '<button type="button" class="btn-secondary app-access-gate__secondary" id="appAccessResendCode" hidden>Resend code</button>' +
      '<button type="button" class="app-access-gate__link" id="appAccessChangeEmail" hidden>Use a different email</button>' +
      '</div>' +
      '</form>' +
      '<p class="app-access-gate__note" id="appAccessNote">An administrator will review your request. After approval, you will receive a sign-in code by email.</p>' +
      '</div>';
    document.body.appendChild(gate);

    document.getElementById('appAccessForm').addEventListener('submit', onSubmit);
    document.getElementById('appAccessResendCode').addEventListener('click', onResendCode);
    document.getElementById('appAccessChangeEmail').addEventListener('click', onChangeEmail);
  }

  function isVerifyStepActive() {
    var section = document.getElementById('appAccessVerifySection');
    return !!(section && !section.hidden);
  }

  function resetToEmailStep() {
    var title = document.getElementById('appAccessTitle');
    var lead = document.getElementById('appAccessLead');
    var emailSection = document.getElementById('appAccessEmailSection');
    var verifySection = document.getElementById('appAccessVerifySection');
    var emailInput = document.getElementById('appAccessEmail');
    var codeInput = document.getElementById('appAccessCode');
    var submitBtn = document.getElementById('appAccessSubmit');
    var resendBtn = document.getElementById('appAccessResendCode');
    var changeBtn = document.getElementById('appAccessChangeEmail');
    var status = document.getElementById('appAccessStatus');
    var note = document.getElementById('appAccessNote');
    if (title) title.textContent = 'Request access';
    if (lead) {
      lead.textContent = 'Submit your work email to request access to the Technician Assistant.';
      lead.hidden = false;
    }
    if (emailSection) emailSection.hidden = false;
    if (verifySection) verifySection.hidden = true;
    if (emailInput) emailInput.readOnly = false;
    if (codeInput) codeInput.value = '';
    if (submitBtn) submitBtn.textContent = 'Submit for access';
    if (resendBtn) resendBtn.hidden = true;
    if (changeBtn) changeBtn.hidden = true;
    if (status) status.hidden = true;
    if (note) {
      note.hidden = false;
      note.textContent =
        'An administrator will review your request. After approval, you will receive a sign-in code by email.';
    }
  }

  function showVerifyCodeState(email, options) {
    options = options || {};
    var title = document.getElementById('appAccessTitle');
    var lead = document.getElementById('appAccessLead');
    var emailSection = document.getElementById('appAccessEmailSection');
    var verifySection = document.getElementById('appAccessVerifySection');
    var emailInput = document.getElementById('appAccessEmail');
    var codeInput = document.getElementById('appAccessCode');
    var submitBtn = document.getElementById('appAccessSubmit');
    var resendBtn = document.getElementById('appAccessResendCode');
    var changeBtn = document.getElementById('appAccessChangeEmail');
    var status = document.getElementById('appAccessStatus');
    var note = document.getElementById('appAccessNote');
    if (title) title.textContent = 'Enter sign-in code';
    if (lead) {
      if (options.codeSent) {
        lead.innerHTML =
          'A new sign-in code was sent to <span class="app-access-gate__email">' +
          escapeHtml(email) +
          '</span>. Codes expire in ' +
          codeMinutesLabel() +
          ' minutes.';
      } else {
        lead.innerHTML =
          'Enter the sign-in code sent to <span class="app-access-gate__email">' +
          escapeHtml(email) +
          '</span>. Codes expire in ' +
          codeMinutesLabel() +
          ' minutes.';
      }
    }
    if (emailSection) emailSection.hidden = true;
    if (verifySection) verifySection.hidden = false;
    if (emailInput) emailInput.value = email;
    if (codeInput) {
      codeInput.value = '';
      codeInput.focus();
    }
    if (submitBtn) submitBtn.textContent = 'Verify code';
    if (resendBtn) resendBtn.hidden = false;
    if (changeBtn) changeBtn.hidden = false;
    if (status) status.hidden = true;
    if (note) note.hidden = true;
    showError('');
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
    resetToEmailStep();
    var status = document.getElementById('appAccessStatus');
    var submitBtn = document.getElementById('appAccessSubmit');
    var title = document.getElementById('appAccessTitle');
    var lead = document.getElementById('appAccessLead');
    var emailInput = document.getElementById('appAccessEmail');
    if (title) title.textContent = 'Waiting for approval';
    if (lead) {
      lead.textContent =
        'Your access request is pending. You will receive a sign-in code by email after an administrator approves access.';
    }
    if (status) {
      status.hidden = false;
      status.className = 'app-access-gate__status app-access-gate__status--pending';
      status.innerHTML =
        'Request sent for <span class="app-access-gate__email">' +
        escapeHtml(email) +
        '</span>. Check your email after approval, then submit the same email here again to enter your code.';
    }
    if (submitBtn) submitBtn.textContent = 'Check approval status';
    if (emailInput && !emailInput.value) emailInput.value = email;
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
    resetToEmailStep();
    var status = document.getElementById('appAccessStatus');
    if (status) {
      status.hidden = false;
      status.className = 'app-access-gate__status app-access-gate__status--expired';
      status.textContent =
        'Your access has expired. Submit your work email again to receive a new sign-in code.';
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hasValidStoredAccess() {
    return Boolean(loadAnyAccess());
  }

  function dispatchAccessReady(detail) {
    if (global.WorkspaceApi && typeof global.WorkspaceApi.initPageTelemetry === 'function') {
      global.WorkspaceApi.initPageTelemetry();
    }
    if (readyResolve) {
      readyResolve(detail);
      readyResolve = null;
    }
    document.dispatchEvent(new CustomEvent('tta:access-ready', { detail: detail }));
  }

  function unlockAccess(email, expiresAt, grantType, options) {
    options = options || {};
    authorized = true;
    if (options.persist !== false) {
      persistAccess(email, expiresAt, grantType);
    } else {
      writeJson(sessionStorage, SESSION_KEY, {
        email: normalizeEmail(email),
        expiresAt: expiresAt,
        grantType: grantType || '',
        savedAt: new Date().toISOString(),
      });
    }
    if (isEntryPage()) {
      setGateVisible(false);
    }
    document.body.classList.remove('app-access-locked');
    dispatchAccessReady({
      email: normalizeEmail(email),
      expiresAt: expiresAt,
      grantType: grantType || '',
    });
    if (isEntryPage()) {
      maybeFollowReturnUrl();
    }
  }

  function lockAccess() {
    if (!isEntryPage()) return;
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
      else {
        writeJson(sessionStorage, SESSION_KEY, {
          email: normalizeEmail(email),
          expiresAt: result.expiresAt,
          grantType: result.grantType || '',
          savedAt: new Date().toISOString(),
        });
      }
      unlockAccess(email, result.expiresAt, result.grantType, { persist: remember !== false });
      return;
    }
    if (result.status === 'verify_code') {
      showVerifyCodeState(email, { codeSent: !!result.codeSent });
      return;
    }
    if (result.status === 'pending') {
      rememberPendingEmail(email);
      showPendingState(email);
      showError('');
      return;
    }
    if (result.status === 'denied') {
      authorized = false;
      clearStoredAccess();
      lockAccess();
      showDeniedState(email);
      return;
    }
    if (result.status === 'expired') {
      authorized = false;
      clearStoredAccess();
      lockAccess();
      showExpiredState(email);
      return;
    }
    showError('');
  }

  function onResendCode() {
    var emailInput = document.getElementById('appAccessEmail');
    var email = normalizeEmail(emailInput && emailInput.value);
    if (!isValidEmail(email)) {
      showError('Enter your work email first.');
      return;
    }
    showError('');
    if (!global.WorkspaceApi || typeof global.WorkspaceApi.resendAccessCode !== 'function') {
      showError('Access service is not configured yet.');
      return;
    }
    var resendBtn = document.getElementById('appAccessResendCode');
    if (resendBtn) {
      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending…';
    }
    global.WorkspaceApi.resendAccessCode(email)
      .then(function (result) {
        if (!result || !result.ok) {
          showError((result && result.error) || 'Could not resend code. Try again.');
          return;
        }
        if (result.throttled) {
          showError('A code was sent recently. Check your inbox or wait a minute before resending.');
          return;
        }
        showVerifyCodeState(email, { codeSent: true });
      })
      .finally(function () {
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.textContent = 'Resend code';
        }
      });
  }

  function onChangeEmail(e) {
    if (e && e.preventDefault) e.preventDefault();
    resetToEmailStep();
    showError('');
  }

  function onVerifyCode(email) {
    var rememberInput = document.getElementById('appAccessRemember');
    var codeInput = document.getElementById('appAccessCode');
    var code = String((codeInput && codeInput.value) || '').trim();
    if (!/^\d{6}$/.test(code)) {
      showError('Enter the 6-digit code from your email.');
      return;
    }
    if (!global.WorkspaceApi || typeof global.WorkspaceApi.verifyAccessCode !== 'function') {
      showError('Access service is not configured yet.');
      return;
    }
    var submitBtn = document.getElementById('appAccessSubmit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying…';
    }
    global.WorkspaceApi.verifyAccessCode(email, code)
      .then(function (result) {
        if (!result || !result.ok) {
          var message = (result && result.error) || 'Could not verify code. Try again.';
          if (/expired/i.test(message)) {
            resetToEmailStep();
            showError('That code has expired. Submit your email again to receive a new sign-in code.');
            var emailInput = document.getElementById('appAccessEmail');
            if (emailInput) emailInput.value = email;
            return;
          }
          showError(message);
          return;
        }
        applyCheckResult(result, email, !rememberInput || rememberInput.checked);
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Verify code';
        }
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
    if (isVerifyStepActive()) {
      onVerifyCode(email);
      return;
    }
    if (!global.WorkspaceApi || typeof global.WorkspaceApi.startAccess !== 'function') {
      showError('Access service is not configured yet.');
      return;
    }
    var submitBtn = document.getElementById('appAccessSubmit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Please wait…';
    }
    global.WorkspaceApi.startAccess(email)
      .then(function (result) {
        if (!result || !result.ok) {
          showError((result && result.error) || 'Could not submit your request. Try again.');
          return;
        }
        if (result.status === 'verify_code') {
          showVerifyCodeState(email, { codeSent: !!result.codeSent });
          return;
        }
        if (result.status === 'approved' && result.expiresAt) {
          applyCheckResult(result, email, !rememberInput || rememberInput.checked);
          return;
        }
        if (result.status === 'pending') {
          rememberPendingEmail(email);
          if (!result.duplicate && global.WorkspaceApi.logEvent) {
            global.WorkspaceApi.logEvent('access_requested', { email: email, detail: isTrimbleEmail(email) ? 'trimble' : 'external' });
          }
          showPendingState(email);
          return;
        }
        if (result.status === 'denied') {
          applyCheckResult(result, email, !rememberInput || rememberInput.checked);
          return;
        }
        rememberPendingEmail(email);
        if (!result.duplicate && global.WorkspaceApi.logEvent) {
          global.WorkspaceApi.logEvent('access_requested', { email: email, detail: isTrimbleEmail(email) ? 'trimble' : 'external' });
        }
        showPendingState(email);
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = isVerifyStepActive()
            ? 'Verify code'
            : document.getElementById('appAccessStatus') &&
              !document.getElementById('appAccessStatus').hidden
              ? 'Check approval status'
              : 'Submit for access';
        }
      });
  }

  function handleRevokedAccess(email) {
    authorized = false;
    clearStoredAccess();
    if (isEntryPage()) {
      lockAccess();
      resetToEmailStep();
      showError('Access is no longer active for this email. Sign in again or contact the app administrator.');
      return;
    }
    redirectToHub();
  }

  function revalidateAccess(email, options) {
    options = options || {};
    var allowLock = options.allowLock !== false && isEntryPage();

    if (!global.WorkspaceApi || typeof global.WorkspaceApi.checkAccess !== 'function') {
      if (allowLock && !hasValidStoredAccess() && !options.allowPending) lockAccess();
      return;
    }

    global.WorkspaceApi.checkAccess(email, { revalidate: true }).then(function (result) {
      if (result && result.status === 'approved' && result.expiresAt) {
        if (allowLock) {
          unlockAccess(email, result.expiresAt, result.grantType, { persist: false });
        } else {
          persistAccess(email, result.expiresAt, result.grantType);
        }
        return;
      }
      if (result && result.status === 'expired') {
        authorized = false;
        clearStoredAccess();
        if (allowLock) {
          lockAccess();
          showExpiredState(email);
        } else {
          redirectToHub();
        }
        return;
      }
      if (result && result.status === 'denied') {
        handleRevokedAccess(email);
        return;
      }
      if (result && result.status === 'pending') {
        if (allowLock) {
          authorized = false;
          lockAccess();
          showPendingState(email);
        }
        return;
      }
      if (result && result.status === 'none') {
        handleRevokedAccess(email);
        return;
      }
      if (allowLock && !hasValidStoredAccess()) {
        lockAccess();
      }
    }).catch(function () {
      if (allowLock && !hasValidStoredAccess()) {
        lockAccess();
      }
    });
  }

  function authorizeFromStorage(stored) {
    authorized = true;
    document.body.classList.remove('app-access-locked');
    dispatchAccessReady({
      email: stored.email,
      expiresAt: stored.expiresAt,
      grantType: stored.grantType || '',
    });
    revalidateAccess(stored.email, { allowLock: false });
  }

  function bootstrapEntry() {
    ensureGate();
    if (!global.WorkspaceApi || !global.WORKSPACE_CONFIG || !global.WORKSPACE_CONFIG.endpoint) {
      lockAccess();
      showError('Access service is not configured. Contact the app developer.');
      return;
    }

    var stored = loadAnyAccess();
    var pendingEmail = getPendingEmail();
    var emailInput = document.getElementById('appAccessEmail');
    if (stored && emailInput) emailInput.value = stored.email;
    else if (pendingEmail && emailInput) emailInput.value = pendingEmail;

    if (stored) {
      unlockAccess(stored.email, stored.expiresAt, stored.grantType, { persist: false });
      revalidateAccess(stored.email);
      return;
    }

    if (pendingEmail) {
      lockAccess();
      revalidateAccess(pendingEmail, { allowPending: true });
      return;
    }

    lockAccess();
  }

  function bootstrapVisitor() {
    var stored = loadAnyAccess();
    if (stored) {
      authorizeFromStorage(stored);
      return;
    }
    redirectToHub();
  }

  function bootstrap() {
    if (isEntryPage()) {
      bootstrapEntry();
    } else {
      bootstrapVisitor();
    }
  }

  function whenReady() {
    var stored = loadAnyAccess();
    if (authorized || stored) {
      return Promise.resolve({
        email: stored ? stored.email : '',
        expiresAt: stored ? stored.expiresAt : '',
        grantType: stored ? stored.grantType : '',
      });
    }
    if (!readyPromise) {
      readyPromise = new Promise(function (resolve) {
        readyResolve = resolve;
      });
    }
    return readyPromise;
  }

  function isAuthorized() {
    return authorized || hasValidStoredAccess();
  }

  function getEmail() {
    var stored = loadAnyAccess();
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
    if (isEntryPage()) {
      lockAccess();
      resetToEmailStep();
      var emailInput = document.getElementById('appAccessEmail');
      if (emailInput) emailInput.value = '';
      var status = document.getElementById('appAccessStatus');
      if (status) status.hidden = true;
      var title = document.getElementById('appAccessTitle');
      if (title) title.textContent = 'Request access';
      return;
    }
    redirectToHub();
  }

  global.AppAccess = {
    whenReady: whenReady,
    isAuthorized: isAuthorized,
    getEmail: getEmail,
    signOut: signOut,
    bootstrap: bootstrap,
    isEntryPage: isEntryPage,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})(window);
