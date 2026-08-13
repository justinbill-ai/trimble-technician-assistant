/**
 * Excavator measure-up — survey layout and calculator usage guide.
 */
var EXCAVATOR_MEASUREUP = {
  machine: 'Excavator',
  earthworksPivotLabel: 'Pin G',

  theoryOfOperation: {
    title: 'How to use this calculator — Excavator',
    intro:
      'Upload one survey CSV, choose how you measured centerline and attachment width, then copy the results into Siteworks. Shoot from one setup with the stick extended when possible, and do not move the machine between survey and RECORD.',
    sections: [
      {
        id: 'field-positioning',
        title: 'Before you survey',
        list: [
          'Shoot all points from one setup with the stick extended when possible; do not move the machine between survey and RECORD.',
          'GNSS receiver on the bracket; confirm mount location and coupler type in Siteworks Receiver Orientation.',
          'Plumb bob, tape measure, and calibration magnet required.',
        ],
      },
      {
        id: 'minimum-shots',
        title: 'Minimum survey shots',
        paragraphs: ['Required in every CSV (one setup, stick extended when possible):'],
        list: [
          'BB — bottom bolt of the GNSS antenna bracket',
          'CT1 — control point closest to the R780 receiver',
          'CT2 — control point closest to the pivot pin (G)',
          'G — attachment pivot pin (Earthworks Pin G)',
          'CL — cutting edge (left corner)',
        ],
        footnote:
          'Also shoot BL and BR when you choose Total station for centerline. Shoot CR when you choose Total station for attachment width.',
      },
      {
        id: 'centerline',
        title: 'Receiver to centerline method',
        paragraphs: ['Use the first dropdown in the calculator:'],
        methods: [
          {
            name: 'Total station',
            body:
              'Select Total station and include BL and BR in the CSV on opposite sides of the stick (BR on the hidden side). Use equidistant targets. Confirm the bracket offset field matches your welment (default 0.030 US ft / 0.009 m).',
          },
          {
            name: 'Manual tape',
            body:
              'Select Manual and enter the tape-measured stick width and the bracket offset. BL and BR are not required in the CSV.',
          },
        ],
      },
      {
        id: 'width',
        title: 'Attachment width method',
        paragraphs: ['Use the second dropdown in the calculator:'],
        methods: [
          {
            name: 'Total station',
            body: 'Select Total station and include CL and CR at the cutting-edge corners in the CSV.',
          },
          {
            name: 'Manual tape',
            body: 'Select Manual and enter the measured bucket or attachment width. CR is optional in the CSV.',
          },
        ],
      },
      {
        id: 'running',
        title: 'Run and copy results',
        list: [
          'Set units to match your Siteworks project.',
          'Choose both measurement methods, upload the CSV, and confirm all required points are found.',
          'Tap Run calculations, then copy each result into the matching Siteworks measure-up screen.',
          'Do not move the machine between plumb-bob measurements and tapping RECORD in Siteworks.',
        ],
      },
    ],
  },

  siteworksResults: [
    'Receiver bracket bolt to pivot point',
    'Receiver bracket to centerline',
    'Pivot point to plumb bob',
    'Receiver pitch',
    'Pivot point to attachment cutting edge',
    'Attachment cutting edge to plumb bob',
    'Attachment width',
  ],

  plumbBobNote:
    'Pivot point to plumb bob and attachment cutting edge to plumb bob are calibration measurements. Do not move the machine between measuring and tapping RECORD in Siteworks.',
};
