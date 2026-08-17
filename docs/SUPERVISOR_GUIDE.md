# Supervisor guide

How to publish the app, get it onto enumerators' phones, and collect the data.

## Publishing the app

### Option A — Deploy from a branch (simplest)

1. Repo → **Settings** → **Pages**
2. **Source:** *Deploy from a branch*
3. **Branch:** `main`, folder **`/ (root)`** → **Save**

After a minute the app is live at
`https://wtunsworth-a11y.github.io/MCA_SAMS/`. Send that link to enumerators
along with [`ENUMERATOR_SETUP.md`](ENUMERATOR_SETUP.md).

### Option B — GitHub Actions

Settings → Pages → **Source: GitHub Actions**, then Actions tab → *Deploy PWA to
GitHub Pages* → **Run workflow**. The workflow is manual-only so it never fails
before Pages has been switched on.

### Option C — the single file

`dist/MCA_SAMS_Survey.html` is the whole app in one file. Email it, or put it on
a USB stick. The enumerator opens it in a phone browser and it works offline.

Rebuild it after editing anything in `js/` or `css/`:

```sh
node build.js
```

Use this as a backup route. The hosted link is more reliable for real fieldwork,
because storage on a proper `https://` origin survives the file being moved or
renamed.

## Collecting the data

Enumerators send one ZIP per completed survey, named by Survey ID
(`MGL-2026-014.zip`). Each contains:

| File | What it holds |
| --- | --- |
| `README.txt` | Summary, and any photo subjects still short |
| `survey.json` | The full record — answers, photo manifest, counts |
| `answers.csv` | One row per question, with linked photo IDs |
| `photos.csv` | One row per photograph, with the questions it evidences |
| `photos/` | Full-resolution images, named by photo ID |

**Where to put them:** not in this repository. See
[`../received_data/README.md`](../received_data/README.md).

**De-duplicate on the Survey ID.** An enumerator may send the same survey twice,
for example after going back to add the last photographs. Keep the later one.

## Reading the data

`answers.csv` opens directly in Excel. Columns:

```
section, section_title, question_number, question, answer, other, follow_up, photo_ids
```

Multi-select answers are joined with `; `. The `photo_ids` column names the
photographs bearing on that question, matching the filenames in `photos/`.

`photos.csv` runs the link the other way — each photograph with the question
numbers it evidences.

## Changing the survey

| To change | Edit |
| --- | --- |
| Questions, wording, options, conditional logic | `js/questions.js` |
| Photo subjects and minimum counts | `js/photo-subjects.js` |
| Consent script, app version, attribution | `js/config.js` |

Bump `appVersion` in `js/config.js` whenever the instrument changes. It is
written into every export as `app_version`, so you can tell which build produced
a record. Then re-run `node build.js` and push.

## Before a pilot

- [ ] Publish the app and check the link opens on a real phone
- [ ] Install it, turn on flight mode, confirm it still opens
- [ ] Run one complete practice interview, photographs included
- [ ] Send that practice survey and confirm the ZIP arrives intact
- [ ] Confirm the photographs in it are full-size and legible
- [ ] Agree the Survey ID format with the team (e.g. `MGL-2026-001`)
