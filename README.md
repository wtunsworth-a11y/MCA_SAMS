# MCA_SAMS

Photographic record for the **Managalas Conservation Area small-scale mining
site & miner survey**.

The paper form
([`incoming/Managalas_Small_Scale_Mining_Survey(1).pdf`](incoming/Managalas_Small_Scale_Mining_Survey%281%29.pdf))
records photographs in two fields on its final page — `Photographs taken:
Yes/No` and a free-text `Photo IDs:` line. What to photograph is left entirely
to the enumerator, so coverage varies between sites and between enumerators.
This tool makes the expectation explicit: each subject carries a minimum number
of photographs, and the app tracks what is still outstanding while the team is
still on site.

Built as a static page with no dependencies and no build step, so it runs from a
phone in the field with no connectivity. Surveys and photographs are held in
IndexedDB on the device.

## Running it

Serve the folder over HTTP — opening `index.html` directly with `file://` will
not work, because the app uses ES modules.

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static host works for deployment, GitHub Pages included.

## Installing it on a phone

The app is a PWA. Opened over HTTPS, it can be installed to the home screen and
then launched like any other app — full screen, no browser chrome, and working
with no signal.

- **Android / Chrome:** open the link, then menu → *Add to Home screen* (or the
  install prompt the browser offers).
- **iPhone / Safari:** open the link, then Share → *Add to Home Screen*.

`sw.js` caches the app shell on first visit, so after one online load the tool
opens in the field regardless of connectivity. Photographs and survey records
are stored in IndexedDB on the device and are never uploaded — they stay on the
phone until someone exports them off it.

## Photographic schedule

Subjects are data, defined in [`js/locations.js`](js/locations.js). Each sets a
`minPhotos` figure the app enforces, plus advisory `guidance` shown on site.

| Subject             | Photos required | Covers                                                             |
| ------------------- | --------------: | ------------------------------------------------------------------ |
| Mining Site         |               4 | Landscape context, working face/pit, deposit type, water interface |
| **Equipment**       |           **8** | Every item separately, extraction and processing alike             |
| Processing Activity |               4 | Recovery process underway, including mercury handling and burning  |
| Gold Recovered      |               2 | The gold itself with scale; weighing or sale record                |
| Rehabilitation      |               1 | Rehabilitation works — or the un-rehabilitated ground              |

**Equipment** carries the highest count deliberately. The form lists gold pans,
shovels and picks, sluice boxes, water pumps, highbankers, trommels and metal
detectors (Q25), then processing equipment including shaking tables, crushing
and grinding gear and retorts (Q33, Q40). Each item needs its own frame — one
photograph of the pile does not record which equipment is present, nor which of
it is hired rather than owned (Q26).

**Processing Activity** is kept separate from Equipment on purpose: the former
records the recovery process actually running, the latter records the items as
objects. Mercury use, amalgam burning and whether a retort is fitted (Q34–Q40)
are among the survey's central concerns, and a photograph of an idle sluice
evidences none of it.

**Rehabilitation** is required whether or not any has been carried out (Q58,
Q59). Where nothing has been done, the enumerator photographs the
un-rehabilitated ground: the absence of rehabilitation is itself the record, and
making the photograph mandatory stops "none" going unevidenced.

To add a subject, append an entry to the `LOCATIONS` array. Nothing else needs
to change — the survey list, progress totals and completion checks all derive
from that array.

## Layout

| Path              | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `index.html`      | Page shell                                            |
| `css/styles.css`  | Styling, including a dark scheme                      |
| `js/locations.js` | Photographic schedule and per-subject minimums        |
| `js/storage.js`   | IndexedDB persistence for surveys and photographs     |
| `js/photos.js`    | Camera intake, downscaling, object-URL lifecycle      |
| `js/app.js`       | Views and rendering                                   |
| `sw.js`           | Service worker — offline app shell                    |
| `manifest.webmanifest` | PWA manifest                                     |
| `icons/`          | Home-screen icons                                     |
| `incoming/`       | Source material — the paper form; not used at runtime |

Photographs are downscaled to 1600px on the long edge and re-encoded as JPEG
before storage, taking a typical phone capture from several megabytes to tens of
kilobytes. That matters in the field, where a device may hold many surveys
before it next reaches a connection.

## Not yet covered

The app records photographs only. The 93 survey questions, the enumerator's
observation block, and the GPS position are still captured on paper.
