(function () {
  'use strict';

  var modal = document.getElementById('helpModal');
  if (!modal) return;

  var backdrop = document.getElementById('helpModalBackdrop');
  var closeBtn = document.getElementById('helpModalClose');
  var closeBottomBtn = document.getElementById('helpModalCloseBottom');

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function populateHelpGuide() {
    var navList = document.getElementById('helpNavList');
    if (!navList) return;
    navList.innerHTML = '';

    var categories = (window.HubNav && window.HubNav.categories) || [];
    categories.forEach(function (cat) {
      if (window.HubNav && typeof window.HubNav.isCategoryVisible === 'function') {
        if (!window.HubNav.isCategoryVisible(cat)) return;
      } else if (cat.hubHidden || cat.audience === 'internal') {
        return;
      }

      var li = document.createElement('li');
      li.className = 'help-guide__nav-cat';

      var toolsHtml = (cat.tools || [])
        .map(function (tool) {
          var beta = tool.beta ? ' <span class="help-guide__beta">BETA</span>' : '';
          var summary = tool.summary
            ? '<span class="help-guide__tool-summary">' + esc(tool.summary) + '</span>'
            : '';
          return (
            '<li class="help-guide__nav-tool">' +
            '<span class="help-guide__tool-name">' +
            esc(tool.name) +
            beta +
            '</span>' +
            summary +
            '</li>'
          );
        })
        .join('');

      var hubNote = cat.href
        ? '<span class="help-guide__cat-note">Opens the ' + esc(cat.title) + ' tool list</span>'
        : '';

      li.innerHTML =
        '<span class="help-guide__nav-cat-title">' +
        esc(cat.title) +
        '</span>' +
        hubNote +
        '<ul class="help-guide__nav-tools">' +
        toolsHtml +
        '</ul>';
      navList.appendChild(li);
    });
  }

  function openHelp() {
    populateHelpGuide();
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('help-modal-open');
    closeBtn.focus();
  }

  function closeHelp() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('help-modal-open');
  }

  document.querySelectorAll('[data-open-help]').forEach(function (btn) {
    btn.addEventListener('click', openHelp);
  });

  if (backdrop) backdrop.addEventListener('click', closeHelp);
  if (closeBtn) closeBtn.addEventListener('click', closeHelp);
  if (closeBottomBtn) closeBottomBtn.addEventListener('click', closeHelp);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && !modal.hidden) closeHelp();
  });
})();
