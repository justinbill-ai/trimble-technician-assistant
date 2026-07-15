/**
 * Developer feedback — email delivery config.
 * @deprecated Prefer WORKSPACE_CONFIG in workspace-config.js (shared telemetry + feedback + uploads).
 */
window.FEEDBACK_CONFIG = {
  endpoint: (window.WORKSPACE_CONFIG && window.WORKSPACE_CONFIG.endpoint) || '',
  recipientEmail:
    (window.WORKSPACE_CONFIG && window.WORKSPACE_CONFIG.recipientEmail) ||
    'justin_bill@trimble.com',
  appName:
    (window.WORKSPACE_CONFIG && window.WORKSPACE_CONFIG.appName) ||
    'Trimble Technician Assistant',
};
