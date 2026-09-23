import { useRef } from "react";

// Keeps returning the first `value` seen for a given `key`, ignoring later
// changes to `value` as long as `key` stays the same.
//
// Used for presigned S3 playback URLs: attachPlayUrls() re-signs the same
// file on every fetch, so polling (the queue socket's fallback interval, or
// any "queue-updated" broadcast while something's already playing) hands
// back a new-but-equally-valid URL string for the same track. Feeding that
// straight into an <audio>/<video> src makes the browser reload the media
// and restart playback from zero, even though nothing actually changed.
// Keying on the submission id and freezing the URL until the id itself
// changes fixes that — the stale signature is still valid for its full
// expiry window, so there's no downside to not re-fetching it.
export function useStableBy(key, value) {
  const ref = useRef({ key, value });
  if (ref.current.key !== key) {
    ref.current = { key, value };
  }
  return ref.current.value;
}
