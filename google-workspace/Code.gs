/**
 * Trimble Technician Assistant — Google Workspace backend
 *
 * Copy this entire file into a Google Apps Script project bound to a Google Sheet
 * (Extensions → Apps Script), or a standalone script with SPREADSHEET_ID set below.
 *
 * See DEPLOY.md for setup steps.
 */

var CONFIG = {
  /** Technician Assistant — Analytics */
  SPREADSHEET_ID: '1io6EBhpC1LKELjhjLOtH9w6jn9ZMiwx7sEcosr3Snm4',
  /** Technician Assistant — Report Archive */
  DRIVE_FOLDER_ID: '1oZK53RQj23uuQ9naORlZiCiwTBiL63Fw',
  RECIPIENT_EMAIL: 'justin_bill@trimble.com',
  /** Public app URL — used in approval emails */
  APP_URL: 'https://justinbill-ai.github.io/trimble-technician-assistant/',
  /** Days before approved users must request access again */
  ACCESS_GRANT_DAYS: 28,
  /** Comma-separated domains that auto-approve (no manual review) */
  AUTO_APPROVE_DOMAINS: 'trimble.com',
};

function parsePayload(e) {
  if (e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  return e.parameter || {};
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getSpreadsheet() {
  if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID.indexOf('PASTE_') === 0) {
    throw new Error('Set CONFIG.SPREADSHEET_ID in Apps Script.');
  }
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

var SHEET_HEADERS = {
  Events: [
    'timestamp',
    'event',
    'tool',
    'page',
    'appVersion',
    'dealer',
    'email',
    'detail',
    'userAgent',
    'deviceType',
  ],
  Feedback: [
    'timestamp',
    'type',
    'topic',
    'name',
    'email',
    'tool',
    'page',
    'message',
    'appVersion',
    'userAgent',
    'deviceType',
  ],
  Uploads: [
    'timestamp',
    'reportType',
    'fileName',
    'dealer',
    'technician',
    'machineModel',
    'serialNumber',
    'reportName',
    'tool',
    'page',
    'appVersion',
    'driveFileId',
    'driveFileUrl',
  ],
  AccessRequests: [
    'timestamp',
    'email',
    'status',
    'token',
    'requestedAt',
    'resolvedAt',
    'resolvedBy',
    'userAgent',
    'deviceType',
    'page',
  ],
  ApprovedUsers: [
    'email',
    'grantedAt',
    'expiresAt',
    'grantType',
    'approvedBy',
    'lastCheckAt',
  ],
};

function ensureSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function clearSheetBanding(sheet) {
  var bandings = sheet.getBandings();
  var i;
  for (i = 0; i < bandings.length; i++) {
    bandings[i].remove();
  }
}

function formatDataSheet(sheet, colCount) {
  if (!sheet) {
    throw new Error('formatDataSheet requires a sheet. Run setupSheets instead of formatDataSheet.');
  }
  if (!colCount || colCount < 1) {
    throw new Error('formatDataSheet requires a column count.');
  }
  var header = sheet.getRange(1, 1, 1, colCount);
  header
    .setBackground('#005f9e')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontSize(10)
    .setVerticalAlignment('middle');
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, sheet.getMaxRows(), colCount).setWrap(false);
  sheet.setRowHeight(1, 32);

  var widths = {
    1: 165,
    2: 140,
    3: 120,
    4: 220,
    5: 95,
    6: 110,
    7: 180,
    8: 200,
    9: 280,
    10: 90,
    11: 90,
    12: 200,
    13: 220,
  };
  var c;
  for (c = 1; c <= colCount; c++) {
    sheet.setColumnWidth(c, widths[c] || 120);
  }

  if (sheet.getLastRow() > 1) {
    clearSheetBanding(sheet);
    sheet
      .getRange(2, 1, sheet.getLastRow(), colCount)
      .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
  }
}

function setupReadmeSheet(ss) {
  var name = 'README';
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name, 0);
  } else {
    sheet.clear();
  }

  sheet.getRange('A1').setValue('Technician Assistant — Analytics').setFontSize(16).setFontWeight('bold');
  sheet.getRange('A2').setValue('Usage events, feedback, and optional report uploads from the field app.');
  sheet.getRange('A4').setValue('Tabs').setFontWeight('bold').setFontColor('#005f9e');
  sheet.getRange('A5:D5').setValues([
    ['Tab', 'Purpose', 'Key columns', 'Looker Studio tip'],
  ]);
  sheet.getRange('A6:D10').setValues([
    ['Events', 'Adoption & funnel', 'event, tool, deviceType', 'Chart event counts by week'],
    ['Feedback', 'Friction & bugs', 'type, topic, page, message', 'Filter by tool and type'],
    ['Uploads', 'Opt-in reports', 'reportType, dealer, driveFileUrl', 'Count exports by dealer'],
    ['AccessRequests', 'App access queue', 'email, status, token', 'Filter status = pending'],
    ['ApprovedUsers', 'Active access grants', 'email, expiresAt, grantType', 'Filter expiresAt > today'],
  ]);

  sheet.getRange('A10').setValue('Common events').setFontWeight('bold').setFontColor('#005f9e');
  sheet.getRange('A11:B31').setValues([
    ['hub_open', 'User opened the hub'],
    ['category_open', 'User opened a hub category'],
    ['tool_open', 'User opened a tool page'],
    ['access_requested', 'User requested app access (non-Trimble email)'],
    ['access_granted', 'Access approved (auto @trimble.com or manual grant)'],
    ['access_denied', 'Access request denied'],
    ['calc_run', 'User ran CTL or PD25 measure-up calculator'],
    ['csv_uploaded', 'Survey CSV uploaded'],
    ['csv_analyzed:ok', 'Calculator succeeded'],
    ['csv_analyzed:fail', 'Calculator failed (see detail column)'],
    ['csv_analyzed:missing', 'Required survey point missing from CSV'],
    ['calc_warnings', 'PD25 calculator warnings after run'],
    ['calc_options', 'PD25 calculator options snapshot'],
    ['pdf_exported', 'User generated a PDF'],
    ['pdf_export_with_dealer', 'PDF export included dealer name on upload'],
    ['guide_phase_complete', 'PD25 workflow phase finished'],
    ['guide_section_view', 'Bench crane segment opened'],
    ['guide_section_complete', 'Bench crane segment marked complete'],
    ['prestart_complete', 'Excavator prestart checklist finished'],
    ['symptom_analyzed', 'Excavator symptom search run'],
    ['wiring_pdf_open', 'Groundworks wiring reference PDF opened'],
  ]);

  sheet.getRange('A1:D31').setWrap(true).setVerticalAlignment('top');
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 220);
  sheet.setColumnWidth(4, 240);
  sheet.getRange('A5:D5')
    .setBackground('#005f9e')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  clearSheetBanding(sheet);
  sheet.getRange('A6:D10').applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
  sheet.setFrozenRows(5);
}

function removeDefaultSheet(ss) {
  var sheet = ss.getSheetByName('Sheet1');
  if (sheet && ss.getSheets().length > 1) {
    ss.deleteSheet(sheet);
  }
}

function reorderSheets(ss, namesInOrder) {
  var i;
  for (i = 0; i < namesInOrder.length; i++) {
    var sheet = ss.getSheetByName(namesInOrder[i]);
    if (sheet) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(i + 1);
    }
  }
}

function appendEvent(data) {
  var ss = getSpreadsheet();
  var headers = SHEET_HEADERS.Events;
  var sheet = ensureSheet(ss, 'Events', headers);
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.event || '',
    data.tool || '',
    data.page || '',
    data.appVersion || '',
    data.dealer || '',
    data.email || '',
    data.detail || '',
    data.userAgent || '',
    data.deviceType || '',
  ]);
}

function appendFeedback(data) {
  var ss = getSpreadsheet();
  var headers = SHEET_HEADERS.Feedback;
  var sheet = ensureSheet(ss, 'Feedback', headers);
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.type || '',
    data.topic || '',
    data.name || '',
    data.email || '',
    data.tool || '',
    data.page || '',
    data.message || '',
    data.appVersion || '',
    data.userAgent || '',
    data.deviceType || '',
  ]);
}

function appendUpload(data, fileId, fileUrl) {
  var ss = getSpreadsheet();
  var headers = SHEET_HEADERS.Uploads;
  var sheet = ensureSheet(ss, 'Uploads', headers);
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.reportType || '',
    data.fileName || '',
    data.dealer || '',
    data.technician || '',
    data.machineModel || '',
    data.serialNumber || '',
    data.reportName || '',
    data.tool || '',
    data.page || '',
    data.appVersion || '',
    fileId || '',
    fileUrl || '',
  ]);
}

function sendFeedbackEmail(data) {
  var recipient = CONFIG.RECIPIENT_EMAIL;
  var subject =
    '[Tech Assistant] ' +
    (data.type || 'Feedback') +
    (data.topic ? ' — ' + data.topic : '');
  var body =
    'Type: ' +
    (data.type || '') +
    '\nTool: ' +
    (data.tool || '') +
    '\nApp version: ' +
    (data.appVersion || '') +
    '\nFrom: ' +
    (data.name || 'Anonymous') +
    (data.email ? ' <' + data.email + '>' : '') +
    '\nPage: ' +
    (data.page || '') +
    '\nDevice: ' +
    (data.deviceType || '') +
    ' / ' +
    (data.userAgent || '') +
    '\n\n' +
    (data.message || '');
  var options = {};
  if (data.email) options.replyTo = data.email;
  MailApp.sendEmail(recipient, subject, body, options);
}

function saveReportToDrive(data) {
  if (!CONFIG.DRIVE_FOLDER_ID || CONFIG.DRIVE_FOLDER_ID.indexOf('PASTE_') === 0) {
    throw new Error('Set CONFIG.DRIVE_FOLDER_ID in Apps Script.');
  }
  if (!data.fileBase64) {
    throw new Error('Missing fileBase64.');
  }
  var folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  var mime = data.mimeType || 'text/html';
  var ext = mime.indexOf('html') >= 0 ? '.html' : '';
  var baseName = (data.fileName || 'report').replace(/[\\/:*?"<>|]+/g, '_');
  var name = baseName.indexOf('.') === -1 ? baseName + ext : baseName;
  var bytes = Utilities.base64Decode(data.fileBase64);
  var blob = Utilities.newBlob(bytes, mime, name);
  var file = folder.createFile(blob);
  return { id: file.getId(), url: file.getUrl() };
}

function normalizeAccessEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

function isValidAccessEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAccessEmailDomain(email) {
  var parts = normalizeAccessEmail(email).split('@');
  return parts.length === 2 ? parts[1] : '';
}

function getAutoApproveDomains() {
  return String(CONFIG.AUTO_APPROVE_DOMAINS || 'trimble.com')
    .split(',')
    .map(function (part) {
      return part.trim().toLowerCase();
    })
    .filter(Boolean);
}

function isAutoApproveEmail(email) {
  var domain = getAccessEmailDomain(email);
  return getAutoApproveDomains().indexOf(domain) !== -1;
}

function getAccessGrantDays() {
  var days = Number(CONFIG.ACCESS_GRANT_DAYS);
  return days > 0 ? days : 28;
}

function getAccessGrantMs() {
  return getAccessGrantDays() * 24 * 60 * 60 * 1000;
}

function getWebAppUrl() {
  try {
    return ScriptApp.getService().getUrl();
  } catch (err) {
    return '';
  }
}

function getAppUrl() {
  var url = String(CONFIG.APP_URL || '').trim();
  if (!url) return getWebAppUrl();
  return url.charAt(url.length - 1) === '/' ? url : url + '/';
}

function accessIsoDate(ms) {
  return new Date(ms).toISOString();
}

function findApprovedUserRow(sheet, email) {
  var normalized = normalizeAccessEmail(email);
  var values = sheet.getDataRange().getValues();
  var i;
  for (i = 1; i < values.length; i++) {
    if (normalizeAccessEmail(values[i][0]) === normalized) {
      return { row: i + 1, values: values[i] };
    }
  }
  return null;
}

function findLatestAccessRequestRow(sheet, email) {
  var normalized = normalizeAccessEmail(email);
  var values = sheet.getDataRange().getValues();
  var i;
  var latest = null;
  for (i = 1; i < values.length; i++) {
    if (normalizeAccessEmail(values[i][1]) === normalized) {
      latest = { row: i + 1, values: values[i] };
    }
  }
  return latest;
}

function upsertApprovedUser(email, grantType, approvedBy) {
  var ss = getSpreadsheet();
  var sheet = ensureSheet(ss, 'ApprovedUsers', SHEET_HEADERS.ApprovedUsers);
  var now = Date.now();
  var expiresAt = now + getAccessGrantMs();
  var existing = findApprovedUserRow(sheet, email);
  var rowValues = [
    normalizeAccessEmail(email),
    accessIsoDate(now),
    accessIsoDate(expiresAt),
    grantType || 'manual',
    approvedBy || '',
    accessIsoDate(now),
  ];
  if (existing) {
    sheet.getRange(existing.row, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return {
    email: normalizeAccessEmail(email),
    status: 'approved',
    grantType: grantType || 'manual',
    grantedAt: accessIsoDate(now),
    expiresAt: accessIsoDate(expiresAt),
  };
}

function readApprovedAccess(email) {
  var ss = getSpreadsheet();
  var sheet = ensureSheet(ss, 'ApprovedUsers', SHEET_HEADERS.ApprovedUsers);
  var existing = findApprovedUserRow(sheet, email);
  if (!existing) return null;
  var expiresAt = new Date(existing.values[2]).getTime();
  if (!expiresAt || isNaN(expiresAt)) return null;
  if (Date.now() > expiresAt) {
    return {
      email: normalizeAccessEmail(email),
      status: 'expired',
      expiresAt: accessIsoDate(expiresAt),
      grantType: existing.values[3] || '',
    };
  }
  sheet.getRange(existing.row, 6).setValue(accessIsoDate(Date.now()));
  return {
    email: normalizeAccessEmail(email),
    status: 'approved',
    expiresAt: accessIsoDate(expiresAt),
    grantedAt: existing.values[1] || '',
    grantType: existing.values[3] || '',
  };
}

function createPendingAccessRequest(data) {
  var ss = getSpreadsheet();
  var sheet = ensureSheet(ss, 'AccessRequests', SHEET_HEADERS.AccessRequests);
  var email = normalizeAccessEmail(data.email);
  var latest = findLatestAccessRequestRow(sheet, email);
  if (latest && String(latest.values[2] || '').toLowerCase() === 'pending') {
    return {
      email: email,
      status: 'pending',
      token: latest.values[3] || '',
      duplicate: true,
    };
  }
  var token = Utilities.getUuid();
  var nowIso = accessIsoDate(Date.now());
  sheet.appendRow([
    nowIso,
    email,
    'pending',
    token,
    nowIso,
    '',
    '',
    data.userAgent || '',
    data.deviceType || '',
    data.page || '',
  ]);
  return {
    email: email,
    status: 'pending',
    token: token,
    duplicate: false,
  };
}

function resolveAccessRequest(email, status, resolvedBy, token) {
  var ss = getSpreadsheet();
  var sheet = ensureSheet(ss, 'AccessRequests', SHEET_HEADERS.AccessRequests);
  var latest = findLatestAccessRequestRow(sheet, email);
  if (!latest) return false;
  if (token && String(latest.values[3]) !== String(token)) return false;
  if (String(latest.values[2] || '').toLowerCase() !== 'pending') return false;
  sheet.getRange(latest.row, 3).setValue(status);
  sheet.getRange(latest.row, 6).setValue(accessIsoDate(Date.now()));
  sheet.getRange(latest.row, 7).setValue(resolvedBy || '');
  return true;
}

function sendAccessAdminEmail(email, token) {
  var recipient = CONFIG.RECIPIENT_EMAIL;
  var webAppUrl = getWebAppUrl();
  var approveUrl =
    webAppUrl +
    '?action=access_approve&email=' +
    encodeURIComponent(email) +
    '&token=' +
    encodeURIComponent(token);
  var denyUrl =
    webAppUrl +
    '?action=access_deny&email=' +
    encodeURIComponent(email) +
    '&token=' +
    encodeURIComponent(token);
  var subject = '[Tech Assistant] Access request — ' + email;
  var plain =
    email +
    ' is requesting access to the Technician Assistant.\n\n' +
    'Grant: ' +
    approveUrl +
    '\nDeny: ' +
    denyUrl;
  var html =
    '<p><strong>' +
    email +
    '</strong> is requesting access to the Technician Assistant.</p>' +
    '<p style="margin:24px 0;">' +
    '<a href="' +
    approveUrl +
    '" style="display:inline-block;padding:12px 20px;margin-right:12px;background:#005f9e;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;">Grant permission</a>' +
    '<a href="' +
    denyUrl +
    '" style="display:inline-block;padding:12px 20px;background:#fff;color:#b42318;text-decoration:none;border-radius:6px;border:1px solid #d0d5dd;font-weight:700;">Deny</a>' +
    '</p>' +
    '<p style="color:#666;font-size:13px;">Approved users receive app access for ' +
    getAccessGrantDays() +
    ' days.</p>';
  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: plain,
    htmlBody: html,
    replyTo: email,
  });
}

function sendAccessApprovedUserEmail(email, expiresAt) {
  var appUrl = getAppUrl();
  var subject = 'Technician Assistant — access approved';
  var plain =
    'Your access to the Trimble Technician Assistant has been approved for ' +
    getAccessGrantDays() +
    ' days.\n\n' +
    'Open the app: ' +
    appUrl +
    '\n\n' +
    'Use the same email address (' +
    email +
    ') on this device. If you already have the app open, tap "Check status" or refresh the page.\n\n' +
    'Access expires: ' +
    expiresAt;
  var html =
    '<p>Your access to the <strong>Trimble Technician Assistant</strong> has been approved for <strong>' +
    getAccessGrantDays() +
    ' days</strong>.</p>' +
    '<p style="margin:24px 0;"><a href="' +
    appUrl +
    '" style="display:inline-block;padding:12px 20px;background:#005f9e;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;">Open Technician Assistant</a></p>' +
    '<p>Use the same email address (<strong>' +
    email +
    '</strong>) on this device. If the app is already open, tap <strong>Check status</strong> or refresh the page.</p>' +
    '<p style="color:#666;font-size:13px;">Access expires: ' +
    expiresAt +
    '</p>';
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: plain,
    htmlBody: html,
  });
}

function sendAccessDeniedUserEmail(email) {
  var subject = 'Technician Assistant — access request update';
  var body =
    'Your request to use the Trimble Technician Assistant was not approved at this time.\n\n' +
    'If you believe this is an error, contact your Trimble representative.';
  MailApp.sendEmail(email, subject, body);
}

function logAccessEvent(event, email, detail, data) {
  appendEvent({
    timestamp: new Date().toISOString(),
    event: event,
    tool: (data && data.tool) || 'hub',
    page: (data && data.page) || '',
    appVersion: (data && data.appVersion) || '',
    dealer: (data && data.dealer) || '',
    email: email || '',
    detail: detail || '',
    userAgent: (data && data.userAgent) || '',
    deviceType: (data && data.deviceType) || '',
  });
}

function buildAccessCheckResult(email) {
  var normalized = normalizeAccessEmail(email);
  if (!isValidAccessEmail(normalized)) {
    return { ok: false, status: 'invalid', email: normalized };
  }
  var approved = readApprovedAccess(normalized);
  if (approved && approved.status === 'approved') {
    return { ok: true, status: 'approved', email: normalized, expiresAt: approved.expiresAt, grantType: approved.grantType };
  }
  if (approved && approved.status === 'expired') {
    return { ok: true, status: 'expired', email: normalized, expiresAt: approved.expiresAt };
  }
  var ss = getSpreadsheet();
  var sheet = ensureSheet(ss, 'AccessRequests', SHEET_HEADERS.AccessRequests);
  var latest = findLatestAccessRequestRow(sheet, normalized);
  if (latest) {
    var requestStatus = String(latest.values[2] || '').toLowerCase();
    if (requestStatus === 'pending') {
      return { ok: true, status: 'pending', email: normalized };
    }
    if (requestStatus === 'denied') {
      return { ok: true, status: 'denied', email: normalized };
    }
  }
  return { ok: true, status: 'none', email: normalized };
}

function handleAccessRequest(data) {
  var email = normalizeAccessEmail(data.email);
  if (!isValidAccessEmail(email)) {
    return { ok: false, error: 'Invalid email address.' };
  }
  var existing = readApprovedAccess(email);
  if (existing && existing.status === 'approved') {
    return {
      ok: true,
      status: 'approved',
      email: email,
      expiresAt: existing.expiresAt,
      grantType: existing.grantType,
    };
  }
  if (isAutoApproveEmail(email)) {
    var granted = upsertApprovedUser(email, 'trimble_auto', 'auto');
    logAccessEvent('access_granted', email, 'trimble_auto', data);
    return {
      ok: true,
      status: 'approved',
      email: email,
      expiresAt: granted.expiresAt,
      grantType: granted.grantType,
    };
  }
  var pending = createPendingAccessRequest(data);
  if (!pending.duplicate) {
    sendAccessAdminEmail(email, pending.token);
    logAccessEvent('access_requested', email, 'pending', data);
  } else {
    logAccessEvent('access_requested', email, 'pending_duplicate', data);
  }
  return { ok: true, status: 'pending', email: email };
}

function handleAccessApprove(params) {
  var email = normalizeAccessEmail(params.email);
  var token = String(params.token || '');
  if (!isValidAccessEmail(email) || !token) {
    return htmlAccessPage('Access approval failed', 'Missing email or token.', false);
  }
  if (!resolveAccessRequest(email, 'approved', CONFIG.RECIPIENT_EMAIL, token)) {
    return htmlAccessPage('Access approval failed', 'This request is invalid or already resolved.', false);
  }
  var granted = upsertApprovedUser(email, 'manual', CONFIG.RECIPIENT_EMAIL);
  logAccessEvent('access_granted', email, 'manual', { tool: 'hub', page: getAppUrl() });
  try {
    sendAccessApprovedUserEmail(email, granted.expiresAt);
  } catch (err) {}
  return htmlAccessPage(
    'Access granted',
    'Approved <strong>' +
      email +
      '</strong> for <strong>' +
      getAccessGrantDays() +
      ' days</strong>. The user has been emailed a link to open the app.',
    true
  );
}

function handleAccessDeny(params) {
  var email = normalizeAccessEmail(params.email);
  var token = String(params.token || '');
  if (!isValidAccessEmail(email) || !token) {
    return htmlAccessPage('Access denial failed', 'Missing email or token.', false);
  }
  if (!resolveAccessRequest(email, 'denied', CONFIG.RECIPIENT_EMAIL, token)) {
    return htmlAccessPage('Access denial failed', 'This request is invalid or already resolved.', false);
  }
  logAccessEvent('access_denied', email, 'manual', { tool: 'hub', page: getAppUrl() });
  try {
    sendAccessDeniedUserEmail(email);
  } catch (err) {}
  return htmlAccessPage('Access denied', 'Denied access for <strong>' + email + '</strong>.', true);
}

function htmlAccessPage(title, message, success) {
  var color = success ? '#005f9e' : '#b42318';
  var html =
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' +
    title +
    '</title></head><body style="font-family:Segoe UI,Arial,sans-serif;padding:32px;color:#252a2e;">' +
    '<h1 style="color:' +
    color +
    ';">' +
    title +
    '</h1><p style="font-size:16px;line-height:1.5;">' +
    message +
    '</p></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle(title);
}

function respondJson(obj, callback) {
  var text = JSON.stringify(obj || {});
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + text + ')').setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
  }
  return jsonResponse(obj);
}

function doPost(e) {
  try {
    var data = parsePayload(e);
    var action = String(data.action || 'feedback').toLowerCase();

    if (action === 'event') {
      appendEvent(data);
      return jsonResponse({ ok: true });
    }

    if (action === 'feedback') {
      sendFeedbackEmail(data);
      appendFeedback(data);
      return jsonResponse({ ok: true });
    }

    if (action === 'upload') {
      var saved = saveReportToDrive(data);
      appendUpload(data, saved.id, saved.url);
      return jsonResponse({ ok: true, fileId: saved.id, fileUrl: saved.url });
    }

    if (action === 'access_request') {
      return jsonResponse(handleAccessRequest(data));
    }

    return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};
  var action = String(params.action || '').toLowerCase();
  var callback = params.callback || '';

  if (action === 'access_check') {
    return respondJson(buildAccessCheckResult(params.email), callback);
  }

  if (action === 'access_approve') {
    return handleAccessApprove(params);
  }

  if (action === 'access_deny') {
    return handleAccessDeny(params);
  }

  if (callback) {
    return respondJson({ ok: false, error: 'Unknown action' }, callback);
  }

  return ContentService.createTextOutput(
    'Trimble Technician Assistant workspace API — POST for writes, GET ?action=access_check for access status.'
  ).setMimeType(ContentService.MimeType.TEXT);
}

/** Run once (or again) from the editor — creates tabs, headers, formatting, README. */
function setupSheets() {
  var ss = getSpreadsheet();
  var name;
  var headers;

  for (name in SHEET_HEADERS) {
    headers = SHEET_HEADERS[name];
    var sheet = ensureSheet(ss, name, headers);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatDataSheet(sheet, headers.length);
  }

  setupReadmeSheet(ss);
  removeDefaultSheet(ss);
  reorderSheets(ss, ['README', 'Events', 'Feedback', 'Uploads', 'AccessRequests', 'ApprovedUsers']);
  Logger.log('Sheets ready: README, Events, Feedback, Uploads, AccessRequests, ApprovedUsers');
}
