/**
 * Hub developer feedback — modal form with Apps Script email or mailto fallback.
 */
(function () {
  'use strict';

  var config = window.FEEDBACK_CONFIG || {};
  var modal;
  var form;
  var errorEl;
  var successEl;
  var submitBtn;
  var submitFrame;

  function cfg(key, fallback) {
    return config[key] != null && config[key] !== '' ? config[key] : fallback;
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
    return {
      type: formData.get('type') || 'Enhancement request',
      topic: formData.get('topic') || '',
      name: (formData.get('name') || '').trim(),
      email: (formData.get('email') || '').trim(),
      message: (formData.get('message') || '').trim(),
      page: window.location.href,
      userAgent: navigator.userAgent,
    };
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
    if (endpoint) {
      submitViaEndpoint(payload).catch(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send feedback';
        }
        showError(
          'Could not reach the feedback service. Opening your email app instead…'
        );
        setTimeout(function () {
          submitViaMailto(payload);
        }, 600);
      });
    } else {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send feedback';
      }
      submitViaMailto(payload);
    }
  }

  function bindModal() {
    modal = document.getElementById('feedbackModal');
    form = document.getElementById('feedbackForm');
    errorEl = document.getElementById('feedbackError');
    successEl = document.getElementById('feedbackSuccess');
    submitBtn = document.getElementById('feedbackSubmit');
    if (!modal || !form) return;

    document.getElementById('feedbackOpenBtn')?.addEventListener('click', openModal);
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
