/**
 * Smoke tests for PD25 and CTL calculator modules.
 * Run: npm test   (requires Node.js)
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.join(__dirname, '..');
var failed = 0;

function loadGlobalScript(filePath, exportName) {
  var code = fs.readFileSync(filePath, 'utf8');
  var sandbox = { console: console, Math: Math, Date: Date, parseFloat: parseFloat, isNaN: isNaN };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: filePath });
  if (exportName && !sandbox[exportName]) {
    throw new Error('Expected global ' + exportName + ' from ' + filePath);
  }
  return sandbox;
}

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    failed++;
    return;
  }
  console.log('OK:', message);
}

function testCtl() {
  var sandbox = loadGlobalScript(path.join(root, 'measure-up/ctl/calc.js'), 'MeasureUpCalc');
  var csv = fs.readFileSync(path.join(__dirname, 'fixtures/ctl-min.csv'), 'utf8');
  var result = sandbox.MeasureUpCalc.calculateForWeb(
    csv,
    'US FT',
    0.03,
    'CTL',
    'Manual',
    '8.5',
    'PNEZ',
    'Manual',
    '6.2',
    0.03,
    '',
    '',
    '',
    ''
  );
  assert(result && result.calculations, 'CTL returns calculations');
  var width = result.calculations['Attachment Width'];
  assert(
    typeof width === 'number' || (typeof width === 'string' && !isNaN(parseFloat(width))),
    'CTL computes attachment width'
  );
}

function testPd25() {
  var guideSandbox = loadGlobalScript(path.join(root, 'groundworks/pd25/guide-data.js'), 'PD25_GUIDE');
  var calcSandbox = {
    console: console,
    Math: Math,
    Date: Date,
    parseFloat: parseFloat,
    isNaN: isNaN,
    PD25_GUIDE: guideSandbox.PD25_GUIDE,
  };
  vm.createContext(calcSandbox);
  vm.runInContext(
    fs.readFileSync(path.join(root, 'groundworks/pd25/calc.js'), 'utf8'),
    calcSandbox,
    { filename: 'calc.js' }
  );
  var csv = fs.readFileSync(path.join(__dirname, 'fixtures/pd25-min.csv'), 'utf8');
  var analysis = calcSandbox.PD25Calc.analyzeCsv(csv, 'US FT', {
    rodEnteredInSiteworks: true,
    shotWithRod: true,
  });
  assert(analysis.status === 'ok', 'PD25 analysis status ok');
  assert(analysis.groundworks && analysis.groundworks.G6, 'PD25 produces G6 groundworks value');

  var penzLayout = calcSandbox.PD25Calc.detectCsvLayout([['ML', '200', '100', '10']], 'PENZ');
  assert(penzLayout.idxE === 1 && penzLayout.idxN === 2, 'PD25 PENZ column order');
  var pnezLayout = calcSandbox.PD25Calc.detectCsvLayout([['ML', '100', '200', '10']], 'PNEZ');
  assert(pnezLayout.idxN === 1 && pnezLayout.idxE === 2, 'PD25 PNEZ column order');
}

function testGwCsvFormatter() {
  var sandbox = loadGlobalScript(path.join(root, 'groundworks/csv-formatter/formatter.js'), 'GwCsvFormatter');
  var fmt = sandbox.GwCsvFormatter;
  var flexCsv = fs.readFileSync(path.join(__dirname, 'fixtures/gw-flex-input.csv'), 'utf8');
  var result = fmt.processCsv(flexCsv, {
    fieldConstants: { Z: '962' },
  });

  assert(result.ok, 'GW formatter validates flex input');
  assert(result.pileCount === 3, 'GW formatter reads three piles');
  assert(result.outputDelimiter === ';', 'GW output uses semicolon delimiter');
  assert(result.outputCsv.indexOf('ID;X;Y;Z;Orientation;Inclination;Rotation;Length') === 0, 'GW header row');
  assert(result.outputCsv.indexOf('P1;100.5;200.25;962') !== -1, 'GW maps first pile coordinates');

  var tbcCsv = fs.readFileSync(path.join(__dirname, 'fixtures/gw-tbc-input.csv'), 'utf8');
  var tbcResult = fmt.processCsv(tbcCsv);
  assert(tbcResult.ok, 'GW formatter accepts TBC header input');
  assert(tbcResult.outputRecords[0].ID === 'A1', 'GW maps TBC Name to ID');
  assert(tbcResult.outputRecords[0].Orientation === '45', 'GW maps Heading to Orientation');

  var aliasParsed = fmt.parseCsvText('pile id;easting;northing;height;depth\nB1;10;20;30;12\n');
  var aliasRecords = fmt.toGroundworksRecords(aliasParsed.header, aliasParsed.records);
  assert(aliasRecords[0].ID === 'B1', 'GW coerces pile id alias');
  assert(aliasRecords[0].Length === '12', 'GW coerces depth alias to Length');

  var dupCsv = 'ID,X,Y,Z,Length\nD1,1,2,3,15\nD1,4,5,6,15\n';
  var dupResult = fmt.processCsv(dupCsv, { validateOnly: true });
  assert(!dupResult.ok, 'GW flags duplicate IDs');
  assert(dupResult.issues.some(function (i) { return i.indexOf('duplicate') !== -1; }), 'GW duplicate issue message');

  var swCsv = fs.readFileSync(path.join(__dirname, 'fixtures/gw-siteworks-export.csv'), 'utf8');
  var swRaw = fmt.parseCsvRaw(swCsv);
  var swSource = fmt.buildSourceTable(swRaw, { hasHeaderRow: true });
  var swMapping = fmt.guessColumnMapping(swSource.columns);
  assert(swMapping.ID === 0, 'Siteworks export maps point names to ID');
  var swMapped = fmt.processWithMapping(swSource, swMapping, { fieldConstants: { Length: '15' } });
  assert(swMapped.pileCount === 6, 'Siteworks export yields six piles');
  assert(swMapped.outputRecords[0].ID === 'ML', 'Siteworks first pile ID preserved');
  assert(swMapped.outputRecords[0].X === '5000', 'Siteworks northing maps to X');
  assert(swMapped.outputRecords[0].Y === '1000', 'Siteworks easting maps to Y');
  assert(swMapped.outputRecords[0].Z === '100.709', 'Siteworks elevation maps to Z');
  assert(swMapped.inputUnits === 'US FT', 'GW formatter defaults to US FT');
  var swMetric = fmt.processWithMapping(swSource, swMapping, {
    fieldConstants: { Length: '15' },
    inputUnits: 'METRIC',
  });
  assert(swMetric.inputUnits === 'METRIC', 'GW formatter records METRIC input units');

  var ignored = fmt.parseIgnoreRows('1,2...4,7');
  assert(ignored[1] && ignored[2] && ignored[3] && ignored[4] && ignored[7], 'Ignore rows parses singles and ranges');
  var swSkip = fmt.buildSourceTable(swRaw, { hasHeaderRow: true, ignoreRows: '7' });
  assert(swSkip.dataRows.length === 5, 'Ignore rows removes a data row from export');
}

console.log('--- CTL measure-up ---');
try {
  testCtl();
} catch (err) {
  failed++;
  console.error('FAIL: CTL threw', err.message);
}

console.log('--- PD25 calculator ---');
try {
  testPd25();
} catch (err) {
  failed++;
  console.error('FAIL: PD25 threw', err.message);
}

console.log('--- Groundworks CSV formatter ---');
try {
  testGwCsvFormatter();
} catch (err) {
  failed++;
  console.error('FAIL: GW CSV formatter threw', err.message);
}

if (failed) {
  console.error('\n' + failed + ' smoke test(s) failed.');
  process.exit(1);
}
console.log('\nAll smoke tests passed.');
