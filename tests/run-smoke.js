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

if (failed) {
  console.error('\n' + failed + ' smoke test(s) failed.');
  process.exit(1);
}
console.log('\nAll smoke tests passed.');
