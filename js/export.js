// Delivery. A survey leaves the device as a single ZIP holding the answer sheet
// and every full-resolution photograph, cross-referenced both ways: the answer
// sheet names the image files, and each image file's name carries the survey
// reference and the subject it belongs to.

import { SECTIONS, ALL_QUESTIONS } from './questions.js';
import { SUBJECTS } from './photo-subjects.js';
import { zip } from './zip.js';

/** A filesystem-safe token for use in filenames. */
function slug(value, fallback) {
  const cleaned = String(value || '').trim().replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || fallback;
}

/**
 * Stable photo identifiers, assigned per subject in capture order:
 *   MGL-2026-014-EQP-03
 * These are what the paper form's "Photo IDs" field asks for, and what the
 * exported answer sheet references.
 */
export function photoIds(survey, photos) {
  const reference = slug(survey.reference || survey.siteName, 'SURVEY');
  const perSubject = new Map();
  const ids = new Map();

  SUBJECTS.forEach((subject) => {
    photos
      .filter((p) => p.locationId === subject.id)
      .sort((a, b) => a.takenAt - b.takenAt)
      .forEach((photo) => {
        const next = (perSubject.get(subject.id) || 0) + 1;
        perSubject.set(subject.id, next);
        ids.set(photo.id, `${reference}-${subject.code}-${String(next).padStart(2, '0')}`);
      });
  });

  return ids;
}

function isAnswered(answers, question) {
  const value = answers[question.id];
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (question.type === 'group') {
    return Object.values(value).some((v) => v !== '' && v !== null && v !== undefined);
  }
  return true;
}

function flatten(value) {
  if (Array.isArray(value)) return value.join('; ');
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
  }
  return value ?? '';
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Question numbers each photo subject bears on, as a lookup by question. */
function evidenceIndex() {
  const byQuestion = new Map();
  SUBJECTS.forEach((subject) => {
    (subject.evidences || []).forEach((n) => {
      if (!byQuestion.has(n)) byQuestion.set(n, []);
      byQuestion.get(n).push(subject);
    });
  });
  return byQuestion;
}

export function buildRecord(survey, photos) {
  const answers = survey.answers || {};
  const ids = photoIds(survey, photos);
  const byQuestion = evidenceIndex();

  const photographs = photos
    .slice()
    .sort((a, b) => a.takenAt - b.takenAt)
    .map((photo) => {
      const subject = SUBJECTS.find((s) => s.id === photo.locationId);
      const id = ids.get(photo.id);
      return {
        photoId: id,
        file: `photos/${id}.jpg`,
        subject: subject ? subject.name : photo.locationId,
        evidences: subject ? subject.evidences : [],
        width: photo.width || null,
        height: photo.height || null,
        bytes: photo.blob.size,
        takenAt: new Date(photo.takenAt).toISOString(),
      };
    });

  const sections = SECTIONS.map((section) => ({
    section: section.number !== undefined ? section.number : section.id,
    title: section.title,
    questions: section.questions
      .filter((q) => isAnswered(answers, q))
      .map((q) => {
        const linked = q.n ? byQuestion.get(q.n) || [] : [];
        const linkedIds = photographs
          .filter((p) => linked.some((s) => s.name === p.subject))
          .map((p) => p.photoId);
        return {
          number: q.n || null,
          question: q.label,
          answer: answers[q.id],
          other: answers[q.id + '_other'] || undefined,
          followUp: answers[q.id + '_f'] || undefined,
          followUpOther: answers[q.id + '_f_other'] || undefined,
          photoIds: linkedIds.length ? linkedIds : undefined,
        };
      }),
  })).filter((s) => s.questions.length);

  return {
    survey: {
      id: survey.id,
      reference: survey.reference || null,
      siteName: survey.siteName,
      enumerator: survey.surveyor || null,
      createdAt: new Date(survey.createdAt).toISOString(),
      exportedAt: new Date().toISOString(),
      instrument: 'Managalas Conservation Area — Small-Scale Mining Site & Miner Survey',
      questionsAnswered: ALL_QUESTIONS.filter((q) => q.n && isAnswered(answers, q)).length,
      questionsTotal: ALL_QUESTIONS.filter((q) => q.n).length,
    },
    answers: sections,
    photographs,
    photoSubjects: SUBJECTS.map((subject) => ({
      subject: subject.name,
      code: subject.code,
      required: subject.minPhotos,
      taken: photos.filter((p) => p.locationId === subject.id).length,
      evidences: subject.evidences,
      notes: (survey.notes || {})[subject.id] || undefined,
    })),
  };
}

function answersCsv(record) {
  const rows = [['section', 'section_title', 'question_number', 'question', 'answer', 'other', 'follow_up', 'photo_ids']];
  record.answers.forEach((section) => {
    section.questions.forEach((q) => {
      rows.push([
        section.section,
        section.title,
        q.number ?? '',
        q.question,
        flatten(q.answer),
        q.other ?? '',
        flatten(q.followUp),
        (q.photoIds || []).join('; '),
      ]);
    });
  });
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

function photosCsv(record) {
  const rows = [['photo_id', 'file', 'subject', 'evidences_questions', 'width', 'height', 'bytes', 'taken_at']];
  record.photographs.forEach((p) => {
    rows.push([
      p.photoId,
      p.file,
      p.subject,
      (p.evidences || []).map((n) => `Q${n}`).join('; '),
      p.width ?? '',
      p.height ?? '',
      p.bytes,
      p.takenAt,
    ]);
  });
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

function readme(record) {
  const shortfall = record.photoSubjects.filter((s) => s.taken < s.required);
  return [
    record.survey.instrument,
    '',
    `Site:       ${record.survey.siteName}`,
    `Reference:  ${record.survey.reference || '(none)'}`,
    `Enumerator: ${record.survey.enumerator || '(none)'}`,
    `Exported:   ${record.survey.exportedAt}`,
    '',
    `Questions answered: ${record.survey.questionsAnswered} of ${record.survey.questionsTotal}`,
    `Photographs:        ${record.photographs.length}`,
    '',
    'Contents',
    '  survey.json   Full record: answers, photo manifest, per-subject counts.',
    '  answers.csv   One row per answered question, with linked photo IDs.',
    '  photos.csv    One row per photograph, with the questions it evidences.',
    '  photos/       Full-resolution images, named by photo ID.',
    '',
    'Photo IDs follow REFERENCE-SUBJECT-NN and appear in both directions:',
    'answers.csv lists the photo IDs for each question, and photos.csv lists',
    'the question numbers each photograph bears on.',
    '',
    shortfall.length
      ? 'Incomplete photographic coverage:\n' +
        shortfall.map((s) => `  ${s.subject}: ${s.taken} of ${s.required}`).join('\n')
      : 'Photographic coverage complete for every subject.',
    '',
  ].join('\n');
}

/** Build the delivery bundle for one survey. */
export async function buildBundle(survey, photos) {
  const record = buildRecord(survey, photos);
  const ids = photoIds(survey, photos);

  const entries = [
    { name: 'README.txt', content: readme(record) },
    { name: 'survey.json', content: JSON.stringify(record, null, 2) },
    { name: 'answers.csv', content: answersCsv(record) },
    { name: 'photos.csv', content: photosCsv(record) },
    ...photos.map((photo) => ({
      name: `photos/${ids.get(photo.id)}.jpg`,
      content: photo.blob,
    })),
  ];

  const name = slug(survey.reference || survey.siteName, 'survey');
  return { blob: await zip(entries), filename: `${name}.zip`, record };
}
