export function broadcastQueueUpdate() {
  if (global.io) {
    global.io.emit("queue-updated");
  }
}
