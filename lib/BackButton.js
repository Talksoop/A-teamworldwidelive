import { useRouter } from "next/router";

// A real "back" button: goes to wherever the visitor actually came from
// (via the browser's own history) rather than always dumping them on the
// homepage. Falls back to fallbackHref when there's no in-app history to
// go back to -- e.g. someone landed here directly from a shared link.
export default function BackButton({ style, fallbackHref = "/" }) {
  const router = useRouter();

  function handleClick(e) {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <a href={fallbackHref} onClick={handleClick} style={{ ...styles.back, ...style }}>
      ← Back
    </a>
  );
}

const styles = {
  back: {
    display: "inline-flex",
    alignItems: "center",
    color: "var(--text-dim)",
    fontSize: "0.82rem",
    fontWeight: 600,
    textDecoration: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};
