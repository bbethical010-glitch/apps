import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

export function loadConfig(env = process.env) {
  const port = Number.parseInt(env.PORT || "8787", 10);
  const storageRoot = path.resolve(env.STORAGE_ROOT || path.join(process.cwd(), "tmp", "storage"));
  const corsOrigin = (env.CORS_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const pollIntervalMs = Number.parseInt(env.POLL_INTERVAL_MS || "5000", 10);

  return {
    port,
    storageRoot,
    corsOrigin,
    pollIntervalMs
  };
}
