import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { createServer } from "../src/app.js";

let tempDir;
let app;

before(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ssd-cloud-storage-"));
  app = createServer({
    config: {
      storageRoot: tempDir,
      corsOrigin: [],
      pollIntervalMs: 5000
    }
  });
});

after(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe("SSD Cloud Storage API", () => {
  it("reports storage status", async () => {
    const response = await request(app).get("/api/status");

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.storage, "online");
    assert.equal(typeof response.body.host.hostname, "string");
    assert.equal(typeof response.body.host.user, "string");
  });

  it("lists files from the storage directory", async () => {
    await fs.writeFile(path.join(tempDir, "hello.txt"), "hello world");
    const response = await request(app).get("/api/files");

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.items[0].name, "hello.txt");
  });

  it("streams uploaded files to disk", async () => {
    const response = await request(app)
      .post("/api/upload")
      .attach("file:clips/holiday.mov", Buffer.from("video-data"), "holiday.mov");

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.uploads[0].path, "clips/holiday.mov");

    const written = await fs.readFile(path.join(tempDir, "clips", "holiday.mov"), "utf8");
    assert.equal(written, "video-data");
  });

  it("downloads files from disk", async () => {
    await fs.writeFile(path.join(tempDir, "report.pdf"), "binary-ish");
    const response = await request(app).get("/api/download").query({ path: "report.pdf" });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.toString(), "binary-ish");
  });

  it("creates folders via the API", async () => {
    const response = await request(app)
      .post("/api/mkdir")
      .send({ path: "", name: "Projects" });

    assert.equal(response.statusCode, 201);

    const stats = await fs.stat(path.join(tempDir, "Projects"));
    assert.equal(stats.isDirectory(), true);
  });
});
