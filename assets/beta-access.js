/**
 * BETA tool access — per-tool grants on top of main app access.
 * @trimble.com: auto-approved for BETA. Other emails: admin approval required.
 */
(function (global) {
  'use strict';

  function cfg(key, fallback) {
    var c = global.WORKSPACE_CONFIG || {};
    return c[key] != null && c[key] !== '' ? c[key] : fallback;
  }

  function normalizeEmail(raw) {
    return String(raw || '').trim().toLowerCase();
  }

  function isTrimbleEmail(email) {
    return normalizeEmail(email).split('@')[1] === 'trimble.com';
  }

  function getToolId() {
    return document.body.getAttribute('data-beta-tool') || '';
  }

  function storageKey(toolId) {
    return 'tta-beta-access-v1-' + toolId;
  }

  function readGrant(toolId) {
    try {
      var raw = localStorage.getItem(storageKey(toolId));
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.email || !data.expiresAt) return null;
      if (Date.now() > new Date(data.expiresAt).getTime()) {
        localStorage.removeItem(storageKey(toolId));
        return null;
      }
      return data;
    } catch (err) {
      return null;
    }
  }

  function saveGrant(toolId, email, expiresAt, grantType) {
    try {
      localStorage.setItem(
        storageKey(toolId),
        JSON.stringify({
          toolId: toolId,
          email: normalizeEmail(email),
          expiresAt: expiresAt,
          grantType: grantType || '',
          savedAt: new Date().toISOString(),
        })
      );
    } catch (err) {}
  }

  function clearGrant(toolId) {
    try {
      localStorage.removeItem(storageKey(toolId));
    } catch (err) {}
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

  function redirectToHub() {
    global.location.replace(resolveHubUrl());
  }

  function getToolLabel(toolId) {
    var tools = cfg('betaTools', {});
    return (tools[toolId] && tools[toolId].label) || toolId;
  }

  function ensureGate() {
    var gate = document.getElementById('betaAccessGate');
    if (gate) return gate;
    gate = document.createElement('div');
    gate.id = 'betaAccessGate';
    gate.className = 'beta-access-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.innerHTML =
      '<div class="beta-access-gate__panel card">' +
      '<span class="beta-access-gate__badge">BETA</span>' +
      '<h2 class="beta-access-gate__title" id="betaAccessTitle">Request BETA access</h2>' +
      '<p class="beta-access-gate__lead" id="betaAccessLead"></p>' +
      '<p class="beta-access-gate__email" id="betaAccessEmail" hidden></p>' +
      '<p class="beta-access-gate__status" id="betaAccessStatus" hidden></p>' +
      '<p class="beta-access-gate__error" id="betaAccessError" hidden role="alert"></p>' +
      '<div class="beta-access-gate__actions">' +
      '<button type="button" class="btn-primary" id="betaAccessSubmit">Request BETA access</button>' +
      '<button type="button" class="btn-secondary" id="betaAccessCheck" hidden>Check approval status</button>' +
      '</div>' +
      '<p style="margin-top:14px"><a class="tc-back-link" id="betaAccessBack" href="#">← Back to Groundworks</a></p>' +
      '</div>';
    document.body.appendChild(gate);

    document.getElementById('betaAccessSubmit').addEventListener('click', onRequest);
    document.getElementById('betaAccessCheck').addEventListener('click', onCheckStatus);
    document.getElementById('betaAccessBack').addEventListener('click', function (e) {
      e.preventDefault();
      var back = document.querySelector('.tc-back-link');
      if (back && back.href) global.location.href = back.href;
      else global.location.href = '../index.html';
    });
    return gate;
  }

  function showError(msg) {
    var el = document.getElementById('betaAccessError');
    if (!el) return;
    el.textContent = msg || '';
    el.hidden = !msg;
  }

  function showStatus(msg) {
    var el = document.getElementById('betaAccessStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.hidden = !msg;
  }

  function lockGate() {
    document.body.classList.add('beta-access-locked');
    var gate = ensureGate();
    gate.hidden = false;
  }

  function unlockGate() {
    document.body.classList.remove('beta-access-locked');
    var gate = document.getElementById('betaAccessGate');
    if (gate) gate.hidden = true;
    showError('');
    if (global.WorkspaceApi && typeof global.WorkspaceApi.initPageTelemetry === 'function') {
      global.WorkspaceApi.initPageTelemetry();
    }
    document.dispatchEvent(new CustomEvent('tta:beta-access-ready', { detail: { toolId: getToolId() } }));
  }

  function applyApproved(toolId, email, result) {
    if (!result || result.status !== 'approved' || !result.expiresAt) return false;
    saveGrant(toolId, email, result.expiresAt, result.grantType);
    unlockGate();
    if (global.WorkspaceApi && typeof global.WorkspaceApi.logEvent === 'function') {
      global.WorkspaceApi.logEvent('beta_access_granted', { detail: toolId, email: email });
    }
    return true;
  }

  function showDenied(toolId, email, message) {
    lockGate();
    var label = getToolLabel(toolId);
    document.getElementById('betaAccessTitle').textContent = 'BETA access not approved';
    document.getElementById('betaAccessLead').textContent =
      message ||
      'Your request for ' + label + ' was not approved. Contact the app administrator if you believe this is an error.';
    var emailEl = document.getElementById('betaAccessEmail');
    emailEl.textContent = email;
    emailEl.hidden = false;
    document.getElementById('betaAccessSubmit').hidden = true;
    document.getElementById('betaAccessCheck').hidden = true;
    showStatus('');
    showError('');
  }

  function showPending(toolId, email) {
    lockGate();
    showError('');
    var label = getToolLabel(toolId);
    document.getElementById('betaAccessTitle').textContent = 'BETA access pending';
    document.getElementById('betaAccessLead').textContent =
      'Your request to use ' + label + ' is waiting for approval. You will be notified by email when access is granted.';
    var emailEl = document.getElementById('betaAccessEmail');
    emailEl.textContent = email;
    emailEl.hidden = false;
    document.getElementById('betaAccessSubmit').hidden = true;
    document.getElementById('betaAccessCheck').hidden = false;
    showStatus('Check back here after you receive approval, or tap “Check approval status”.');
  }

  function showRequest(toolId, email) {
    lockGate();
    var label = getToolLabel(toolId);
    document.getElementById('betaAccessTitle').textContent = 'Request BETA access';
    document.getElementById('betaAccessLead').textContent =
      label +
      ' is in active development. Request BETA access to try it — Trimble personnel are approved automatically; other users require admin approval.';
    var emailEl = document.getElementById('betaAccessEmail');
    emailEl.textContent = 'Signed in as: ' + email;
    emailEl.hidden = false;
    document.getElementById('betaAccessSubmit').hidden = false;
    document.getElementById('betaAccessSubmit').textContent = isTrimbleEmail(email)
      ? 'Continue to BETA tool'
      : 'Request BETA access';
    document.getElementById('betaAccessCheck').hidden = true;
    showStatus('');
  }

  function onRequest() {
    var toolId = getToolId();
    var email = global.AppAccess && global.AppAccess.getEmail ? global.AppAccess.getEmail() : '';
    email = normalizeEmail(email);
    if (!email) {
      showError('Sign in to the Technician Assistant first, then return to this tool.');
      return;
    }
    if (!global.WorkspaceApi || typeof global.WorkspaceApi.startBetaAccess !== 'function') {
      showError('BETA access service is not configured.');
      return;
    }
    showError('');
    var btn = document.getElementById('betaAccessSubmit');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Please wait…';
    }
    global.WorkspaceApi.startBetaAccess(toolId, email)
      .then(function (result) {
        if (applyApproved(toolId, email, result)) return;
        if (result && result.status === 'pending') {
          if (global.WorkspaceApi.logEvent) {
            global.WorkspaceApi.logEvent('beta_access_requested', { detail: toolId, email: email });
          }
          showPending(toolId, email);
          return;
        }
        if (result && result.status === 'denied') {
          showDenied(toolId, email);
          return;
        }
        showError((result && result.error) || 'Could not submit BETA access request.');
        showRequest(toolId, email);
      })
      .finally(function () {
        if (btn) {
          btn.disabled = false;
          btn.textContent = isTrimbleEmail(email) ? 'Continue to BETA tool' : 'Request BETA access';
        }
      });
  }

  function onCheckStatus() {
    var toolId = getToolId();
    var email = global.AppAccess && global.AppAccess.getEmail ? normalizeEmail(global.AppAccess.getEmail()) : '';
    if (!email || !global.WorkspaceApi || typeof global.WorkspaceApi.checkBetaAccess !== 'function') return;
    showError('');
    global.WorkspaceApi.checkBetaAccess(toolId, email, { revalidate: true }).then(function (result) {
      if (applyApproved(toolId, email, result)) return;
      if (result && result.status === 'pending') {
        showPending(toolId, email);
        return;
      }
      if (result && result.status === 'denied') {
        showDenied(toolId, email);
        return;
      }
      showStatus('No approval yet. You will receive an email when access is granted.');
    });
  }

  function bootstrap(toolId) {
    if (!toolId) return;

    function run(email) {
      email = normalizeEmail(email);
      if (!email) {
        redirectToHub();
        return;
      }

      var stored = readGrant(toolId);
      if (stored && stored.email === email) {
        unlockGate();
        return;
      }
      if (stored && stored.email !== email) {
        clearGrant(toolId);
      }

      if (!global.WorkspaceApi || typeof global.WorkspaceApi.checkBetaAccess !== 'function') {
        if (isTrimbleEmail(email)) {
          unlockGate();
          return;
        }
        showRequest(toolId, email);
        return;
      }

      global.WorkspaceApi.checkBetaAccess(toolId, email, { revalidate: true }).then(function (result) {
        if (applyApproved(toolId, email, result)) return;
        if (result && result.status === 'pending') {
          showPending(toolId, email);
          return;
        }
        if (result && result.status === 'denied') {
          showDenied(toolId, email);
          return;
        }
        if (isTrimbleEmail(email)) {
          onRequest();
          return;
        }
        showRequest(toolId, email);
      });
    }

    if (global.AppAccess && typeof global.AppAccess.whenReady === 'function') {
      global.AppAccess.whenReady().then(function () {
        if (!global.AppAccess.isAuthorized()) {
          redirectToHub();
          return;
        }
        run(global.AppAccess.getEmail());
      });
    } else {
      run('');
    }
  }

  global.BetaAccess = {
    bootstrap: bootstrap,
    isTrimbleEmail: isTrimbleEmail,
    hasGrant: function (toolId) {
      return !!readGrant(toolId || getToolId());
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bootstrap(getToolId());
    });
  } else {
    bootstrap(getToolId());
  }
})(window);
