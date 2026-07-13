var STORAGE_KEY = 'tta_pd25_measureup_progress_v1';

var state = {
  checked: {},
  expandedPhases: {},
  csvText: null,
};

function copyResultValue(text, buttonEl) {
  function flashDone() {
    var prev = buttonEl.textContent;
    buttonEl.textContent = 'Copied';
    buttonEl.disabled = true;
    setTimeout(function () {
      buttonEl.textContent = prev;
      buttonEl.disabled = false;
    }, 1400);
  }
  function flashFail() {
    alert('Could not copy automatically. Select the value and copy manually.');
  }
  function fallbackExec() {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      if (document.execCommand('copy')) flashDone();
      else flashFail();
    } catch (err) {
      flashFail();
    }
    document.body.removeChild(ta);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(flashDone).catch(fallbackExec);
  } else {
    fallbackExec();
  }
}

function refreshViz(analysis) {
  if (typeof PD25Viz !== 'undefined' && analysis) {
    PD25Viz.updateFromAnalysis(analysis);
  }
}

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function loadProgress() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state.checked = JSON.parse(raw) || {};
  } catch (e) {
    state.checked = {};
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.checked));
  } catch (e) {}
}

function allStepsForPhase(phase) {
  return (phase.steps || []).filter(function (s) {
    return !s.optional;
  });
}

function isPhaseComplete(phase) {
  if (phase.calculator) return isCalculatorUnlocked();
  var required = allStepsForPhase(phase);
  if (!required.length) return true;
  return required.every(function (s) {
    return !!state.checked[s.id];
  });
}

function isCalculatorUnlocked() {
  var preCalc = PD25_GUIDE.phases.filter(function (p) {
    return !p.calculator && p.id !== 'phase-6';
  });
  return preCalc.every(function (p) {
    return isPhaseComplete(p);
  });
}

function guidePhases() {
  return PD25_GUIDE.phases.filter(function (p) {
    return !p.calculator;
  });
}

function ensureExpandedDefaults() {
  var phases = guidePhases();
  var hasExpanded = phases.some(function (p) {
    return !!state.expandedPhases[p.id];
  });
  if (hasExpanded) return;

  var target = phases.find(function (p) {
    return !isPhaseComplete(p);
  });
  if (!target) target = phases[0];
  if (target) state.expandedPhases[target.id] = true;
}

function updatePhaseBadge(phaseId) {
  var phase = guidePhases().find(function (p) {
    return p.id === phaseId;
  });
  if (!phase) return;

  var section = document.querySelector('[data-phase-id="' + phaseId + '"]');
  if (!section) return;

  var done = isPhaseComplete(phase);
  var badge = section.querySelector('.pd25-phase__badge');
  if (badge) {
    badge.textContent = done ? 'Complete' : 'In progress';
    badge.classList.toggle('pd25-phase__badge--done', done);
  }
}

function updateWorkflowProgress() {
  var setupPhases = PD25_GUIDE.phases.filter(function (p) {
    return !p.calculator && p.id !== 'phase-6';
  });
  var doneCount = setupPhases.filter(function (p) {
    return isPhaseComplete(p);
  }).length;
  var el = document.getElementById('workflowProgress');
  if (!el) return;

  if (isCalculatorUnlocked()) {
    el.className = 'pd25-workflow-progress pd25-workflow-progress--done';
    el.textContent =
      'All recommended setup phases complete (' +
      doneCount +
      ' of ' +
      setupPhases.length +
      ').';
  } else {
    el.className = 'pd25-workflow-progress';
    el.textContent =
      'Recommended path: ' +
      doneCount +
      ' of ' +
      setupPhases.length +
      ' setup phases complete. Finish critical steps if you are new to PD25 or troubleshooting accuracy.';
  }
}

function renderTooling() {
  var ul = document.getElementById('toolingList');
  ul.innerHTML = PD25_GUIDE.requiredTooling.map(function (t) {
    return '<li>' + esc(t) + '</li>';
  }).join('');
}

function renderBodyCalibrationSigns() {
  var data = PD25_GUIDE.bodyCalibrationSigns;
  if (!data) return '';

  function block(section) {
    var rules = section.rules
      .map(function (r) {
        return (
          '<div class="pd25-body-signs__rule">' +
          '<span class="pd25-body-signs__condition">' +
          esc(r.condition) +
          '</span>' +
          '<span class="pd25-body-signs__sign">' +
          esc(r.sign) +
          '</span></div>'
        );
      })
      .join('');
    return (
      '<div class="pd25-body-signs__block">' +
      '<p class="pd25-body-signs__title">' +
      esc(section.title) +
      '</p>' +
      rules +
      '</div>'
    );
  }

  return (
    '<div class="pd25-body-signs" role="note">' +
    '<p class="pd25-body-signs__intro"><strong>Important — body calibration sign rules</strong><br>' +
    esc(data.intro) +
    '</p>' +
    '<div class="pd25-body-signs__grid">' +
    block(data.pitch) +
    block(data.roll) +
    '</div></div>'
  );
}

function renderPhases() {
  var root = document.getElementById('phaseList');
  root.innerHTML = '';
  ensureExpandedDefaults();

  guidePhases().forEach(function (phase) {
    var done = isPhaseComplete(phase);
    var section = document.createElement('section');
    section.className = 'pd25-phase';
    section.setAttribute('data-phase-id', phase.id);

    var head = document.createElement('div');
    head.className = 'pd25-phase__head' + (phase.critical ? ' pd25-phase__head--critical' : '');
    head.innerHTML =
      '<div><div class="pd25-phase__title">' +
      esc(phase.title) +
      '</div><div class="pd25-phase__summary">' +
      esc(phase.summary) +
      '</div></div>' +
      '<span class="pd25-phase__badge' +
      (done ? ' pd25-phase__badge--done' : '') +
      '">' +
      (done ? 'Complete' : 'In progress') +
      '</span>';

    var body = document.createElement('div');
    body.className = 'pd25-phase__body';
    body.hidden = !state.expandedPhases[phase.id];

    if (phase.showBodyCalibrationSigns) {
      var callout = document.createElement('div');
      callout.innerHTML = renderBodyCalibrationSigns();
      body.appendChild(callout);
    }

    phase.steps.forEach(function (step) {
      var row = document.createElement('label');
      row.className = 'pd25-step' + (step.optional ? ' pd25-step--optional' : '');
      row.innerHTML =
        '<input type="checkbox" data-step="' +
        esc(step.id) +
        '" ' +
        (state.checked[step.id] ? 'checked' : '') +
        ' />' +
        '<span><div class="pd25-step__title">' +
        esc(step.title) +
        '</div><div class="pd25-step__body">' +
        esc(step.body) +
        '</div></span>';
      body.appendChild(row);
    });

    head.addEventListener('click', function () {
      var willExpand = body.hidden;
      body.hidden = !willExpand;
      state.expandedPhases[phase.id] = willExpand;
    });

    body.addEventListener('change', function (e) {
      if (e.target.type !== 'checkbox') return;
      state.checked[e.target.getAttribute('data-step')] = e.target.checked;
      saveProgress();
      updatePhaseBadge(phase.id);
      updateWorkflowProgress();
    });

    section.appendChild(head);
    section.appendChild(body);
    root.appendChild(section);
  });

  updateWorkflowProgress();
}

function switchTab(panelId) {
  document.querySelectorAll('.pd25-tab').forEach(function (btn) {
    var active = btn.getAttribute('data-panel') === panelId;
    btn.classList.toggle('active', active);
  });
  document.querySelectorAll('.pd25-panel').forEach(function (panel) {
    panel.hidden = panel.id !== panelId;
  });
}

function bindTabs() {
  document.querySelectorAll('.pd25-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(btn.getAttribute('data-panel'));
    });
  });
}

function renderPointBadges(points, missing) {
  var box = document.getElementById('pointCheckList');
  box.innerHTML = '';
  PD25_GUIDE.surveyPoints.forEach(function (sp) {
    var badge = document.createElement('span');
    badge.className = 'pt-badge';
    var found = points[sp.id];
    if (found) {
      badge.classList.add('found');
      badge.textContent = sp.id + ' ✓';
    } else if (sp.required) {
      badge.classList.add('missing');
      badge.textContent = sp.id + ' ✗';
    } else {
      badge.classList.add('optional');
      badge.textContent = sp.id + ' (opt)';
    }
    box.appendChild(badge);
  });
  document.getElementById('analyzeBtn').disabled = missing.length > 0;
}

function getSurveyOptions() {
  var shotWithRod = document.getElementById('shotWithRodYes').checked;
  var rodEntered = document.getElementById('rodInSwYes').checked;
  var rodHeightEl = document.getElementById('rodHeight');
  return {
    shotWithRod: shotWithRod,
    rodEnteredInSiteworks: !shotWithRod || rodEntered,
    rodHeight: rodHeightEl ? rodHeightEl.value : '',
    hfFaceOffset: document.getElementById('hfFaceOffset')
      ? document.getElementById('hfFaceOffset').value
      : '0',
  };
}

function syncHfUi(hasHf) {
  var section = document.getElementById('hfOffsetSection');
  if (section) section.hidden = !hasHf;
  updateHfOffsetHint();
}

function updateHfOffsetHint() {
  var hint = document.getElementById('hfOffsetHint');
  if (!hint) return;
  var units = document.getElementById('units').value;
  if (units === 'METRIC') {
    hint.innerHTML =
      '<strong>Positive (+)</strong> — HF is on the face, <em>ahead</em> of jaw center (farther from ML/MR). Example: face shot 160&nbsp;mm toward ML/MR → enter <strong>+0.160&nbsp;m</strong>.<br />' +
      '<strong>Zero (0)</strong> — HF is at the jaw center (pile center).<br />' +
      '<strong>Negative (−)</strong> — HF is between jaw center and ML/MR.';
  } else {
    hint.innerHTML =
      '<strong>Positive (+)</strong> — HF is on the face, <em>ahead</em> of jaw center (farther from ML/MR). Example: face shot ~6.3&nbsp;in toward ML/MR → enter <strong>+0.525&nbsp;ft</strong> (160&nbsp;mm).<br />' +
      '<strong>Zero (0)</strong> — HF is at the jaw center (pile center).<br />' +
      '<strong>Negative (−)</strong> — HF is between jaw center and ML/MR.';
  }
}

function updateRodHeightDefault() {
  var units = document.getElementById('units').value;
  var def = PD25Calc.defaultRodHeight(units);
  var input = document.getElementById('rodHeight');
  if (input && (!input.value || input.dataset.auto === '1')) {
    input.value = def;
    input.dataset.auto = '1';
  }
  var hint = document.getElementById('rodHeightHint');
  if (hint) {
    hint.textContent =
      'PD25 default: ' +
      (units === 'METRIC' ? '0.204 m' : '0.669 ft') +
      ' (EW measure-up tool P/N 105568)';
  }
}

function syncRodUi() {
  var shotWithRod = document.getElementById('shotWithRodYes').checked;
  var rodSection = document.getElementById('rodHeightSection');
  var rodField = document.getElementById('rodHeightField');
  var rodInSwNo = document.getElementById('rodInSwNo').checked;

  if (rodSection) rodSection.hidden = !shotWithRod;
  if (rodField) rodField.hidden = !shotWithRod || !rodInSwNo;
  updateRodHeightDefault();
}

function runAnalysis() {
  if (!state.csvText) return null;
  return PD25Calc.analyzeCsv(
    state.csvText,
    document.getElementById('units').value,
    getSurveyOptions()
  );
}

function bindRodUi() {
  ['shotWithRodYes', 'shotWithRodNo', 'rodInSwYes', 'rodInSwNo'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', function () {
      syncRodUi();
      if (state.csvText && !document.getElementById('calcResults').hidden) {
        try {
          renderCalcResults(runAnalysis());
        } catch (e) {}
      }
    });
  });

  var rodHeight = document.getElementById('rodHeight');
  if (rodHeight) {
    rodHeight.addEventListener('input', function () {
      rodHeight.dataset.auto = '0';
      if (state.csvText && !document.getElementById('calcResults').hidden) {
        try {
          renderCalcResults(runAnalysis());
        } catch (e) {}
      }
    });
  }

  syncRodUi();
}

function bindHfUi() {
  var hfOffset = document.getElementById('hfFaceOffset');
  if (!hfOffset) return;
  hfOffset.addEventListener('input', function () {
    if (state.csvText && !document.getElementById('calcResults').hidden) {
      try {
        renderCalcResults(runAnalysis());
      } catch (e) {}
    }
  });
}

function renderCalcResults(analysis) {
  var box = document.getElementById('calcResults');
  if (analysis.status !== 'ok') {
    box.hidden = false;
    box.innerHTML = '<strong>Survey status:</strong> ' + esc(analysis.message);
    return;
  }

  var u = analysis.unitLabel;
  var html = '';

  if (analysis.warnings && analysis.warnings.length) {
    html +=
      '<div class="pd25-calc-hint" style="margin-bottom:14px;">' +
      analysis.warnings.map(esc).join('<br>') +
      '</div>';
  }

  var GROUNDWORKS_ORDER = ['G6', 'G5', 'G2', 'G1', 'G7', 'T1'];

  html += '<h3 class="pd25-results__h">Groundworks measure-up values</h3>';
  html +=
    '<table class="pd25-table"><thead><tr><th>Value</th><th>Result (' +
    esc(u) +
    ')</th><th class="pd25-th-copy">Copy</th></tr></thead><tbody>';
  GROUNDWORKS_ORDER.forEach(function (key) {
    var row = analysis.groundworks[key];
    if (!row) return;
    var valueStr = Number(row.value).toFixed(3);
    var valueCell = esc(valueStr);
    html +=
      '<tr><td><strong>' +
      esc(key) +
      '</strong><br><span class="pd25-muted">' +
      esc(row.label) +
      '</span></td><td class="pd25-mono pd25-results__value">' +
      valueCell +
      '</td><td class="pd25-copy-cell"><button type="button" class="copy-res-btn" data-copy="' +
      encodeURIComponent(valueStr) +
      '" aria-label="Copy ' +
      esc(key) +
      '">Copy</button></td></tr>';
  });
  html += '</tbody></table>';

  if (analysis.rodCorrection && analysis.rodCorrection.rodSubtract > 0) {
    html +=
      '<p class="note"><strong>APC correction applied:</strong> ' +
      analysis.rodCorrection.rodSubtract +
      ' ' +
      esc(analysis.rodCorrection.unitLabel) +
      ' subtracted from MB and H elevations.</p>';
  }

  box.hidden = false;
  box.innerHTML = html;
}

function bindCsv() {
  var input = document.getElementById('csvFile');
  var zone = document.getElementById('dropZone');

  function handleFile(file) {
    if (!file) return;
    zone.querySelector('.drop-zone__prompt').innerHTML = '✅ <b>' + esc(file.name) + '</b>';
    var reader = new FileReader();
    reader.onload = function (e) {
      state.csvText = e.target.result;
      try {
        var analysis = runAnalysis();
        renderPointBadges(analysis.points, analysis.missing);
        syncHfUi(!!(analysis.points && analysis.points.HF));
        refreshViz(analysis);
        document.getElementById('calcResults').hidden = true;
      } catch (err) {
        alert(err.message || String(err));
      }
    };
    reader.readAsText(file);
  }

  zone.addEventListener('click', function () {
    input.click();
  });
  input.addEventListener('change', function () {
    if (input.files[0]) handleFile(input.files[0]);
  });
  zone.addEventListener('dragover', function (e) {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', function () {
    zone.classList.remove('dragover');
  });
  zone.addEventListener('drop', function (e) {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  document.getElementById('analyzeBtn').addEventListener('click', function () {
    if (!state.csvText) return;
    var analysis = runAnalysis();
    renderCalcResults(analysis);
    refreshViz(analysis);
  });

  document.getElementById('units').addEventListener('change', function () {
    updateRodHeightDefault();
    updateHfOffsetHint();
    if (!state.csvText) return;
    try {
      var analysis = runAnalysis();
      renderPointBadges(analysis.points, analysis.missing);
      syncHfUi(!!(analysis.points && analysis.points.HF));
      if (!document.getElementById('calcResults').hidden && analysis.status === 'ok') {
        renderCalcResults(analysis);
      }
    } catch (err) {
      alert(err.message || String(err));
    }
  });
}

function bindCopyResults() {
  var box = document.getElementById('calcResults');
  if (!box) return;
  box.addEventListener('click', function (e) {
    var btn = e.target.closest('.copy-res-btn');
    if (!btn) return;
    var enc = btn.getAttribute('data-copy');
    if (!enc) return;
    copyResultValue(decodeURIComponent(enc), btn);
  });
}

function init() {
  document.getElementById('accuracyBanner').textContent = PD25_GUIDE.accuracyBanner;
  loadProgress();
  renderTooling();
  renderPhases();
  bindTabs();
  bindCsv();
  bindRodUi();
  bindHfUi();
  bindCopyResults();
  updateHfOffsetHint();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
