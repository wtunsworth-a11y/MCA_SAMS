# MCA_SAMS

The **Managalas Conservation Area small-scale mining site & miner survey** as an
offline-capable web app.

The paper form
([`incoming/Managalas_Small_Scale_Mining_Survey(1).pdf`](incoming/Managalas_Small_Scale_Mining_Survey%281%29.pdf))
is a 93-question enumerator-administered interview covering mining practice,
mercury use, safety, environment, rehabilitation, gold marketing, formalisation
and conservation attitudes. This app carries the whole instrument — consent
block, all fourteen sections, the enumerator's observation page — plus a
photographic schedule the paper form leaves undefined.

No dependencies, no build step. It installs to a phone home screen and runs with
no signal; answers and photographs are held in IndexedDB on the device.

## Running it

Serve the folder over HTTP — opening `index.html` with `file://` will not work,
because the app uses ES modules.

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static host works, GitHub Pages included.

## Installing it on a phone

Opened over HTTPS, the app can be installed and launched like any other app.

- **Android / Chrome:** open the link, then menu → *Add to Home screen*.
- **iPhone / Safari:** open the link, then Share → *Add to Home Screen*.

`sw.js` caches the app shell on first visit, so after one online load the tool
opens in the field regardless of connectivity.

## The instrument

[`js/questions.js`](js/questions.js) holds the survey as data — question
numbers, wording and option lists transcribed from the PDF so a completed record
reconciles against a paper one.

| Section | Title | Questions |
| ---: | --- | ---: |
| 0 | Informed consent | consent, signature, date |
| 1 | Miner particulars | 1–11 |
| 2 | Land ownership and access | 12–17 |
| 3 | Mining operation | 18–26 |
| 4 | Gold deposit and production | 27–32 |
| 5 | Gold processing and mercury | 33–42 |
| 6 | Occupational health and safety | 43–48 |
| 7 | Environment and conservation | 49–57 |
| 8 | Mine-site rehabilitation | 58–61 |
| 9 | Gold sales and market access | 62–69 |
| 10 | Formalisation and mining associations | 70–75 |
| 11 | Social issues | 76–80 |
| 12 | Training and awareness | 81–84 |
| 13 | Miner's view on mining and conservation | 85–91 |
| 14 | Final comments | 92–93 |
| — | Enumerator's observation | intensity, concern, GPS, signature |

Question types are `text`, `textarea`, `number`, `date`, `single`, `multi` and
`group` (several labelled sub-fields, as in Q21's men/women/youth/children).
Two modifiers carry the form's conditional logic:

- `other: true` — selecting **Other** reveals a free-text box (Q12, Q14, Q25 …).
- `follow` — a sub-question shown only for given parent answers. Q11's
  livelihood question appears on **No**; Q17's explanation on **Yes**; Q70's
  association question on **No**.

Answers save on change, so an interrupted interview loses nothing.

## Photographic schedule

The paper form records photographs only as `Photographs taken: Yes/No` plus a
free-text `Photo IDs:` line, leaving coverage to each enumerator.
[`js/photo-subjects.js`](js/photo-subjects.js) makes it explicit — each subject
carries an enforced minimum.

| Subject | Photos | Covers |
| --- | ---: | --- |
| Mining Site | 4 | Landscape context, working face/pit, deposit type, water interface |
| **Equipment** | **8** | Every item separately, extraction and processing alike |
| Processing Activity | 4 | Recovery process underway, incl. mercury handling and burning |
| Gold Recovered | 2 | The gold itself with scale; weighing or sale record |
| Rehabilitation | 1 | Rehabilitation works — or the un-rehabilitated ground |

**Equipment** carries the highest count deliberately: one frame per item, since
a single photograph of the pile records neither what is present nor what is
hired rather than owned (Q26). **Processing Activity** is separate from
Equipment because mercury use and amalgam burning (Q34–Q40) are among the
survey's central concerns, and an idle sluice evidences none of it.
**Rehabilitation** is required whether or not any has been carried out (Q58,
Q59) — where nothing has been done, the enumerator photographs the
un-rehabilitated ground, so "none" cannot go unevidenced.

## Photographs are kept at full quality

Each capture is stored twice: the **original camera bytes, not re-encoded**, and
a small thumbnail used only to draw the grid. Nothing is lost between the
capture and the record — nameplates, serial numbers and service labels stay
legible. Only images beyond 6000px on the long edge are resampled, which no
ordinary phone camera reaches.

Tapping a photograph opens it full size, with arrow-key and button navigation
and its dimensions and file size shown.

The trade-off is deliberate: a survey holds tens of megabytes of photographs
rather than a few hundred kilobytes. Illegible evidence is worth less than the
storage it saves.

## Delivery — answers and photographs together

**Export survey + photos** produces one ZIP holding the whole record:

```
MGL-2026-014.zip
├── README.txt     What the bundle holds, and any incomplete photo coverage
├── survey.json    Full record: answers, photo manifest, per-subject counts
├── answers.csv    One row per answered question, with linked photo IDs
├── photos.csv     One row per photograph, with the questions it evidences
└── photos/
    ├── MGL-2026-014-EQP-01.jpg     full resolution, original bytes
    └── MGL-2026-014-EQP-02.jpg
```

Every photograph carries a stable ID — `REFERENCE-SUBJECT-NN` — assigned per
subject in capture order. That ID is the filename in `photos/`, the value shown
under the thumbnail in the app, and the entry in the observation page's *Photo
IDs* field, so an image can be traced to its survey without being opened.

**The link runs both ways.** `answers.csv` gives the photo IDs bearing on each
question; `photos.csv` gives the question numbers each photograph evidences. The
mapping comes from each subject's `evidences` list in
[`js/photo-subjects.js`](js/photo-subjects.js) — Equipment evidences Q25, Q26,
Q33 and Q40; Rehabilitation evidences Q58–Q60; and so on.

The observation page's *Photographs taken* and *Photo IDs* are derived from the
record rather than typed, so they cannot drift out of step with the images
actually attached.

The ZIP is written by [`js/zip.js`](js/zip.js), a small store-only encoder —
no dependency, and JPEG data would not compress anyway. Images go in as their
original bytes.

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | Page shell |
| `css/styles.css` | Styling, including a dark scheme |
| `js/questions.js` | The survey instrument — sections, questions, options, logic |
| `js/photo-subjects.js` | Photographic schedule and per-subject minimums |
| `js/storage.js` | IndexedDB persistence for surveys, answers and photographs |
| `js/photos.js` | Camera intake, thumbnails, object-URL lifecycle |
| `js/export.js` | Photo IDs, cross-referenced record, bundle assembly |
| `js/zip.js` | Minimal store-only ZIP writer |
| `js/app.js` | Views and rendering |
| `sw.js` | Service worker — offline app shell |
| `manifest.webmanifest` | PWA manifest |
| `icons/` | Home-screen icons |
| `incoming/` | Source material — the paper form; not used at runtime |

## Not yet covered

- No sync or central collection point; each device holds its own records, and
  bundles are moved off by hand.
- Bundles are per-survey; there is no "export everything on this phone".
- Section 0 captures consent as a recorded answer and a typed signature, not a
  drawn one.
