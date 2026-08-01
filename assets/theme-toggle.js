/**
 * Header light/dark toggle — requires theme-init.js and trimble-connect.css.
 */
(function () {
  'use strict';

  function ensureActions() {
    var inner = document.querySelector('.tc-app-header .tc-header__inner');
    if (!inner) return null;

    var actions = inner.querySelector('.tc-header__actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'tc-header__actions';
      inner.appendChild(actions);
      inner.classList.add('tc-header__inner--with-help');
    }
    return actions;
  }

  function syncToggle(btn) {
    var dark = window.TcTheme && window.TcTheme.get() === 'dark';
    btn.classList.toggle('theme-toggle--dark', !!dark);
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  function buildToggle() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';

    var track = document.createElement('span');
    track.className = 'theme-toggle__track';
    track.setAttribute('aria-hidden', 'true');

    var knob = document.createElement('span');
    knob.className = 'theme-toggle__knob';
    track.appendChild(knob);
    btn.appendChild(track);

    btn.addEventListener('click', function () {
      if (window.TcTheme) window.TcTheme.toggle();
      syncToggle(btn);
    });

    window.addEventListener('tc-theme-change', function () {
      syncToggle(btn);
    });

    syncToggle(btn);
    return btn;
  }

  function init() {
    if (!window.TcTheme) return;
    var actions = ensureActions();
    if (!actions || actions.querySelector('.theme-toggle')) return;

    var toggle = buildToggle();
    var help = actions.querySelector('.help-trigger');
    if (help) {
      actions.insertBefore(toggle, help);
    } else {
      actions.appendChild(toggle);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
