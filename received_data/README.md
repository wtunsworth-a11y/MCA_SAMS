# Received data → stored outside this repository

Exported survey bundles are **not** kept in this repository. Each bundle holds
interview answers and site photographs, including the site's GPS position where
the enumerator recorded one.

Bundles arrive as `REFERENCE.zip` — one per completed survey — sent from the
enumerator's phone through the app's share sheet.

De-duplicate on the survey `reference` (Q1, Survey ID) when merging: an
enumerator may send the same survey more than once, for example after adding the
last photographs.

## Why not in the repo?

Survey records identify mining sites and the people working them, and the
photographs show those sites directly. Keeping the data out of the repository
keeps it private while the app code stays available for GitHub Pages to serve.

Any `.zip`, `.csv` or `.json` dropped into this folder is git-ignored (see
`.gitignore`), so data is never accidentally pushed. This folder exists only to
document where the data actually goes.
