/**
 * Google Workspace backend — telemetry, feedback, optional Drive report archive.
 *
 * Deploy Apps Script from google-workspace/DEPLOY.md, then paste the web app URL below.
 * Until endpoint is set, telemetry is queued locally only (no-op send) and feedback uses mailto.
 */
window.WORKSPACE_CONFIG = {
  /** Web app URL — update after deploying google-workspace/Code.gs (see DEPLOY.md). */
  endpoint:
    'https://script.google.com/macros/s/AKfycbxUWZgf2uvicFpMUvoLBNvWMdqi2rjgPILBGzTJmIzCxjmKOoOR_Ix3Uxj030tDuFo8AQ/exec',
  appVersion: '2026.07.14',
  appName: 'Trimble Technician Assistant',
  recipientEmail: 'justin_bill@trimble.com',
  /** Set false to disable all background posts (local app still works). */
  telemetryEnabled: true,
  /** Show “Send copy to Trimble” on PDF export sections. */
  driveUploadEnabled: true,
};

/** @deprecated Use WORKSPACE_CONFIG — kept for feedback.js compatibility */
window.FEEDBACK_CONFIG = {
  endpoint: window.WORKSPACE_CONFIG.endpoint,
  recipientEmail: window.WORKSPACE_CONFIG.recipientEmail,
  appName: window.WORKSPACE_CONFIG.appName,
};
