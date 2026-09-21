export function broadcastQueueUpdate(hostId) {
  if (global.io && hostId) {
    global.io.to(hostId).emit("queue-updated");
  }
}

export function broadcastBattleUpdate(hostId) {
  if (global.io && hostId) {
    global.io.to(hostId).emit("battle-updated");
  }
}
