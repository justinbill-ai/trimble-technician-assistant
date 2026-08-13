/**
 * Renders theory-of-operation panel for CTL or Excavator measure-up calculators.
 * Expects config.theoryOfOperation plus optional stickOrientation, siteworksResults, plumbBobNote.
 */
(function (global) {
  'use strict';

  var THEORY_EXPANDED_KEY = 'tta_measure_theory_expanded_v1';

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadTheoryExpanded(containerId) {
    try {
      var raw = localStorage.getItem(THEORY_EXPANDED_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      return !!data[containerId];
    } catch (e) {
      return false;
    }
  }

  function saveTheoryExpanded(containerId, expanded) {
    try {
      var raw = localStorage.getItem(THEORY_EXPANDED_KEY);
      var data = raw ? JSON.parse(raw) : {};
      if (expanded) {
        data[containerId] = true;
      } else {
        delete data[containerId];
      }
      localStorage.setItem(THEORY_EXPANDED_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function toggleCollapsibleSection(section, body, storageKey) {
    var willExpand = body.hidden;
    body.hidden = !willExpand;
    section.classList.toggle('ex-phase--expanded', willExpand);
    var head = section.querySelector('.ex-phase__head');
    if (head) head.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
    if (storageKey) saveTheoryExpanded(storageKey, willExpand);
  }

  function bindCollapsibleSection(section, body, storageKey) {
    var head = section.querySelector('.ex-phase__head');
    if (!head) return;

    function onToggle(e) {
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      if (e.type === 'keydown') e.preventDefault();
      toggleCollapsibleSection(section, body, storageKey);
    }

    head.addEventListener('click', onToggle);
    head.addEventListener('keydown', onToggle);
  }

  function renderList(items) {
    if (!items || !items.length) return '';
    return (
      '<ul class="ex-measure-ref__list">' +
      items.map(function (item) {
        return '<li>' + esc(item) + '</li>';
      }).join('') +
      '</ul>'
    );
  }

  function renderMethods(methods) {
    if (!methods || !methods.length) return '';
    return methods
      .map(function (m) {
        return (
          '<p class="ex-measure-ref__method"><strong>' +
          esc(m.name) +
          '</strong> — ' +
          esc(m.body) +
          '</p>'
        );
      })
      .join('');
  }

  function renderCallout(callout) {
    if (!callout) return '';
    var items = Array.isArray(callout) ? callout : [callout];
    return items
      .map(function (c) {
        var title = c.title
          ? '<strong>' + esc(c.title) + '</strong>'
          : '';
        var body = c.body ? '<p>' + esc(c.body) + '</p>' : '';
        return (
          '<div class="ex-measure-ref__callout mu-survey-requirement" role="note">' +
          title +
          body +
          '</div>'
        );
      })
      .join('');
  }

  function renderTheorySections(sections) {
    if (!sections || !sections.length) return '';
    return sections
      .map(function (sec) {
        var html =
          '<h4 class="ex-measure-ref__subtitle">' + esc(sec.title) + '</h4>';
        if (sec.paragraphs) {
          sec.paragraphs.forEach(function (p) {
            html += '<p class="ex-measure-ref__lead">' + esc(p) + '</p>';
          });
        }
        html += renderCallout(sec.callout);
        html += renderList(sec.list);
        html += renderMethods(sec.methods);
        if (sec.footnote) {
          html += '<p class="ex-measure-ref__footnote">' + esc(sec.footnote) + '</p>';
        }
        return html;
      })
      .join('');
  }

  function renderStickOrientation(stick) {
    if (!stick) return '';
    var opts =
      '<ul class="ex-measure-ref__list">' +
      stick.options
        .map(function (opt) {
          return (
            '<li><strong>' +
            esc(opt.siteworksLabel) +
            '</strong> — ' +
            esc(opt.description) +
            '</li>'
          );
        })
        .join('') +
      '</ul>';
    return (
      '<h3 class="ex-measure-ref__title">Stick orientation (Siteworks only)</h3>' +
      '<p class="ex-measure-ref__lead">' +
      esc(stick.note) +
      '</p>' +
      opts
    );
  }

  function renderMeasureTheoryPanel(config, containerId) {
    var el = document.getElementById(containerId);
    if (!el || !config || !config.theoryOfOperation) return;

    var theory = config.theoryOfOperation;
    var bodyId = containerId + 'Body';
    var expanded = loadTheoryExpanded(containerId);
    var resultsHtml = '';
    if (config.siteworksResults && config.siteworksResults.length) {
      resultsHtml =
        '<h3 class="ex-measure-ref__title">Siteworks fields this calculator fills</h3>' +
        '<p class="ex-measure-ref__lead">Copy these values into the matching Siteworks measure-up screens after you run the calculator.</p>' +
        renderList(config.siteworksResults);
    }

    var plumbHtml = config.plumbBobNote
      ? '<p class="note ex-measure-ref__plumb">' + esc(config.plumbBobNote) + '</p>'
      : '';

    el.innerHTML =
      '<section class="ex-phase ex-measure-ref-panel' +
      (expanded ? ' ex-phase--expanded' : '') +
      '">' +
      '<div class="ex-phase__head ex-phase__head--critical" role="button" tabindex="0" aria-expanded="' +
      (expanded ? 'true' : 'false') +
      '" aria-controls="' +
      esc(bodyId) +
      '">' +
      '<span class="ex-phase__chevron" aria-hidden="true"></span>' +
      '<div class="ex-phase__head-text">' +
      '<div class="ex-phase__title">' +
      esc(theory.title) +
      '</div>' +
      '<div class="ex-phase__summary">Survey points, methods, and copying results into Siteworks</div>' +
      '</div>' +
      '</div>' +
      '<div class="ex-phase__body" id="' +
      esc(bodyId) +
      '"' +
      (expanded ? '' : ' hidden') +
      '>' +
      '<div class="ex-measure-ref">' +
      '<p class="ex-measure-ref__lead ex-measure-ref__intro">' +
      esc(theory.intro) +
      '</p>' +
      renderTheorySections(theory.sections) +
      renderStickOrientation(config.stickOrientation) +
      resultsHtml +
      plumbHtml +
      '</div>' +
      '</div>' +
      '</section>';

    var section = el.querySelector('.ex-measure-ref-panel');
    var body = el.querySelector('.ex-phase__body');
    if (section && body) {
      bindCollapsibleSection(section, body, containerId);
    }
  }

  global.renderMeasureTheoryPanel = renderMeasureTheoryPanel;
})(typeof window !== 'undefined' ? window : this);
