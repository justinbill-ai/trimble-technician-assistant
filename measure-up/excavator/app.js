/* Excavator Measure-Up — calculator UI */

var DEALER_LOGO_KEY = 'tta_preinspection_dealer_logo_v1';

var DEALER_NAME_KEY = 'tta_preinspection_dealer_name_v1';



var BASE_REQUIRED = ['BB', 'CT1', 'CT2', 'G', 'CL'];

var lastResponse = null;

var dealerLogo = null;

var scene, camera, renderer, controls;

var vizAnimFrame = null;



var MACHINE_RESULT_KEYS = [

  'Receiver bracket bolt to pivot point',

  'Reciever Bracket to Centerline',

  'Pivot point to plumb bob',

];



var ATTACHMENT_RESULT_KEYS = [

  'Pivot Point to Attachment Cutting Edge',

  'Attachment Cutting Edge to Plumb Bob',

  'Attachment Width',

];



function esc(s) {

  if (s == null) return '';

  return String(s)

    .replace(/&/g, '&amp;')

    .replace(/</g, '&lt;')

    .replace(/>/g, '&gt;')

    .replace(/"/g, '&quot;')

    .replace(/'/g, '&#39;');

}



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

    alert('Could not copy automatically. Select the number in the Result column and copy manually.');

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



function buildSectionRowHtml(title) {

  return '<tr class="mu-res-section"><td colspan="3">' + esc(title) + '</td></tr>';

}



function buildResultRowHtml(label, valueStr) {

  var enc = encodeURIComponent(String(valueStr));

  return (

    '<tr><td class="mu-res-label">' +

    esc(label) +

    '</td><td class="mu-res-value">' +

    esc(valueStr) +

    '</td><td class="mu-res-copy"><button type="button" class="copy-res-btn" data-copy="' +

    enc +

    '" aria-label="Copy result for ' +

    esc(label) +

    '">Copy</button></td></tr>'

  );

}



function updateSelectPendingClass() {

  var cl = document.getElementById('centerlineMethod');

  var wm = document.getElementById('widthMethod');

  if (!cl || !wm) return;

  cl.classList.toggle('mu-select--pending', !cl.value);

  wm.classList.toggle('mu-select--pending', !wm.value);

}



function syncMeasureUpGate(csvPointsComplete) {

  var cl = document.getElementById('centerlineMethod').value;

  var wm = document.getElementById('widthMethod').value;

  var methodsOk = !!(cl && wm);

  var manualOk = true;

  if (cl === 'Manual') {

    var mv = document.getElementById('manualCenterlineVal').value;

    var mvv = parseFloat(mv);

    manualOk = mv !== '' && !isNaN(mvv) && mvv > 0;

  }

  if (wm === 'Manual') {

    var wv = document.getElementById('manualWidthVal').value;

    var wvv = parseFloat(wv);

    manualOk = manualOk && wv !== '' && !isNaN(wvv) && wvv > 0;

  }

  var fileOk = document.getElementById('csvFile').files.length > 0;

  var runReady = methodsOk && manualOk && fileOk && !!csvPointsComplete;



  document.getElementById('calcBtn').disabled = !runReady;



  var el = document.getElementById('measurementFunnelBanner');

  if (!methodsOk) {

    el.className = 'mu-funnel';

    el.innerHTML =

      '<strong>Step 1</strong> — Choose <b>receiver-to-centerline</b> and <b>attachment width</b> using the two dropdowns below. Pick <b>Total station</b> only if those points are in the CSV; pick <b>Manual tape</b> if you measured with a tape.';

  } else if (!manualOk) {

    el.className = 'mu-funnel';

    el.innerHTML =

      '<strong>Step 2</strong> — Enter the <b>tape measurements</b> in the fields below for each row you set to <b>Manual</b> (positive numbers required).';

  } else if (!fileOk) {

    el.className = 'mu-funnel';

    el.innerHTML =

      '<strong>Step 3</strong> — Upload your survey <b>CSV</b>. Required points: <b>BB, CT1, CT2, G, CL</b> plus BL/BR or CR depending on your method choices.';

  } else if (!csvPointsComplete) {

    var parts = [];

    if (cl === 'Total Station') parts.push('<b>BL</b> and <b>BR</b> in the CSV (total station centerline)');

    if (wm === 'Total Station') parts.push('<b>CR</b> in the CSV (total station width)');

    el.className = 'mu-funnel';

    if (!parts.length) {

      el.innerHTML =

        '<strong>Step 3</strong> — This file is missing one or more required points (<b>BB, CT1, CT2, G, CL</b>). Check names, spelling, and CSV format.';

    } else {

      el.innerHTML =

        '<strong>Step 3</strong> — This file is missing: ' +

        parts.join(' and ') +

        '. Either add those points to the CSV, or change the matching dropdown to <b>Manual</b> and type the tape measurement(s).';

    }

  } else {

    el.className = 'mu-funnel mu-funnel--ok';

    el.innerHTML =

      '<strong>Ready</strong> — Methods, manual values (if any), and required CSV points are satisfied. Tap <b>Run calculations</b>.';

  }

}



function refreshCalcGate() {

  var fi = document.getElementById('csvFile');

  if (fi.files.length > 0) parseCSVForPreview(fi.files[0]);

  else {

    document.getElementById('pointCheckList').innerHTML = '';

    hideViz();

    syncMeasureUpGate(false);

  }

}



function csvPreviewErrorMessage(parsed) {

  if (parsed.error === 'Header columns not identified') {

    return 'Header detected, but required columns were not identified.';

  }

  if (parsed.error === 'Empty file') return 'CSV file is empty.';

  return parsed.error;

}



function showCsvPreviewError(message) {

  document.getElementById('pointCheckList').innerHTML = '';

  hideViz();

  var errorBox = document.getElementById('errorBox');

  errorBox.textContent = message;

  errorBox.hidden = false;

  syncMeasureUpGate(false);

}



function toggleCenterlineInputs() {

  var method = document.getElementById('centerlineMethod').value;

  document.getElementById('centerlineHintTS').classList.toggle('visible', method === 'Total Station');

  document.getElementById('centerlineHintManual').classList.toggle('visible', method === 'Manual');

  document.getElementById('offsetGroup').hidden = method !== 'Total Station';

  document.getElementById('manualCenterlineGroup').hidden = method !== 'Manual';

  updateSelectPendingClass();

  refreshCalcGate();

}



function toggleWidthInputs() {

  var method = document.getElementById('widthMethod').value;

  document.getElementById('widthHintTS').classList.toggle('visible', method === 'Total Station');

  document.getElementById('widthHintManual').classList.toggle('visible', method === 'Manual');

  document.getElementById('manualWidthGroup').hidden = method !== 'Manual';

  updateSelectPendingClass();

  refreshCalcGate();

}



function updateOffset() {

  var u = document.getElementById('units').value;

  var val = u === 'US FT' ? '0.030' : '0.009';

  document.getElementById('offset').value = val;

  document.getElementById('manualCenterlineOffset').value = val;

  refreshCalcGate();

}



function validateInput(el) {

  if (el.value !== '' && !isNaN(el.value)) {

    el.classList.add('valid');

    el.classList.remove('invalid');

  } else {

    el.classList.add('invalid');

    el.classList.remove('valid');

  }

}



function parseCSVForPreview(file) {

  var methodCL = document.getElementById('centerlineMethod').value;

  var widthMethod = document.getElementById('widthMethod').value;

  var csvFormat = document.getElementById('csvFormat').value;



  var reader = new FileReader();

  reader.onload = function (e) {

    if (!methodCL || !widthMethod) {

      document.getElementById('pointCheckList').innerHTML =

        '<p class="note">Choose both <b>measurement methods</b> above first. The checklist will then list the exact CSV points required.</p>';

      hideViz();

      syncMeasureUpGate(false);

      return;

    }



    var parsed = ExcavatorMeasureUpCalc.parseSurveyPoints(e.target.result, csvFormat);

    if (parsed.error) {

      showCsvPreviewError(csvPreviewErrorMessage(parsed));

      return;

    }



    document.getElementById('errorBox').hidden = true;

    var foundPoints = parsed.foundPoints;

    var currentRequired = BASE_REQUIRED.slice();

    if (methodCL === 'Total Station') currentRequired.push('BL', 'BR');

    if (widthMethod === 'Total Station') currentRequired.push('CR');



    var allFound = true;

    document.getElementById('pointCheckList').innerHTML = '';

    currentRequired.forEach(function (pt) {

      var badge = document.createElement('div');

      badge.className = 'pt-badge';

      if (foundPoints[pt]) {

        badge.classList.add('found');

        badge.textContent = pt + ' ✓';

      } else {

        badge.classList.add('missing');

        badge.textContent = pt + ' ✗';

        allFound = false;

      }

      document.getElementById('pointCheckList').appendChild(badge);

    });



    if (widthMethod === 'Manual') {

      var opt = document.createElement('div');

      opt.className = 'pt-badge';

      opt.textContent = foundPoints['CR'] ? 'CR (opt) ✓' : 'CR (opt) —';

      if (foundPoints['CR']) opt.classList.add('found');

      document.getElementById('pointCheckList').appendChild(opt);

    }



    syncMeasureUpGate(allFound);

    if (Object.keys(foundPoints).length > 0) init3D(foundPoints);

  };

  reader.readAsText(file);

}



function hideViz() {

  var container = document.getElementById('viz-container');

  if (container) container.style.display = 'none';

  disposeVizRenderer();

}



function disposeVizRenderer() {

  if (vizAnimFrame != null) {

    cancelAnimationFrame(vizAnimFrame);

    vizAnimFrame = null;

  }

  if (scene) {

    scene.traverse(function (obj) {

      if (obj.geometry) obj.geometry.dispose();

      if (obj.material) {

        var mats = Array.isArray(obj.material) ? obj.material : [obj.material];

        mats.forEach(function (m) {

          if (m.map) m.map.dispose();

          m.dispose();

        });

      }

    });

  }

  scene = null;

  if (renderer) {

    try {

      renderer.dispose();

    } catch (e) {}

    renderer = null;

  }

  controls = null;

  camera = null;

}



function init3D(points) {

  if (typeof THREE === 'undefined') return;

  disposeVizRenderer();

  var container = document.getElementById('viz-container');

  container.innerHTML =

    '<div id="viz-overlay">Mouse: rotate / zoom / pan</div>' +

    '<div id="viz-legend"><span class="mu-legend-pt">● Points</span> <span class="mu-legend-hdg">➞ Heading</span></div>';

  container.style.display = 'block';

  scene = new THREE.Scene();

  scene.background = new THREE.Color(0xffffff);

  camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);

  camera.position.set(0, 5, 12);

  camera.up.set(0, 0, 1);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  renderer.setSize(container.clientWidth, container.clientHeight);

  if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;

  container.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xe8eaed, 0.92));

  var dir = new THREE.DirectionalLight(0xffffff, 0.38);

  dir.position.set(6, 10, 14);

  scene.add(dir);

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;

  controls.dampingFactor = 0.06;

  var avgN = 0;

  var avgE = 0;

  var avgZ = 0;

  var count = 0;

  for (var key in points) {

    avgN += points[key].n;

    avgE += points[key].e;

    avgZ += points[key].z;

    count++;

  }

  if (count > 0) {

    avgN /= count;

    avgE /= count;

    avgZ /= count;

  }

  var sphereGeomTemplate = new THREE.SphereGeometry(0.055, 40, 40);

  var sphereMatTemplate = new THREE.MeshStandardMaterial({

    color: 0x005f9e,

    roughness: 0.38,

    metalness: 0.08,

  });

  for (var k in points) {

    var pt = points[k];

    var x = pt.e - avgE;

    var y = pt.n - avgN;

    var z = pt.z - avgZ;

    var sphere = new THREE.Mesh(sphereGeomTemplate.clone(), sphereMatTemplate.clone());

    sphere.position.set(x, y, z);

    scene.add(sphere);

    var sprite = makeTextSprite(k, renderer);

    sprite.position.set(x, y, z + 0.18);

    sprite.renderOrder = 10;

    scene.add(sprite);

  }

  sphereGeomTemplate.dispose();

  sphereMatTemplate.dispose();

  if (points['CT1'] && points['CT2']) {

    var p1 = points['CT1'];

    var p2 = points['CT2'];

    var o = new THREE.Vector3(p1.e - avgE, p1.n - avgN, p1.z - avgZ);

    var t = new THREE.Vector3(p2.e - avgE, p2.n - avgN, p2.z - avgZ);

    scene.add(

      new THREE.ArrowHelper(

        new THREE.Vector3().subVectors(t, o).normalize(),

        o,

        o.distanceTo(t) + 1.6,

        0xfbad26,

        0.85,

        0.42

      )

    );

  }

  function animate() {

    vizAnimFrame = requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene, camera);

  }

  animate();

}



function fillRoundRect(ctx, x, y, w, h, r) {

  r = Math.min(r, w / 2, h / 2);

  if (r <= 0) {

    ctx.rect(x, y, w, h);

    return;

  }

  ctx.beginPath();

  ctx.moveTo(x + r, y);

  ctx.arcTo(x + w, y, x + w, y + h, r);

  ctx.arcTo(x + w, y + h, x, y + h, r);

  ctx.arcTo(x, y + h, x, y, r);

  ctx.arcTo(x, y, x + w, y, r);

  ctx.closePath();

}



function makeTextSprite(message, threeRenderer) {

  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var padX = 10 * dpr;

  var padY = 6 * dpr;

  var fontPx = Math.round(20 * dpr);

  var cvs = document.createElement('canvas');

  var ctx = cvs.getContext('2d');

  ctx.font = '600 ' + fontPx + 'px "Open Sans", sans-serif';

  var textW = ctx.measureText(message).width;

  var lineH = Math.round(fontPx * 1.25);

  var rw = Math.ceil(textW + padX * 2);

  var rh = Math.ceil(lineH + padY * 2);

  cvs.width = rw;

  cvs.height = rh;

  ctx.font = '600 ' + fontPx + 'px "Open Sans", sans-serif';

  ctx.textBaseline = 'middle';

  var radius = 4 * dpr;

  ctx.fillStyle = 'rgba(255,255,255,0.97)';

  fillRoundRect(ctx, 0.5 * dpr, 0.5 * dpr, rw - dpr, rh - dpr, radius);

  ctx.fill();

  ctx.strokeStyle = '#e0e1e9';

  ctx.lineWidth = Math.max(1, dpr);

  fillRoundRect(ctx, 0.5 * dpr, 0.5 * dpr, rw - dpr, rh - dpr, radius);

  ctx.stroke();

  ctx.fillStyle = '#005f9e';

  ctx.fillText(message, padX, rh / 2);

  var tex = new THREE.Texture(cvs);

  tex.needsUpdate = true;

  tex.minFilter = THREE.LinearFilter;

  tex.magFilter = THREE.LinearFilter;

  if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;

  if (threeRenderer && threeRenderer.capabilities && threeRenderer.capabilities.getMaxAnisotropy) {

    tex.anisotropy = threeRenderer.capabilities.getMaxAnisotropy();

  }

  var mat = new THREE.SpriteMaterial({

    map: tex,

    transparent: true,

    depthTest: true,

    depthWrite: false,

  });

  var sp = new THREE.Sprite(mat);

  var scaleFac = 42 * dpr;

  sp.scale.set(rw / scaleFac, rh / scaleFac, 1);

  return sp;

}



function handleFile(file, dropZone) {

  dropZone.querySelector('.drop-zone__prompt').innerHTML = '✅ <b>' + esc(file.name) + '</b>';

  dropZone.style.borderColor = 'var(--tc-success)';

  if (window.WorkspaceApi) {

    window.WorkspaceApi.logEvent('csv_uploaded', { detail: file.name });

  }

  parseCSVForPreview(file);

}



function runCalc() {

  var file = document.getElementById('csvFile').files[0];

  var cl = document.getElementById('centerlineMethod').value;

  var wm = document.getElementById('widthMethod').value;

  if (!cl || !wm) {

    alert('Choose receiver-to-centerline and attachment width methods first.');

    return;

  }

  if (cl === 'Manual') {

    var mv = parseFloat(document.getElementById('manualCenterlineVal').value);

    if (!document.getElementById('manualCenterlineVal').value || isNaN(mv) || mv <= 0) {

      alert('Enter the full stick width (BL to BR) for manual centerline.');

      return;

    }

  }

  if (wm === 'Manual') {

    var wv = parseFloat(document.getElementById('manualWidthVal').value);

    if (!document.getElementById('manualWidthVal').value || isNaN(wv) || wv <= 0) {

      alert('Enter the measured attachment width for manual width.');

      return;

    }

  }

  if (!file) {

    alert('Upload a survey CSV first.');

    return;

  }



  var calcBtn = document.getElementById('calcBtn');

  var errorBox = document.getElementById('errorBox');

  errorBox.hidden = true;

  calcBtn.textContent = 'Calculating…';



  var reader = new FileReader();

  reader.onload = function (e) {

    try {

      var response = ExcavatorMeasureUpCalc.calculateForWeb(

        e.target.result,

        document.getElementById('units').value,

        parseFloat(document.getElementById('offset').value),

        document.getElementById('widthMethod').value,

        document.getElementById('manualWidthVal').value,

        document.getElementById('csvFormat').value,

        document.getElementById('centerlineMethod').value,

        document.getElementById('manualCenterlineVal').value,

        document.getElementById('manualCenterlineOffset').value

      );



      lastResponse = response;

      var body = document.getElementById('resBody');

      body.innerHTML = '';

      var calcs = response.calculations;



      body.innerHTML += buildSectionRowHtml('Machine Measurement');

      MACHINE_RESULT_KEYS.forEach(function (rk) {

        if (calcs[rk] != null) body.innerHTML += buildResultRowHtml(rk, calcs[rk]);

      });



      body.innerHTML += buildSectionRowHtml('Pivot Point Measurement — attachment');

      ATTACHMENT_RESULT_KEYS.forEach(function (rk) {

        if (calcs[rk] != null) body.innerHTML += buildResultRowHtml(rk, calcs[rk]);

      });



      var rk;

      for (rk in calcs) {

        if (!Object.prototype.hasOwnProperty.call(calcs, rk)) continue;

        if (MACHINE_RESULT_KEYS.indexOf(rk) !== -1 || ATTACHMENT_RESULT_KEYS.indexOf(rk) !== -1) continue;

        body.innerHTML += buildResultRowHtml(rk, calcs[rk]);

      }



      document.getElementById('results').hidden = false;

      showExportSection(true);

      calcBtn.textContent = 'Run calculations';

      if (window.WorkspaceApi) {

        window.WorkspaceApi.logCalcRun('ok');

        window.WorkspaceApi.logEvent('csv_analyzed:ok', { detail: 'excavator-measure-up' });

      }

      if (response.vizPoints) init3D(response.vizPoints);

    } catch (err) {

      errorBox.textContent = err.message || String(err);

      errorBox.hidden = false;

      calcBtn.textContent = 'Run calculations';

      if (window.WorkspaceApi) {

        window.WorkspaceApi.logCalcRun('fail', err.message || String(err));

        window.WorkspaceApi.logEvent('csv_analyzed:fail', {

          detail: 'excavator-measure-up:' + (err.message || String(err)),

        });

      }

    }

  };

  reader.onerror = function () {

    errorBox.textContent = 'Could not read the CSV file.';

    errorBox.hidden = false;

    calcBtn.textContent = 'Run calculations';

  };

  reader.readAsText(file);

}



function showExportHints(message) {

  var box = document.getElementById('exportHintBox');

  if (!box) return;

  box.textContent = message || '';

  box.classList.toggle('hidden', !message);

}



function showExportSection(show) {

  var prompt = document.getElementById('exportPrompt');

  if (prompt) prompt.hidden = !show;

  if (!show) hideExportPanel();

  if (show && window.ReportUpload) window.ReportUpload.injectCheckboxes();

}



function hideExportPanel() {

  var section = document.getElementById('exportSection');

  var toggle = document.getElementById('exportReportToggle');

  if (section) section.hidden = true;

  if (toggle) toggle.setAttribute('aria-expanded', 'false');

}



function toggleExportPanel() {

  var section = document.getElementById('exportSection');

  var toggle = document.getElementById('exportReportToggle');

  if (!section || !toggle) return;

  var open = section.hidden;

  section.hidden = !open;

  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');

  if (open) {

    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (window.ReportUpload) window.ReportUpload.injectCheckboxes();

  }

}



function getExportPayload() {

  var reportName = document.getElementById('reportName').value.trim();

  var meta = lastResponse.meta || {};

  var machineModel = document.getElementById('machineModel').value.trim();

  var serialNumber = document.getElementById('serialNumber').value.trim();

  return {

    calculations: lastResponse.calculations,

    meta: {

      time: meta.time,

      units: meta.units,

      machine: 'Excavator',

      model: machineModel || meta.model || 'N/A',

      serial: serialNumber || meta.serial || 'N/A',

    },

    dealerName: document.getElementById('dealerName').value.trim(),

    techName: document.getElementById('techName').value.trim(),

    dealerLogo: dealerLogo,

    reportName: reportName,

    reportTitle: reportName || 'Excavator Measure-Up',

    generatedAt: meta.time || new Date().toLocaleString(),

  };

}



function generateReport() {

  if (!lastResponse) return;

  try {

    var payload = getExportPayload();

    ExcavatorMeasureUpPdf.exportPdf(payload);

    showExportHints('In the print dialog, choose Save as PDF and pick a folder on this device.');

    if (window.ReportUpload) {

      window.ReportUpload.afterPdfExport({

        reportType: 'excavator-measure-up',

        html: ExcavatorMeasureUpPdf.buildHtml(payload),

        fileName: 'excavator-measure-up',

        dealerName: payload.dealerName,

        techName: payload.techName,

        machineModel: payload.meta && payload.meta.model,

        serialNumber: payload.meta && payload.meta.serial,

        reportName: payload.reportName,

      });

    }

  } catch (err) {

    alert(err.message || 'PDF export failed.');

  }

}



function uploadDealerLogo() {

  document.getElementById('dealerLogoInput').click();

}



function clearDealerLogo() {

  dealerLogo = null;

  try {

    localStorage.removeItem(DEALER_LOGO_KEY);

  } catch (err) {}

  renderDealerLogoPreview();

  document.getElementById('dealerLogoSavedNote').classList.add('hidden');

}



function renderDealerLogoPreview() {

  var box = document.getElementById('dealerLogoPreview');

  var clearBtn = document.getElementById('clearDealerLogoBtn');

  if (!box) return;

  if (dealerLogo) {

    box.className = 'dealer-logo-preview';

    box.innerHTML = '<img src="' + dealerLogo.dataUrl + '" alt="Dealer logo">';

    if (clearBtn) clearBtn.classList.remove('hidden');

  } else {

    box.className = 'dealer-logo-preview dealer-logo-preview--empty';

    box.textContent = 'No dealer logo';

    if (clearBtn) clearBtn.classList.add('hidden');

  }

}



function loadSavedDealerBranding() {

  try {

    var raw = localStorage.getItem(DEALER_LOGO_KEY);

    if (raw) dealerLogo = JSON.parse(raw);

    var name = localStorage.getItem(DEALER_NAME_KEY);

    var dealerField = document.getElementById('dealerName');

    if (name && dealerField && !dealerField.value) dealerField.value = name;

    if (dealerLogo) {

      document.getElementById('dealerLogoSavedNote').classList.remove('hidden');

    }

  } catch (err) {}

  renderDealerLogoPreview();

}



function handleDealerLogoFile(file) {

  if (!file || file.type.indexOf('image/') !== 0) return;

  var reader = new FileReader();

  reader.onload = function (e) {

    dealerLogo = { name: file.name, dataUrl: e.target.result };

    try {

      localStorage.setItem(DEALER_LOGO_KEY, JSON.stringify(dealerLogo));

      document.getElementById('dealerLogoSavedNote').classList.remove('hidden');

    } catch (err) {

      alert('Logo saved for this report only — device storage may be full.');

    }

    renderDealerLogoPreview();

  };

  reader.readAsDataURL(file);

}



function bindDropZone() {

  document.querySelectorAll('.drop-zone__input').forEach(function (inputElement) {

    var dropZoneElement = inputElement.closest('.drop-zone');

    dropZoneElement.addEventListener('click', function () {

      inputElement.click();

    });

    inputElement.addEventListener('change', function () {

      if (inputElement.files[0]) handleFile(inputElement.files[0], dropZoneElement);

    });

    dropZoneElement.addEventListener('dragover', function (e) {

      e.preventDefault();

      dropZoneElement.classList.add('dragover');

    });

    dropZoneElement.addEventListener('dragleave', function () {

      dropZoneElement.classList.remove('dragover');

    });

    dropZoneElement.addEventListener('drop', function (e) {

      e.preventDefault();

      dropZoneElement.classList.remove('dragover');

      if (e.dataTransfer.files.length) {

        inputElement.files = e.dataTransfer.files;

        handleFile(e.dataTransfer.files[0], dropZoneElement);

      }

    });

  });

}



function bindCalcUi() {

  updateOffset();

  toggleCenterlineInputs();

  toggleWidthInputs();

  loadSavedDealerBranding();

  bindDropZone();



  document.getElementById('centerlineMethod').addEventListener('change', toggleCenterlineInputs);

  document.getElementById('widthMethod').addEventListener('change', toggleWidthInputs);

  document.getElementById('units').addEventListener('change', updateOffset);

  document.getElementById('csvFormat').addEventListener('change', refreshCalcGate);

  document.getElementById('calcBtn').addEventListener('click', runCalc);



  var generatePdfBtn = document.getElementById('generatePdfBtn');

  if (generatePdfBtn) generatePdfBtn.addEventListener('click', generateReport);

  var exportToggle = document.getElementById('exportReportToggle');

  if (exportToggle) exportToggle.addEventListener('click', toggleExportPanel);

  var uploadLogoBtn = document.getElementById('uploadDealerLogoBtn');

  if (uploadLogoBtn) uploadLogoBtn.addEventListener('click', uploadDealerLogo);

  var clearLogoBtn = document.getElementById('clearDealerLogoBtn');

  if (clearLogoBtn) clearLogoBtn.addEventListener('click', clearDealerLogo);



  var dealerLogoInput = document.getElementById('dealerLogoInput');

  if (dealerLogoInput) {

    dealerLogoInput.addEventListener('change', function () {

      if (this.files && this.files[0]) handleDealerLogoFile(this.files[0]);

      this.value = '';

    });

  }



  var dealerName = document.getElementById('dealerName');

  if (dealerName) {

    dealerName.addEventListener('change', function () {

      try {

        var v = this.value.trim();

        if (v) localStorage.setItem(DEALER_NAME_KEY, v);

        else localStorage.removeItem(DEALER_NAME_KEY);

      } catch (err) {}

    });

  }



  ['manualCenterlineVal', 'manualWidthVal', 'offset', 'manualCenterlineOffset'].forEach(function (id) {

    var el = document.getElementById(id);

    if (el) {

      el.addEventListener('input', function () {

        validateInput(el);

        refreshCalcGate();

      });

    }

  });



  document.getElementById('resBody').addEventListener('click', function (e) {

    var btn = e.target.closest('.copy-res-btn');

    if (!btn) return;

    var enc = btn.getAttribute('data-copy');

    if (enc == null) return;

    var text;

    try {

      text = decodeURIComponent(enc);

    } catch (err) {

      text = enc;

    }

    copyResultValue(text, btn);

  });



  window.addEventListener('resize', function () {

    var container = document.getElementById('viz-container');

    if (!renderer || !camera || !container || container.style.display === 'none') return;

    camera.aspect = container.clientWidth / container.clientHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(container.clientWidth, container.clientHeight);

  });



  syncMeasureUpGate(false);

}


