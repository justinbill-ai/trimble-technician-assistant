/**
 * Siteworks CTL measure-up — client-side calculation (ported from Apps Script Code.gs).
 * No spreadsheet logging.
 */
var MeasureUpCalc = (function () {
  var RESULT_KEYS = [
    'Receiver bracket bolt to pivot point',
    'Reciever Bracket to Centerline',
    'Pivot point to plumb bob',
    'Pivot Point to Attachment Cutting Edge',
    'Attachment Cutting Edge to Plumb Bob',
    'Attachment Width',
  ];

  function parseCsvString(text) {
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
        } else if (c === '"') {
          inQuotes = false;
        } else {
          cell += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(cell);
        cell = '';
      } else if (c === '\r') {
        /* skip */
      } else if (c === '\n') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += c;
      }
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

  function calculateForWeb(
    csvString,
    units,
    manualOffset,
    machine,
    widthMethod,
    manualWidthVal,
    csvFormat,
    centerlineMethod,
    manualCenterlineVal,
    manualCenterlineOffset,
    machineModel,
    serialNumber,
    techName,
    dealerName
  ) {
    var transactionId = 'TX-' + Math.floor(100000 + Math.random() * 900000);
    var timestamp = new Date();

    var csvData;
    try {
      csvData = parseCsvString(csvString);
    } catch (e) {
      throw new Error('❌ Error: Could not read CSV file.');
    }

    if (!csvData || csvData.length < 1) throw new Error('❌ Error: CSV file is empty.');

    var sampleCell = parseFloat(csvData[0][1]);
    var hasHeader = isNaN(sampleCell);

    var idxN;
    var idxE;
    var idxZ;
    var idxName;

    if (hasHeader) {
      var headers = csvData[0].map(function (h) {
        return h.toString().toLowerCase().trim();
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
      idxName = headers.findIndex(function (h) {
        return h.includes('name') || h === 'pt' || h.includes('point');
      });

      if (idxN === -1 || idxE === -1 || idxZ === -1 || idxName === -1) {
        throw new Error('❌ Error: Header detected but columns missing.');
      }
    } else {
      idxName = 0;
      idxZ = 3;
      if (csvFormat === 'PNEZ') {
        idxN = 1;
        idxE = 2;
      } else {
        idxE = 1;
        idxN = 2;
      }
    }

    function getPt(name) {
      var row = csvData.find(function (r) {
        return r[idxName] && r[idxName].toString().toUpperCase().trim() === name;
      });
      return row
        ? {
            n: parseFloat(row[idxN]),
            e: parseFloat(row[idxE]),
            z: parseFloat(row[idxZ]),
          }
        : null;
    }

    var res = {};
    var transformedPoints = {};

    if (machine === 'CTL') {
      var required = ['G', 'CT1', 'CT2', 'CL', 'BB'];
      if (centerlineMethod === 'Total Station') required.push('BL', 'BR');

      var missing = required.filter(function (p) {
        return !getPt(p);
      });
      if (missing.length > 0) throw new Error('⚠️ MISSING POINTS: ' + missing.join(', '));

      var rawG = getPt('G');
      var rawCT1 = getPt('CT1');
      var rawCT2 = getPt('CT2');

      var dE = rawCT2.e - rawCT1.e;
      var dN = rawCT2.n - rawCT1.n;
      var mag = Math.sqrt(dE * dE + dN * dN);

      if (mag === 0) {
        throw new Error('❌ Error: CT1 and CT2 cannot be in the exact same horizontal position.');
      }

      var u_e = dE / mag;
      var u_n = dN / mag;

      function transformToMachineFrame(pt) {
        if (!pt) return null;
        var de = pt.e - rawG.e;
        var dn = pt.n - rawG.n;
        var dz = pt.z - rawG.z;
        return {
          e: de * u_n - dn * u_e,
          n: de * u_e + dn * u_n,
          z: dz,
        };
      }

      var points = ['G', 'CT1', 'CT2', 'CL', 'BB', 'BL', 'BR', 'CR'];
      points.forEach(function (key) {
        var pt = getPt(key);
        if (pt) transformedPoints[key] = transformToMachineFrame(pt);
      });

      var BB = transformedPoints['BB'];
      var CL = transformedPoints['CL'];
      var BL = transformedPoints['BL'];
      var BR = transformedPoints['BR'];
      var CR = transformedPoints['CR'];

      var recBracketToCenterline;
      if (centerlineMethod === 'Manual') {
        var armWidth = parseFloat(manualCenterlineVal);
        var armOffset = parseFloat(manualCenterlineOffset);
        recBracketToCenterline = (armWidth / 2 + armOffset).toFixed(3);
      } else if (BL && BR) {
        var width = Math.abs(BR.e - BL.e);
        recBracketToCenterline = (width / 2 + manualOffset).toFixed(3);
      } else {
        recBracketToCenterline = 'Error';
      }

      var pivotToPlumb = Math.abs(BB.n).toFixed(3);
      var bracketBoltToPivot = Math.sqrt(Math.pow(BB.n, 2) + Math.pow(BB.z, 2)).toFixed(3);
      var pivotToCuttingEdge = Math.sqrt(Math.pow(CL.n, 2) + Math.pow(CL.z, 2)).toFixed(3);
      var cuttingEdgeToPlumb = Math.abs(CL.n).toFixed(3);

      var attachmentWidth;
      if (widthMethod === 'Manual') {
        attachmentWidth = parseFloat(manualWidthVal).toFixed(3);
      } else if (widthMethod === 'Total Station' && CR) {
        var rawCL = getPt('CL');
        var rawCR = getPt('CR');
        var dist = Math.sqrt(
          Math.pow(rawCR.e - rawCL.e, 2) +
            Math.pow(rawCR.n - rawCL.n, 2) +
            Math.pow(rawCR.z - rawCL.z, 2)
        );
        attachmentWidth = dist.toFixed(3);
      } else {
        attachmentWidth = 'Error: Missing CR Point';
      }

      res['Receiver bracket bolt to pivot point'] = bracketBoltToPivot;
      res['Reciever Bracket to Centerline'] = recBracketToCenterline;
      res['Pivot point to plumb bob'] = pivotToPlumb;
      res['Pivot Point to Attachment Cutting Edge'] = pivotToCuttingEdge;
      res['Attachment Cutting Edge to Plumb Bob'] = cuttingEdgeToPlumb;
      res['Attachment Width'] = attachmentWidth;
    }

    return {
      calculations: res,
      meta: {
        id: transactionId,
        time: timestamp.toLocaleString(),
        machine: machine,
        units: units,
        model: machineModel || 'N/A',
        serial: serialNumber || 'N/A',
        tech: techName || '',
        dealer: dealerName || '',
      },
      vizPoints: transformedPoints,
    };
  }

  /** Parse CSV for point preview / checklist (survey coordinates). */
  function parseSurveyPoints(text, csvFormat) {
    var rows = parseCsvString(text);
    if (!rows.length) return { foundPoints: {}, hasHeader: false, error: 'Empty file' };

    var sample = parseFloat(rows[0][1]);
    var hasHeader = isNaN(sample);
    var idxN;
    var idxE;
    var idxZ;
    var idxName;

    if (hasHeader) {
      var headers = rows[0].map(function (h) {
        return h.trim().toLowerCase();
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
      idxName = headers.findIndex(function (h) {
        return h.includes('name') || h === 'pt' || h.includes('point');
      });
      if (idxN === -1 || idxE === -1 || idxZ === -1 || idxName === -1) {
        return { foundPoints: {}, hasHeader: true, error: 'Header columns not identified' };
      }
    } else {
      idxName = 0;
      idxZ = 3;
      if (csvFormat === 'PNEZ') {
        idxN = 1;
        idxE = 2;
      } else {
        idxE = 1;
        idxN = 2;
      }
    }

    var foundPoints = {};
    rows.forEach(function (row, ri) {
      if (row.length < 4) return;
      if (hasHeader && ri === 0) return;
      var name = row[idxName] && row[idxName].trim().toUpperCase();
      var nVal = parseFloat(row[idxN]);
      if (name && !isNaN(nVal)) {
        foundPoints[name] = {
          n: nVal,
          e: parseFloat(row[idxE]),
          z: parseFloat(row[idxZ]),
        };
      }
    });

    return { foundPoints: foundPoints, hasHeader: hasHeader, error: null };
  }

  return {
    RESULT_KEYS: RESULT_KEYS,
    parseCsvString: parseCsvString,
    calculateForWeb: calculateForWeb,
    parseSurveyPoints: parseSurveyPoints,
  };
})();
