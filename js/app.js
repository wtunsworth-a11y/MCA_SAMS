import { LOCATIONS, LOCATIONS_BY_ID, TOTAL_MIN_PHOTOS } from './locations.js';
import * as store from './storage.js';
import { normalise, objectUrl, releaseUrls } from './photos.js';

const root = document.getElementById('app');

/* ---------------------------------------------------------------- render -- */

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (value !== null && value !== undefined) node.setAttribute(key, value);
  });
  (Array.isArray(children) ? children : [children]).forEach((child) => {
    if (child) node.append(child);
  });
  return node;
}

function show(view) {
  releaseUrls();
  root.replaceChildren(view);
  window.scrollTo(0, 0);
}

function progressBar(done, required) {
  const pct = required === 0 ? 100 : Math.min(100, (done / required) * 100);
  return el('div', { class: 'bar', role: 'presentation' }, [
    el('span', { class: done >= required ? 'fill done' : 'fill', style: `width:${pct}%` }),
  ]);
}

function photoBadge(count, min) {
  const met = count >= min;
  return el('span', {
    class: met ? 'badge met' : 'badge',
    text: `${count} / ${min} photos`,
    'aria-label': met
      ? `${count} of ${min} photographs taken, minimum met`
      : `${count} of ${min} photographs taken, ${min - count} still required`,
  });
}

/* ------------------------------------------------------------ survey list -- */

async function viewSurveyList() {
  const surveys = await store.listSurveys();

  const items = await Promise.all(
    surveys.map(async (survey) => {
      const counts = await store.photoCounts(survey.id);
      const taken = LOCATIONS.reduce(
        (n, l) => n + Math.min(counts.get(l.id) || 0, l.minPhotos),
        0
      );
      return el('li', {}, [
        el('button', { class: 'card', onclick: () => viewSurvey(survey.id) }, [
          el('div', { class: 'card-head' }, [
            el('h2', { text: survey.siteName }),
            el('span', { class: 'ref', text: survey.reference || '' }),
          ]),
          el('p', {
            class: 'muted',
            text: `${taken} of ${TOTAL_MIN_PHOTOS} required photos · ${new Date(
              survey.createdAt
            ).toLocaleDateString()}`,
          }),
          progressBar(taken, TOTAL_MIN_PHOTOS),
        ]),
      ]);
    })
  );

  show(
    el('section', {}, [
      el('header', { class: 'top' }, [
        el('h1', { text: 'Surveys' }),
        el('button', { class: 'primary', text: 'New survey', onclick: viewNewSurvey }),
      ]),
      surveys.length
        ? el('ul', { class: 'list' }, items)
        : el('p', { class: 'empty', text: 'No surveys yet. Start one to begin capturing photographs.' }),
    ])
  );
}

/* ------------------------------------------------------------ new survey -- */

function viewNewSurvey() {
  const form = el('form', {
    class: 'form',
    onsubmit: async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const survey = await store.createSurvey({
        siteName: data.get('siteName').trim(),
        reference: data.get('reference').trim(),
        surveyor: data.get('surveyor').trim(),
      });
      viewSurvey(survey.id);
    },
  });

  form.append(
    el('label', {}, [
      el('span', { text: 'Site name' }),
      el('input', { name: 'siteName', required: 'required', autocomplete: 'off' }),
    ]),
    el('label', {}, [
      el('span', { text: 'Reference' }),
      el('input', { name: 'reference', autocomplete: 'off' }),
    ]),
    el('label', {}, [
      el('span', { text: 'Surveyor' }),
      el('input', { name: 'surveyor', autocomplete: 'off' }),
    ]),
    el('div', { class: 'actions' }, [
      el('button', { type: 'submit', class: 'primary', text: 'Create survey' }),
      el('button', { type: 'button', text: 'Cancel', onclick: viewSurveyList }),
    ])
  );

  show(
    el('section', {}, [
      el('header', { class: 'top' }, [el('h1', { text: 'New survey' })]),
      form,
    ])
  );
}

/* ----------------------------------------------------------- one survey -- */

async function viewSurvey(surveyId) {
  const survey = await store.getSurvey(surveyId);
  if (!survey) return viewSurveyList();

  const counts = await store.photoCounts(surveyId);
  const outstanding = LOCATIONS.filter((l) => (counts.get(l.id) || 0) < l.minPhotos);

  const rows = LOCATIONS.map((location) => {
    const count = counts.get(location.id) || 0;
    return el('li', {}, [
      el(
        'button',
        { class: 'card', onclick: () => viewLocation(surveyId, location.id) },
        [
          el('div', { class: 'card-head' }, [
            el('h2', { text: location.name }),
            photoBadge(count, location.minPhotos),
          ]),
          progressBar(count, location.minPhotos),
        ]
      ),
    ]);
  });

  show(
    el('section', {}, [
      el('header', { class: 'top' }, [
        el('button', { class: 'back', text: '← Surveys', onclick: viewSurveyList }),
      ]),
      el('h1', { text: survey.siteName }),
      el('p', {
        class: 'muted',
        text: [survey.reference, survey.surveyor].filter(Boolean).join(' · '),
      }),
      outstanding.length
        ? el('p', {
            class: 'warn',
            text: `${outstanding.length} location${
              outstanding.length === 1 ? '' : 's'
            } still below the required photo count.`,
          })
        : el('p', { class: 'ok', text: 'All locations have their required photographs.' }),
      el('ul', { class: 'list' }, rows),
    ])
  );
}

/* --------------------------------------------------------- one location -- */

async function viewLocation(surveyId, locationId) {
  const survey = await store.getSurvey(surveyId);
  const location = LOCATIONS_BY_ID.get(locationId);
  if (!survey || !location) return viewSurveyList();

  const photos = await store.listPhotos(surveyId, locationId);
  const remaining = Math.max(0, location.minPhotos - photos.length);

  const input = el('input', {
    type: 'file',
    accept: 'image/*',
    capture: 'environment',
    multiple: 'multiple',
    class: 'hidden-input',
    id: 'photo-input',
    onchange: async (event) => {
      const files = [...event.target.files];
      event.target.value = '';
      for (const file of files) {
        const blob = await normalise(file);
        await store.addPhoto({ surveyId, locationId, blob });
      }
      viewLocation(surveyId, locationId);
    },
  });

  const grid = el(
    'ul',
    { class: 'grid' },
    photos.map((photo, index) =>
      el('li', {}, [
        el('img', {
          src: objectUrl(photo.blob),
          alt: `${location.name}, photograph ${index + 1} of ${photos.length}`,
          loading: 'lazy',
        }),
        el('button', {
          class: 'remove',
          text: '×',
          'aria-label': `Delete photograph ${index + 1}`,
          onclick: async () => {
            await store.deletePhoto(photo.id);
            viewLocation(surveyId, locationId);
          },
        }),
      ])
    )
  );

  const notes = el('textarea', {
    class: 'notes',
    rows: '4',
    placeholder: 'Observations for this location',
    onchange: async (event) => {
      survey.notes = survey.notes || {};
      survey.notes[locationId] = event.target.value;
      await store.updateSurvey(survey);
    },
  });
  notes.value = (survey.notes && survey.notes[locationId]) || '';

  show(
    el('section', {}, [
      el('header', { class: 'top' }, [
        el('button', {
          class: 'back',
          text: '← ' + survey.siteName,
          onclick: () => viewSurvey(surveyId),
        }),
      ]),
      el('h1', { text: location.name }),
      photoBadge(photos.length, location.minPhotos),
      progressBar(photos.length, location.minPhotos),
      remaining
        ? el('p', {
            class: 'warn',
            text: `${remaining} more photograph${remaining === 1 ? '' : 's'} required here.`,
          })
        : el('p', { class: 'ok', text: 'Minimum photographs met.' }),
      el('p', { class: 'guidance', text: location.guidance }),
      input,
      el('label', { class: 'primary capture', for: 'photo-input', text: 'Take photographs' }),
      photos.length
        ? grid
        : el('p', { class: 'empty', text: 'No photographs yet.' }),
      el('h2', { text: 'Notes' }),
      notes,
    ])
  );
}

viewSurveyList();
