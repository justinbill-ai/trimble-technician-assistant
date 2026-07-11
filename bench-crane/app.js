'use strict';

(function () {
  var GUIDE, ASSEMBLY_ORDER, NAV_ORDER, HARDWARE_CATALOG, formatHardwareEntry, MASTER_HARDWARE_KIT;

  function showBootError(message) {
    var box = document.createElement('div');
    box.className = 'card';
    box.style.cssText = 'margin:16px auto;max-width:960px;border-color:#da212c;background:#fdeaec;padding:16px;';
    box.innerHTML =
      '<strong>Assembly guide could not start</strong>' +
      '<p style="margin:8px 0 0;font-size:0.9rem;">' + message + '</p>' +
      '<p style="margin:8px 0 0;font-size:0.85rem;color:#6a6e79;">Open from ' +
      '<code>Trimble Technician Assistant\\bench-crane\\index.html</code> and hard refresh (Ctrl+Shift+R).</p>';
    document.body.insertBefore(box, document.body.firstChild);
  }

  var guidePkg = window.TmcCraneGuide;
  var hardwarePkg = window.TmcCraneHardware;
  if (!guidePkg || !hardwarePkg || !window.TmcCraneImages) {
    showBootError(
      'JavaScript files did not load (guide-data.js, hardware-catalog.js, or drive-images.js). ' +
        'Check that all files sit in the same folder as index.html.'
    );
    return;
  }

  GUIDE = guidePkg.GUIDE;
  ASSEMBLY_ORDER = guidePkg.ASSEMBLY_ORDER;
  NAV_ORDER = guidePkg.NAV_ORDER;
  HARDWARE_CATALOG = hardwarePkg.HARDWARE_CATALOG;
  formatHardwareEntry = hardwarePkg.formatHardwareEntry;
  MASTER_HARDWARE_KIT = hardwarePkg.MASTER_HARDWARE_KIT;

  if (!GUIDE || !NAV_ORDER) {
    showBootError('Guide data is empty or invalid.');
    return;
  }

function mediaSrc(item) {
  if (!window.TmcCraneImages) return '';
  return window.TmcCraneImages.resolve(item);
}

function hasMedia(item) {
  if (!window.TmcCraneImages) return false;
  return window.TmcCraneImages.hasImage(item);
}

const STORAGE_KEY = 'tmc-crane-guide-v1';

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (err) {
    return {};
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const state = {
  currentSection: null,
  currentTab: 'assemble',
  boomConfig: 'dual-sheave',
  vruConfig: 'vru-both-sides',
  completedSections: new Set(),
  printedChecks: new Set(),
  stepChecks: new Set(),
  ...loadState(),
};

if (state.completedSections instanceof Array) {
  state.completedSections = new Set(state.completedSections);
}
if (state.printedChecks instanceof Array) {
  state.printedChecks = new Set(state.printedChecks);
}
if (state.stepChecks instanceof Array) {
  state.stepChecks = new Set(state.stepChecks);
}

function persist() {
  saveState({
    currentSection: state.currentSection,
    boomConfig: state.boomConfig,
    vruConfig: state.vruConfig,
    completedSections: [...state.completedSections],
    printedChecks: [...state.printedChecks],
    stepChecks: [...state.stepChecks],
  });
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function getSection(id) {
  return GUIDE.sections[id];
}

function initViewer3d() {
  const v = GUIDE.viewer3d;
  if (!v) return;

  const modal = document.getElementById('viewerModal');
  const frame = document.getElementById('viewerFrame');
  const openBtn = document.getElementById('openViewerBtn');
  const closeBtn = document.getElementById('closeViewerBtn');
  const backdrop = document.getElementById('viewerBackdrop');
  const external = document.getElementById('viewerOpenExternal');
  const fallbackLink = document.getElementById('viewerFallbackLink');
  const title = document.getElementById('viewerTitle');
  const desc = document.getElementById('viewerDesc');

  if (!title || !desc || !external || !fallbackLink) return;

  title.textContent = v.title;
  desc.textContent = v.description;
  external.href = v.url;
  fallbackLink.href = v.url;

  function openViewer() {
    frame.src = v.embedUrl || v.url;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('viewer-open');
    closeBtn.focus();
  }

  function closeViewer() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('viewer-open');
    frame.src = '';
  }

  openBtn?.addEventListener('click', openViewer);
  document.getElementById('welcomeViewerBtn')?.addEventListener('click', openViewer);
  closeBtn?.addEventListener('click', closeViewer);
  backdrop?.addEventListener('click', closeViewer);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeViewer();
  });

  window.openTmcViewer3d = openViewer;
}

function initImageLightbox() {
  const modal = document.getElementById('imageLightbox');
  const img = document.getElementById('imageLightboxImg');
  const caption = document.getElementById('imageLightboxCaption');
  const closeBtn = document.getElementById('imageLightboxClose');
  const backdrop = document.getElementById('imageLightboxBackdrop');
  if (!modal || !img) return;

  function openLightbox(src, alt) {
    img.src = src;
    img.alt = alt;
    caption.textContent = alt;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('viewer-open');
    closeBtn?.focus();
  }

  function closeLightbox() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('viewer-open');
    img.src = '';
  }

  closeBtn?.addEventListener('click', closeLightbox);
  backdrop?.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) closeLightbox();
  });

  window.openStepImageLightbox = openLightbox;
}

function bindStepImageZoom() {
  document.querySelectorAll('[data-step-image]').forEach(btn => {
    btn.addEventListener('click', () => {
      window.openStepImageLightbox?.(btn.dataset.stepImage, btn.dataset.stepImageAlt || '');
    });
  });
}

function renderViewerPrompt() {
  if (!GUIDE.viewer3d) return '';
  return `
    <div class="viewer-prompt">
      <span>Need orientation?</span>
      <button class="btn-secondary btn-sm" type="button" data-open-viewer>Open 360° 3D view</button>
    </div>`;
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.innerHTML = NAV_ORDER.map((id, i) => {
    const s = getSection(id);
    const isOverview = s.kind === 'overview';
    const done = !isOverview && state.completedSections.has(id);
    const active = state.currentSection === id;
    const statusLabel = isOverview ? 'Start here'
      : s.status === 'complete' ? 'Ready'
      : s.status === 'in-progress' ? 'In progress'
      : 'Coming soon';
    const navNum = isOverview ? '◆' : (done ? '✓' : i);
    return `
      <button class="seg-nav-item ${active ? 'active' : ''} ${done ? 'complete' : ''} ${isOverview ? 'nav-overview' : ''}"
              data-section="${id}" type="button">
        <span class="seg-nav-num">${navNum}</span>
        <span>
          <div class="seg-nav-label">${esc(s.title)}</div>
          <div class="seg-nav-status">${statusLabel}</div>
        </span>
      </button>`;
  }).join('');

  sidebar.querySelectorAll('.seg-nav-item').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });
}

function updateProgress() {
  const done = state.completedSections.size;
  var chip = document.getElementById('progressSummary');
  if (chip) {
    chip.textContent = `${done} / ${ASSEMBLY_ORDER.length} segments complete`;
  }
}

function printCheckId(sectionId, file) {
  return `${sectionId}::${file}`;
}

function renderPrintList(section) {
  let items = [];

  if (section.printParts?.length) {
    items = section.printParts.map(p => ({ ...p, sectionId: section.id }));
  } else if (section.id === 'boom') {
    items = [...section.sharedPrintedParts.map(p => ({ ...p, sectionId: section.id }))];
    const configParts = section.configPrintedParts[state.boomConfig]?.include || [];
    configParts.forEach(p => items.push({ ...p, sectionId: section.id }));
  }

  const totalQty = items.reduce((s, p) => s + p.qty, 0);
  const excludeNote = section.configPrintedParts?.[state.boomConfig]?.excludeNote;

  return `
    <div class="card">
      <div class="card-header">
        <span>Print checklist</span>
        <span style="font-weight:400;color:var(--text-muted)">${items.length} files</span>
      </div>
      <ul class="print-list">
        ${items.map(p => {
          const cid = printCheckId(p.sectionId || section.id, p.file);
          const checked = state.printedChecks.has(cid);
          return `
            <li class="print-item ${checked ? 'checked' : ''}">
              <input type="checkbox" data-print-id="${esc(cid)}" ${checked ? 'checked' : ''} />
              <span class="print-qty">×${p.qty}</span>
              <div>
                <div class="print-name">${esc(p.name)}</div>
                <div class="print-file">${esc(p.file)}${p.folder ? ` · ${esc(p.folder)}` : ''}</div>
                ${p.note ? `<div class="print-note">${esc(p.note)}</div>` : ''}
              </div>
            </li>`;
        }).join('')}
      </ul>
      ${excludeNote ? `<div class="exclude-note">⚠ ${esc(excludeNote)}</div>` : ''}
      <div class="total-prints">Total printed pieces: <strong>${totalQty}</strong></div>
    </div>`;
}

function dedupePrintItems(items) {
  const map = new Map();
  items.forEach(p => {
    const key = p.file;
    if (map.has(key)) {
      map.get(key).qty += p.qty;
    } else {
      map.set(key, { ...p });
    }
  });
  return [...map.values()];
}

function renderConfigPicker(section) {
  if (!section.configuration) return '';
  const opts = section.configuration.options;
  return `
    <div class="config-picker">
      <h3>${esc(section.configuration.prompt)}</h3>
      <div class="config-options">
        ${opts.map(o => `
          <label class="config-option ${state.boomConfig === o.id ? 'selected' : ''}">
            <input type="radio" name="boomConfig" value="${esc(o.id)}"
              ${state.boomConfig === o.id ? 'checked' : ''} />
            <div>
              <strong>${esc(o.label)}</strong>
              <span>${esc(o.description)}</span>
            </div>
          </label>`).join('')}
      </div>
    </div>`;
}

function renderVruConfigPicker(section) {
  if (!section.vruConfiguration) return '';
  const opts = section.vruConfiguration.options;
  return `
    <div class="config-picker">
      <h3>${esc(section.vruConfiguration.prompt)}</h3>
      <div class="config-options">
        ${opts.map(o => `
          <label class="config-option ${state.vruConfig === o.id ? 'selected' : ''}">
            <input type="radio" name="vruConfig" value="${esc(o.id)}"
              ${state.vruConfig === o.id ? 'checked' : ''} />
            <div>
              <strong>${esc(o.label)}</strong>
              <span>${esc(o.description)}</span>
            </div>
          </label>`).join('')}
      </div>
    </div>`;
}

function renderHardwareRow(h) {
  const { part, spec, note, qty, vendor } = formatHardwareEntry(h);
  return `
    <div class="hardware-row">
      <span><span class="hw-qty">×${qty}</span> ${esc(part)}</span>
      <span class="hw-spec">${esc(spec)}${vendor ? ` · ${vendor}` : ''}${note ? ` · ${esc(note)}` : ''}</span>
    </div>`;
}

function renderChapterHardware(section) {
  return `
    <div class="card chapter-hardware">
      <div class="card-header"><span>Hardware for this segment</span></div>
      <div class="hardware-list">
        ${section.chapterHardware.map(h => renderHardwareRow(h)).join('')}
      </div>
    </div>`;
}

function renderHardwareReference({ open = true } = {}) {
  const m3 = HARDWARE_CATALOG['ruthex-m3-57'];
  const m6 = HARDWARE_CATALOG['ruthex-m6-68'];

  return `
    <details class="hw-reference" ${open ? 'open' : ''}>
      <summary>Standard hardware catalog — Ruthex inserts & fasteners</summary>
      <p class="hw-reference-intro">${esc(GUIDE.hardwareKitIntro)}</p>

      <div class="hw-kit-grid">
        <div class="hw-reference-highlight">
          <span class="hw-kit-label">Insert · M3</span>
          <strong>${esc(m3.formalName)}</strong>
          <span class="hw-reference-pn">P/N ${esc(m3.partNumber)}</span>
          <p>M3 · 5.7 mm · <strong>4.0 mm</strong> hole · min 6.7 mm depth · Brass</p>
          <p class="hw-reference-note">Blue arrows · ${esc(m3.usedIn)}</p>
        </div>
        <div class="hw-reference-highlight hw-reference-highlight-m6">
          <span class="hw-kit-label">Insert · M6</span>
          <strong>${esc(m6.formalName)}</strong>
          <span class="hw-reference-pn">P/N ${esc(m6.partNumber)}</span>
          <p>M6 · 6.8 mm · <strong>8.0 mm</strong> hole · min 7.8 mm depth · Brass</p>
          <p class="hw-reference-note">Blue arrows · ${esc(m6.usedIn)}</p>
        </div>
      </div>

      <table class="hw-kit-table">
        <thead><tr><th>Part</th><th>P/N</th><th>Used for</th></tr></thead>
        <tbody>
          ${MASTER_HARDWARE_KIT.map(item => {
            const c = HARDWARE_CATALOG[item.ref];
            return `<tr>
              <td><strong>${esc(c.formalName)}</strong></td>
              <td class="hw-reference-pn">${c.partNumber ? esc(c.partNumber) : '—'}</td>
              <td>${esc(item.note)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>

      <p class="hw-kit-legend"><strong>Annotation legend:</strong>
        <span class="legend-inline"><span class="legend-dot blue"></span> ruthex® insert</span>
        <span class="legend-inline"><span class="legend-dot green"></span> M3×12 dowel</span>
        <span class="legend-inline"><span class="legend-dot yellow"></span> M3×8 cap screw</span>
      </p>
    </details>`;
}

function renderIncompleteBanner(notice) {
  return `
    <div class="incomplete-banner" role="status">
      <strong>⚠ Incomplete list</strong>
      <p>${esc(notice)}</p>
    </div>`;
}

function renderRequiredTools(tools) {
  return `
    <div class="overview-block">
      <h3>${esc(tools.title)}</h3>
      ${tools.intro ? `<p class="overview-lead">${esc(tools.intro)}</p>` : ''}
      <div class="tools-grid">
        ${tools.items.map(tool => {
          const toolImg = mediaSrc(tool);
          return `
          <div class="tool-card">
            <h4>${esc(tool.name)}</h4>
            ${tool.preferred ? `<p class="tool-preferred">${esc(tool.preferred)}</p>` : ''}
            ${tool.detail ? `<p>${esc(tool.detail)}</p>` : ''}
            ${tool.usedFor ? `<p class="tool-used-for"><strong>Used for:</strong> ${esc(tool.usedFor)}</p>` : ''}
            ${toolImg ? `
              <figure class="tool-figure">
                <img class="tool-image" src="${esc(toolImg)}" alt="${esc(tool.imageAlt || tool.name)}" loading="lazy" />
                ${tool.imageAlt ? `<figcaption>${esc(tool.imageAlt)}</figcaption>` : ''}
              </figure>` : ''}
            ${tool.warnings?.length ? `
              <ul class="tool-warnings">
                ${tool.warnings.map(w => `<li>${esc(w)}</li>`).join('')}
              </ul>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderSegmentCards(intro) {
  return `
    <div class="overview-block">
      <h3>Assembly segments</h3>
      ${intro ? `<p class="overview-lead">${esc(intro)}</p>` : ''}
      <div class="segment-grid">
        ${ASSEMBLY_ORDER.map((id, i) => {
          const s = getSection(id);
          const statusLabel = s.status === 'complete' ? 'Ready'
            : s.status === 'in-progress' ? 'In progress'
            : 'Coming soon';
          const badgeClass = s.status === 'complete' ? 'badge-ok'
            : s.status === 'in-progress' ? 'badge-warning'
            : 'badge-soon';
          const hwCount = s.chapterHardware?.length;
          return `
            <div class="segment-card">
              <div class="segment-card-head">
                <span class="segment-num">${i + 1}</span>
                <span class="badge ${badgeClass}">${statusLabel}</span>
              </div>
              <h4>${esc(s.title)}</h4>
              <p class="segment-folder">STL folder: ${esc(s.driveFolder || '—')}</p>
              ${hwCount ? `<p class="segment-hw-note">Section hardware list: ${hwCount} line items documented</p>` : ''}
              ${s.status === 'placeholder' || !s.steps?.length
                ? `<p class="segment-pending">Instructions not published yet.</p>`
                : `<p class="segment-hw-note">Print checklist + step-by-step assembly in this segment.</p>`}
              <button class="btn-primary btn-sm segment-go" type="button" data-section="${id}">
                Open segment →
              </button>
            </div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderOverviewContent(section) {
  const mpl = section.masterPartsList;

  return `
    <div class="section-header">
      <h2>${esc(section.title)} <span class="badge badge-ok">Start here</span></h2>
      ${renderViewerPrompt()}
    </div>

    <div class="overview-block">
      <h3>${esc(section.intro.title)}</h3>
      ${section.intro.paragraphs.map(p => `<p class="overview-lead">${esc(p)}</p>`).join('')}
    </div>

    ${renderRequiredTools(section.requiredTools)}

    <div class="overview-block">
      <h3>${esc(mpl.title)}</h3>
      ${mpl.incomplete ? renderIncompleteBanner(mpl.incompleteNotice) : ''}
      ${renderHardwareReference({ open: true })}
    </div>

    ${renderSegmentCards(section.segmentsIntro)}

    <div class="section-footer">
      <span></span>
      <button class="btn-primary" id="nextSection" type="button">Begin Axio Group →</button>
    </div>`;
}

function bindOverviewEvents() {
  document.querySelectorAll('.segment-go').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.section));
  });
  document.getElementById('nextSection')?.addEventListener('click', () => {
    showSection('axio-group');
  });
  document.querySelectorAll('[data-open-viewer]').forEach(btn => {
    btn.addEventListener('click', () => window.openTmcViewer3d?.());
  });
}

function renderHardwareBlock(step) {
  if (step.hardwareByVruConfig) {
    const items = step.hardwareByVruConfig[state.vruConfig] || [];
    return `
      <div class="detail-block">
        <h4>Hardware</h4>
        ${items.map(h => renderHardwareRow(h)).join('')}
      </div>`;
  }

  if (step.hardware?.length) {
    return `
      <div class="detail-block">
        <h4>Hardware</h4>
        ${step.hardware.map(h => renderHardwareRow(h)).join('')}
      </div>`;
  }

  if (step.hardwarePerPulley) {
    const totals = step.hardwareTotals?.[state.boomConfig];
    return `
      <div class="detail-block">
        <h4>Hardware per pulley</h4>
        ${step.hardwarePerPulley.map(h => renderHardwareRow(h)).join('')}
      </div>
      ${totals ? `
        <div class="detail-block">
          <h4>Total for ${state.boomConfig === 'dual-sheave' ? 'dual' : 'single'} sheave (${totals.pulleys} pulleys)</h4>
          <div class="hardware-row"><span>Bearings</span><span class="hw-qty">×${totals.bearings}</span></div>
          <div class="hardware-row"><span>M3×8 cap screws</span><span class="hw-qty">×${totals['M3×8 screws']}</span></div>
        </div>` : ''}`;
  }

  if (step.hardwarePerSide) {
    let html = `
      <div class="detail-block">
        <h4>Hardware per side (LH or RH)</h4>
        ${step.hardwarePerSide.map(h => renderHardwareRow(h)).join('')}
      </div>`;

    if (step.hardwareTotals) {
      Object.values(step.hardwareTotals).forEach(group => {
        html += `
          <div class="detail-block">
            <h4>${esc(group.label)}</h4>
            ${group.items.map(h => renderHardwareRow(h)).join('')}
          </div>`;
      });
    }
    return html;
  }

  if (step.hardwareTotals && !step.hardwarePerSide && !step.hardwarePerPulley) {
    let html = '';
    Object.values(step.hardwareTotals).forEach(group => {
      html += `
        <div class="detail-block">
          <h4>${esc(group.label)}</h4>
          ${group.items.map(h => renderHardwareRow(h)).join('')}
        </div>`;
    });
    return html;
  }

  return '';
}

function renderStep(step, index, sectionId) {
  if (step.configs && !step.configs.includes(state.boomConfig)) return '';

  const tag = step.required === false
    ? `<span class="step-tag step-tag-optional">${step.recommended ? 'Optional · Recommended' : 'Optional'}</span>`
    : `<span class="step-tag step-tag-required">Required</span>`;

  const legend = step.legend ? `
    <div class="legend">
      ${step.legend.map(l => `
        <span class="legend-item">
          <span class="legend-dot ${l.color}"></span>${esc(l.label)}
        </span>`).join('')}
    </div>` : '';

  const imgSrc = mediaSrc(step);

  return `
    <article class="step-card card${imgSrc ? ' step-card--with-image' : ''}">
      <div class="step-header">
        <div>
          <div class="step-num">Step ${index + 1}</div>
          <div class="step-title">${esc(step.title)}</div>
        </div>
        ${tag}
      </div>
      <div class="step-body">
        <div class="step-visual">
          ${imgSrc ? `
            <button class="step-image-btn" type="button" data-step-image="${esc(imgSrc)}" data-step-image-alt="${esc(step.imageAlt || step.title)}" aria-label="Enlarge assembly image">
              <img class="step-image" src="${esc(imgSrc)}" alt="${esc(step.imageAlt || step.title)}" loading="lazy" />
              <span class="step-image-zoom">Click to enlarge</span>
            </button>
            ${step.imageNote ? `<div class="step-visual-sublabel">${esc(step.imageNote)}</div>` : ''}
            ${legend}` : `
            <div class="step-visual-icon">🖼</div>
            <div class="step-visual-label">${esc(step.imagePlaceholder || 'Add image: set imageDriveId on the step in guide-data.js and register the file in CRANE_DRIVE_IMAGES')}</div>
            ${step.imageNote ? `<div class="step-visual-sublabel">${esc(step.imageNote)}</div>` : ''}
            ${legend}`}
        </div>
        <div class="step-details">
          <p class="step-summary">${esc(step.summary)}</p>
          ${step.warnings?.length ? `
            <div class="step-warning">
              ${step.warnings.map(w => `<p>⚠ ${esc(w)}</p>`).join('')}
            </div>` : ''}
          ${step.blockedUntil?.length ? `
            <div class="step-blocked-until">
              <h4>Complete these first</h4>
              <ul>${step.blockedUntil.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
            </div>` : ''}
          ${step.orientationNotes ? `
            <div class="detail-block">
              <h4>Orientation</h4>
              <ul class="detail-list">${step.orientationNotes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
            </div>` : ''}
          ${step.printedParts?.length ? `
            <div class="detail-block">
              <h4>Printed parts</h4>
              <ul class="detail-list">${step.printedParts.map(p => `<li>×${p.qty} ${esc(p.name)}</li>`).join('')}</ul>
            </div>` : ''}
          ${renderHardwareBlock(step)}
          ${step.checks?.length ? `
            <div class="detail-block">
              <h4>Checks</h4>
              <div class="check-list">
                ${step.checks.map((c, ci) => {
                  const cid = `${sectionId}::${step.id}::${ci}`;
                  const checked = state.stepChecks.has(cid);
                  return `
                    <label>
                      <input type="checkbox" data-step-check="${esc(cid)}" ${checked ? 'checked' : ''} />
                      ${esc(c)}
                    </label>`;
                }).join('')}
              </div>
            </div>` : ''}
          ${step.optionalAddendum ? `
            <div class="detail-block optional-addendum">
              <h4><span class="step-tag step-tag-optional">Optional</span> ${esc(step.optionalAddendum.title)}</h4>
              <p class="step-summary">${esc(step.optionalAddendum.summary)}</p>
              ${step.optionalAddendum.orientationNotes ? `
                <ul class="detail-list">${step.optionalAddendum.orientationNotes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
              ${step.optionalAddendum.hardware?.length ? `
                <div class="hardware-list" style="margin-top:0.75rem">
                  ${step.optionalAddendum.hardware.map(h => renderHardwareRow(h)).join('')}
                </div>` : ''}
              ${step.optionalAddendum.checks?.length ? `
                <div class="check-list" style="margin-top:0.75rem">
                  ${step.optionalAddendum.checks.map((c, ci) => {
                    const cid = `${sectionId}::${step.id}::opt::${ci}`;
                    const checked = state.stepChecks.has(cid);
                    return `
                      <label>
                        <input type="checkbox" data-step-check="${esc(cid)}" ${checked ? 'checked' : ''} />
                        ${esc(c)}
                      </label>`;
                  }).join('')}
                </div>` : ''}
            </div>` : ''}
        </div>
      </div>
    </article>`;
}

function renderSectionContent(section) {
  if (section.kind === 'overview') {
    return renderOverviewContent(section);
  }

  if (section.status === 'placeholder' || !section.steps?.length) {
    return `
      <div class="placeholder-box">
        <h3>${esc(section.title)}</h3>
        <p>${esc(section.placeholderMessage || 'Content coming soon.')}</p>
        <p style="margin-top:1rem;font-size:0.85rem">Drive folder: <code>${esc(section.driveFolder)}</code></p>
      </div>`;
  }

  const steps = section.steps
    .map((s, i) => renderStep(s, i, section.id))
    .filter(Boolean);

  const statusBadge = section.status === 'complete'
    ? '<span class="badge badge-ok">Content ready</span>'
    : '<span class="badge badge-warning">In progress</span>';

  const printPanel = section.printParts?.length || section.id === 'boom'
    ? renderPrintList(section) : '';

  const methodCallout = section.assemblyMethod ? `
    <div class="config-picker" style="border-color: var(--accent);">
      <h3>${esc(section.assemblyMethod.title)}</h3>
      <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:0.75rem">${esc(section.assemblyMethod.summary)}</p>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
        ${section.assemblyMethod.sides.map(s => `<span class="chip">${esc(s)}</span>`).join('')}
      </div>
    </div>` : '';

  const criticalBanner = section.criticalBanner ? `
    <div class="critical-banner" role="alert">
      <div class="critical-banner-title">⛔ ${esc(section.criticalBanner.title)}</div>
      <ul class="critical-banner-list">
        ${section.criticalBanner.lines.map(l => `<li>${esc(l)}</li>`).join('')}
      </ul>
    </div>` : '';

  const prerequisites = section.prerequisitesBeforeExtrusions ? `
    <div class="prerequisites-box">
      <h3>Before mounting to extrusions — confirm all of these:</h3>
      <ul class="prerequisites-list">
        ${section.prerequisitesBeforeExtrusions.map(p => `<li>${esc(p)}</li>`).join('')}
      </ul>
    </div>` : '';

  const assemblyNote = section.assemblyNote ? `
    <div class="section-assembly-note">${esc(section.assemblyNote)}</div>` : '';

  const printingGuidance = section.printingGuidance ? `
    <div class="prerequisites-box" style="border-color: var(--warning-border, #e6c200); background: var(--warning-bg, #fffbeb);">
      <h3>${esc(section.printingGuidance.title)}</h3>
      <ul class="prerequisites-list">
        ${section.printingGuidance.lines.map(l => `<li>${esc(l)}</li>`).join('')}
      </ul>
    </div>` : '';

  return `
    <div class="section-header">
      <h2>${esc(section.title)} ${statusBadge}</h2>
      <div class="section-meta">Drive folder: ${esc(section.driveFolder)}</div>
      ${assemblyNote}
      ${printingGuidance}
      ${criticalBanner}
      ${prerequisites}
      ${renderViewerPrompt()}
    </div>

    ${section.configuration ? renderConfigPicker(section) : ''}
    ${section.vruConfiguration ? renderVruConfigPicker(section) : ''}
    ${section.chapterHardware?.length ? renderChapterHardware(section) : ''}
    ${methodCallout}

    <div class="tabs">
      <button class="tab-btn ${state.currentTab === 'assemble' ? 'active' : ''}" data-tab="assemble" type="button">Assemble</button>
      <button class="tab-btn ${state.currentTab === 'print' ? 'active' : ''}" data-tab="print" type="button">Print checklist</button>
    </div>

    <div class="panel ${state.currentTab === 'assemble' ? 'active' : ''}" id="panel-assemble">
      ${steps.join('')}
    </div>
    <div class="panel ${state.currentTab === 'print' ? 'active' : ''}" id="panel-print">
      ${printPanel || '<p style="color:var(--text-muted)">No print list for this section yet.</p>'}
    </div>

    <div class="section-footer">
      <button class="btn-secondary" id="prevSection" type="button">← Previous segment</button>
      <button class="btn-secondary btn-mark-complete ${state.completedSections.has(section.id) ? 'is-done' : ''}" id="markComplete" type="button">
        ${state.completedSections.has(section.id) ? '✓ Segment complete' : 'Mark segment complete'}
      </button>
      <button class="btn-primary" id="nextSection" type="button">Next segment →</button>
    </div>`;
}

function bindSectionEvents(section) {
  document.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      state.currentTab = tab.dataset.tab;
      persist();
      const hash = state.currentTab === 'assemble'
        ? `#${section.id}`
        : `#${section.id}/${state.currentTab}`;
      history.replaceState(null, '', hash);
      render();
    });
  });

  document.querySelectorAll('[data-print-id]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) state.printedChecks.add(cb.dataset.printId);
      else state.printedChecks.delete(cb.dataset.printId);
      persist();
      render();
    });
  });

  document.querySelectorAll('[data-step-check]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) state.stepChecks.add(cb.dataset.stepCheck);
      else state.stepChecks.delete(cb.dataset.stepCheck);
      persist();
    });
  });

  document.querySelectorAll('input[name="boomConfig"]').forEach(radio => {
    radio.addEventListener('change', () => {
      state.boomConfig = radio.value;
      persist();
      render();
    });
  });

  document.querySelectorAll('input[name="vruConfig"]').forEach(radio => {
    radio.addEventListener('change', () => {
      state.vruConfig = radio.value;
      persist();
      render();
    });
  });

  document.getElementById('markComplete')?.addEventListener('click', () => {
    if (state.completedSections.has(section.id)) {
      state.completedSections.delete(section.id);
    } else {
      state.completedSections.add(section.id);
    }
    persist();
    render();
  });

  const idx = NAV_ORDER.indexOf(section.id);
  document.getElementById('prevSection')?.addEventListener('click', () => {
    if (idx > 0) showSection(NAV_ORDER[idx - 1]);
  });
  document.getElementById('nextSection')?.addEventListener('click', () => {
    if (idx < NAV_ORDER.length - 1) showSection(NAV_ORDER[idx + 1]);
  });

  document.querySelectorAll('[data-open-viewer]').forEach(btn => {
    btn.addEventListener('click', () => window.openTmcViewer3d?.());
  });

  bindStepImageZoom();
}

function showSection(id, tab = 'assemble') {
  state.currentSection = id;
  const section = getSection(id);
  if (section?.kind === 'overview') {
    state.currentTab = 'assemble';
  } else {
    state.currentTab = tab;
  }
  persist();
  const hash = state.currentTab === 'assemble' || section?.kind === 'overview'
    ? `#${id}`
    : `#${id}/${state.currentTab}`;
  history.replaceState(null, '', hash);
  render();
}

function parseLocationHash() {
  const raw = location.hash.replace(/^#/, '').trim();
  if (!raw) return null;
  const [sectionId, tab] = raw.split('/');
  if (!NAV_ORDER.includes(sectionId)) return null;
  const section = getSection(sectionId);
  if (section?.kind === 'overview') {
    return { sectionId, tab: 'assemble' };
  }
  const validTab = tab === 'print' || tab === 'assemble' ? tab : 'assemble';
  return { sectionId, tab: validTab };
}

function render() {
  renderSidebar();
  updateProgress();

  const main = document.getElementById('main');
  const welcome = document.getElementById('welcome');
  let sectionRoot = document.getElementById('section-root');

  if (!state.currentSection) {
    welcome.hidden = false;
    if (sectionRoot) sectionRoot.hidden = true;
    return;
  }

  welcome.hidden = true;
  if (!sectionRoot) {
    sectionRoot = document.createElement('div');
    sectionRoot.id = 'section-root';
    main.appendChild(sectionRoot);
  }
  sectionRoot.hidden = false;

  const section = getSection(state.currentSection);
  if (!section) {
    state.currentSection = null;
    persist();
    render();
    return;
  }

  sectionRoot.innerHTML = renderSectionContent(section);
  if (section.kind === 'overview') {
    bindOverviewEvents();
  } else {
    bindSectionEvents(section);
  }
}

function bindCraneUi() {
  var app = document.getElementById('app');
  if (app) {
    app.addEventListener('click', function (e) {
      var sectionBtn = e.target.closest('[data-crane-section]');
      if (sectionBtn) {
        e.preventDefault();
        showSection(sectionBtn.getAttribute('data-crane-section'));
        return;
      }
      var viewerBtn = e.target.closest('[data-crane-viewer]');
      if (viewerBtn) {
        e.preventDefault();
        if (window.openTmcViewer3d) window.openTmcViewer3d();
      }
    });
  }

  var deepLink = parseLocationHash();
  if (deepLink) {
    state.currentSection = deepLink.sectionId;
    state.currentTab = deepLink.tab;
  } else if (!state.currentSection) {
    showSection('overview');
  }

  render();
  initViewer3d();
  initImageLightbox();

  window.addEventListener('hashchange', function () {
    var link = parseLocationHash();
    if (link) {
      state.currentSection = link.sectionId;
      state.currentTab = link.tab;
      render();
    }
  });
}

function startCraneApp() {
  if (!window.TmcAccess) {
    document.body.classList.remove('access-locked');
    bindCraneUi();
    return;
  }
  window.TmcAccess.initGate(function () {
    bindCraneUi();
  });
}

startCraneApp();
})();
