# MCA_SAMS

Site survey capture tool. A surveyor works through a fixed list of locations at
a site, photographing each one; the app tracks how many photographs each
location still needs and will not report a location as complete until its
minimum is met.

Built as a static page with no dependencies and no build step, so it runs from a
phone on site with no connectivity. Surveys and photographs are held in
IndexedDB on the device.

## Running it

Serve the folder over HTTP — opening `index.html` directly with `file://` will
not work, because the app uses ES modules.

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static host works for deployment, GitHub Pages included.

## Survey locations

Locations are data, defined in [`js/locations.js`](js/locations.js). Each one
sets a `minPhotos` figure that the app enforces, plus advisory `guidance` shown
to the surveyor on site.

| Location                | Photos required |
| ----------------------- | --------------: |
| Main Entrance           |               4 |
| Reception               |               3 |
| Corridors & Circulation |               4 |
| Accessible WC           |               5 |
| Stairwell               |               4 |
| Car Park                |               4 |
| **Plant Room**          |          **12** |

The Plant Room needs far more photographs than anywhere else — every item of
plant individually, plus a legible shot of each nameplate, serial number and
service label. The per-location minimum exists precisely so a location like this
can demand more coverage than the rest of the survey without changing any code.

To add a location, append an entry to the `LOCATIONS` array. Nothing else needs
to change: the survey list, progress totals and completion checks all derive
from that array.

## Layout

| Path               | Purpose                                                     |
| ------------------ | ----------------------------------------------------------- |
| `index.html`       | Page shell                                                  |
| `css/styles.css`   | Styling, including a dark scheme                            |
| `js/locations.js`  | Location definitions and photo minimums                     |
| `js/storage.js`    | IndexedDB persistence for surveys and photographs           |
| `js/photos.js`     | Camera intake, downscaling, object-URL lifecycle            |
| `js/app.js`        | Views and rendering                                         |
| `incoming/`        | Drop folder for source material — not used by the app       |

Photographs are downscaled to 1600px on the long edge and re-encoded as JPEG
before storage, which takes a typical phone capture from several megabytes to
tens of kilobytes. That matters most in the Plant Room, where a single location
holds twelve images.
