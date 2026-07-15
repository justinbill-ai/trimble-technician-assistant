/**
 * Developer feedback — hub tile, sub-tool footer link, Apps Script or mailto fallback.
 */
(function () {
  'use strict';

  var modal;
  var form;
  var errorEl;
  var successEl;
  var submitBtn;
  var submitFrame;
  var bound;

  function cfg(key, fallback) {
    var c = window.WORKSPACE_CONFIG || window.FEEDBACK_CONFIG || {};
    return c[key] != null && c[key] !== '' ? c[key] : fallback;
  }

  function injectFeedbackModal() {
    if (document.getElementById('feedbackModal')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="feedback-modal" id="feedbackModal" hidden aria-hidden="true">' +
      '<button type="button" class="feedback-modal__backdrop" id="feedbackModalBackdrop" aria-label="Close"></button>' +
      '<div class="feedback-modal__panel card" role="dialog" aria-modal="true" aria-labelledby="feedbackModalTitle">' +
      '<div class="feedback-modal__head">' +
      '<h2 id="feedbackModalTitle" class="feedback-modal__title">Developer feedback</h2>' +
      '<button type="button" class="btn-icon" id="feedbackModalClose" aria-label="Close">✕</button>' +
      '</div>' +
      '<p class="feedback-modal__lead">Share enhancement ideas, report issues, or ask for help. Your message includes the current page URL.</p>' +
      '<form id="feedbackForm" class="feedback-modal__form" novalidate>' +
      '<label class="feedback-modal__label" for="feedbackType">Type</label>' +
      '<select class="feedback-modal__input" id="feedbackType" name="type" required>' +
      '<option value="Enhancement request">Enhancement request</option>' +
      '<option value="Bug report">Bug report</option>' +
      '<option value="Question">Question</option>' +
      '</select>' +
      '<label class="feedback-modal__label" for="feedbackTopic">Topic (optional)</label>' +
      '<input class="feedback-modal__input" id="feedbackTopic" name="topic" type="text" maxlength="120" placeholder="e.g. PD25 calculator, hub navigation" />' +
      '<label class="feedback-modal__label" for="feedbackName">Your name (optional)</label>' +
      '<input class="feedback-modal__input" id="feedbackName" name="name" type="text" autocomplete="name" maxlength="80" />' +
      '<label class="feedback-modal__label" for="feedbackEmail">Your email (optional)</label>' +
      '<input class="feedback-modal__input" id="feedbackEmail" name="email" type="email" autocomplete="email" maxlength="120" />' +
      '<label class="feedback-modal__label" for="feedbackMessage">Message</label>' +
      '<textarea class="feedback-modal__input feedback-modal__textarea" id="feedbackMessage" name="message" rows="5" required placeholder="Describe what you would like improved, what happened, or what you need help with…"></textarea>' +
      '<p class="feedback-modal__error" id="feedbackError" hidden role="alert"></p>' +
      '<p class="feedback-modal__success" id="feedbackSuccess" hidden role="status"></p>' +
      '<div class="feedback-modal__actions">' +
      '<button type="button" class="btn-secondary" id="feedbackModalCancel">Cancel</button>' +
      '<button type="submit" class="btn-primary" id="feedbackSubmit">Send feedback</button>' +
      '</div>' +
      '</form>' +
      '<p class="feedback-modal__note note">Submissions include the current page URL to help with troubleshooting.</p>' +
      '</div>' +
      '</div>';
    document.body.appendChild(wrap.firstChild);
  }

  function injectFooterLink() {
    var footer = document.querySelector('.tc-footer');
    if (!footer || footer.querySelector('[data-open-feedback]')) return;
    if (document.getElementById('feedbackOpenBtn')) return;
    var sep = document.createTextNode(' · ');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tc-footer__feedback';
    btn.setAttribute('data-open-feedback', '');
    btn.textContent = 'Send feedback';
    footer.appendChild(sep);
    footer.appendChild(btn);
  }

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('feedback-modal-open');
    if (form) {
      form.reset();
      form.hidden = false;
    }
    if (errorEl) errorEl.hidden = true;
    if (successEl) successEl.hidden = true;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send feedback';
    }
    var first = document.getElementById('feedbackType');
    if (first) first.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('feedback-modal-open');
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = !message;
    if (successEl) successEl.hidden = true;
  }

  function showSuccess(message) {
    if (!successEl) return;
    successEl.textContent = message;
    successEl.hidden = !message;
    if (errorEl) errorEl.hidden = true;
    if (form) form.hidden = true;
  }

  function buildPayload(formData) {
    var base = window.WorkspaceApi ? window.WorkspaceApi.baseContext() : {};
    return Object.assign(base, {
      action: 'feedback',
      type: formData.get('type') || 'Enhancement request',
      topic: formData.get('topic') || '',
      name: (formData.get('name') || '').trim(),
      email: (formData.get('email') || '').trim(),
      message: (formData.get('message') || '').trim(),
      page: window.location.href,
      userAgent: navigator.userAgent,
    });
  }

  function ensureSubmitFrame() {
    if (submitFrame && submitFrame.parentNode) return submitFrame;
    submitFrame = document.createElement('iframe');
    submitFrame.name = 'feedbackSubmitFrame';
    submitFrame.id = 'feedbackSubmitFrame';
    submitFrame.hidden = true;
    submitFrame.setAttribute('aria-hidden', 'true');
    submitFrame.setAttribute('tabindex', '-1');
    document.body.appendChild(submitFrame);
    return submitFrame;
  }

  function submitViaMailto(payload) {
    var recipient = cfg('recipientEmail', '');
    if (!recipient) {
      showError('Feedback email is not configured yet. Contact your administrator.');
      return;
    }
    var subject = encodeURIComponent(
      '[' + cfg('appName', 'Technician Assistant') + '] ' + payload.type +
        (payload.topic ? ' — ' + payload.topic : '')
    );
    var body = encodeURIComponent(
      'Type: ' + payload.type + '\n' +
        'Name: ' + (payload.name || 'Not provided') + '\n' +
        'Email: ' + (payload.email || 'Not provided') + '\n' +
        'Page: ' + payload.page + '\n\n' +
        payload.message
    );
    window.location.href = 'mailto:' + recipient + '?subject=' + subject + '&body=' + body;
    showSuccess(
      'Your email app should open with the message ready to send. Tap Send to deliver it to the developer.'
    );
    if (submitBtn) submitBtn.disabled = true;
  }

  /**
   * POST via hidden form + iframe — avoids browser CORS blocks on Apps Script fetch().
   */
  function submitViaEndpoint(payload) {
    var endpoint = cfg('endpoint', '');
    ensureSubmitFrame();

    return new Promise(function (resolve, reject) {
      var hiddenForm = document.createElement('form');
      hiddenForm.method = 'POST';
      hiddenForm.action = endpoint;
      hiddenForm.target = 'feedbackSubmitFrame';
      hiddenForm.acceptCharset = 'UTF-8';
      hiddenForm.style.display = 'none';

      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'payload';
      input.value = JSON.stringify(payload);
      hiddenForm.appendChild(input);

      var settled = false;
      function finish(ok) {
        if (settled) return;
        settled = true;
        hiddenForm.remove();
        if (ok) resolve();
        else reject(new Error('Submission failed'));
      }

      submitFrame.onload = function () {
        finish(true);
      };

      document.body.appendChild(hiddenForm);
      hiddenForm.submit();

      // Cross-origin iframe may not fire onload — assume success after brief delay.
      setTimeout(function () {
        finish(true);
      }, 1800);
    }).then(function () {
      showSuccess('Thanks — your feedback was sent to the developer.');
      if (submitBtn) submitBtn.disabled = true;
    });
  }

  function onSubmit(e) {
    e.preventDefault();
    showError('');
    var formData = new FormData(form);
    var payload = buildPayload(formData);
    if (!payload.message) {
      showError('Please describe your enhancement request or issue.');
      document.getElementById('feedbackMessage')?.focus();
      return;
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }
    var endpoint = cfg('endpoint', '');
    if (endpoint && window.WorkspaceApi) {
      window.WorkspaceApi.submitFeedback(payload).then(function () {
        showSuccess('Thanks — your feedback was sent to the developer.');
        if (submitBtn) submitBtn.disabled = true;
      }).catch(function () {
        fallbackMailto();
      });
    } else if (endpoint) {
      submitViaEndpoint(payload).catch(function () {
        fallbackMailto();
      });
    } else {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send feedback';
      }
      submitViaMailto(payload);
    }

    function fallbackMailto() {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send feedback';
      }
      showError('Could not reach the feedback service. Opening your email app instead…');
      setTimeout(function () {
        submitViaMailto(payload);
      }, 600);
    }
  }

  function bindModal() {
    if (bound) return;
    injectFeedbackModal();
    injectFooterLink();

    modal = document.getElementById('feedbackModal');
    form = document.getElementById('feedbackForm');
    errorEl = document.getElementById('feedbackError');
    successEl = document.getElementById('feedbackSuccess');
    submitBtn = document.getElementById('feedbackSubmit');
    if (!modal || !form) return;

    bound = true;
    document.querySelectorAll('[data-open-feedback], #feedbackOpenBtn').forEach(function (btn) {
      btn.addEventListener('click', openModal);
    });
    document.getElementById('feedbackModalClose')?.addEventListener('click', closeModal);
    document.getElementById('feedbackModalBackdrop')?.addEventListener('click', closeModal);
    document.getElementById('feedbackModalCancel')?.addEventListener('click', closeModal);
    form.addEventListener('submit', onSubmit);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindModal);
  } else {
    bindModal();
  }
})();
