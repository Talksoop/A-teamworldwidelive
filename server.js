const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new Server(httpServer, {
    path: "/socket.io",
  });

  // Exposed so API routes (running in this same long-lived process) can
  // broadcast without needing a separate pub/sub layer. This only works
  // because the service runs as a single persistent instance, not
  // multiple serverless replicas.
  global.io = io;

  io.on("connection", () => {
    // Nothing to do on connect — clients just listen for broadcasts.
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
});
