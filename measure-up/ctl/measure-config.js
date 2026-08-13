/**
 * CTL measure-up — survey layout and calculator usage guide.
 */
var CTL_MEASUREUP = {
  machine: 'Compact Track Loader',

  theoryOfOperation: {
    title: 'How to use this calculator — CTL',
    intro:
      'Upload one survey CSV, choose how you measured centerline and attachment width, then copy the results into Siteworks. Position on a level pad with minimal roll, and do not move the tracks after Machine Setup NEXT until measure-up is complete.',
    sections: [
      {
        id: 'field-positioning',
        title: 'Before you survey',
        list: [
          'Use a level pad with minimal roll when possible — Siteworks does not compensate for roll on CTL measure-up.',
          'GNSS receiver on the bracket; set receiver mount location to match your CTL bracket in Siteworks.',
          'Do not move tracks after Machine Setup NEXT until measure-up is complete.',
          'Keep plumb bob and tape measure on hand for manual measurements and plumb-bob calibration.',
        ],
      },
      {
        id: 'minimum-shots',
        title: 'Minimum survey shots',
        paragraphs: ['Required in every CSV (one setup, tracks stationary):'],
        list: [
          'BB — bottom bolt of the GNSS antenna bracket',
          'CT1 — control point; same plane and target thickness as CT2',
          'CT2 — control point on the opposite side of the machine from CT1',
          'G — attachment pivot pin',
          'CL — cutting edge on a straight, unworn section',
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
              'Select Total station and include BL and BR in the CSV on opposite boom lift arms. Use equidistant targets on each arm. Confirm the bracket offset field matches your welment (default 0.030 US ft / 0.009 m).',
          },
          {
            name: 'Manual tape',
            body:
              'Select Manual and enter the tape-measured distance between lift arms and the bracket offset. BL and BR are not required in the CSV.',
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
            body: 'Select Total station and include CL and CR at opposite cutting-edge corners in the CSV.',
          },
          {
            name: 'Manual tape',
            body: 'Select Manual and enter the measured attachment or bucket width. CR is optional in the CSV.',
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
