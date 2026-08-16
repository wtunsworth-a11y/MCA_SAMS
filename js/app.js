import { SECTIONS, SECTIONS_BY_ID, ALL_QUESTIONS, NUMBERED_COUNT } from './questions.js';
import { SUBJECTS, SUBJECTS_BY_ID, TOTAL_MIN_PHOTOS } from './photo-subjects.js';
import * as store from './storage.js';
import { prepare, objectUrl, releaseUrls, detachedUrl, revoke } from './photos.js';
import { buildBundle, photoIds } from './export.js';

const root = document.getElementById('app');

/* ---------------------------------------------------------------- render -- */

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (value !== null && value !== undefined && value !== false) {
      node.setAttribute(key, value);
    }
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

function badge(count, min, unit) {
  const met = count >= min;
  return el('span', {
    class: met ? 'badge met' : 'badge',
    text: `${count} / ${min}${unit ? ' ' + unit : ''}`,
  });
}

function backBar(label, onclick) {
  return el('header', { class: 'top' }, [el('button', { class: 'back', text: '← ' + label, onclick })]);
}

/* ------------------------------------------------------------- answering -- */

/** A question counts as answered when it holds any non-empty value. */
function isAnswered(answers, question) {
  const value = answers[question.id];
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (question.type === 'group') {
    return Object.values(value).some((v) => v !== '' && v !== null && v !== undefined);
  }
  return true;
}

function sectionProgress(answers, section) {
  const done = section.questions.filter((q) => isAnswered(answers, q)).length;
  return { done, total: section.questions.length };
}

function answeredCount(answers) {
  return ALL_QUESTIONS.filter((q) => q.n && isAnswered(answers, q)).length;
}

/* ------------------------------------------------------------ survey list -- */

async function viewSurveyList() {
  const surveys = await store.listSurveys();

  const items = surveys.map((survey) => {
    const answers = survey.answers || {};
    const done = answeredCount(answers);
    return el('li', {}, [
      el('button', { class: 'card', onclick: () => viewSurvey(survey.id) }, [
        el('div', { class: 'card-head' }, [
          el('h2', { text: survey.siteName }),
          el('span', { class: 'ref', text: survey.reference || '' }),
        ]),
        el('p', {
          class: 'muted',
          text: `${done} of ${NUMBERED_COUNT} questions · ${new Date(
            survey.createdAt
          ).toLocaleDateString()}`,
        }),
        progressBar(done, NUMBERED_COUNT),
      ]),
    ]);
  });

  show(
    el('section', {}, [
      el('header', { class: 'top' }, [
        el('h1', { text: 'Managalas survey' }),
        el('button', { class: 'primary', text: 'New survey', onclick: viewNewSurvey }),
      ]),
      el('p', {
        class: 'muted',
        text: 'Small-scale mining site & miner survey, Managalas Conservation Area.',
      }),
      surveys.length
        ? el('ul', { class: 'list' }, items)
        : el('p', { class: 'empty', text: 'No surveys yet. Start one to begin an interview.' }),
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
      // Seed the matching questions so the sheet agrees with the header.
      await store.saveAnswer(survey.id, 'q3', survey.siteName);
      if (survey.reference) await store.saveAnswer(survey.id, 'q1', survey.reference);
      if (survey.surveyor) await store.saveAnswer(survey.id, 'o5', survey.surveyor);
      viewSurvey(survey.id);
    },
  });

  form.append(
    el('label', {}, [
      el('span', { text: 'Name of mining site (Q3)' }),
      el('input', { name: 'siteName', required: 'required', autocomplete: 'off' }),
    ]),
    el('label', {}, [
      el('span', { text: 'Survey ID (Q1)' }),
      el('input', { name: 'reference', autocomplete: 'off' }),
    ]),
    el('label', {}, [
      el('span', { text: 'Enumerator' }),
      el('input', { name: 'surveyor', autocomplete: 'off' }),
    ]),
    el('div', { class: 'actions' }, [
      el('button', { type: 'submit', class: 'primary', text: 'Start survey' }),
      el('button', { type: 'button', text: 'Cancel', onclick: viewSurveyList }),
    ])
  );

  show(
    el('section', {}, [
      backBar('Surveys', viewSurveyList),
      el('h1', { text: 'New survey' }),
      form,
    ])
  );
}

/* ------------------------------------------------------- survey contents -- */

async function viewSurvey(surveyId) {
  const survey = await store.getSurvey(surveyId);
  if (!survey) return viewSurveyList();

  const answers = survey.answers || {};
  const counts = await store.photoCounts(surveyId);
  const photosTaken = SUBJECTS.reduce((n, s) => n + Math.min(counts.get(s.id) || 0, s.minPhotos), 0);
  const photosTotal = [...counts.values()].reduce((n, c) => n + c, 0);
  const done = answeredCount(answers);

  const rows = SECTIONS.map((section) => {
    const { done: d, total } = sectionProgress(answers, section);
    return el('li', {}, [
      el('button', { class: 'card', onclick: () => viewSection(surveyId, section.id) }, [
        el('div', { class: 'card-head' }, [
          el('h2', {
            text: section.number !== undefined ? `${section.number}. ${section.title}` : section.title,
          }),
          badge(d, total),
        ]),
        progressBar(d, total),
      ]),
    ]);
  });

  // Photographs sit alongside the paper sections rather than inside them: the
  // form's observation block only asks whether photographs were taken, which
  // this answers from the record itself.
  rows.push(
    el('li', {}, [
      el('button', { class: 'card', onclick: () => viewPhotoSubjects(surveyId) }, [
        el('div', { class: 'card-head' }, [
          el('h2', { text: 'Photographs' }),
          badge(photosTaken, TOTAL_MIN_PHOTOS),
        ]),
        progressBar(photosTaken, TOTAL_MIN_PHOTOS),
      ]),
    ])
  );

  show(
    el('section', {}, [
      backBar('Surveys', viewSurveyList),
      el('h1', { text: survey.siteName }),
      el('p', {
        class: 'muted',
        text: [survey.reference, survey.surveyor].filter(Boolean).join(' · '),
      }),
      el('p', { class: 'muted', text: `${done} of ${NUMBERED_COUNT} numbered questions answered` }),
      progressBar(done, NUMBERED_COUNT),
      el('ul', { class: 'list' }, rows),
      el('div', { class: 'actions spread' }, [
        el('span', {
          class: 'muted',
          text: `${photosTotal} photograph${photosTotal === 1 ? '' : 's'} attached`,
        }),
        el('button', {
          class: 'primary',
          text: 'Export survey + photos',
          onclick: (event) => exportSurvey(surveyId, event.currentTarget),
        }),
      ]),
    ])
  );
}

/* -------------------------------------------------------------- section -- */

async function viewSection(surveyId, sectionId) {
  const survey = await store.getSurvey(surveyId);
  const section = SECTIONS_BY_ID.get(sectionId);
  if (!survey || !section) return viewSurveyList();

  const answers = survey.answers || {};
  const derived = section.id === 'observation' ? await photographsBlock(surveyId, survey) : null;
  const index = SECTIONS.findIndex((s) => s.id === sectionId);
  const next = SECTIONS[index + 1];
  const previous = SECTIONS[index - 1];

  const fields = section.questions.map((q) => questionField(surveyId, q, answers));

  show(
    el('section', {}, [
      backBar(survey.siteName, () => viewSurvey(surveyId)),
      el('p', { class: 'eyebrow', text: section.number !== undefined ? `Section ${section.number}` : 'Observation' }),
      el('h1', { text: section.title }),
      section.preamble ? el('p', { class: 'guidance', text: section.preamble }) : null,
      section.note ? el('p', { class: 'muted', text: section.note }) : null,
      el('div', { class: 'questions' }, fields),
      derived,
      el('div', { class: 'actions spread' }, [
        previous
          ? el('button', {
              text: '← ' + (previous.number !== undefined ? `Section ${previous.number}` : previous.title),
              onclick: () => viewSection(surveyId, previous.id),
            })
          : el('span', {}),
        next
          ? el('button', {
              class: 'primary',
              text: (next.number !== undefined ? `Section ${next.number}` : next.title) + ' →',
              onclick: () => viewSection(surveyId, next.id),
            })
          : el('button', {
              class: 'primary',
              text: 'Done',
              onclick: () => viewSurvey(surveyId),
            }),
      ]),
    ])
  );
}

/* ------------------------------------------------------ question fields -- */

function questionField(surveyId, question, answers) {
  const wrap = el('div', { class: 'question' });
  const heading = question.n ? `${question.n}. ${question.label}` : question.label;
  wrap.append(el('p', { class: 'q-label', text: heading }));

  const save = (key, value) => store.saveAnswer(surveyId, key, value);
  const current = answers[question.id];

  wrap.append(control(question, question.id, current, save, () => {
    // Re-render the section so conditional follow-ups appear or disappear.
    viewSection(surveyId, SECTIONS.find((s) => s.questions.includes(question)).id);
  }));

  if (question.other && needsOther(question, current)) {
    wrap.append(
      labelled(
        'Other — please specify',
        textInput(answers[question.id + '_other'], (v) => save(question.id + '_other', v))
      )
    );
  }

  if (question.follow && followVisible(question.follow, current)) {
    const f = question.follow;
    const key = question.id + '_f';
    wrap.append(
      el('div', { class: 'follow' }, [
        el('p', { class: 'q-label sub', text: f.label }),
        control(f, key, answers[key], save, () =>
          viewSection(surveyId, SECTIONS.find((s) => s.questions.includes(question)).id)
        ),
        f.other && needsOther(f, answers[key])
          ? labelled(
              'Other — please specify',
              textInput(answers[key + '_other'], (v) => save(key + '_other', v))
            )
          : null,
      ])
    );
  }

  return wrap;
}

function needsOther(question, value) {
  if (!question.other) return false;
  return Array.isArray(value) ? value.includes('Other') : value === 'Other';
}

function followVisible(follow, value) {
  if (!follow.when) return true;
  return Array.isArray(value) ? value.some((v) => follow.when.includes(v)) : follow.when.includes(value);
}

function labelled(text, node) {
  return el('label', { class: 'inline-field' }, [el('span', { text }), node]);
}

function textInput(value, onSave, type = 'text') {
  const input = el('input', { type, inputmode: type === 'number' ? 'decimal' : null });
  input.value = value ?? '';
  input.addEventListener('change', () => onSave(input.value.trim()));
  return input;
}

function control(question, key, value, save, rerender) {
  switch (question.type) {
    case 'textarea': {
      const area = el('textarea', { rows: '3' });
      area.value = value ?? '';
      area.addEventListener('change', () => save(key, area.value.trim()));
      return area;
    }

    case 'number': {
      const field = el('div', { class: 'with-unit' }, [textInput(value, (v) => save(key, v), 'number')]);
      if (question.unit) field.append(el('span', { class: 'unit', text: question.unit }));
      return field;
    }

    case 'date':
      return textInput(value, (v) => save(key, v), 'date');

    case 'single':
      return el(
        'div',
        { class: 'options' },
        question.options.map((option) => {
          const input = el('input', { type: 'radio', name: key });
          input.checked = value === option;
          input.addEventListener('change', async () => {
            await save(key, option);
            rerender();
          });
          return el('label', { class: 'option' }, [input, el('span', { text: option })]);
        })
      );

    case 'multi': {
      const chosen = Array.isArray(value) ? value : [];
      return el(
        'div',
        { class: 'options' },
        question.options.map((option) => {
          const input = el('input', { type: 'checkbox' });
          input.checked = chosen.includes(option);
          input.addEventListener('change', async () => {
            const set = new Set(Array.isArray(value) ? value : []);
            input.checked ? set.add(option) : set.delete(option);
            await save(key, question.options.filter((o) => set.has(o)));
            rerender();
          });
          return el('label', { class: 'option' }, [input, el('span', { text: option })]);
        })
      );
    }

    case 'group': {
      const held = value && typeof value === 'object' ? value : {};
      return el(
        'div',
        { class: 'group' },
        question.fields.map((f) =>
          labelled(
            f.label,
            textInput(held[f.key], (v) => {
              const updated = { ...held, [f.key]: v };
              Object.keys(updated).forEach((k) => updated[k] === '' && delete updated[k]);
              save(key, updated);
            }, f.type === 'number' ? 'number' : 'text')
          )
        )
      );
    }

    default:
      return textInput(value, (v) => save(key, v));
  }
}

/**
 * The paper form's observation page asks "Photographs taken: Yes/No" and for a
 * list of photo IDs. Both are facts about the record rather than judgements, so
 * they are derived here instead of typed — which also keeps the IDs in the
 * answer sheet identical to the filenames in the export.
 */
async function photographsBlock(surveyId, survey) {
  const photos = await store.listPhotos(surveyId);
  const ids = photoIds(survey, photos);

  const listed = SUBJECTS.map((subject) => {
    const mine = photos
      .filter((p) => p.locationId === subject.id)
      .sort((a, b) => a.takenAt - b.takenAt)
      .map((p) => ids.get(p.id));
    if (!mine.length) return null;
    return el('li', {}, [
      el('span', { class: 'id-subject', text: subject.name }),
      el('span', { class: 'id-list', text: mine.join(', ') }),
    ]);
  }).filter(Boolean);

  return el('div', { class: 'question derived' }, [
    el('p', { class: 'q-label', text: 'Photographs taken' }),
    el('p', {
      class: photos.length ? 'ok' : 'warn',
      text: photos.length
        ? `Yes — ${photos.length} photograph${photos.length === 1 ? '' : 's'}`
        : 'No',
    }),
    el('p', { class: 'q-label sub', text: 'Photo IDs' }),
    photos.length
      ? el('ul', { class: 'id-list-wrap' }, listed)
      : el('p', { class: 'muted', text: 'None recorded.' }),
    el('p', {
      class: 'muted',
      text: 'Derived from the photographs attached to this survey. These IDs are the filenames in the export.',
    }),
    el('button', { text: 'Go to photographs', onclick: () => viewPhotoSubjects(surveyId) }),
  ]);
}

/* ----------------------------------------------------------- photographs -- */

async function viewPhotoSubjects(surveyId) {
  const survey = await store.getSurvey(surveyId);
  if (!survey) return viewSurveyList();
  const counts = await store.photoCounts(surveyId);

  const rows = SUBJECTS.map((subject) => {
    const count = counts.get(subject.id) || 0;
    return el('li', {}, [
      el('button', { class: 'card', onclick: () => viewSubject(surveyId, subject.id) }, [
        el('div', { class: 'card-head' }, [
          el('h2', { text: subject.name }),
          badge(count, subject.minPhotos, 'photos'),
        ]),
        progressBar(count, subject.minPhotos),
      ]),
    ]);
  });

  const outstanding = SUBJECTS.filter((s) => (counts.get(s.id) || 0) < s.minPhotos);

  show(
    el('section', {}, [
      backBar(survey.siteName, () => viewSurvey(surveyId)),
      el('h1', { text: 'Photographs' }),
      outstanding.length
        ? el('p', {
            class: 'warn',
            text: `${outstanding.length} subject${outstanding.length === 1 ? '' : 's'} still below the required photo count.`,
          })
        : el('p', { class: 'ok', text: 'All subjects have their required photographs.' }),
      el('ul', { class: 'list' }, rows),
    ])
  );
}

async function viewSubject(surveyId, subjectId) {
  const survey = await store.getSurvey(surveyId);
  const subject = SUBJECTS_BY_ID.get(subjectId);
  if (!survey || !subject) return viewSurveyList();

  const photos = await store.listPhotos(surveyId, subjectId);
  const ids = photoIds(survey, await store.listPhotos(surveyId));
  const remaining = Math.max(0, subject.minPhotos - photos.length);

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
        const image = await prepare(file);
        await store.addPhoto({ surveyId, locationId: subjectId, ...image });
      }
      viewSubject(surveyId, subjectId);
    },
  });

  const grid = el(
    'ul',
    { class: 'grid' },
    photos.map((photo, index) =>
      el('li', {}, [
        el('button', {
          class: 'shot',
          'aria-label': `View photograph ${index + 1} full size`,
          onclick: () => openViewer(photos, index, ids),
        }, [
          el('img', {
            src: objectUrl(photo.thumb || photo.blob),
            alt: `${subject.name}, photograph ${index + 1} of ${photos.length}`,
            loading: 'lazy',
          }),
        ]),
        el('span', { class: 'dims', text: ids.get(photo.id) || '' }),
        el('button', {
          class: 'remove',
          text: '×',
          'aria-label': `Delete photograph ${index + 1}`,
          onclick: async () => {
            await store.deletePhoto(photo.id);
            viewSubject(surveyId, subjectId);
          },
        }),
      ])
    )
  );

  const notes = el('textarea', { class: 'notes', rows: '4', placeholder: 'Observations for this subject' });
  notes.value = (survey.notes && survey.notes[subjectId]) || '';
  notes.addEventListener('change', async () => {
    const fresh = await store.getSurvey(surveyId);
    fresh.notes = fresh.notes || {};
    fresh.notes[subjectId] = notes.value;
    await store.updateSurvey(fresh);
  });

  show(
    el('section', {}, [
      backBar('Photographs', () => viewPhotoSubjects(surveyId)),
      el('h1', { text: subject.name }),
      badge(photos.length, subject.minPhotos, 'photos'),
      progressBar(photos.length, subject.minPhotos),
      remaining
        ? el('p', {
            class: 'warn',
            text: `${remaining} more photograph${remaining === 1 ? '' : 's'} required here.`,
          })
        : el('p', { class: 'ok', text: 'Minimum photographs met.' }),
      el('p', { class: 'guidance', text: subject.guidance }),
      input,
      el('label', { class: 'primary capture', for: 'photo-input', text: 'Take photographs' }),
      photos.length ? grid : el('p', { class: 'empty', text: 'No photographs yet.' }),
      el('h2', { text: 'Notes' }),
      notes,
    ])
  );
}

/* --------------------------------------------------------- photo viewer -- */

function openViewer(photos, startIndex, ids = new Map()) {
  let index = startIndex;
  let url = null;

  const image = el('img', { class: 'viewer-image', alt: '' });
  const caption = el('p', { class: 'viewer-caption' });

  const draw = () => {
    if (url) revoke(url);
    const photo = photos[index];
    url = detachedUrl(photo.blob);
    image.src = url;
    image.alt = `Photograph ${index + 1} of ${photos.length}, full size`;
    caption.textContent =
      (ids.get(photo.id) ? ids.get(photo.id) + ' · ' : '') +
      `${index + 1} of ${photos.length}` +
      (photo.width ? ` · ${photo.width}×${photo.height}` : '') +
      ` · ${Math.round(photo.blob.size / 1024)} KB`;
  };

  const close = () => {
    if (url) revoke(url);
    document.removeEventListener('keydown', onKey);
    overlay.remove();
  };

  const step = (by) => {
    index = (index + by + photos.length) % photos.length;
    draw();
  };

  function onKey(event) {
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowRight') step(1);
    if (event.key === 'ArrowLeft') step(-1);
  }

  const overlay = el('div', { class: 'viewer', role: 'dialog', 'aria-modal': 'true' }, [
    el('div', { class: 'viewer-bar' }, [
      caption,
      el('button', { class: 'viewer-close', text: 'Close', onclick: close }),
    ]),
    image,
    photos.length > 1
      ? el('div', { class: 'viewer-nav' }, [
          el('button', { text: '‹ Previous', onclick: () => step(-1) }),
          el('button', { text: 'Next ›', onclick: () => step(1) }),
        ])
      : null,
  ]);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });
  document.addEventListener('keydown', onKey);
  draw();
  document.body.append(overlay);
}

/* ------------------------------------------------------------- delivery -- */

async function exportSurvey(surveyId, button) {
  const label = button && button.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = 'Packaging…';
  }
  try {
    const survey = await store.getSurvey(surveyId);
    const photos = await store.listPhotos(surveyId);
    const { blob, filename } = await buildBundle(survey, photos);

    const url = URL.createObjectURL(blob);
    const link = el('a', { href: url, download: filename });
    document.body.append(link);
    link.click();
    link.remove();
    // Large bundles keep downloading after the click; hold the URL a while.
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = label;
    }
  }
}

viewSurveyList();
