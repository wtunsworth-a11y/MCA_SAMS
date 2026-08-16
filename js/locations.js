// Survey locations ("places").
//
// Each location defines the minimum number of photographs a surveyor must
// capture before that location can be signed off. The minimum is what the app
// enforces; `guidance` is advisory text shown to the surveyor on site.
//
// To add a new place, append an entry here — nothing else needs to change.

export const LOCATIONS = [
  {
    id: 'main-entrance',
    name: 'Main Entrance',
    minPhotos: 4,
    guidance:
      'Approach, threshold, door furniture and any signage. Include one wide ' +
      'shot showing the entrance in context.',
  },
  {
    id: 'reception',
    name: 'Reception',
    minPhotos: 3,
    guidance: 'Desk, waiting area and the route from the entrance.',
  },
  {
    id: 'circulation',
    name: 'Corridors & Circulation',
    minPhotos: 4,
    guidance:
      'Each corridor run, junctions, and anything narrowing the clear width.',
  },
  {
    id: 'accessible-wc',
    name: 'Accessible WC',
    minPhotos: 5,
    guidance:
      'Door and approach, transfer space, grab rails, alarm cord and basin.',
  },
  {
    id: 'stairwell',
    name: 'Stairwell',
    minPhotos: 4,
    guidance: 'Each flight, handrails, nosings and landing.',
  },
  {
    id: 'car-park',
    name: 'Car Park',
    minPhotos: 4,
    guidance: 'Bay markings, dropped kerbs, surface condition and the route in.',
  },
  {
    id: 'plant-room',
    name: 'Plant Room',
    minPhotos: 12,
    guidance:
      'Photograph every item of plant individually, plus a legible shot of ' +
      'each asset nameplate, serial number and service label. Add general ' +
      'shots of each wall and the access route. This location needs ' +
      'substantially more photographs than the rest of the survey — budget ' +
      'extra time on site for it.',
  },
];

export const LOCATIONS_BY_ID = new Map(LOCATIONS.map((l) => [l.id, l]));

/** Total photographs required to complete a full survey. */
export const TOTAL_MIN_PHOTOS = LOCATIONS.reduce((n, l) => n + l.minPhotos, 0);
