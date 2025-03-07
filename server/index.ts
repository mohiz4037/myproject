import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// 1. Set payload limits here (already sufficient)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// 2. Improved logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalJson = res.json;
  res.json = function(body) {
    capturedJsonResponse = body;
    return originalJson.call(this, body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const logLine = [
        `${req.method} ${path} ${res.statusCode} in ${duration}ms`,
        capturedJsonResponse ? `:: ${JSON.stringify(capturedJsonResponse)}` : ''
      ].join('').slice(0, 80);
      log(logLine);
    }
  });
  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    // 3. Proper error handling
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      if (err.type === 'entity.too.large') {
        return res.status(413).json({ 
          error: "Payload too large. Maximum 10MB allowed.",
          code: "PAYLOAD_TOO_LARGE"
        });
      }

      console.error("Error:", err);
      res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'development' 
          ? err.message 
          : "Internal Server Error",
        code: err.code || "INTERNAL_ERROR"
      });
    });

    // Vite setup remains unchanged
    if (app.get("env") === "development") {
      console.log("Starting Vite in dev mode...");
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const PORT = 3000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Fatal startup error:", error);
    process.exit(1);
  }
})();