/**
 * Optional “Send copy to Trimble” checkbox on PDF export sections + upload helper.
 */
(function () {
  'use strict';

  function isUploadEnabled() {
    var c = window.WORKSPACE_CONFIG || {};
    return c.driveUploadEnabled !== false && window.WorkspaceApi && window.WorkspaceApi.isEnabled();
  }

  function injectCheckboxes() {
    if (!isUploadEnabled()) return;
    document.querySelectorAll('[data-report-upload]').forEach(function (host) {
      if (host.querySelector('.tta-upload-opt')) return;
      var reportType = host.getAttribute('data-report-upload') || 'report';
      var wrap = document.createElement('div');
      wrap.className = 'tta-upload-opt-wrap';
      wrap.innerHTML =
        '<label class="tta-upload-opt">' +
        '<input type="checkbox" class="tta-upload-opt__input" data-report-type="' +
        reportType +
        '" />' +
        '<span class="tta-upload-opt__text">' +
        '<strong>Send optional copy to Trimble</strong> — archives report content in a shared Drive folder for training and QA. ' +
        'May include customer or job data; only check if appropriate for your site.</span>' +
        '</label>' +
        '<p class="tta-upload-opt__status note" hidden role="status"></p>';
      host.appendChild(wrap);
    });
  }

  function findOptInCheckbox(reportType) {
    var inputs = document.querySelectorAll('.tta-upload-opt__input');
    var i;
    for (i = 0; i < inputs.length; i++) {
      if (!reportType || inputs[i].getAttribute('data-report-type') === reportType) {
        return inputs[i];
      }
    }
    return null;
  }

  function setStatus(message, reportType) {
    var cb = findOptInCheckbox(reportType);
    if (!cb) return;
    var status = cb.closest('.tta-upload-opt-wrap')?.querySelector('.tta-upload-opt__status');
    if (!status) return;
    status.textContent = message || '';
    status.hidden = !message;
  }

  function afterPdfExport(options) {
    options = options || {};
    var api = window.WorkspaceApi;
    if (!api) return;

    api.logEvent('pdf_exported', {
      detail: options.reportType || 'report',
      dealer: options.dealer || options.dealerName || '',
      email: options.email || '',
    });

    if (options.dealer || options.dealerName) {
      api.logEvent('pdf_export_with_dealer', { detail: options.dealer || options.dealerName });
    }

    if (!isUploadEnabled()) return;
    var cb = findOptInCheckbox(options.reportType);
    if (!cb || !cb.checked) return;
    if (!options.html) return;

    setStatus('Uploading copy to Trimble…', options.reportType);
    api
      .uploadReport({
        reportType: options.reportType,
        fileName: options.fileName || 'report',
        mimeType: 'text/html',
        fileBase64: api.utf8ToBase64(options.html),
        technician: options.technician || options.techName || '',
        machineModel: options.machineModel || '',
        serialNumber: options.serialNumber || '',
        reportName: options.reportName || '',
        dealer: options.dealer || options.dealerName || '',
      })
      .then(function () {
        setStatus('Copy sent to Trimble shared archive.', options.reportType);
      })
      .catch(function () {
        setStatus('Could not upload copy — PDF on this device is still available.', options.reportType);
      });
  }

  window.ReportUpload = {
    injectCheckboxes: injectCheckboxes,
    afterPdfExport: afterPdfExport,
    isUploadEnabled: isUploadEnabled,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCheckboxes);
  } else {
    injectCheckboxes();
  }
})();
