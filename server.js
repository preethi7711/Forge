import express from "express";
import http from "http";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { initDB } from "./server/db.js";
import { routes } from "./server/routes.js";
import { initSocket } from "./server/socket.js";

async function startServer() {
  // Initialize Local JSON database
  initDB();

  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Log API requests
  app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.path}`);
    next();
  });

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", platform: "Forge", timestamp: new Date().toISOString() });
  });

  // Register main API routes
  app.use("/api", routes);

  const server = http.createServer(app);

  // Initialize Socket.io
  initSocket(server);

  // Vite Integration for Front-end SPA
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode (Vite middleware enabled)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode (Serving static assets)");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Forge Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical: Failed to start Forge server", err);
});
