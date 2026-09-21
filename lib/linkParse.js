export function parseLink(url) {
  if (!url) return { platform: "link", embedUrl: null };
  let u;
  try {
    u = new URL(url);
  } catch {
    return { platform: "link", embedUrl: null };
  }
  const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const id = u.searchParams.get("v");
    if (id) return { platform: "youtube", embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1` };
    const shortsMatch = u.pathname.match(/\/shorts\/([\w-]+)/);
    if (shortsMatch) {
      return {
        platform: "youtube",
        embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1`,
      };
    }
  }
  if (host === "youtu.be") {
    const id = u.pathname.slice(1);
    if (id) return { platform: "youtube", embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1` };
  }

  if (host === "open.spotify.com") {
    const m = u.pathname.match(/\/(track|episode|album)\/([a-zA-Z0-9]+)/);
    if (m) {
      return { platform: "spotify", embedUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}` };
    }
  }

  if (host === "soundcloud.com") {
    return {
      platform: "soundcloud",
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        url
      )}&auto_play=true&visual=false&color=%234fd8f5`,
    };
  }

  if (host === "tiktok.com") {
    const m = u.pathname.match(/\/video\/(\d+)/);
    if (m) {
      return { platform: "tiktok", embedUrl: `https://www.tiktok.com/embed/v2/${m[1]}` };
    }
    return { platform: "tiktok", embedUrl: null };
  }

  return { platform: "link", embedUrl: null };
}

export const PLATFORM_LABELS = {
  youtube: "YouTube",
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  tiktok: "TikTok",
  link: "Link",
};
