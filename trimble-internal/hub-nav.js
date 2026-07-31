/**
 * Trimble Internal hub — TMC and personnel-only Groundworks tools.
 */
(function () {
  'use strict';

  var CATEGORIES = [
    {
      id: 'tmc',
      title: 'TMC',
      desc: 'In-house TMC tools — assembly guides, manufacturing workflows, and build documentation.',
      tools: [
        {
          href: './bench-crane/index.html#overview',
          icon: 'BC',
          name: 'TMC Bench Crane Assembly Guide',
          summary: 'Segment-based assembly, Ruthex hardware catalog, and step photos',
        },
      ],
    },
    {
      id: 'groundworks-internal',
      title: 'Groundworks (Internal)',
      desc: 'Personnel-only Groundworks utilities not published on the dealer hub.',
      tools: [
        {
          href: './groundworks/csv-formatter/index.html',
          icon: 'CS',
          name: 'CSV formatter',
          summary: 'Map survey/TBC CSV columns and export Groundworks pile import files',
        },
      ],
    },
  ];

  var homeView = document.getElementById('hubHome');
  var categoryView = document.getElementById('hubCategory');
  var pickerEl = document.getElementById('categoryPicker');
  var titleEl = document.getElementById('hubCategoryTitle');
  var descEl = document.getElementById('hubCategoryDesc');
  var toolListEl = document.getElementById('hubToolList');
  var backBtn = document.getElementById('hubBack');

  function findCategory(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return null;
  }

  function renderPicker() {
    if (!pickerEl) return;
    pickerEl.innerHTML = '';
    CATEGORIES.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'category-pick category-pick--' + cat.id;
      btn.innerHTML = '<span class="category-pick__title">' + cat.title + '</span>';
      btn.addEventListener('click', function () {
        if (window.WorkspaceApi) {
          window.WorkspaceApi.logEvent('category_open', { detail: cat.id });
        }
        openCategory(cat.id, true);
      });
      pickerEl.appendChild(btn);
    });
  }

  function renderToolList(cat) {
    if (!toolListEl) return;
    toolListEl.innerHTML = '';
    cat.tools.forEach(function (tool) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'tool-link';
      a.href = tool.href;
      a.innerHTML =
        '<span class="tool-link__icon" aria-hidden="true">' +
        tool.icon +
        '</span>' +
        '<span class="tool-link__text">' +
        '<span class="tool-link__name">' +
        tool.name +
        '</span>' +
        '<span class="tool-link__summary">' +
        tool.summary +
        '</span>' +
        '</span>' +
        '<span class="tool-link__arrow" aria-hidden="true">&#8250;</span>';
      li.appendChild(a);
      toolListEl.appendChild(li);
    });
  }

  function openCategory(id, pushHash) {
    var cat = findCategory(id);
    if (!cat || !homeView || !categoryView) {
      openHome(pushHash);
      return;
    }
    homeView.hidden = true;
    categoryView.hidden = false;
    if (titleEl) titleEl.textContent = cat.title;
    if (descEl) descEl.textContent = cat.desc;
    renderToolList(cat);
    document.title = cat.title + ' — Trimble Internal';
    if (pushHash && history.pushState) {
      history.pushState({ category: id }, '', '#category/' + id);
    } else if (pushHash) {
      location.hash = 'category/' + id;
    }
  }

  function openHome(pushHash) {
    if (!homeView || !categoryView) return;
    homeView.hidden = false;
    categoryView.hidden = true;
    document.title = 'Trimble Internal — Technician Assistant';
    if (pushHash && history.replaceState) {
      history.replaceState({}, '', location.pathname + location.search);
    } else if (pushHash) {
      location.hash = '';
    }
  }

  function parseHash() {
    var hash = (location.hash || '').replace(/^#/, '');
    if (hash.indexOf('category/') === 0) {
      openCategory(hash.slice('category/'.length), false);
      return;
    }
    openHome(false);
  }

  if (backBtn) {
    backBtn.addEventListener('click', function (e) {
      e.preventDefault();
      openHome(true);
    });
  }

  window.addEventListener('hashchange', parseHash);
  window.addEventListener('popstate', parseHash);

  function bootHub() {
    renderPicker();
    parseHash();
  }

  if (window.AppAccess && typeof window.AppAccess.whenReady === 'function') {
    window.AppAccess.whenReady().then(bootHub);
  } else {
    bootHub();
  }

  window.HubNav = {
    categories: CATEGORIES,
    openCategory: openCategory,
    openHome: openHome,
    refresh: bootHub,
  };
})();
