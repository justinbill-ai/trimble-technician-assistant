/**
 * PD25 COGO / Groundworks value extraction (phases 4–5).
 * Replicates Siteworks offset line, CENTER REF, Down & Out, and Inverse per OEM guide.
 */
var PD25Calc = (function () {
  var COGO = PD25_GUIDE.cogo;

  function parseSurveyCsv(text) {
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    var rows = [];
    var row = [];
    var cell = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      var next = text[i + 1];
      if (inQuotes) {
        if (c === '"' && next === '"') {
          cell += '"';
          i++;
        } else if (c === '"') inQuotes = false;
        else cell += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ',') {
        row.push(cell);
        cell = '';
      } else if (c === '\r') {
      } else if (c === '\n') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else cell += c;
    }
    if (cell.length || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows.filter(function (r) {
      return r.some(function (v) {
        return String(v).trim() !== '';
      });
    });
  }

  /** Canonical survey IDs → Siteworks export names (matched case-insensitive). */
  var POINT_ALIASES = {
    ML: ['ML'],
    MR: ['MR'],
    MF: ['MF', 'MASTFOOT', 'MAST FOOT'],
    MB: ['MB'],
    H: ['H', 'HEADING'],
    HF: ['HF', 'MHF', 'HAMMERFACE', 'HAMMER FACE'],
    LINEPT1: ['LINEPT1', 'LINE PT1', 'LINE PT 1', 'LINE_PT1'],
    LINEPT2: ['LINEPT2', 'LINE PT2', 'LINE PT 2', 'LINE_PT2'],
    'CENTER REF': ['CENTER REF', 'CENTERREF', 'CENTER_REF'],
  };

  function normalizeName(name) {
    return String(name || '')
      .toUpperCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  function aliasList(canonicalId) {
    var key = normalizeName(canonicalId);
    return POINT_ALIASES[key] || [key];
  }

  function findPoint(rows, canonicalId) {
    var targets = aliasList(canonicalId).map(normalizeName);

    var sample = parseFloat(rows[0][1]);
    var hasHeader = isNaN(sample);
    var idxName = 0;
    var idxN = 1;
    var idxE = 2;
    var idxZ = 3;
    if (hasHeader) {
      var headers = rows[0].map(function (h) {
        return h.toString().toLowerCase().trim();
      });
      idxName = headers.findIndex(function (h) {
        return h.includes('name') || h === 'pt' || h.includes('point');
      });
      idxN = headers.findIndex(function (h) {
        return h.includes('north') || h === 'n';
      });
      idxE = headers.findIndex(function (h) {
        return h.includes('east') || h === 'e';
      });
      idxZ = headers.findIndex(function (h) {
        return h.includes('elev') || h === 'z';
      });
    }

    for (var i = hasHeader ? 1 : 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r[idxName]) continue;
      var rowName = normalizeName(r[idxName]);
      if (targets.indexOf(rowName) !== -1) {
        return {
          n: parseFloat(r[idxN]),
          e: parseFloat(r[idxE]),
          z: parseFloat(r[idxZ]),
          name: rowName,
          csvName: r[idxName].toString().trim(),
        };
      }
    }
    return null;
  }

  function constantsForUnits(units) {
    var metric = units === 'METRIC';
    return {
      horizontal: metric ? COGO.offsetLine.horizontalM : COGO.offsetLine.horizontalFt,
      vertical: metric ? COGO.offsetLine.verticalM : COGO.offsetLine.verticalFt,
      centerRefDist: metric ? COGO.centerRef.distanceM : COGO.centerRef.distanceFt,
      unitLabel: metric ? 'm' : 'ft',
    };
  }

  function bearingRad(dN, dE) {
    return Math.atan2(dE, dN);
  }

  function offsetByBearing(pt, bearingRadVal, horiz, vertZ) {
    return {
      n: pt.n + horiz * Math.cos(bearingRadVal),
      e: pt.e + horiz * Math.sin(bearingRadVal),
      z: pt.z + vertZ,
    };
  }

  function horizDist(a, b) {
    return Math.hypot(b.n - a.n, b.e - a.e);
  }

  function horizDist3D(a, b) {
    return Math.hypot(b.n - a.n, b.e - a.e, b.z - a.z);
  }

  /**
   * Siteworks offset line: ML then MR, positive horizontal = right of ML→MR, positive vertical = up.
   */
  function buildOffsetLine(ml, mr, units) {
    var c = constantsForUnits(units);
    var dN = mr.n - ml.n;
    var dE = mr.e - ml.e;
    var mlToMr = bearingRad(dN, dE);
    var rightBearing = mlToMr + Math.PI / 2;
    return {
      linePt1: offsetByBearing(ml, rightBearing, c.horizontal, c.vertical),
      linePt2: offsetByBearing(mr, rightBearing, c.horizontal, c.vertical),
      bearingMlMrDeg: (mlToMr * 180) / Math.PI,
      constants: c,
    };
  }

  function buildCenterRef(linePt1, linePt2, units) {
    var c = constantsForUnits(units);
    var dN = linePt2.n - linePt1.n;
    var dE = linePt2.e - linePt1.e;
    var bearing = bearingRad(dN, dE);
    return offsetByBearing(linePt1, bearing, c.centerRefDist, 0);
  }

  /**
   * Y-pivot reference: midpoint of ML/MR (mast X-slide pin targets at reference position).
   */
  function yPivotCenter(ml, mr) {
    return {
      n: (ml.n + mr.n) / 2,
      e: (ml.e + mr.e) / 2,
      z: (ml.z + mr.z) / 2,
    };
  }

  /**
   * Antenna offsets relative to CENTER REF using the offset line (Line PT1 → Line PT2).
   * Matches Siteworks Down & Out from baseline on the PD25 ECM dataset:
   *   back (G5/G1) = perpendicular distance to the offset line
   *   left  (G6/G2) = |along-line distance from Line PT1 to the perpendicular foot|
   */
  function antennaOffsetsFromOffsetLine(linePt1, linePt2, antenna) {
    var dN = linePt2.n - linePt1.n;
    var dE = linePt2.e - linePt1.e;
    var lenSq = dN * dN + dE * dE;
    if (lenSq < 1e-12) throw new Error('Offset line length is zero (Line PT1 and Line PT2).');

    var len = Math.sqrt(lenSq);
    var t = ((antenna.n - linePt1.n) * dN + (antenna.e - linePt1.e) * dE) / lenSq;
    var footN = linePt1.n + t * dN;
    var footE = linePt1.e + t * dE;

    return {
      back: Math.hypot(antenna.n - footN, antenna.e - footE),
      left: Math.abs(t * len),
      alongSignedFromLinePt1: t * len,
    };
  }

  function inverseVertical(fromPt, toPt) {
    return toPt.z - fromPt.z;
  }

  function fmt(n, places) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toFixed(places == null ? 3 : places);
  }

  function comparePoints(calc, ref, tol) {
    if (!calc || !ref) return null;
    return {
      horizDelta: horizDist(calc, ref),
      vertDelta: calc.z - ref.z,
      withinTol: horizDist(calc, ref) <= tol && Math.abs(calc.z - ref.z) <= tol,
    };
  }

  function defaultRodHeight(units) {
    return units === 'METRIC' ? COGO.rodHeightMbH.metricM : COGO.rodHeightMbH.usft;
  }

  /** Lower measured Z to APC when rod height was not entered in Siteworks. */
  function applyApcCorrection(pt, rodSubtract) {
    if (!rodSubtract || rodSubtract <= 0) return pt;
    return {
      n: pt.n,
      e: pt.e,
      z: pt.z - rodSubtract,
      name: pt.name,
      csvName: pt.csvName,
    };
  }

  function g7Vertical(mbApc, ml) {
    return Math.abs(inverseVertical(mbApc, ml));
  }

  /**
   * Move measured HF to hammer jaw center along HF → Y-pivot (ML/MR) direction.
   * Positive offset = shot is ahead of center (farther from ML/MR than jaw center).
   * Zero = shot is at jaw center. Negative = shot is between jaw center and ML/MR.
   */
  function correctHfToHammerCenter(hf, pivot, faceOffset) {
    var offset = parseFloat(faceOffset);
    if (!hf || isNaN(offset) || offset === 0) {
      return { measured: hf, center: hf, offsetApplied: 0 };
    }

    var dN = pivot.n - hf.n;
    var dE = pivot.e - hf.e;
    var len = Math.hypot(dN, dE);
    if (len < 1e-9) {
      return { measured: hf, center: hf, offsetApplied: 0 };
    }

    var uN = dN / len;
    var uE = dE / len;
    return {
      measured: hf,
      center: {
        n: hf.n + offset * uN,
        e: hf.e + offset * uE,
        z: hf.z,
        name: hf.name,
        csvName: hf.csvName,
      },
      offsetApplied: offset,
    };
  }

  function analyzeCsv(csvString, units, surveyOptions) {
    surveyOptions = surveyOptions || {};
    var rodEnteredInSiteworks = !!surveyOptions.rodEnteredInSiteworks;
    var shotWithRod = surveyOptions.shotWithRod !== false;
    var rodSubtract = 0;
    if (shotWithRod && !rodEnteredInSiteworks) {
      var parsed = parseFloat(surveyOptions.rodHeight);
      rodSubtract = !isNaN(parsed) && parsed > 0 ? parsed : defaultRodHeight(units);
    }
    var rows = parseSurveyCsv(csvString);
    if (!rows.length) throw new Error('CSV file is empty.');

    var coreRequired = ['ML', 'MR', 'MB', 'H'];
    var points = {};
    var missing = [];
    var warnings = [];

    coreRequired.forEach(function (id) {
      var pt = findPoint(rows, id);
      if (pt) points[id] = pt;
      else missing.push(id);
    });

    var mf = findPoint(rows, 'MF');
    if (mf) points.MF = mf;

    var hf = findPoint(rows, 'HF');
    if (hf) points.HF = hf;

    var refLinePt1 = findPoint(rows, 'LINEPT1');
    var refLinePt2 = findPoint(rows, 'LINEPT2');
    var refCenter = findPoint(rows, 'CENTER REF');

    if (missing.length) {
      return {
        points: points,
        missing: missing,
        warnings: warnings,
        units: units,
        status: 'incomplete',
        message: 'Missing required points: ' + missing.join(', ') + '. Need ML, MR, MB, and H from Siteworks.',
      };
    }

    var offset = buildOffsetLine(points.ML, points.MR, units);
    var linePt1 = offset.linePt1;
    var linePt2 = offset.linePt2;
    var centerRef = buildCenterRef(linePt1, linePt2, units);

    var pivot = yPivotCenter(points.ML, points.MR);

    var mbApc = applyApcCorrection(points.MB, rodSubtract);
    var hApc = applyApcCorrection(points.H, rodSubtract);

    var tol = units === 'METRIC' ? 0.002 : 0.01;
    var validation = {
      linePt1: comparePoints(linePt1, refLinePt1, tol),
      linePt2: comparePoints(linePt2, refLinePt2, tol),
      centerRef: comparePoints(centerRef, refCenter, tol),
      hasReferencePoints: !!(refLinePt1 || refLinePt2 || refCenter),
    };

    var mbOff = antennaOffsetsFromOffsetLine(linePt1, linePt2, mbApc);
    var hOff = antennaOffsetsFromOffsetLine(linePt1, linePt2, hApc);

    var g7Signed = inverseVertical(mbApc, points.ML);
    var g7Value = g7Vertical(mbApc, points.ML);

    var results = {
      G6: {
        label: 'Moving base antenna — left of CENTER REF',
        value: mbOff.left,
        source: 'Offset line (Line PT1 → Line PT2) — along-line from Line PT1 to MB foot',
      },
      G5: {
        label: 'Moving base antenna — back from CENTER REF',
        value: mbOff.back,
        source: 'Offset line (Line PT1 → Line PT2) — perpendicular distance to MB',
      },
      G2: {
        label: 'Heading antenna — left of CENTER REF',
        value: hOff.left,
        source: 'Offset line (Line PT1 → Line PT2) — along-line from Line PT1 to H foot',
      },
      G1: {
        label: 'Heading antenna — back from CENTER REF',
        value: hOff.back,
        source: 'Offset line (Line PT1 → Line PT2) — perpendicular distance to H',
      },
      G7: {
        label: 'Vertical — Moving Base APC to ML (Y pivot pin center)',
        value: g7Value,
        signedInverse: g7Signed,
        source:
          'Inverse vertical — MB APC → ML' +
          (rodSubtract > 0
            ? ' (rod height ' + rodSubtract + ' ' + offset.constants.unitLabel + ' subtracted from MB/H for APC)'
            : ''),
      },
    };

    var hfCorrection = null;
    var hfCenter = null;

    if (points.HF) {
      hfCorrection = correctHfToHammerCenter(points.HF, pivot, surveyOptions.hfFaceOffset);
      hfCenter = hfCorrection.center;
      var t5Signed = inverseVertical(pivot, hfCenter);
      results.T5 = {
        label: 'Vertical — Y pivot center to hammer opening center (HF)',
        value: Math.abs(t5Signed),
        signedInverse: t5Signed,
        source:
          'Inverse vertical — Y pivot midpoint (ML/MR) → corrected HF jaw center' +
          (hfCorrection.offsetApplied
            ? ' (face offset ' +
              hfCorrection.offsetApplied +
              ' ' +
              offset.constants.unitLabel +
              ' toward ML/MR applied)'
            : ''),
      };
    }

    return {
      points: points,
      missing: [],
      warnings: warnings,
      units: units,
      unitLabel: offset.constants.unitLabel,
      status: 'ok',
      message: validation.hasReferencePoints
        ? 'Survey parsed. Computed COGO points compared to optional reference points in CSV.'
        : 'Survey parsed. G1, G2, G5, G6, and G7 calculated from ML, MR, MB, and H.' +
          (points.HF ? ' T5 included from HF.' : ''),
      intermediate: {
        linePt1: linePt1,
        linePt2: linePt2,
        centerRef: centerRef,
        yPivotCenter: pivot,
        hfMeasured: points.HF || null,
        hfJawCenter: hfCenter,
        hfFaceOffset: hfCorrection ? hfCorrection.offsetApplied : 0,
        offsetConstants: {
          horizontal: offset.constants.horizontal,
          vertical: offset.constants.vertical,
          centerRefDist: offset.constants.centerRefDist,
          bearingMlMrDeg: offset.bearingMlMrDeg,
        },
      },
      validation: validation,
      groundworks: results,
      rodCorrection: {
        shotWithRod: shotWithRod,
        rodEnteredInSiteworks: rodEnteredInSiteworks,
        rodSubtract: rodSubtract,
        unitLabel: offset.constants.unitLabel,
      },
    };
  }

  return {
    analyzeCsv: analyzeCsv,
    parseSurveyCsv: parseSurveyCsv,
    buildOffsetLine: buildOffsetLine,
    buildCenterRef: buildCenterRef,
    defaultRodHeight: defaultRodHeight,
    applyApcCorrection: applyApcCorrection,
    correctHfToHammerCenter: correctHfToHammerCenter,
    g7Vertical: g7Vertical,
    leftBackFromCenterRef: antennaOffsetsFromOffsetLine,
    antennaOffsetsFromOffsetLine: antennaOffsetsFromOffsetLine,
    yPivotCenter: yPivotCenter,
    inverseVertical: inverseVertical,
  };
})();
