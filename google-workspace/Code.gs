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

function formatDataSheet(sheet, colCount) {
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
    sheet
      .getRange(2, 1, sheet.getLastRow() - 1, colCount)
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
  sheet.getRange('A6:D8').setValues([
    ['Events', 'Adoption & funnel', 'event, tool, deviceType', 'Chart event counts by week'],
    ['Feedback', 'Friction & bugs', 'type, topic, page, message', 'Filter by tool and type'],
    ['Uploads', 'Opt-in reports', 'reportType, dealer, driveFileUrl', 'Count exports by dealer'],
  ]);

  sheet.getRange('A10').setValue('Common events').setFontWeight('bold').setFontColor('#005f9e');
  sheet.getRange('A11:B16').setValues([
    ['hub_open', 'User opened the hub'],
    ['tool_open', 'User opened a tool'],
    ['csv_analyzed:ok', 'Calculator succeeded'],
    ['pdf_exported', 'User generated a PDF'],
    ['guide_phase_complete', 'PD25 workflow phase finished'],
    ['manual_open', 'Commissioning PDF opened'],
  ]);

  sheet.getRange('A1:D16').setWrap(true).setVerticalAlignment('top');
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 220);
  sheet.setColumnWidth(4, 240);
  sheet.getRange('A5:D5')
    .setBackground('#005f9e')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.getRange('A6:D8').applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
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

    return jsonResponse({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet() {
  return ContentService.createTextOutput(
    'Trimble Technician Assistant workspace API — POST only.'
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
  reorderSheets(ss, ['README', 'Events', 'Feedback', 'Uploads']);
  Logger.log('Sheets ready: README, Events, Feedback, Uploads');
}
