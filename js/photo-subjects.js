// Photographic schedule for the Managalas small-scale mining survey.
//
// The paper form (incoming/Managalas_Small_Scale_Mining_Survey(1).pdf) records
// photographs only as "Photographs taken: Yes/No" plus a free-text list of photo
// IDs, which leaves what to photograph up to each enumerator. This schedule
// makes the expectation explicit: each subject below declares the minimum number
// of photographs required before it counts as complete.
//
// `guidance` is advisory text shown to the enumerator on site. Question numbers
// refer to the paper form.
//
// `code` prefixes the photo IDs written into the export and shown on screen, so
// an image file can be traced back to its subject without opening it.
// `evidences` lists the question numbers the subject bears on, which is what
// ties the photographs to the answer sheet in the delivered bundle.
//
// To add a subject, append an entry here — nothing else needs to change.

export const SUBJECTS = [
  {
    id: 'site',
    name: 'Mining Site',
    code: 'SITE',
    evidences: [19, 50, 51, 52],
    minPhotos: 4,
    guidance:
      'A wide shot establishing the site in its landscape, the working face ' +
      'or pit, the deposit being worked (Q19), and where the operation meets ' +
      'water — river, stream or discharge point (Q50, Q51). Include tailings ' +
      'or waste material if stored on site (Q52). Record the GPS position ' +
      'alongside these.',
  },
  {
    id: 'equipment',
    name: 'Equipment',
    code: 'EQP',
    evidences: [25, 26, 33, 40],
    minPhotos: 8,
    guidance:
      'Photograph every item separately — gold pan, shovel and pick, sluice ' +
      'box, water pump, highbanker, trommel, metal detector and anything else ' +
      'in use (Q25). Include processing equipment as objects: shaking table, ' +
      'crushing or grinding gear, retort if one is present (Q33, Q40). Where ' +
      'an item is hired rather than owned (Q26), note it below. This subject ' +
      'needs more photographs than any other — one frame per item, not one ' +
      'frame of the pile.',
  },
  {
    id: 'processing',
    name: 'Processing Activity',
    code: 'PROC',
    evidences: [33, 34, 35, 38, 39, 40],
    minPhotos: 4,
    guidance:
      'The recovery process actually underway, not the idle equipment (Q33). ' +
      'Photograph material being fed, crushed or ground; gravity ' +
      'concentration in progress — panning, sluicing or the shaking table ' +
      'running; and the tailings or wash water leaving the process. Where ' +
      'mercury is used, record where it is handled and where amalgam is ' +
      'burned, and whether a retort is fitted (Q34–Q40).',
  },
  {
    id: 'gold',
    name: 'Gold Recovered',
    code: 'GOLD',
    evidences: [27, 29, 67],
    minPhotos: 2,
    guidance:
      'The gold itself — alluvial, fine, coarse, nuggets or gold-bearing ore ' +
      '(Q27). Include something for scale in the frame, a coin or rule. Add a ' +
      'shot of it being weighed or of the sale record where either is ' +
      'available (Q29, Q67, Q68).',
  },
  {
    id: 'rehabilitation',
    name: 'Rehabilitation',
    code: 'REHAB',
    evidences: [58, 59, 60],
    minPhotos: 1,
    guidance:
      'Required whether or not any rehabilitation has been done (Q58, Q59). ' +
      'If work has taken place, photograph it — backfilled pits, replaced ' +
      'topsoil, replanting, stabilised riverbanks or restored drainage. If ' +
      'nothing has been done, photograph the un-rehabilitated ground anyway: ' +
      'the absence of rehabilitation is itself the record.',
  },
];

export const SUBJECTS_BY_ID = new Map(SUBJECTS.map((s) => [s.id, s]));

/** Total photographs required to complete a full survey. */
export const TOTAL_MIN_PHOTOS = SUBJECTS.reduce((n, s) => n + s.minPhotos, 0);
