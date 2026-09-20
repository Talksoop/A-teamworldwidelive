export function broadcastQueueUpdate() {
  if (global.io) {
    global.io.emit("queue-updated");
  }
}

export function broadcastBattleUpdate() {
  if (global.io) {
    global.io.emit("battle-updated");
  }
}
