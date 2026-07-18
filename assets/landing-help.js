(function () {
  'use strict';

  var modal = document.getElementById('helpModal');
  if (!modal) return;

  var backdrop = document.getElementById('helpModalBackdrop');
  var closeBtn = document.getElementById('helpModalClose');
  var closeBottomBtn = document.getElementById('helpModalCloseBottom');

  function populateHelpGuide() {
    var navList = document.getElementById('helpNavList');
    if (!navList) return;
    navList.innerHTML = '';
    var categories = (window.HubNav && window.HubNav.categories) || [];
    categories.forEach(function (cat) {
      if (cat.hubHidden) return;
      var li = document.createElement('li');
      li.className = 'help-guide__nav-cat';
      var toolsHtml = (cat.tools || [])
        .map(function (tool) {
          return '<li class="help-guide__nav-tool">' + tool.name + '</li>';
        })
        .join('');
      li.innerHTML =
        '<span class="help-guide__nav-cat-title">' +
        cat.title +
        '</span><ul class="help-guide__nav-tools">' +
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

  backdrop && backdrop.addEventListener('click', closeHelp);
  closeBtn && closeBtn.addEventListener('click', closeHelp);
  closeBottomBtn && closeBottomBtn.addEventListener('click', closeHelp);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && !modal.hidden) closeHelp();
  });
})();
