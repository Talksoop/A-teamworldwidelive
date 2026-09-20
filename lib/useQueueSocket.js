import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

// Instant push when the queue changes, with a slow poll as a safety net in
// case the socket connection drops or never establishes (e.g. a proxy that
// blocks websockets) — 20s is frequent enough to feel fine as a fallback
// without hammering the server.
const FALLBACK_POLL_MS = 20000;

export function useQueueSocket(onUpdate) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const socket = io({ path: "/socket.io" });
    socket.on("queue-updated", () => onUpdateRef.current());

    const fallback = setInterval(() => onUpdateRef.current(), FALLBACK_POLL_MS);

    return () => {
      socket.disconnect();
      clearInterval(fallback);
    };
  }, []);
}
