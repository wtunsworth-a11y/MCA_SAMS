// Photo intake.
//
// Two images are kept per capture: a full-quality one that is the actual record
// — nameplates, serial numbers, mercury handling and rehabilitation ground all
// need to be legible when the photograph is examined later — and a small
// thumbnail used only to draw the grid quickly.
//
// The full image is stored as the camera produced it — the original bytes, not
// re-encoded — so nothing is lost between the capture and the record. Only
// images beyond MAX_EDGE are resampled, which no ordinary phone camera reaches;
// that ceiling exists to stop a 100-megapixel file exhausting device storage.
// A survey photograph that cannot be read is not evidence.

const MAX_EDGE = 6000;
const FULL_QUALITY = 0.94;

const THUMB_EDGE = 400;
const THUMB_QUALITY = 0.75;

async function decode(file) {
  try {
    // from-image applies the EXIF orientation phones record, so portrait
    // captures are not stored on their side.
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    try {
      return await createImageBitmap(file);
    } catch {
      return null;
    }
  }
}

function render(bitmap, maxEdge, quality) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve({ blob, width, height }), 'image/jpeg', quality)
  );
}

/**
 * Prepare a captured file for storage.
 * Returns the full-quality image plus a grid thumbnail. If the browser cannot
 * decode the file it is stored untouched rather than dropped.
 */
export async function prepare(file) {
  const bitmap = await decode(file);
  if (!bitmap) return { blob: file, thumb: file, width: 0, height: 0 };

  const needsResize = Math.max(bitmap.width, bitmap.height) > MAX_EDGE;
  const full = needsResize
    ? await render(bitmap, MAX_EDGE, FULL_QUALITY)
    : { blob: file, width: bitmap.width, height: bitmap.height };

  const thumb = await render(bitmap, THUMB_EDGE, THUMB_QUALITY);
  bitmap.close();

  return {
    blob: full.blob || file,
    thumb: thumb.blob || full.blob || file,
    width: full.width,
    height: full.height,
  };
}

// Object URLs are revoked when a view is torn down, to avoid leaking blobs.
// A view's DOM is built before it is shown, so URLs are staged in `pending` and
// only promoted once that view is on screen — otherwise the release pass would
// revoke the URLs belonging to the view about to be displayed.
let shown = new Set();
let pending = new Set();

export function objectUrl(blob) {
  const url = URL.createObjectURL(blob);
  pending.add(url);
  return url;
}

/** Revoke the outgoing view's URLs and adopt the incoming view's. */
export function releaseUrls() {
  shown.forEach((url) => URL.revokeObjectURL(url));
  shown = pending;
  pending = new Set();
}

/** A URL held outside the view lifecycle, for the full-size viewer. */
export function detachedUrl(blob) {
  return URL.createObjectURL(blob);
}

export function revoke(url) {
  URL.revokeObjectURL(url);
}
