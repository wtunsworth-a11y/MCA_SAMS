# Supervisor guide

Managalas Small-Scale Mining Site & Miner Survey

How to publish the app, get it onto enumerators' phones, collect the data and
change the survey.

---

## 1. Publish the app

### Option A — Deploy from a branch (simplest)

1. Repo → **Settings** → **Pages**
2. **Source:** *Deploy from a branch*
3. **Branch:** `main`, folder **`/ (root)`** → **Save**

After a minute the app is live at
`https://wtunsworth-a11y.github.io/MCA_SAMS/`. Send that link to enumerators
with [`INSTALL_GUIDE.md`](INSTALL_GUIDE.md).

> **The repository must be public** for Pages on a free plan. Settings → bottom
> of the page → *Change repository visibility*. No survey data lives in the
> repository (see section 3), so making it public exposes the app code and the
> blank questionnaire only.

### Option B — GitHub Actions

Settings → Pages → **Source: GitHub Actions**, then Actions tab → *Deploy PWA to
GitHub Pages* → **Run workflow**. The workflow is manual-only so it never fails
before Pages has been switched on.

### Option C — the single file

`dist/MCA_SAMS_Survey.html` is the whole app in one file. Email it, or carry it
on a USB stick. The enumerator opens it in a phone browser and it works offline.

Rebuild it after editing anything in `js/` or `css/`:

```sh
node build.js
```

Use this as the backup route. The hosted link is more reliable for real
fieldwork: storage on a proper `https://` origin survives the file being moved
or renamed.

---

## 2. Get it onto phones

Send each enumerator:

1. The link (or the file)
2. [`INSTALL_GUIDE.md`](INSTALL_GUIDE.md) — installing and the offline check
3. [`INTERVIEWER_GUIDE.md`](INTERVIEWER_GUIDE.md) — conducting the interview

Word versions of both sit alongside them in `docs/` for printing or sending to
phones that cannot read Markdown.

### Agree the Survey ID format first

The Survey ID becomes the bundle filename and the prefix of every photograph ID.
Set the format before anyone starts — for example `MGL-2026-001` upwards, with a
block of numbers allocated per enumerator so two people cannot use the same ID.

### Run a pilot before the real thing

- [ ] Publish and open the link on a real phone
- [ ] Install it, turn on flight mode, confirm it still opens
- [ ] One complete practice interview, photographs included
- [ ] Send that practice survey and confirm the ZIP arrives intact
- [ ] Open the photographs — full size and legible?
- [ ] Check `answers.csv` opens in Excel
- [ ] Delete the practice survey from the phone

---

## 3. Collect the data

Enumerators send one ZIP per completed survey, named by Survey ID
(`MGL-2026-014.zip`). Each contains:

| File | What it holds |
| --- | --- |
| `README.txt` | Summary, app version, and any photo subjects still short |
| `survey.json` | The full record — answers, photo manifest, counts |
| `answers.csv` | One row per answered question, with linked photo IDs |
| `photos.csv` | One row per photograph, with the questions it evidences |
| `photos/` | Full-resolution images, named by photo ID |

### Where to put them

**Not in this repository.** Survey records identify mining sites and the people
working them, and the photographs show those sites directly. Keep bundles in a
private store — a shared Drive folder or equivalent. See
[`../received_data/README.md`](../received_data/README.md).

`received_data/` in the repo is git-ignored so data cannot be pushed by
accident. It documents the destination; it is not the destination.

### De-duplicate on Survey ID

An enumerator may send the same survey more than once — commonly after going
back to add the last photographs. Keep the later bundle; check `exportedAt` in
`survey.json` or `README.txt`.

### Check each bundle on arrival

- Does `README.txt` report photographic coverage complete? It lists any subject
  still short.
- Do the photograph counts look right — especially Equipment, which needs eight?
- Are the images sharp enough to read a nameplate?

Raise shortfalls with the enumerator **while they can still return to the site**.

---

## 4. Read the data

`answers.csv` opens directly in Excel. Columns:

```
section, section_title, question_number, question, answer, other, follow_up, photo_ids
```

- Multi-select answers are joined with `; `
- `other` holds the free text where the person chose **Other**
- `photo_ids` names the photographs bearing on that question

`photos.csv` runs the link the other way — each photograph with the question
numbers it evidences:

```
photo_id, file, subject, evidences_questions, width, height, bytes, taken_at
```

So Q25 (equipment used) lists the Equipment photo IDs, and each Equipment
photograph lists `Q25; Q26; Q33; Q40`. The IDs match the filenames in `photos/`.

`survey.json` holds everything including `app_version`, so a record can be traced
to the build that produced it.

### Combining many surveys

Concatenate the `answers.csv` files, keeping one header row. Each row already
carries the section and question number, and the bundle filename carries the
Survey ID.

---

## 5. Change the survey

| To change | Edit |
| --- | --- |
| Questions, wording, options, conditional logic | `js/questions.js` |
| Photo subjects and minimum counts | `js/photo-subjects.js` |
| Consent script, app version, attribution | `js/config.js` |

After any change:

1. Bump `appVersion` in `js/config.js`
2. Run `node build.js`
3. Commit and push — the hosted app updates itself on the enumerators' next
   online open

`appVersion` is written into every export as `app_version`, so you can tell which
build produced a record. Bump it whenever the instrument changes, or you will not
be able to tell mid-season records apart.

### Regenerate the Word guides

```sh
npm install docx          # once
node docs/generators/build_docs.js
```

This rebuilds the `.docx` files in `docs/` from the Markdown guides, so the two
never drift apart.

---

## 6. What the app does not do

Know these before planning fieldwork:

- **No sync and no central collection.** Each phone holds its own records and
  bundles are sent by hand. If you have several enumerators, someone collects
  from each.
- **Bundles are per-survey.** There is no "send everything on this phone".
- **No backup.** A survey exists only on that phone until it is sent. This is
  why the guides press so hard on sending the same day.
- **Consent signature is typed, not drawn.**
- **GPS is typed in, not read from the phone's receiver.**

---

## Data protection

- Bundles contain site GPS, photographs of identifiable sites, and possibly
  names. Treat them as confidential.
- Keep them in a private store with access limited to the analysis team.
- Do not attach them to public issues, or commit them to any repository.
- Agree a retention period with the project before collection starts.
