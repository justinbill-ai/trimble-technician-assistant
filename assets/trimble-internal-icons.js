/**
 * Trimble Internal header badge icons — SVG registry for preview & production.
 * Set WORKSPACE_CONFIG.trimbleInternalIcon to one of the keys below.
 *
 * Brand palette: #005f9e blue · #003d66 dark · #004a7c mid · #fbad26 gold · #e8f2f8 tint · #fff white
 */
(function (global) {
  'use strict';

  var B = '#005f9e';
  var D = '#003d66';
  var M = '#004a7c';
  var G = '#fbad26';
  var T = '#e8f2f8';
  var W = '#ffffff';

  var ICONS = {
    'shield-t': {
      label: 'Shield + T',
      desc: 'Trust badge — Trimble personnel verified',
      palette: 'mono',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.5L4.5 5.5v5.8c0 4.6 3.2 8.9 7.5 10.2 4.3-1.3 7.5-5.6 7.5-10.2V5.5L12 2.5z" fill="currentColor" opacity="0.2"/><path d="M12 2.5L4.5 5.5v5.8c0 4.6 3.2 8.9 7.5 10.2 4.3-1.3 7.5-5.6 7.5-10.2V5.5L12 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10.2 8.2h3.6v1.1h-2.5v1.4h2.2v1.1h-2.2v2.4h-1.1V8.2z" fill="currentColor"/></svg>',
    },
    'crosshair-mc': {
      label: 'MC Crosshair',
      desc: 'Machine control — grade & guidance focus',
      palette: 'mono',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/></svg>',
    },
    'satellite-arc': {
      label: 'GNSS Arc',
      desc: 'Survey & positioning — field satellite lock',
      palette: 'mono',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 14.5a8 8 0 0115 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7.5 14.5a5 5 0 019 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="14.5" r="1.6" fill="currentColor"/><path d="M12 3v2.5M16.2 4.8l-1.2 2.1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    },
    'grid-grade': {
      label: 'Grade Grid',
      desc: 'Earthworks grade surface — machine control plane',
      palette: 'mono',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8h16M4 12h16M4 16h16M8 5v14M12 5v14M16 5v14" stroke="currentColor" stroke-width="1.2" opacity="0.45"/><path d="M5 17l4-3 3 2 7-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="18" cy="10" r="1.8" fill="currentColor"/></svg>',
    },
    'badge-master': {
      label: 'Master Badge',
      desc: 'Gold star tier — internal personnel',
      palette: 'mono',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M12 6.2l1.4 2.8 3.1.5-2.2 2.1.5 3.1L12 13.4l-2.8 1.3.5-3.1-2.2-2.1 3.1-.5L12 6.2z" fill="currentColor"/></svg>',
    },
    'hex-core': {
      label: 'Hex Core',
      desc: 'Internal systems hub — connected stack',
      palette: 'mono',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3.5l6.5 3.75v7.5L12 18.5l-6.5-3.75v-7.5L12 3.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="11" r="2.5" fill="currentColor"/></svg>',
    },
    'layers-field': {
      label: 'Field Layers',
      desc: 'Design surfaces & multi-layer field data',
      palette: 'mono',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4.5L3.5 9 12 13.5 20.5 9 12 4.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5.5 12.5L12 16l6.5-3.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5.5 16L12 19.5 18.5 16" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" opacity="0.7"/></svg>',
    },
    'bolt-signal': {
      label: 'Signal Bolt',
      desc: 'Connected field tech — live machine link',
      palette: 'mono',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13.2 2.8L8.5 12h3.8l-.9 9.2L17 10.5h-4l.2-7.7z" fill="currentColor"/></svg>',
    },

    /* —— Brand color experiments —— */
    'brand-t-split': {
      label: 'T Split Mark',
      desc: 'Trimble T — gold bar on blue field',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" fill="' +
        M +
        '"/><path d="M7.5 7.5h9v2.2H12.8v9H10.2v-9H7.5V7.5z" fill="' +
        G +
        '"/></svg>',
    },
    'brand-t-ring': {
      label: 'T Gold Ring',
      desc: 'Trimble T inside gold verification ring',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="' +
        G +
        '" stroke-width="2"/><circle cx="12" cy="12" r="6.5" fill="' +
        B +
        '"/><path d="M9.8 8.5h4.4v1.5h-2.9v5.5h-1.5V10H9.8V8.5z" fill="' +
        W +
        '"/></svg>',
    },
    'brand-compass': {
      label: 'MC Compass',
      desc: 'Machine control compass — blue & gold sectors',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="' +
        T +
        '" stroke-width="1.2"/><path d="M12 3v9l6.5 3.7" fill="' +
        G +
        '" opacity="0.9"/><path d="M12 12L5.5 15.7 12 21 18.5 15.7 12 12z" fill="' +
        B +
        '"/><circle cx="12" cy="12" r="2" fill="' +
        W +
        '"/></svg>',
    },
    'compass-white-card': {
      label: 'White Compass',
      desc: 'Concentric compass rings with Trimble mark — white card badge',
      palette: 'brand',
      family: 'compass',
      badgeStyle: 'white-card',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="' +
        W +
        '" stroke="#e0e1e9" stroke-width="1"/><circle cx="12" cy="12" r="7.2" fill="none" stroke="#cbcdd6" stroke-width="0.9"/><circle cx="12" cy="12" r="4.8" fill="' +
        W +
        '" stroke="#e8f2f8" stroke-width="0.8"/><path d="M12 8.4l2.6 4.2H9.4L12 8.4z" fill="' +
        G +
        '"/><path d="M9.6 13.1h4.8l-.8 2.6h-3.2l-.8-2.6z" fill="' +
        B +
        '"/></svg>',
    },
    'brand-gnss-lock': {
      label: 'GNSS Lock',
      desc: 'Satellite fix — gold lock on blue arcs',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 15a8 8 0 0116 0" stroke="' +
        T +
        '" stroke-width="1.5" stroke-linecap="round"/><path d="M7 15a5 5 0 0110 0" stroke="' +
        G +
        '" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="15" r="2" fill="' +
        G +
        '"/><path d="M12 4v3M15.5 5.5l-1 1.7" stroke="' +
        T +
        '" stroke-width="1.3" stroke-linecap="round"/><rect x="9.5" y="8" width="5" height="4" rx="1" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1"/><path d="M11 10h2" stroke="' +
        G +
        '" stroke-width="1.2" stroke-linecap="round"/></svg>',
    },
    'brand-grade-cut': {
      label: 'Grade Cut/Fill',
      desc: 'Earthworks cut-fill — blue surface, gold blade',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 16h18" stroke="' +
        T +
        '" stroke-width="1.2"/><path d="M4 16c2-3 4-4 8-4s6 1 8 4" fill="' +
        B +
        '" opacity="0.85"/><path d="M6 18l4-6h4l4 6" stroke="' +
        G +
        '" stroke-width="1.6" stroke-linejoin="round"/><circle cx="18" cy="9" r="2" fill="' +
        G +
        '"/></svg>',
    },
    'brand-pile-gw': {
      label: 'Pile Driver',
      desc: 'Groundworks pile — gold tip, blue shaft',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 20h8" stroke="' +
        T +
        '" stroke-width="1.3" stroke-linecap="round"/><rect x="10.5" y="6" width="3" height="14" rx="0.8" fill="' +
        B +
        '"/><path d="M9.5 6h5l-2.5-3-2.5 3z" fill="' +
        G +
        '"/><path d="M12 3v1.5" stroke="' +
        G +
        '" stroke-width="1.2" stroke-linecap="round"/><circle cx="12" cy="11" r="1.2" fill="' +
        G +
        '" opacity="0.8"/></svg>',
    },
    'brand-excavator': {
      label: 'Excavator MC',
      desc: 'Earthworks machine control — boom silhouette',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 18h12" stroke="' +
        T +
        '" stroke-width="1.2" stroke-linecap="round"/><rect x="4" y="14" width="6" height="4" rx="1" fill="' +
        M +
        '"/><path d="M10 16h3l5-5 2 1-5 5h-3" stroke="' +
        G +
        '" stroke-width="1.5" stroke-linejoin="round"/><path d="M18 7l2-2 1.5 1.5-2 2" stroke="' +
        B +
        '" stroke-width="1.4" stroke-linejoin="round"/><circle cx="7" cy="16" r="1.2" fill="' +
        G +
        '"/></svg>',
    },
    'brand-rtk-rover': {
      label: 'RTK Rover',
      desc: 'Survey rover pole — gold fix indicator',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14" stroke="' +
        T +
        '" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="5.5" r="2.5" fill="' +
        G +
        '"/><rect x="10" y="8" width="4" height="3" rx="0.6" fill="' +
        B +
        '"/><path d="M8 20h8" stroke="' +
        G +
        '" stroke-width="1.3" stroke-linecap="round"/><path d="M5 8a7 7 0 0114 0" stroke="' +
        B +
        '" stroke-width="1.2" stroke-linecap="round" opacity="0.7"/></svg>',
    },
    'brand-connect': {
      label: 'Connect Nodes',
      desc: 'Trimble Connect style — linked field nodes',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="6" cy="12" r="2.5" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1"/><circle cx="18" cy="6" r="2.5" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1"/><circle cx="18" cy="18" r="2.5" fill="' +
        G +
        '"/><path d="M8.2 11l7.6-3.5M8.2 13l7.6 3.5" stroke="' +
        T +
        '" stroke-width="1.3" stroke-linecap="round"/></svg>',
    },
    'brand-shield-key': {
      label: 'Shield Key',
      desc: 'Internal access — blue shield, gold keyhole',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.5L5 5.2v5.5c0 4 2.8 7.8 7 9.3 4.2-1.5 7-5.3 7-9.3V5.2L12 2.5z" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1.3" stroke-linejoin="round"/><circle cx="12" cy="10.5" r="2.2" fill="' +
        G +
        '"/><path d="M12 12.5v3.5" stroke="' +
        D +
        '" stroke-width="1.5" stroke-linecap="round"/></svg>',
    },
    'brand-dozer-blade': {
      label: 'Dozer Blade',
      desc: 'Siteworks grade — gold blade on blue track',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 14h18v3H3z" fill="' +
        M +
        '"/><path d="M5 14V9h14v5" stroke="' +
        G +
        '" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 17v2M12 17v2M16 17v2" stroke="' +
        T +
        '" stroke-width="1.2" stroke-linecap="round"/><circle cx="12" cy="7" r="1.5" fill="' +
        G +
        '"/></svg>',
    },
    'brand-laser-plane': {
      label: 'Laser Plane',
      desc: 'Grade plane reference — MC elevation control',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 14h18" stroke="' +
        G +
        '" stroke-width="1.5" stroke-linecap="round"/><path d="M3 14l3-4h12l3 4" fill="' +
        B +
        '" opacity="0.5"/><rect x="10" y="5" width="4" height="5" rx="1" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1"/><path d="M6 10h12" stroke="' +
        G +
        '" stroke-width="1" stroke-dasharray="2 2" opacity="0.8"/></svg>',
    },
    'brand-internal-star': {
      label: 'Internal Star',
      desc: 'Gold star on Trimble blue — personnel tier',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="' +
        B +
        '"/><circle cx="12" cy="12" r="8.5" stroke="' +
        G +
        '" stroke-width="1.2"/><path d="M12 6.5l1.6 3.2 3.5.5-2.5 2.4.6 3.5L12 14.2l-3.2 1.7.6-3.5-2.5-2.4 3.5-.5L12 6.5z" fill="' +
        G +
        '"/></svg>',
    },
    'brand-mc-target': {
      label: 'MC Target',
      desc: 'Machine target lock — concentric gold rings',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="' +
        T +
        '" stroke-width="1"/><circle cx="12" cy="12" r="6" stroke="' +
        G +
        '" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="' +
        G +
        '"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="' +
        B +
        '" stroke-width="1.2" stroke-linecap="round"/></svg>',
    },
    'brand-field-badge': {
      label: 'Field Badge',
      desc: 'Rounded badge — blue field, gold check',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1.3"/><path d="M8 12l2.5 2.5L16 9" stroke="' +
        G +
        '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    },
    'brand-trimble-bars': {
      label: 'Trimble Bars',
      desc: 'Abstract Trimble mark — three gold bars',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" fill="' +
        D +
        '"/><rect x="7" y="7" width="10" height="2.2" rx="1" fill="' +
        G +
        '"/><rect x="7" y="11" width="7" height="2.2" rx="1" fill="' +
        W +
        '" opacity="0.9"/><rect x="7" y="15" width="10" height="2.2" rx="1" fill="' +
        B +
        '"/></svg>',
    },
    'brand-machine-pulse': {
      label: 'Machine Pulse',
      desc: 'Live MC link — gold pulse on blue radio',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="10" width="8" height="10" rx="1.5" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1"/><path d="M10 8h4v2h-4z" fill="' +
        M +
        '"/><circle cx="12" cy="14" r="1.5" fill="' +
        G +
        '"/><path d="M4 12a8 8 0 0116 0" stroke="' +
        G +
        '" stroke-width="1.3" stroke-linecap="round" opacity="0.7"/><path d="M6.5 12a5.5 5.5 0 0111 0" stroke="' +
        T +
        '" stroke-width="1.2" stroke-linecap="round"/></svg>',
    },
    'brand-coordinates': {
      label: 'Coordinates',
      desc: 'Survey XYZ — gold origin on blue grid',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 19V5M4 19h16" stroke="' +
        T +
        '" stroke-width="1.2" stroke-linecap="round"/><path d="M4 15h12M4 11h8M4 7h5" stroke="' +
        B +
        '" stroke-width="1" stroke-linecap="round" opacity="0.6"/><circle cx="16" cy="9" r="2.5" fill="' +
        G +
        '"/><path d="M16 6.5V5M16 13v1.5M13.5 9h-1.5M18.5 9H20" stroke="' +
        G +
        '" stroke-width="1" stroke-linecap="round"/></svg>',
    },
    'brand-helmet-link': {
      label: 'Field Tech',
      desc: 'Hard hat + signal — internal field support',
      palette: 'brand',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 14c0-3.3 2.7-6 6-6s6 2.7 6 6v2H6v-2z" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1.2"/><rect x="10" y="16" width="4" height="2" rx="0.5" fill="' +
        M +
        '"/><path d="M5 12a7 7 0 0114 0" stroke="' +
        G +
        '" stroke-width="1.2" stroke-linecap="round" opacity="0.75"/><circle cx="18" cy="6" r="1.5" fill="' +
        G +
        '"/></svg>',
    },

    /* —— Wrench / technician service —— */
    'wrench-classic': {
      label: 'Open-End Wrench',
      desc: 'Classic combination wrench — field service tool',
      palette: 'brand',
      family: 'wrench',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16.2 4.8a3.6 3.6 0 00-4.2 5.6L6.8 15.6a2.2 2.2 0 103.1 3.1l5.2-5.2a3.6 3.6 0 004.2-5.6l-1.6 1.6-2.6-2.6 1.6-1.6z" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1.2" stroke-linejoin="round"/><circle cx="8.3" cy="17.1" r="1.4" fill="' +
        G +
        '"/></svg>',
    },
    'wrench-adjustable': {
      label: 'Adjustable Wrench',
      desc: 'Crescent spanner — adjustable jaw technician tool',
      palette: 'brand',
      family: 'wrench',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19l5.5-5.5 1.8 1.8L6.8 20.8 5 19z" fill="' +
        M +
        '"/><path d="M10.2 8.4l5.4-5.4a3.2 3.2 0 014.5 4.5l-2.2 2.2" stroke="' +
        G +
        '" stroke-width="1.6" stroke-linecap="round"/><path d="M12.8 10.8l6.4 6.4a2 2 0 01-2.8 2.8l-6.4-6.4" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1.2" stroke-linejoin="round"/><circle cx="17.8" cy="6.2" r="1.3" fill="' +
        G +
        '"/></svg>',
    },
    'wrench-crossed': {
      label: 'Crossed Wrenches',
      desc: 'Dual wrench — shop & field service emblem',
      palette: 'brand',
      family: 'wrench',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 18l4.5-4.5 7.5 7.5" stroke="' +
        G +
        '" stroke-width="2" stroke-linecap="round"/><path d="M7.5 7.5l3 3M13.5 13.5l3 3" stroke="' +
        B +
        '" stroke-width="2.2" stroke-linecap="round"/><circle cx="7.5" cy="7.5" r="2.2" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1"/><circle cx="16.5" cy="16.5" r="2.2" fill="' +
        G +
        '"/><path d="M9 6.5l2-2M15 18.5l2 2" stroke="' +
        T +
        '" stroke-width="1.3" stroke-linecap="round"/></svg>',
    },
    'wrench-gear': {
      label: 'Wrench + Gear',
      desc: 'Service & calibration — maintenance technician',
      palette: 'brand',
      family: 'wrench',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="9" cy="15" r="4.5" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1.2"/><path d="M9 12.2v1.2M9 16.6v1.2M6.2 15h1.2M10.6 15h1.2M7.1 13.1l.85.85M10.05 16.05l.85.85M10.9 13.1l-.85.85M7.95 16.05l-.85.85" stroke="' +
        G +
        '" stroke-width="1" stroke-linecap="round"/><path d="M13.5 5.5l2.5 2.5 4-4 1.5 1.5-4 4 2.5 2.5-2 2-5.5-5.5 2-2z" fill="' +
        G +
        '" stroke="' +
        D +
        '" stroke-width="0.8" stroke-linejoin="round"/></svg>',
    },
    'wrench-mc': {
      label: 'Wrench + Crosshair',
      desc: 'Technician Assistant — service meets machine control',
      palette: 'brand',
      family: 'wrench',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 17l4-4 2.2 2.2-4 4H5v-2.2z" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1.1" stroke-linejoin="round"/><path d="M11.5 6.5l2-2a2.8 2.8 0 014 4l-2 2" stroke="' +
        G +
        '" stroke-width="1.5" stroke-linecap="round"/><circle cx="17.5" cy="6.5" r="1.5" fill="' +
        G +
        '"/><circle cx="17" cy="17" r="5" stroke="' +
        T +
        '" stroke-width="1.2"/><path d="M17 14v6M14 17h6" stroke="' +
        G +
        '" stroke-width="1.3" stroke-linecap="round"/><circle cx="17" cy="17" r="1.5" fill="' +
        G +
        '"/></svg>',
    },
    'wrench-box-end': {
      label: 'Box-End Wrench',
      desc: 'Ring spanner — precision fastener work',
      palette: 'brand',
      family: 'wrench',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 18l3.5-3.5 8-8 3.5 3.5-8 8L5 18z" fill="' +
        M +
        '" stroke="' +
        G +
        '" stroke-width="1.1" stroke-linejoin="round"/><circle cx="17.5" cy="6.5" r="3.2" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1.3"/><circle cx="17.5" cy="6.5" r="1.4" fill="' +
        D +
        '"/></svg>',
    },
    'wrench-pipe': {
      label: 'Pipe Wrench',
      desc: 'Serrated jaw wrench — heavy install & rigging',
      palette: 'brand',
      family: 'wrench',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18l3-3 9-9 2 2-9 9-3 3-2-2 3-3" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1.1" stroke-linejoin="round"/><path d="M15 4l3 3M17.5 5.5l1.5 3-2 1-1.5-3" fill="' +
        G +
        '"/><path d="M16 7l1.5 1.5M17 8.5l2 2" stroke="' +
        T +
        '" stroke-width="1.2" stroke-linecap="round"/><circle cx="7.5" cy="16.5" r="1.5" fill="' +
        G +
        '"/></svg>',
    },
    'wrench-socket': {
      label: 'Ratchet Socket',
      desc: 'Socket wrench — assembly line & bench work',
      palette: 'brand',
      family: 'wrench',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 14.5h7l4.5-4.5 3.5 3.5-4.5 4.5H4v-3.5z" fill="' +
        M +
        '" stroke="' +
        G +
        '" stroke-width="1" stroke-linejoin="round"/><rect x="14" y="4" width="6" height="6" rx="1" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1.2" transform="rotate(45 17 7)"/><circle cx="17" cy="7" r="1.5" fill="' +
        G +
        '"/><path d="M18.5 8.5l2.5 2.5" stroke="' +
        G +
        '" stroke-width="1.4" stroke-linecap="round"/></svg>',
    },
    'wrench-bolt': {
      label: 'Wrench on Bolt',
      desc: 'Hex fastener service — install & commissioning',
      palette: 'brand',
      family: 'wrench',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 8l-1.5 2.6h3L12 8z" fill="' +
        G +
        '"/><path d="M8.5 13.5l-2 3.5h11l-2-3.5H8.5z" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1"/><path d="M4 16l3.5-2 1.5 2.6-3.5 2-1.5-2.6z" fill="' +
        G +
        '" stroke="' +
        D +
        '" stroke-width="0.8"/><circle cx="12" cy="12" r="5.5" stroke="' +
        T +
        '" stroke-width="1" stroke-dasharray="2 2" opacity="0.6"/></svg>',
    },
    'wrench-torque': {
      label: 'Torque Wrench',
      desc: 'Calibrated torque — spec-driven service',
      palette: 'brand',
      family: 'wrench',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 17l4-3.5 7-7 2.5 2.5-7 7L5 17z" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1.1" stroke-linejoin="round"/><rect x="14" y="3.5" width="6" height="4" rx="1" fill="' +
        D +
        '" stroke="' +
        G +
        '" stroke-width="1"/><path d="M15.5 5.5h3M16 7h2" stroke="' +
        G +
        '" stroke-width="0.9" stroke-linecap="round"/><circle cx="6" cy="18" r="1.5" fill="' +
        G +
        '"/></svg>',
    },
    'wrench-shield': {
      label: 'Wrench Shield',
      desc: 'Internal service badge — wrench in personnel shield',
      palette: 'brand',
      family: 'wrench',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.5L5 5v5.5c0 3.8 2.7 7.4 7 8.8 4.3-1.4 7-5 7-8.8V5L12 2.5z" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1.2" stroke-linejoin="round"/><path d="M9.5 14.5l-1.5-1.5 2-2 1.5 1.5 2.5-2.5 1.2 1.2-2.5 2.5 1.5 1.5-2 2-1.5-1.5-1 1 1.5 1.5-2 2z" fill="' +
        G +
        '"/></svg>',
    },
    'wrench-minimal': {
      label: 'Minimal Wrench',
      desc: 'Bold single-stroke silhouette — reads clearly at small size',
      palette: 'brand',
      family: 'wrench',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14.8 4.2a3.8 3.8 0 00-5 5.7L5.8 13.9a2.4 2.4 0 003.4 3.4l4-4a3.8 3.8 0 005-5.7L16.6 6l-1.8-1.8z" stroke="' +
        G +
        '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7.5" cy="16.5" r="2" fill="' +
        B +
        '" stroke="' +
        G +
        '" stroke-width="1.3"/></svg>',
    },
    'wrench-l-key': {
      label: 'L-Key / Allen',
      desc: 'Hex key — panel access & fine adjustment',
      palette: 'brand',
      family: 'wrench',
      svg:
        '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17L17 7" stroke="' +
        G +
        '" stroke-width="2.4" stroke-linecap="round"/><path d="M15 5h3v3M5 15h3v3" stroke="' +
        B +
        '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="18" cy="6" r="1.5" fill="' +
        G +
        '"/><circle cx="6" cy="18" r="1.5" fill="' +
        G +
        '"/></svg>',
    },
  };

  function cfg(key, fallback) {
    var c = global.WORKSPACE_CONFIG || {};
    return c[key] != null && c[key] !== '' ? c[key] : fallback;
  }

  function getIconId() {
    try {
      var preview = sessionStorage.getItem('tta-icon-preview-choice');
      if (preview && ICONS[preview]) return preview;
    } catch (err) {}
    var id = cfg('trimbleInternalIcon', 'compass-white-card');
    return ICONS[id] ? id : 'compass-white-card';
  }

  function getIconSvg(id) {
    var key = id && ICONS[id] ? id : getIconId();
    return ICONS[key].svg;
  }

  function listIcons() {
    return Object.keys(ICONS).map(function (id) {
      var item = ICONS[id];
      return {
        id: id,
        label: item.label,
        desc: item.desc,
        svg: item.svg,
        palette: item.palette || 'mono',
        family: item.family || '',
        badgeStyle: item.badgeStyle || '',
      };
    });
  }

  global.TrimbleInternalIcons = {
    ICONS: ICONS,
    BRAND: { blue: B, dark: D, mid: M, gold: G, tint: T, white: W },
    getIconId: getIconId,
    getIconSvg: getIconSvg,
    listIcons: listIcons,
  };
})(window);
