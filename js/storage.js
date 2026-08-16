// Persistence layer. Surveys and photographs are held in IndexedDB so the app
// keeps working with no connectivity, which is the normal case on site.

const DB_NAME = 'mca-sams';
const DB_VERSION = 1;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('surveys')) {
        db.createObjectStore('surveys', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('photos')) {
        const photos = db.createObjectStore('photos', { keyPath: 'id' });
        photos.createIndex('bySurvey', 'surveyId');
        photos.createIndex('byLocation', ['surveyId', 'locationId']);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

async function tx(storeNames, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeNames, mode);
    let result;
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
    result = fn(transaction);
  });
}

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

/* -------------------------------------------------------------- surveys -- */

export async function listSurveys() {
  const surveys = await tx('surveys', 'readonly', (t) =>
    request(t.objectStore('surveys').getAll())
  );
  return surveys.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSurvey(id) {
  return tx('surveys', 'readonly', (t) =>
    request(t.objectStore('surveys').get(id))
  );
}

export async function createSurvey({ siteName, reference, surveyor }) {
  const survey = {
    id: newId(),
    siteName,
    reference,
    surveyor,
    notes: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await tx('surveys', 'readwrite', (t) => t.objectStore('surveys').put(survey));
  return survey;
}

export async function updateSurvey(survey) {
  survey.updatedAt = Date.now();
  await tx('surveys', 'readwrite', (t) => t.objectStore('surveys').put(survey));
  return survey;
}

export async function deleteSurvey(id) {
  const photos = await listPhotos(id);
  await tx(['surveys', 'photos'], 'readwrite', (t) => {
    t.objectStore('surveys').delete(id);
    const store = t.objectStore('photos');
    photos.forEach((p) => store.delete(p.id));
  });
}

/* --------------------------------------------------------------- photos -- */

export async function listPhotos(surveyId, locationId) {
  return tx('photos', 'readonly', (t) => {
    const store = t.objectStore('photos');
    const req = locationId
      ? store.index('byLocation').getAll([surveyId, locationId])
      : store.index('bySurvey').getAll(surveyId);
    return request(req).then((rows) => rows.sort((a, b) => a.takenAt - b.takenAt));
  });
}

export async function addPhoto({ surveyId, locationId, blob }) {
  const photo = {
    id: newId(),
    surveyId,
    locationId,
    blob,
    takenAt: Date.now(),
  };
  await tx('photos', 'readwrite', (t) => t.objectStore('photos').put(photo));
  return photo;
}

export async function deletePhoto(id) {
  await tx('photos', 'readwrite', (t) => t.objectStore('photos').delete(id));
}

/**
 * Photo counts for one survey, keyed by location id.
 * Locations with no photographs yet are simply absent from the map.
 */
export async function photoCounts(surveyId) {
  const photos = await listPhotos(surveyId);
  const counts = new Map();
  photos.forEach((p) => counts.set(p.locationId, (counts.get(p.locationId) || 0) + 1));
  return counts;
}
