/**
 * TMC Bench Crane — Standard Hardware Catalog
 *
 * This crane intentionally reuses a small set of fasteners and inserts
 * across all sections. When the guide references a catalog ID, builders
 * order the exact part listed here.
 */
const HARDWARE_CATALOG = {
  'ruthex-m3-57': {
    id: 'ruthex-m3-57',
    formalName: 'ruthex® RX-M3×5.7 Threaded Insert',
    partNumber: 'GE-M3X5.7-001',
    category: 'Heat-set insert',
    thread: 'M3',
    length: '5.7 mm',
    installHole: '4.0 mm diameter',
    minHoleDepth: '6.7 mm',
    material: 'Brass',
    shortLabel: 'RX-M3×5.7',
    guideCallout: 'ruthex® RX-M3×5.7 (P/N GE-M3X5.7-001)',
    annotationColor: 'blue',
    usedIn: 'Boom lattice, lower boom support, shaft retainers, upper clamp mounts, bucket attachment',
    notes: 'Heat-set into 4.0 mm holes. Blue arrows in step images = this insert.',
  },
  'ruthex-m6-68': {
    id: 'ruthex-m6-68',
    formalName: 'ruthex® RX-M6Sx6.8 Threaded Insert',
    partNumber: 'GE-M6X68-001',
    category: 'Heat-set insert',
    thread: 'M6',
    length: '6.8 mm',
    installHole: '8.0 mm diameter',
    minHoleDepth: '7.8 mm',
    material: 'Brass',
    shortLabel: 'RX-M6Sx6.8',
    guideCallout: 'ruthex® RX-M6Sx6.8 (P/N GE-M6X68-001)',
    annotationColor: 'blue',
    usedIn: 'Boom mounts (VRU) · LR970B boom IMU mount',
    notes: 'Heat-set into 8.0 mm holes. Cd-free · Pb-free · RoHS compliant. Order 8–10 for VRU flexibility + 2 for LR970B.',
  },
  'cap-screw-m3x8': {
    id: 'cap-screw-m3x8',
    formalName: 'M3 × 8 mm Socket Head Cap Screw',
    partNumber: null,
    category: 'Fastener',
    shortLabel: 'M3×8 SHCS',
    guideCallout: 'M3×8 mm cap screw',
    usedIn: 'Boom lattice joints, pulley halves, shaft retainers, lower boom support, bucket attachment',
    notes: 'Into RX-M3×5.7 inserts where noted · direct thread into pulley halves where noted.',
  },
  'cap-screw-m6x20': {
    id: 'cap-screw-m6x20',
    formalName: 'M6 × 20 mm Socket Head Cap Screw',
    partNumber: null,
    category: 'Fastener',
    shortLabel: 'M6×20 SHCS',
    guideCallout: 'M6×20 mm cap screw',
    usedIn: 'Base plates to extrusions (8) · boom mounts to base plate (4) · VRU to boom mount (2)',
    notes: '14× total for full build · also used with 8020 T-nuts on base extrusions.',
  },
  'cap-screw-m6x30': {
    id: 'cap-screw-m6x30',
    formalName: 'M6 × 30 mm Socket Head Cap Screw',
    partNumber: null,
    category: 'Fastener',
    shortLabel: 'M6×30 SHCS',
    guideCallout: 'M6×30 mm cap screw',
    usedIn: 'LR970B boom IMU mount — 2× into RX-M6Sx6.8 inserts',
    notes: 'Longer M6 screw for LR970B mount through boom lattice flange.',
  },
  'dowel-m3x12': {
    id: 'dowel-m3x12',
    formalName: 'M3 × 12 mm Steel Dowel Pin',
    partNumber: null,
    category: 'Alignment dowel',
    shortLabel: 'M3×12 dowel',
    guideCallout: 'M3×12 mm steel dowel pin',
    annotationColor: 'green',
    usedIn: 'Base plate joint (optional), boom lattice section alignment, bucket attachment',
    notes: 'Green arrows in step images · press-fit for alignment and joint support.',
  },
  'bearing-5x14x5': {
    id: 'bearing-5x14x5',
    formalName: '5 mm ID × 14 mm OD × 5 mm Ball Bearing',
    partNumber: null,
    category: 'Bearing',
    shortLabel: '5×14×5 bearing',
    guideCallout: '5 mm ID × 14 mm OD × 5 mm bearing',
    usedIn: 'Sheave (pulley) assembly — one per pulley; bucket attachment pivot',
  },
  'pin-sheave-5x150': {
    id: 'pin-sheave-5x150',
    formalName: '5 mm × 150 mm Sheave Pin',
    partNumber: null,
    category: 'Shaft / pin',
    shortLabel: '5×150 sheave pin',
    guideCallout: '150 mm × 5 mm pin',
    usedIn: 'Boom head — sheaves slide on these pins; bucket attachment pivot',
  },
  'pin-boom-10x150': {
    id: 'pin-boom-10x150',
    formalName: '10 mm × 150 mm Boom Pivot Pin',
    partNumber: null,
    category: 'Shaft / pin',
    shortLabel: '10×150 boom pin',
    guideCallout: '10 mm × 150 mm boom pin',
    usedIn: 'Lower boom support — main boom pivot',
    notes: 'Not the same as the 5 mm sheave pins.',
  },
  'extrusion-4040-500': {
    id: 'extrusion-4040-500',
    formalName: '40 mm × 40 mm Lite T-Slotted Profile — 500 mm',
    partNumber: '40-4040-LITE-BLACK',
    vendor: '8020.net',
    vendorUrl: 'https://8020.net/40-4040-lite-black',
    category: 'Structural',
    shortLabel: '40×40×500 extrusion',
    guideCallout: '8020 P/N 40-4040-LITE-BLACK · 40 Series · 500 mm · Black',
    length: '500 mm (19.69 in)',
    profile: '40 mm × 40 mm Lite · four open T-slots · black anodized',
    usedIn: 'Base plate foundation rails — qty 2',
    notes: '40 Series (metric) · compatible with all 40 series fasteners · order cut to 500 mm length.',
    imageRef: '8020 product page — 40-4040-Lite-Black cross-section',
  },
  'tnut-m6-rollin': {
    id: 'tnut-m6-rollin',
    formalName: 'M6 Short Self-Aligning Roll-in T-Nut with Spring Leaf',
    partNumber: '13093',
    category: 'Extrusion hardware',
    shortLabel: 'M6 roll-in T-nut',
    guideCallout: 'P/N 13093 · M6 roll-in T-nut with spring leaf',
    thread: 'M6',
    usedIn: 'Base plates to extrusion — one per M6×20 screw · qty 8',
    notes: 'Roll into T-slot before inserting cap screw. Replaces generic hammer nuts / inserts.',
  },
  'endcap-40-series': {
    id: 'endcap-40-series',
    formalName: '40 Series End Cap with Molded Push-In Stem',
    partNumber: '12260',
    category: 'Extrusion hardware',
    shortLabel: '40 series end cap',
    guideCallout: 'P/N 12260 · 40 series push-in end cap',
    usedIn: 'Extrusion rail ends — qty 4 (both ends of both rails)',
    notes: 'Push-in stem · finishes open extrusion ends.',
  },
};

/** Primary inserts called out in Fusion annotations */
const INSERT_CALLOUTS = {
  m3: 'ruthex® RX-M3×5.7 · P/N GE-M3X5.7-001 · M3 · 5.7 mm · 4.0 mm hole',
  m6: 'ruthex® RX-M6Sx6.8 · P/N GE-M6X68-001 · M6 · 6.8 mm · 8.0 mm hole',
};

/** Recommended builder shopping list — one kit covers the whole crane */
const MASTER_HARDWARE_KIT = [
  { ref: 'ruthex-m3-57', note: 'Primary insert — used throughout boom assembly' },
  { ref: 'ruthex-m6-68', note: 'Boom mounts only — order 8 for VRU flexibility, 6 minimum' },
  { ref: 'cap-screw-m3x8', note: 'Single M3 screw size for entire build' },
  { ref: 'cap-screw-m6x20', note: '14× total — 8 base · 4 boom mount · 2 VRU' },
  { ref: 'cap-screw-m6x30', note: '2× — LR970B boom IMU mount' },
  { ref: 'dowel-m3x12', note: 'Single dowel size for entire build' },
  { ref: 'bearing-5x14x5', note: '4× for dual sheave · 2× for single sheave' },
  { ref: 'pin-sheave-5x150', note: '2× for dual sheave boom head' },
  { ref: 'pin-boom-10x150', note: '1× main boom pivot' },
  { ref: 'extrusion-4040-500', note: '2× 500 mm rails — P/N 40-4040-LITE-BLACK' },
  { ref: 'tnut-m6-rollin', note: '8× — P/N 13093 · base plate to extrusion' },
  { ref: 'endcap-40-series', note: '4× — P/N 12260 · extrusion rail ends' },
];

/** Resolve a hardware line for display in steps */
function formatHardwareEntry(entry) {
  const cat = entry.ref ? HARDWARE_CATALOG[entry.ref] : null;
  const part = cat ? cat.formalName : entry.part;
  const spec = cat
    ? [
        cat.partNumber && `P/N ${cat.partNumber}`,
        cat.thread && `${cat.thread} thread`,
        cat.length && cat.length,
        cat.installHole && `install in ${cat.installHole}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : entry.spec;
  const note = [entry.note, cat?.notes].filter(Boolean).join(' · ');
  const vendor = cat?.vendorUrl
    ? `<a href="${cat.vendorUrl}" target="_blank" rel="noopener">${cat.vendor || 'Supplier'}</a>`
    : null;
  return { part, spec, note, qty: entry.qty, shortLabel: cat?.shortLabel, vendor, vendorUrl: cat?.vendorUrl };
}

function renderCatalogCard(id) {
  const c = HARDWARE_CATALOG[id];
  if (!c) return '';
  return c;
}

window.TmcCraneHardware = {
  HARDWARE_CATALOG,
  INSERT_CALLOUTS,
  MASTER_HARDWARE_KIT,
  formatHardwareEntry,
  renderCatalogCard,
};
