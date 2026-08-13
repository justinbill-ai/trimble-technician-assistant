/**
 * CTL measure-up — survey layout and calculator usage guide.
 */
var CTL_MEASUREUP = {
  machine: 'Compact Track Loader',

  theoryOfOperation: {
    title: 'How to use this calculator — CTL',
    intro:
      'Set up your total station in a new Siteworks project, survey the machine, upload the CSV here, then copy the results into your calibration project. Before any shots, position on flat ground with receiver roll near zero — Siteworks Machine Leveling requires this before you tap RECORD, and surveying with roll forces a full remeasure if you reposition the machine afterward. Do not move any machine linkage until all Siteworks calibration steps are complete.',
    sections: [
      {
        id: 'siteworks-setup',
        title: 'Siteworks and total station setup',
        list: [
          'Create a new project in Siteworks for your total station survey — separate from the project where you will calibrate the CTL.',
          'Set the new project to the same units as your working calibration project (for example, if the working project is US FT, set the measure-up project to US FT).',
          'You do not need the GNSS receiver on the bracket for CTL measure-up.',
        ],
      },
      {
        id: 'field-positioning',
        title: 'Before you survey',
        paragraphs: [
          'Critical for total station measure-up: move the CTL to a flat location and rotate until receiver roll is near zero before you take any shots. On the Siteworks Machine Leveling screen, the machine must be relatively level — tap RECORD only when roll reads near zero.',
          'If you survey with significant roll, you will have to reposition the machine after taking shots to satisfy Machine Leveling. That forces a full remeasure. Siteworks does not compensate for roll during CTL measure-up.',
        ],
        list: [
          'Position on flat ground with receiver roll near zero on the Machine Leveling screen — do this before your total station shots, not after.',
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
          'Set calculator units to match your Siteworks measure-up project.',
          'Choose both measurement methods, upload the CSV, and confirm all required points are found.',
          'Tap Run calculations, then copy each result into the matching Siteworks measure-up screen.',
          'Important: Once survey measurements are taken, do not move the machine linkage until you complete all Siteworks calibration steps.',
          'Do not move the machine between plumb-bob measurements and tapping RECORD in Siteworks.',
        ],
      },
    ],
  },

  siteworksResults: [
    'Receiver bracket bolt to pivot point',
    'Receiver bracket to centerline',
    'Pivot point to plumb bob',
    'Pivot point to attachment cutting edge',
    'Attachment cutting edge to plumb bob',
    'Attachment width',
  ],

  plumbBobNote:
    'Pivot point to plumb bob and attachment cutting edge to plumb bob are calibration measurements. Do not move the machine linkage between measuring and completing all Siteworks calibration steps.',
};
