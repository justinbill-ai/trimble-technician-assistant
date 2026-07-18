/**
 * Technician Assistant hub — category home + drill-in tool list.
 */
(function () {
  'use strict';

  var HUB_HIDDEN_CATEGORY_IDS = { tmc: true };

  var CATEGORIES = [
    {
      id: 'earthworks',
      title: 'Earthworks Excavator',
      desc: 'Autos optimization, commissioning support, and field diagnostics for Earthworks excavator machine control.',
      tools: [
        {
          href: './excavator/index.html',
          icon: 'ET',
          name: 'Excavator Tuning Assistant',
          summary: 'Prestart checklist, symptom assistant, tuning map, and attachment capture',
        },
      ],
    },
    {
      id: 'siteworks',
      title: 'Siteworks Machine Guidance',
      desc: 'Survey-based setup, measure-up calculations, and reporting for Siteworks CTL and related guidance workflows.',
      tools: [
        {
          href: './measure-up/index.html',
          icon: 'MU',
          name: 'CTL Measure-Up Calculator',
          summary: 'Survey CSV upload, receiver-to-centerline, attachment width, 3D preview, and PDF report',
        },
      ],
    },
    {
      id: 'installation',
      title: 'Machine wear / Installation deliverables',
      desc: 'Pre-install machine wear reports and post-install photo deliverables.',
      howto:
        'Start with <strong>Pre-Inspection</strong> before the install. After install, open <strong>Install Deliverable</strong> for photos, voice notes, and PDF export.',
      tools: [
        {
          href: './pre-inspection/index.html',
          icon: 'PI',
          name: 'Pre-Inspection / Machine Wear Report',
          summary: 'Before install — expert or guided wear documentation with photos and Trimble-branded PDF',
        },
        {
          href: './install-deliverable/index.html',
          icon: 'ID',
          name: 'Install Deliverable',
          summary: 'After install — named reports, unlimited photos, voice notes, resume anytime, PDF export',
        },
      ],
    },
    {
      id: 'tmc',
      title: 'TMC',
      desc: 'In-house TMC tools — assembly guides, manufacturing workflows, and build documentation.',
      hubHidden: true,
      tmc: true,
      tools: [
        {
          href: './bench-crane/index.html#overview',
          icon: 'BC',
          name: 'TMC Bench Crane Assembly Guide',
          summary: 'Segment-based assembly, Ruthex hardware catalog, and step photos',
          tmcGated: true,
        },
      ],
    },
    {
      id: 'groundworks',
      title: 'Trimble Groundworks',
      desc: 'Measure-up, calibration, and field workflows for Groundworks pile drivers and related machine control.',
      tools: [
        {
          href: './groundworks/pd25/index.html',
          icon: 'PD',
          name: 'Vermeer PD25',
          summary: 'Guided pre measure-up workflow and COGO measure-up calculator',
        },
      ],
    },
  ];

  var homeView = document.getElementById('hubHome');
  var categoryView = document.getElementById('hubCategory');
  var pickerEl = document.getElementById('categoryPicker');
  var titleEl = document.getElementById('hubCategoryTitle');
  var descEl = document.getElementById('hubCategoryDesc');
  var howtoEl = document.getElementById('hubCategoryHowto');
  var toolListEl = document.getElementById('hubToolList');
  var backBtn = document.getElementById('hubBack');

  function isHubHiddenCategory(cat) {
    return !!(cat && (cat.hubHidden || HUB_HIDDEN_CATEGORY_IDS[cat.id]));
  }

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
      if (isHubHiddenCategory(cat)) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'category-pick category-pick--' + cat.id;
      btn.setAttribute('data-category-id', cat.id);
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
      if (tool.tmcGated) a.setAttribute('data-tmc-gated', '');
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
    if (cat.tmc && window.TmcAccess && window.TmcAccess.initHubGate) {
      window.TmcAccess.initHubGate();
    }
  }

  function openCategory(id, pushHash) {
    var cat = findCategory(id);
    if (!cat || isHubHiddenCategory(cat) || !homeView || !categoryView) {
      if (isHubHiddenCategory(cat)) openHome(pushHash);
      return;
    }

    if (cat.tmc && window.TmcAccess && !window.TmcAccess.isAuthorized()) {
      window.TmcAccess.promptForAccess({
        context: 'category',
        onSuccess: function () {
          openCategory(id, pushHash);
        },
      });
      return;
    }

    homeView.hidden = true;
    categoryView.hidden = false;
    if (titleEl) titleEl.textContent = cat.title;
    if (descEl) descEl.textContent = cat.desc;
    if (howtoEl) {
      if (cat.howto) {
        howtoEl.innerHTML = cat.howto;
        howtoEl.hidden = false;
      } else {
        howtoEl.hidden = true;
        howtoEl.innerHTML = '';
      }
    }
    renderToolList(cat);
    document.title = cat.title + ' — Technician Assistant';
    if (pushHash) {
      if (history.pushState) {
        history.pushState({ category: id }, '', '#category/' + id);
      } else {
        location.hash = 'category/' + id;
      }
    }
  }

  function openHome(pushHash) {
    if (!homeView || !categoryView) return;
    homeView.hidden = false;
    categoryView.hidden = true;
    document.title = 'Trimble Technician Assistant';
    if (pushHash) {
      if (history.replaceState) {
        history.replaceState({}, '', location.pathname + location.search);
      } else {
        location.hash = '';
      }
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
  };
})();
