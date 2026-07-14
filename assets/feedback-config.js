/**
 * Developer feedback — email delivery config.
 *
 * SETUP (one-time, ~5 min):
 * 1. Go to https://script.google.com → New project
 * 2. Paste the doPost function from the comment block at the bottom of this file
 * 3. Set recipientEmail in the script to your inbox
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the deployment URL into endpoint below and redeploy this site
 *
 * Until endpoint is set, submissions open the user's email app (mailto fallback).
 */
window.FEEDBACK_CONFIG = {
  endpoint:
    'https://script.google.com/a/macros/trimble.com/s/AKfycbzPec8YvWWgjU28rYAIsY_vKJmqowXMJOCoT9UNiBl7hQCq8orQ7Ktibv3pfuiNyvivhg/exec',
  recipientEmail: 'justin_bill@trimble.com',
  appName: 'Trimble Technician Assistant',
};

/*
--- Google Apps Script (copy into script.google.com) ---
IMPORTANT: After updating, Deploy → Manage deployments → edit → New version → Deploy

function parseFeedbackPayload(e) {
  if (e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }
  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  return e.parameter || {};
}

function doPost(e) {
  var recipient = 'justin_bill@trimble.com';
  var data = parseFeedbackPayload(e);
  var subject =
    '[Tech Assistant] ' +
    (data.type || 'Feedback') +
    (data.topic ? ' — ' + data.topic : '');
  var body =
    'Type: ' + (data.type || '') + '\n' +
    'From: ' + (data.name || 'Anonymous') +
    (data.email ? ' <' + data.email + '>' : '') + '\n' +
    'Page: ' + (data.page || '') + '\n' +
    'Device: ' + (data.userAgent || '') + '\n\n' +
    (data.message || '');
  var options = {};
  if (data.email) options.replyTo = data.email;
  MailApp.sendEmail(recipient, subject, body, options);
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true })
  ).setMimeType(ContentService.MimeType.JSON);
}

--- end Apps Script ---

*/
