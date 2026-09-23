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

export function broadcastSettingsUpdate(hostId) {
  if (global.io && hostId) {
    global.io.to(hostId).emit("settings-updated");
  }
}
