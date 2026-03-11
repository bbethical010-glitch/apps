import fs from "node:fs";
import Busboy from "busboy";
import cors from "cors";
import express from "express";
import {
  createFolder,
  deleteEntry,
  ensureStorageRoot,
  getStorageStatus,
  listDirectory,
  resolveDownload,
  writeUploadedStream
} from "./storage.js";

function createCorsMiddleware(origins) {
  if (!origins.length) {
    return cors();
  }

  return cors({
    origin(origin, callback) {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"));
    }
  });
}

async function requireStorage(req, res, next) {
  const status = await getStorageStatus(req.app.locals.config.storageRoot);
  if (!status.available) {
    res.status(503).json({
      ok: false,
      storage: "offline",
      message: status.reason
    });
    return;
  }

  next();
}

export function createServer({ config }) {
  const app = express();

  app.locals.config = config;

  app.use(createCorsMiddleware(config.corsOrigin));
  app.use(express.json());

  app.get("/api/status", async (req, res) => {
    const storageStatus = await getStorageStatus(config.storageRoot);

    res.json({
      ok: true,
      api: "online",
      storage: storageStatus.available ? "online" : "offline",
      storageRoot: config.storageRoot,
      pollIntervalMs: config.pollIntervalMs,
      checkedAt: new Date().toISOString(),
      message: storageStatus.reason
    });
  });

  app.get("/api/files", requireStorage, async (req, res) => {
    try {
      const listing = await listDirectory(config.storageRoot, req.query.path || "");
      res.json({
        ok: true,
        ...listing
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        message: error.message
      });
    }
  });

  app.post("/api/mkdir", requireStorage, async (req, res) => {
    try {
      const result = await createFolder(
        config.storageRoot,
        req.body?.path || "",
        req.body?.name || ""
      );

      res.status(201).json({
        ok: true,
        ...result
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        message: error.message
      });
    }
  });

  app.delete("/api/files", requireStorage, async (req, res) => {
    try {
      await deleteEntry(config.storageRoot, req.query.path || "");
      res.json({
        ok: true
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        message: error.message
      });
    }
  });

  app.get("/api/download", requireStorage, async (req, res) => {
    try {
      const file = await resolveDownload(config.storageRoot, req.query.path || "");
      res.setHeader("Content-Type", file.contentType);
      res.setHeader("Content-Length", String(file.stats.size));
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(file.normalized.split("/").pop())}"`
      );

      fs.createReadStream(file.absolutePath).pipe(res);
    } catch (error) {
      res.status(404).json({
        ok: false,
        message: error.message
      });
    }
  });

  app.post("/api/upload", requireStorage, async (req, res) => {
    try {
      await ensureStorageRoot(config.storageRoot);
      const uploads = [];
      const targetPath = String(req.query.path || "");
      const busboy = Busboy({
        headers: req.headers,
        preservePath: true
      });
      const fileWrites = [];
      let completed = false;

      busboy.on("file", (fieldname, file, info) => {
        const requestedFilename = fieldname.startsWith("file:") ? fieldname.slice(5) : info.filename;

        if (!requestedFilename) {
          file.resume();
          return;
        }

        const uploadTask = writeUploadedStream({
          storageRoot: config.storageRoot,
          parentPath: targetPath,
          originalFilename: requestedFilename,
          stream: file
        }).then((writtenFile) => {
          uploads.push(writtenFile);
        });

        fileWrites.push(uploadTask);
      });

      busboy.on("error", (error) => {
        if (completed) {
          return;
        }

        completed = true;
        req.unpipe(busboy);
        res.status(400).json({
          ok: false,
          message: error.message
        });
      });

      busboy.on("finish", async () => {
        try {
          if (completed) {
            return;
          }

          await Promise.all(fileWrites);
          completed = true;
          res.status(201).json({
            ok: true,
            uploads
          });
        } catch (error) {
          if (completed) {
            return;
          }

          completed = true;
          res.status(500).json({
            ok: false,
            message: error.message
          });
        }
      });

      req.pipe(busboy);
    } catch (error) {
      res.status(500).json({
        ok: false,
        message: error.message
      });
    }
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    res.status(500).json({
      ok: false,
      message: error.message || "Unexpected server error"
    });
  });

  return app;
}
