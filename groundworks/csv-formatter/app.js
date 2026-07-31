(function () {
  'use strict';

  var REQUIRED_FIELDS = ['ID', 'X', 'Y', 'Z'];
  var LINEAR_FIELDS = ['X', 'Y', 'Z', 'Length'];
  var ANGLE_FIELDS = ['Orientation', 'Inclination', 'Rotation'];
  var FIELD_CONSTANT_PLACEHOLDERS = {
    Length: '0',
    Z: 'e.g. 100.5',
    Orientation: '0',
    Inclination: '0',
    Rotation: '0',
  };

  function getInputUnits() {
    if (!els.units) return 'US FT';
    if (typeof GwCsvFormatter !== 'undefined' && GwCsvFormatter.normalizeInputUnits) {
      return GwCsvFormatter.normalizeInputUnits(els.units.value);
    }
    var value = String(els.units.value || '').toUpperCase();
    if (value === 'METRIC') return 'METRIC';
    if (value === 'INTL FT' || value === 'INTERNATIONAL FT') return 'INTL FT';
    return 'US FT';
  }

  function updateConstantPlaceholders() {
    var metric = getInputUnits() === 'METRIC';
    FIELD_CONSTANT_PLACEHOLDERS.Z = metric ? 'e.g. 30.5' : 'e.g. 100.5';
  }

  function inputUnitsLabel() {
    if (typeof GwCsvFormatter !== 'undefined' && GwCsvFormatter.inputUnitLabel) {
      return GwCsvFormatter.inputUnitLabel(getInputUnits());
    }
    return getInputUnits() === 'METRIC' ? 'm' : 'US survey ft';
  }

  function linearUnitSuffix() {
    if (typeof GwCsvFormatter !== 'undefined' && GwCsvFormatter.linearUnitSuffix) {
      return GwCsvFormatter.linearUnitSuffix(getInputUnits());
    }
    return getInputUnits() === 'METRIC' ? 'm' : 'US ft';
  }

  function fieldDisplayLabel(field) {
    if (LINEAR_FIELDS.indexOf(field) !== -1) {
      return field + ' (' + linearUnitSuffix() + ')';
    }
    if (ANGLE_FIELDS.indexOf(field) !== -1) {
      return field + ' (°)';
    }
    return field;
  }

  function fixedValueLabel(field) {
    if (LINEAR_FIELDS.indexOf(field) !== -1) {
      return 'Fixed value (' + linearUnitSuffix() + ')';
    }
    if (ANGLE_FIELDS.indexOf(field) !== -1) {
      return 'Fixed value (°)';
    }
    return 'Fixed value';
  }
  var dragColumnIndex = null;
  var LARGE_ROW_THRESHOLD = 2000;
  var AUTO_PROCESS_ROW_THRESHOLD = 500;
  var MAX_DISPLAY_ISSUES = 50;
  var processTimer = null;
  var ignoreTimer = null;
  var processGeneration = 0;
  var loadGeneration = 0;
  var isBusy = false;

  var state = {
    fileName: '',
    inputText: '',
    parsedRaw: null,
    sourceTable: null,
    mapping: {},
    fieldConstants: {
      Orientation: '0',
      Inclination: '0',
      Rotation: '0',
      Length: '0',
    },
    mappingTouched: false,
    result: null,
    outputFileName: '',
  };

  var els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function bindElements() {
    els.units = $('gwUnits');
    els.file = $('gwCsvFile');
    els.fileMeta = $('gwFileMeta');
    els.hasHeader = $('gwHasHeader');
    els.ignoreRows = $('gwIgnoreRows');
    els.autoMapBtn = $('gwAutoMapBtn');
    els.processBtn = $('gwProcessBtn');
    els.mappingCard = $('gwMappingCard');
    els.mappingSlots = $('gwMappingSlots');
    els.sourceCard = $('gwSourceCard');
    els.sourceMeta = $('gwSourceMeta');
    els.sourceHead = $('gwSourceHead');
    els.sourceBody = $('gwSourceBody');
    els.statusCard = $('gwStatusCard');
    els.statusLine = $('gwStatusLine');
    els.issuesList = $('gwIssuesList');
    els.outputCard = $('gwOutputCard');
    els.outputMeta = $('gwOutputMeta');
    els.outputHead = $('gwOutputHead');
    els.outputBody = $('gwOutputBody');
    els.exportCard = $('gwExportCard');
    els.downloadBtn = $('gwDownloadBtn');
    els.emailTo = $('gwEmailTo');
    els.emailSubject = $('gwEmailSubject');
    els.emailMessage = $('gwEmailMessage');
    els.emailBtn = $('gwEmailBtn');
    els.emailHint = $('gwEmailHint');
    els.busyOverlay = $('gwBusyOverlay');
    els.busyText = $('gwBusyText');
  }

  function rowCount() {
    return state.sourceTable && state.sourceTable.dataRows ? state.sourceTable.dataRows.length : 0;
  }

  function isLargeDataset() {
    return rowCount() > LARGE_ROW_THRESHOLD;
  }

  function shouldAutoProcess() {
    return rowCount() > 0 && rowCount() <= AUTO_PROCESS_ROW_THRESHOLD;
  }

  function setBusy(message) {
    isBusy = true;
    if (els.busyOverlay) {
      els.busyOverlay.classList.remove('hidden');
      if (els.busyText) els.busyText.textContent = message || 'Working…';
    }
    document.body.classList.add('gw-csv-busy');
    if (els.processBtn) els.processBtn.disabled = true;
    if (els.autoMapBtn) els.autoMapBtn.disabled = true;
  }

  function clearBusy() {
    isBusy = false;
    if (els.busyOverlay) els.busyOverlay.classList.add('hidden');
    document.body.classList.remove('gw-csv-busy');
    if (els.processBtn && state.inputText) els.processBtn.disabled = false;
    if (els.autoMapBtn && state.inputText) els.autoMapBtn.disabled = false;
  }

  function showAwaitingPreviewStatus() {
    els.statusCard.classList.remove('hidden', 'gw-card--ok', 'gw-card--warn', 'gw-card--error');
    els.statusCard.classList.add('gw-card--warn');
    els.issuesList.hidden = true;
    els.issuesList.innerHTML = '';
    var rows = rowCount();
    els.statusLine.textContent =
      rows.toLocaleString() +
      ' row(s) loaded — drag column headers to section 3, then click Apply mapping & preview.';
    if (isLargeDataset()) {
      els.statusLine.textContent =
        'Large file (' +
        rows.toLocaleString() +
        ' rows) — map columns in section 3, then click Apply mapping & preview. The table in section 2 stays responsive while you work.';
    }
    els.statusCard.classList.remove('hidden');
  }

  function invalidatePreview() {
    state.result = null;
    renderOutputPreview(null);
    updateExportUi();
    showAwaitingPreviewStatus();
  }

  function scheduleProcess(delay) {
    if (processTimer) clearTimeout(processTimer);
    processTimer = setTimeout(function () {
      processTimer = null;
      processCurrent();
    }, delay == null ? 0 : delay);
  }

  function debouncedAutoProcess(delay) {
    if (!shouldAutoProcess()) {
      invalidatePreview();
      return;
    }
    if (processTimer) clearTimeout(processTimer);
    processTimer = setTimeout(function () {
      processTimer = null;
      processCurrent();
    }, delay || 400);
  }

  function getProcessOptions() {
    return {
      fieldConstants: state.fieldConstants,
      inputUnits: getInputUnits(),
    };
  }

  function sourceColumnHeaderText(col) {
    if (!col) return '';
    if (state.sourceTable && state.sourceTable.hasHeaderRow) {
      return col.rawHeader != null ? col.rawHeader : '';
    }
    return 'Column ' + (col.index + 1);
  }

  function mappedColumnLabel(col) {
    if (!col) return '';
    var text = sourceColumnHeaderText(col);
    return text !== '' ? text : 'Column ' + (col.index + 1);
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ''));
      };
      reader.onerror = function () {
        reject(new Error('Could not read the selected file.'));
      };
      reader.readAsText(file);
    });
  }

  function columnByIndex(index) {
    if (!state.sourceTable) return null;
    var cols = state.sourceTable.columns;
    var i;
    for (i = 0; i < cols.length; i++) {
      if (cols[i].index === index) return cols[i];
    }
    return null;
  }

  function columnTitle(col) {
    return mappedColumnLabel(col);
  }

  function fieldHasSource(field) {
    if (state.mapping[field] != null) return true;
    var constant = state.fieldConstants[field];
    return constant != null && String(constant).trim() !== '';
  }

  function clearMappingField(field) {
    if (state.mapping[field] == null) return;
    delete state.mapping[field];
    state.mappingTouched = true;
  }

  function assignMapping(field, colIndex) {
    var existingField;
    if (colIndex == null || colIndex === '') {
      clearMappingField(field);
      return;
    }
    Object.keys(state.mapping).forEach(function (key) {
      if (state.mapping[key] === colIndex && key !== field) {
        delete state.mapping[key];
      }
    });
    state.mapping[field] = colIndex;
    state.mappingTouched = true;
  }

  function renderMappingSlots() {
    if (!state.sourceTable) return;
    updateConstantPlaceholders();
    els.mappingSlots.innerHTML = '';

    GwCsvFormatter.GROUNDWORKS_HEADER.forEach(function (field) {
      var slot = document.createElement('div');
      slot.className = 'gw-map-slot';
      slot.setAttribute('data-gw-field', field);

      var label = document.createElement('div');
      label.className = 'gw-map-slot__label';
      label.textContent = fieldDisplayLabel(field);
      if (REQUIRED_FIELDS.indexOf(field) !== -1) {
        var req = document.createElement('span');
        req.className = 'gw-map-slot__req';
        req.textContent = ' *';
        label.appendChild(req);
      }

      var drop = document.createElement('div');
      drop.className = 'gw-map-slot__drop';
      drop.setAttribute('data-drop-field', field);

      var mappedIndex = state.mapping[field];
      var mappedCol = mappedIndex != null ? columnByIndex(mappedIndex) : null;
      if (mappedCol) {
        drop.classList.add('gw-map-slot__drop--filled');
        var mappedText = document.createElement('span');
        mappedText.className = 'gw-map-slot__text';
        mappedText.textContent = columnTitle(mappedCol);
        drop.appendChild(mappedText);
        var clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'gw-map-slot__clear';
        clearBtn.setAttribute('aria-label', 'Clear ' + field + ' mapping');
        clearBtn.textContent = '×';
        clearBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          assignMapping(field, null);
          rebuildUi();
        });
        drop.appendChild(clearBtn);
      } else {
        drop.classList.add('gw-map-slot__drop--empty');
        var dropHint = document.createElement('div');
        dropHint.className = 'gw-map-slot__drop-hint';
        var dropArrow = document.createElement('span');
        dropArrow.className = 'gw-map-slot__drop-arrow';
        dropArrow.setAttribute('aria-hidden', 'true');
        dropArrow.textContent = '↑';
        var dropText = document.createElement('span');
        dropText.className = 'gw-map-slot__drop-text';
        dropText.textContent = 'Drag a column header here';
        dropHint.appendChild(dropArrow);
        dropHint.appendChild(dropText);
        drop.appendChild(dropHint);
      }

      drop.addEventListener('dragover', function (e) {
        e.preventDefault();
        drop.classList.add('gw-map-slot__drop--over');
      });
      drop.addEventListener('dragleave', function () {
        drop.classList.remove('gw-map-slot__drop--over');
      });
      drop.addEventListener('drop', function (e) {
        e.preventDefault();
        drop.classList.remove('gw-map-slot__drop--over');
        if (dragColumnIndex == null) return;
        assignMapping(field, dragColumnIndex);
        dragColumnIndex = null;
        rebuildUi();
      });

      slot.appendChild(label);
      slot.appendChild(drop);

      var constantLabel = document.createElement('label');
      constantLabel.className = 'gw-map-slot__constant-label';
      constantLabel.textContent = fixedValueLabel(field);
      constantLabel.setAttribute('for', 'gwConstant_' + field);

      var constantInput = document.createElement('input');
      constantInput.type = 'text';
      constantInput.className = 'gw-map-slot__constant';
      constantInput.id = 'gwConstant_' + field;
      constantInput.placeholder = FIELD_CONSTANT_PLACEHOLDERS[field] || 'Optional';
      constantInput.value =
        state.fieldConstants[field] != null && state.fieldConstants[field] !== undefined
          ? state.fieldConstants[field]
          : '';
      constantInput.addEventListener('input', function () {
        if (constantInput.value.trim() === '') delete state.fieldConstants[field];
        else state.fieldConstants[field] = constantInput.value;
        debouncedAutoProcess(400);
      });

      slot.appendChild(constantLabel);
      slot.appendChild(constantInput);
      els.mappingSlots.appendChild(slot);
    });
  }

  function renderSourcePreview() {
    if (!state.sourceTable) return;
    var columns = state.sourceTable.columns;
    var dataRows = state.sourceTable.dataRows;
    var previewCount = Math.min(dataRows.length, 12);

    els.sourceMeta.textContent =
      columns.length +
      ' column(s), ' +
      dataRows.length +
      ' export row(s)' +
      (state.sourceTable.ignoredRows && state.sourceTable.ignoredRows.length
        ? '. Ignoring file row(s): ' + state.sourceTable.ignoredRows.join(', ')
        : '') +
      '. Grab a blue column header below and drag it down to section 3. Values interpreted as ' +
      inputUnitsLabel() +
      '.';

    els.sourceHead.innerHTML = '';
    els.sourceBody.innerHTML = '';

    var headRow = document.createElement('tr');
    columns.forEach(function (col) {
      var th = document.createElement('th');
      th.className = 'gw-source-col';
      th.draggable = true;
      th.setAttribute('data-col-index', String(col.index));

      var headerText = sourceColumnHeaderText(col);
      if (!headerText) headerText = 'Column ' + (col.index + 1);
      th.title = 'Drag to map: ' + headerText;

      var grip = document.createElement('span');
      grip.className = 'gw-source-col__grip';
      grip.setAttribute('aria-hidden', 'true');
      grip.textContent = '⋮⋮';

      var label = document.createElement('span');
      label.className = 'gw-source-col__label';
      label.textContent = headerText;

      var badge = document.createElement('span');
      badge.className = 'gw-source-col__badge';
      badge.textContent = 'Drag';

      th.appendChild(grip);
      th.appendChild(label);
      th.appendChild(badge);

      var isMapped = Object.keys(state.mapping).some(function (field) {
        return state.mapping[field] === col.index;
      });
      if (isMapped) th.classList.add('gw-source-col--mapped');

      th.addEventListener('dragstart', function (e) {
        dragColumnIndex = col.index;
        th.classList.add('gw-source-col--dragging');
        document.body.classList.add('gw-csv-dragging');
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', String(col.index));
          e.dataTransfer.effectAllowed = 'move';
        }
      });
      th.addEventListener('dragend', function () {
        th.classList.remove('gw-source-col--dragging');
        document.body.classList.remove('gw-csv-dragging');
        dragColumnIndex = null;
      });

      headRow.appendChild(th);
    });
    els.sourceHead.appendChild(headRow);

    var r;
    for (r = 0; r < previewCount; r++) {
      var row = dataRows[r];
      var tr = document.createElement('tr');
      columns.forEach(function (col) {
        var td = document.createElement('td');
        td.textContent = row[col.index] != null ? row[col.index] : '';
        tr.appendChild(td);
      });
      els.sourceBody.appendChild(tr);
    }
  }

  function renderOutputPreview(result) {
    if (!result || !result.outputRecords || !result.outputRecords.length) {
      els.outputCard.classList.add('hidden');
      return;
    }

    els.outputCard.classList.remove('hidden');
    var previewCount = Math.min(result.outputRecords.length, 25);
    els.outputMeta.textContent =
      'Showing first ' +
      previewCount +
      ' of ' +
      result.outputRecords.length +
      ' row(s). Coordinates and lengths in ' +
      (result.inputUnitLabel || inputUnitsLabel()) +
      '. Output delimiter: semicolon.';

    els.outputHead.innerHTML = '';
    els.outputBody.innerHTML = '';
    var headRow = document.createElement('tr');
    result.outputHeader.forEach(function (col) {
      var th = document.createElement('th');
      th.textContent = col;
      headRow.appendChild(th);
    });
    els.outputHead.appendChild(headRow);

    var i;
    for (i = 0; i < previewCount; i++) {
      var rec = result.outputRecords[i];
      var tr = document.createElement('tr');
      result.outputHeader.forEach(function (col) {
        var td = document.createElement('td');
        td.textContent = rec[col] != null ? rec[col] : '';
        tr.appendChild(td);
      });
      els.outputBody.appendChild(tr);
    }
  }

  function setStatus(result) {
    els.statusCard.classList.remove('hidden', 'gw-card--ok', 'gw-card--warn', 'gw-card--error');
    els.issuesList.hidden = true;
    els.issuesList.innerHTML = '';

    if (!result) {
      els.statusCard.classList.add('hidden');
      return;
    }

    var blocking = result.issues.filter(function (issue) {
      return issue.indexOf('missing ') !== -1 || issue.indexOf('not numeric') !== -1 || issue.indexOf('duplicate') !== -1;
    });
    var hasWarningsOnly = result.issues.length > 0 && blocking.length === 0;

    if (result.ok) {
      els.statusCard.classList.add('gw-card--ok');
      els.statusLine.textContent =
        'Validated ' + result.pileCount + ' pile(s) — ready to export as Groundworks import CSV.';
    } else if (hasWarningsOnly) {
      els.statusCard.classList.add('gw-card--warn');
      els.statusLine.textContent =
        'Validated ' + result.pileCount + ' pile(s) with ' + result.issues.length + ' warning(s). You can still export.';
    } else {
      els.statusCard.classList.add('gw-card--error');
      els.statusLine.textContent =
        result.issues.length + ' issue(s) found — adjust column mapping or defaults before export.';
    }

    if (result.issues.length) {
      els.issuesList.hidden = false;
      var displayIssues = result.issues.slice(0, MAX_DISPLAY_ISSUES);
      if (result.issues.length > MAX_DISPLAY_ISSUES) {
        displayIssues.push(
          '… and ' + (result.issues.length - MAX_DISPLAY_ISSUES) + ' more issue(s) not shown.'
        );
      }
      displayIssues.forEach(function (issue) {
        var li = document.createElement('li');
        li.textContent = issue;
        els.issuesList.appendChild(li);
      });
    }
  }

  function mappingIssues() {
    var issues = [];
    REQUIRED_FIELDS.forEach(function (field) {
      if (!fieldHasSource(field)) {
        issues.push('Map ' + field + ' to a source column or enter a fixed value.');
      }
    });
    return issues;
  }

  function canExport(result) {
    if (!result || !result.outputCsv) return false;
    if (mappingIssues().length) return false;
    var blocking = (result.issues || []).filter(function (issue) {
      return issue.indexOf('missing ') !== -1 || issue.indexOf('not numeric') !== -1 || issue.indexOf('duplicate') !== -1;
    });
    return blocking.length === 0;
  }

  function updateExportUi() {
    var allowed = canExport(state.result);
    if (allowed) {
      els.exportCard.classList.remove('hidden');
      els.downloadBtn.disabled = false;
      els.emailBtn.disabled = false;
    } else {
      els.exportCard.classList.add('hidden');
      els.downloadBtn.disabled = true;
      els.emailBtn.disabled = true;
    }
  }

  function buildSourceState(resetMapping) {
    state.parsedRaw = GwCsvFormatter.parseCsvRaw(state.inputText);
    state.sourceTable = GwCsvFormatter.buildSourceTable(state.parsedRaw, {
      hasHeaderRow: els.hasHeader.checked,
      ignoreRows: els.ignoreRows.value,
    });
    if (resetMapping || !state.mappingTouched) {
      state.mapping = GwCsvFormatter.guessColumnMapping(state.sourceTable.columns);
      state.mappingTouched = false;
    }
  }

  function processCurrent() {
    if (!state.inputText) {
      alert('Choose a CSV file first.');
      return;
    }
    if (isBusy) return;

    var gen = ++processGeneration;
    setBusy('Validating and building export…');

    setTimeout(function () {
      if (gen !== processGeneration) return;

      try {
        buildSourceState(false);
        if (gen !== processGeneration) return;

        renderSourcePreview();
        var mapIssues = mappingIssues();
        if (mapIssues.length) {
          state.result = {
            ok: false,
            issues: mapIssues,
            pileCount: 0,
          };
          setStatus(state.result);
          renderOutputPreview(null);
          updateExportUi();
          return;
        }

        state.result = GwCsvFormatter.processWithMapping(state.sourceTable, state.mapping, getProcessOptions());
        if (gen !== processGeneration) return;

        state.outputFileName = GwCsvFormatter.defaultOutputName(state.fileName);
        setStatus(state.result);
        renderOutputPreview(state.result);
        updateExportUi();
        if (window.WorkspaceApi) {
          window.WorkspaceApi.logCalcRun(state.result.ok ? 'ok' : 'issues', state.result.pileCount);
        }
      } catch (err) {
        if (gen !== processGeneration) return;
        state.result = null;
        els.statusCard.classList.remove('hidden', 'gw-card--ok', 'gw-card--warn');
        els.statusCard.classList.add('gw-card--error');
        els.statusLine.textContent = err.message || 'Could not process CSV.';
        els.issuesList.hidden = true;
        els.outputCard.classList.add('hidden');
        els.exportCard.classList.add('hidden');
      } finally {
        if (gen === processGeneration) clearBusy();
      }
    }, 0);
  }

  function rebuildMappingUiOnly() {
    els.sourceCard.classList.remove('hidden');
    els.mappingCard.classList.remove('hidden');
    renderSourcePreview();
    renderMappingSlots();
  }

  function rebuildUi() {
    rebuildMappingUiOnly();
    if (!shouldAutoProcess()) {
      invalidatePreview();
      return;
    }
    scheduleProcess(0);
  }

  function resetUi() {
    processGeneration++;
    loadGeneration++;
    if (processTimer) {
      clearTimeout(processTimer);
      processTimer = null;
    }
    if (ignoreTimer) {
      clearTimeout(ignoreTimer);
      ignoreTimer = null;
    }
    clearBusy();
    state.parsedRaw = null;
    state.sourceTable = null;
    state.mapping = {};
    state.fieldConstants = {
      Orientation: '0',
      Inclination: '0',
      Rotation: '0',
      Length: '0',
    };
    state.mappingTouched = false;
    state.result = null;
    els.mappingCard.classList.add('hidden');
    els.sourceCard.classList.add('hidden');
    els.statusCard.classList.add('hidden');
    els.outputCard.classList.add('hidden');
    els.exportCard.classList.add('hidden');
    els.autoMapBtn.disabled = true;
    els.processBtn.disabled = true;
  }

  function onFileLoaded(file, text) {
    var gen = ++loadGeneration;
    processGeneration++;
    state.fileName = file.name;
    state.inputText = text;
    state.mappingTouched = false;
    els.fileMeta.textContent = file.name + ' (' + Math.max(1, Math.round(file.size / 1024)) + ' KB)';
    els.autoMapBtn.disabled = false;
    els.processBtn.disabled = false;
    setBusy('Reading CSV…');

    setTimeout(function () {
      if (gen !== loadGeneration) return;

      try {
        buildSourceState(true);
        if (gen !== loadGeneration) return;

        rebuildMappingUiOnly();
        if (shouldAutoProcess()) {
          processCurrent();
        } else {
          invalidatePreview();
          clearBusy();
        }
      } catch (err) {
        if (gen !== loadGeneration) return;
        state.result = null;
        els.statusCard.classList.remove('hidden', 'gw-card--ok', 'gw-card--warn');
        els.statusCard.classList.add('gw-card--error');
        els.statusLine.textContent = err.message || 'Could not read CSV.';
        els.issuesList.hidden = true;
        els.outputCard.classList.add('hidden');
        els.exportCard.classList.add('hidden');
        clearBusy();
      }
    }, 0);
  }

  function downloadCsv() {
    if (!canExport(state.result)) return;
    var blob = new Blob([state.result.outputCsv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = state.outputFileName || 'groundworks.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    if (window.WorkspaceApi) {
      window.WorkspaceApi.logEvent('csv_download', { detail: state.outputFileName });
    }
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function sendEmail() {
    if (!canExport(state.result)) return;
    var to = els.emailTo.value.trim();
    if (!isValidEmail(to)) {
      alert('Enter a valid recipient email address.');
      els.emailTo.focus();
      return;
    }

    var subject = els.emailSubject.value.trim() || 'Groundworks pile CSV';
    var message = els.emailMessage.value.trim();
    var fileName = state.outputFileName || 'groundworks.csv';
    var fileBase64 =
      window.WorkspaceApi && typeof window.WorkspaceApi.utf8ToBase64 === 'function'
        ? window.WorkspaceApi.utf8ToBase64(state.result.outputCsv)
        : btoa(unescape(encodeURIComponent(state.result.outputCsv)));

    els.emailBtn.disabled = true;
    els.emailHint.textContent = 'Sending…';

    function finish(ok, text) {
      els.emailBtn.disabled = false;
      els.emailHint.textContent = text;
      if (ok && window.WorkspaceApi) {
        window.WorkspaceApi.logEvent('csv_email', { detail: to });
      }
    }

    if (window.WorkspaceApi && typeof window.WorkspaceApi.sendCsvEmail === 'function' && window.WorkspaceApi.isEnabled()) {
      window.WorkspaceApi
        .sendCsvEmail({
          to: to,
          subject: subject,
          message: message,
          fileName: fileName,
          fileBase64: fileBase64,
        })
        .then(function () {
          finish(true, 'Email sent to ' + to + ' with CSV attached.');
        })
        .catch(function () {
          fallbackMailto(to, subject, message, fileName);
        });
      return;
    }

    fallbackMailto(to, subject, message, fileName);
  }

  function fallbackMailto(to, subject, message, fileName) {
    downloadCsv();
    var body =
      (message ? message + '\n\n' : '') +
      'The formatted CSV (' +
      fileName +
      ') was downloaded to this device. Attach it to this email before sending.\n\n' +
      '— Trimble Technician Assistant';
    var mailto =
      'mailto:' +
      encodeURIComponent(to) +
      '?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(body);
    window.location.href = mailto;
    els.emailBtn.disabled = false;
    els.emailHint.textContent =
      'Workspace email is not configured — your email app will open and the CSV was downloaded. Attach ' +
      fileName +
      ' before sending.';
  }

  function initEmailHint() {
    if (window.AppAccess && typeof window.AppAccess.getEmail === 'function') {
      var signedInEmail = window.AppAccess.getEmail();
      if (signedInEmail && !els.emailTo.value) {
        els.emailHint.textContent = 'Signed in as ' + signedInEmail + '. Recipient can be any address.';
      }
    }
  }

  function init() {
    bindElements();
    updateConstantPlaceholders();

    els.units.addEventListener('change', function () {
      updateConstantPlaceholders();
      if (!state.inputText) return;
      rebuildUi();
    });

    els.file.addEventListener('change', function () {
      var file = els.file.files && els.file.files[0];
      if (!file) {
        resetUi();
        els.fileMeta.textContent = 'No file selected.';
        return;
      }
      readFile(file)
        .then(function (text) {
          onFileLoaded(file, text);
        })
        .catch(function (err) {
          alert(err.message || 'Could not read file.');
          resetUi();
          els.fileMeta.textContent = 'No file selected.';
        });
    });

    els.autoMapBtn.addEventListener('click', function () {
      if (!state.sourceTable) return;
      state.mapping = GwCsvFormatter.guessColumnMapping(state.sourceTable.columns);
      state.mappingTouched = false;
      rebuildUi();
    });

    els.processBtn.addEventListener('click', processCurrent);
    els.downloadBtn.addEventListener('click', downloadCsv);
    els.emailBtn.addEventListener('click', sendEmail);

    els.hasHeader.addEventListener('change', function () {
      if (!state.inputText) return;
      buildSourceState(!state.mappingTouched);
      rebuildUi();
    });

    els.ignoreRows.addEventListener('input', function () {
      if (!state.inputText) return;
      if (ignoreTimer) clearTimeout(ignoreTimer);
      ignoreTimer = setTimeout(function () {
        ignoreTimer = null;
        if (!state.inputText) return;
        setBusy('Updating row filter…');
        setTimeout(function () {
          try {
            buildSourceState(false);
            rebuildMappingUiOnly();
            if (shouldAutoProcess()) {
              processCurrent();
            } else {
              invalidatePreview();
              clearBusy();
            }
          } catch (err) {
            els.statusCard.classList.remove('hidden', 'gw-card--ok', 'gw-card--warn');
            els.statusCard.classList.add('gw-card--error');
            els.statusLine.textContent = err.message || 'Could not update ignored rows.';
            clearBusy();
          }
        }, 0);
      }, 450);
    });

    initEmailHint();
  }

  function startWhenBetaReady() {
    var betaToolId = document.body.getAttribute('data-beta-tool');
    if (!betaToolId) {
      init();
      return;
    }
    if (!document.body.classList.contains('beta-access-locked')) {
      init();
      return;
    }
    document.addEventListener('tta:beta-access-ready', init, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWhenBetaReady);
  } else {
    startWhenBetaReady();
  }
})();
