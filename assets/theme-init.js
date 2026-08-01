/**
 * Apply saved light/dark theme before paint. Load in <head> on every page.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'tc-assistant-theme';
  var root = document.documentElement;

  function readStored() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function updateMeta(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#003d66' : '#005f9e');
    }
  }

  var stored = readStored();
  var theme = stored === 'dark' || stored === 'light' ? stored : 'light';
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
  updateMeta(theme);

  window.TcTheme = {
    storageKey: STORAGE_KEY,
    get: function () {
      return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    },
    set: function (next) {
      var themeName = next === 'dark' ? 'dark' : 'light';
      root.setAttribute('data-theme', themeName);
      root.style.colorScheme = themeName;
      try {
        localStorage.setItem(STORAGE_KEY, themeName);
      } catch (e) {}
      updateMeta(themeName);
      window.dispatchEvent(new CustomEvent('tc-theme-change', { detail: { theme: themeName } }));
    },
    toggle: function () {
      this.set(this.get() === 'dark' ? 'light' : 'dark');
    },
  };
})();
