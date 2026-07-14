/**
 * PD25R survey target map - multi-panel hotspot photos.
 *
 * WORKFLOW: Mark hotspot centers with blue dots on a photo, send it in chat.
 * We detect dot positions and add a panel entry below.
 *
 * Each panel = one photo + the points visible in that photo.
 * detailImage can match the panel image (close-up is the panel itself) until
 * you provide an even tighter exploded crop.
 */
var PD25_MAST_PIN_NOTE =
  'Measure the inside face of the pin flange — at the middle of the X pin (not the outer face). Center the acrylic target on that inside flange surface.';

var PD25_TARGET_MAP = {
  title: 'Survey target placement',
  subtitle:
    'Tap a labeled point on each photo for placement detail.',

  mastPinNote: PD25_MAST_PIN_NOTE,

  panels: [
    {
      id: 'antennas-mb-h',
      title: 'MB and H - GNSS antennas',
      image: 'assets/diagrams/panels/pd25-mb-h-antennas.jpg',
      points: [
        {
          id: 'H',
          label: 'H - Heading antenna',
          short: 'Heading antenna (rear)',
          required: true,
          x: 24.2,
          y: 10.5,
          detailImage: 'assets/diagrams/panels/pd25-mb-h-detail.jpg',
          detailCaption:
            'Heading antenna (H) — rear Zephyr 3. Place EW measure-up tool P/N 105568 with post vertical on the antenna bracket. Keep the post plumb (as shown). Rod height 0.200 m / 0.656 ft (post only) — enter in calculator, not Siteworks. Shoot as control with zero rod height in Siteworks.',
        },
        {
          id: 'MB',
          label: 'MB - Moving base antenna',
          short: 'Moving-base antenna (mast side)',
          required: true,
          x: 68.0,
          y: 31.5,
          detailImage: 'assets/diagrams/panels/pd25-mb-h-detail.jpg',
          detailCaption:
            'Moving-base antenna (MB) — mast-side Zephyr 3. Place EW measure-up tool P/N 105568 with post vertical on the antenna bracket. Keep the post plumb (as shown). Rod height 0.200 m / 0.656 ft (post only) — enter in calculator, not Siteworks. Shoot as control with zero rod height in Siteworks.',
        },
      ],
    },
    {
      id: 'mast-ml',
      title: 'ML - Mast left X-slide pin',
      image: 'assets/diagrams/panels/pd25-ml-overview.jpg',
      points: [
        {
          id: 'ML',
          label: 'ML - Mast left',
          short: 'Inside left pin flange — middle of X pin',
          required: true,
          x: 44.1,
          y: 44.9,
          detailImage: 'assets/diagrams/panels/pd25-ml-detail.jpg',
          detailCaption:
            'ML — mast left X-slide pin. ' +
            PD25_MAST_PIN_NOTE +
            ' Use the left pin flange. Machine in reference position: mast foot down, Y-carriage in, X-carriage fully left (engine side). Shoot as control with zero rod height in Siteworks.',
        },
      ],
    },
    {
      id: 'mast-mr',
      title: 'MR - Mast right X-slide pin',
      image: 'assets/diagrams/panels/pd25-mr-overview.jpg',
      points: [
        {
          id: 'MR',
          label: 'MR - Mast right',
          short: 'Inside right pin flange — middle of X pin',
          required: true,
          x: 51.3,
          y: 39.0,
          detailImage: 'assets/diagrams/panels/pd25-mr-detail.jpg',
          detailCaption:
            'MR — mast right X-slide pin. ' +
            PD25_MAST_PIN_NOTE +
            ' Use the right pin flange. Machine in reference position: mast foot down, Y-carriage in, X-carriage fully left (engine side). Shoot as control with zero rod height in Siteworks.',
        },
      ],
    },
    {
      id: 'mast-mf',
      title: 'MF - Mast foot (optional)',
      image: 'assets/diagrams/panels/pd25-mf-overview.jpg',
      points: [
        {
          id: 'MF',
          label: 'MF - Mast foot',
          short: 'Mast foot / pile guide seam (optional T5)',
          required: false,
          x: 19.8,
          y: 72.4,
          detailImage: 'assets/diagrams/panels/pd25-mf-detail.jpg',
          detailCaption:
            'MF — mast foot / pile guide seam. Mast must be completely lowered. Machine in reference position: mast foot down, Y-carriage in, X-carriage fully left (engine side). Shoot as control with zero rod height in Siteworks. Enables T5 when present in your survey CSV.',
        },
      ],
    },
    {
      id: 'hammer-hc',
      title: 'HC - Hammer center (optional)',
      image: 'assets/diagrams/panels/pd25-hc-overview.jpg',
      points: [
        {
          id: 'HC',
          label: 'HC - Hammer center',
          short: 'Hammer center / pile guide (optional T1)',
          required: false,
          x: 37.6,
          y: 58.2,
          detailImage: 'assets/diagrams/panels/pd25-hc-detail.jpg',
          detailCaption:
            'HC — hammer center at the pile guide / jaw opening center. Optional if tuning T1 on pile later. If you shot the hammer face instead of center, use the HC offset field in the calculator. Shoot as control with zero rod height in Siteworks.',
        },
      ],
    },
  ],
};

/** Flat list of every point across panels (for legend / lookup). */
PD25_TARGET_MAP.allPoints = (function () {
  var out = [];
  (PD25_TARGET_MAP.panels || []).forEach(function (panel) {
    (panel.points || []).forEach(function (pt) {
      out.push(pt);
    });
  });
  return out;
})();
