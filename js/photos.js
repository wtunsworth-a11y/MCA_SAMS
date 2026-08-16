// Photo intake. Camera files off a phone are 4–12 MB each; a plant room alone
// wants a dozen of them, so every image is downscaled before it is stored.

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

/**
 * Downscale an image file to a JPEG blob no larger than MAX_EDGE on its long
 * side. Falls back to the original file if the browser cannot decode it.
 */
export async function normalise(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );
  return blob || file;
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
