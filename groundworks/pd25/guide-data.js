/**
 * Vermeer PD25R measure-up guide — sourced from OEM measure-up guide (Dec 2025).
 * Phases 1–3 & 6 = technician verification funnel; phases 4–5 = survey calculator.
 */
var PD25_GUIDE = {
  product: 'Trimble Groundworks',
  machine: 'Vermeer PD25R Pile Driver',
  docTitle: 'OEM Vermeer PD25R Measure Up Guide',
  accuracyBanner:
    'Groundworks accuracy depends on Vermeer mechanical calibration, correct reference positioning, and verified measure-up values. Complete every phase in this guide before relying on guidance.',

  machineAssumptions: [
    'Moving Base (MB) must be the antenna closest to the mast.',
    'Heading (H) must be the rear antenna on the machine.',
    'Antenna brackets are assumed left of the mast (standard PD25 MB and H mounting).',
    'Reference position: mast foot lowered, Y-carriage in, X-carriage fully left (engine side).',
  ],

  requiredTooling: [
    'Trimble SPS930 total station',
    'Tri-Max tripod',
    'Trimble data collector',
    'Minimum 5 acrylic targets',
    'Earthworks measure-up tool P/N 105568 (Zephyr 3 Rugged)',
    'Calibrated smart level (inclinometer)',
  ],

  /** COGO constants from guide — metric primary (reverse-verified against ECM CSV). */
  cogo: {
    offsetLine: {
      /** Siteworks step 1: perpendicular horizontal offset of ML→MR line (right +). */
      horizontalM: 0.083,
      horizontalFt: 0.272,
      /** Siteworks step 2: vertical offset applied to the horizontally offset line (up +). */
      verticalM: 0.322,
      verticalFt: 1.056,
      note:
        'Mirror Siteworks: offset ML→MR line horizontally (83 mm / 0.272 ft right), then vertically (322 mm / 1.056 ft up) to form Line PT1–Line PT2.',
    },
    centerRef: {
      distanceM: 0.263,
      distanceFt: 0.862,
      note: 'From Line PT1 along the offset line toward Line PT2 (Y-pivot on offset line).',
    },
    rodHeightMbH: { metricM: 0.204, usft: 0.669 },
    ewToolHeightM: 0.204,
    rodHeightNote:
      'MB and H are shot with the Earthworks measure-up rod/post. Siteworks must use APC (antenna phase center). If rod height was not entered in Siteworks, subtract the rod height from the measured MB/H elevation before computing G7 (and antenna offsets).',
  },

  surveyPoints: [
    { id: 'ML', label: 'Mast Left — Y pivot pin (ML)', required: true },
    { id: 'MR', label: 'Mast Right — Y pivot pin (MR)', required: true },
    { id: 'MB', label: 'Moving Base antenna APC (MB)', required: true },
    { id: 'H', label: 'Heading antenna APC (H)', required: true },
    { id: 'HC', label: 'Hammer center (HC — optional T1)', required: false },
  ],

  groundworksDefaults: {
    useDefaults: ['T4', 'T6', 'T7', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'B5'],
    measureRequired: ['G1', 'G2', 'G5', 'G6', 'G7', 'T1', 'T2', 'T3'],
  },

  /** Sign conventions for Groundworks Body Pitch/Roll Calibration */
  bodyCalibrationSigns: {
    intro:
      'Enter smart-level readings in Groundworks using these sign rules. Wrong signs are a common cause of poor guidance on slope.',
    pitch: {
      title: 'Pitch calibration (front-to-back)',
      rules: [
        { condition: 'Rear is UP', sign: 'Positive (+)' },
        { condition: 'Rear is DOWN', sign: 'Negative (−)' },
      ],
    },
    roll: {
      title: 'Roll calibration (side-to-side)',
      rules: [
        { condition: 'Right side is UP', sign: 'Negative (−)' },
        { condition: 'Right side is DOWN', sign: 'Positive (+)' },
      ],
    },
  },

  phases: [
    {
      id: 'phase-1',
      title: 'Phase 1 — Vermeer mechanical calibrations',
      critical: true,
      summary:
        'Do not skip. Groundworks relies on Vermeer internal sensors for mast position relative to the chassis.',
      steps: [
        {
          id: 'p1-depth',
          title: 'Depth sensor adjustment (high-left & low-left)',
          body:
            'Set magnetic pickup face ~1/8" (3 mm) from the strip. Too close risks damage; too far causes Z dropout and inconsistent pile depth.',
        },
        {
          id: 'p1-slides',
          title: 'Mast slide & carriage calibration',
          body:
            'Tighten mast slides to minimize left/right hammer movement without binding. Zero X & Y carriage position sensors per Vermeer procedure.',
        },
        {
          id: 'p1-sick',
          title: 'Mast inclination (SICK sensor)',
          body:
            'Plumb mast in X and Y. Zero SICK inclination in Vermeer UI. Confirm isolator kit is installed between SICK sensor and mast (dealer if missing).',
        },
      ],
    },
    {
      id: 'phase-2',
      title: 'Phase 2 — Reference position & targets',
      critical: true,
      summary: 'Most critical for antenna left/back offsets (G1, G2, G5, G6).',
      steps: [
        {
          id: 'p2-ref',
          title: 'Reference position',
          body:
            'Firm level ground · plumb mast · lower mast foot fully · Y-carriage retracted IN · X-carriage fully LEFT (engine side).',
        },
        {
          id: 'p2-ml',
          title: 'Target ML — mast left X-slide pin flange',
          body: 'Split the X pin; center acrylic target on inside of flange.',
        },
        {
          id: 'p2-mr',
          title: 'Target MR — mast right X-slide pin flange',
          body: 'Split the X pin; center acrylic target on inside of flange.',
        },
        {
          id: 'p2-mf',
          title: 'Target MF — mast foot / pile guide seam',
          body: 'Mast must be completely lowered.',
        },
        {
          id: 'p2-mb',
          title: 'Target MB — moving base Zephyr 3 (mast side)',
          body: 'Use EW measure-up tool P/N 105568; post vertical. Rod height 0.204 m / 0.669 ft.',
        },
        {
          id: 'p2-h',
          title: 'Target H — heading Zephyr 3 (rearward)',
          body: 'Use EW measure-up tool P/N 105568; post vertical. Rod height 0.204 m / 0.669 ft.',
        },
        {
          id: 'p2-hc',
          title: 'Target HC — hammer center (optional)',
          body: 'Hammer center (pile guide / jaw opening center) for T1. Optional if tuning T1 on pile later.',
          optional: true,
        },
        {
          id: 'p2-antenna',
          title: 'Antenna mounting note',
          body:
            'If brackets are angled, do not measure a leaned post — use vertical post at APC center or acrylic target above APC. Recommend Trimble P/N 133676 for Z3R on PD25R.',
        },
      ],
    },
    {
      id: 'phase-3',
      title: 'Phase 3 — Siteworks measurement',
      critical: false,
      summary: 'Collect control points before COGO / calculator.',
      steps: [
        {
          id: 'p3-project',
          title: 'Project & instrument',
          body: 'Create Siteworks project (metric recommended). Connect and level SPS930.',
        },
        {
          id: 'p3-settings',
          title: 'Target settings',
          body:
            'Rod height 0.00 for ML, MR, MF, HC. Rod height 0.204 m / 0.669 ft for MB and H. Target type: acrylic.',
        },
        {
          id: 'p3-shoot',
          title: 'Measure & record',
          body: 'Shoot ML, MR, MF, MB, H, and HC if used. Record all as control points. Export CSV for calculator below.',
        },
      ],
    },
    {
      id: 'phase-4-5',
      title: 'Phase 4–5 — COGO & Groundworks values',
      critical: false,
      summary: 'Use the calculator tab after Phases 1–3 are verified.',
      calculator: true,
      steps: [],
    },
    {
      id: 'phase-6',
      title: 'Phase 6 — Body pitch & roll calibration',
      critical: true,
      summary: 'Final step for slope compensation in Groundworks.',
      showBodyCalibrationSigns: true,
      steps: [
        {
          id: 'p6-level',
          title: 'Smart level on body frame',
          body: 'Stable surface (not necessarily level). Place calibrated smart level on a frame member that represents the machine body plane.',
        },
        {
          id: 'p6-read',
          title: 'Read pitch & roll from smart level',
          body: 'Record the pitch (front-to-back) and roll (side-to-side) values shown on the smart level before entering them in Groundworks.',
        },
        {
          id: 'p6-enter',
          title: 'Enter values in Groundworks & calibrate',
          body:
            'Open Body Pitch/Roll Calibration in Trimble Groundworks. Enter pitch and roll using the sign rules in the callout above, then press Calibrate.',
        },
      ],
    },
  ],
};
