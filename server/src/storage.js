import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import mime from "mime-types";
import { basenameRelative, dirnameRelative, resolveStoragePath } from "./path-utils.js";

export async function getStorageStatus(storageRoot) {
  try {
    const stats = await fsp.stat(storageRoot);
    return {
      available: stats.isDirectory(),
      reason: stats.isDirectory() ? null : "Storage root is not a directory"
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        available: false,
        reason: "Storage root not found"
      };
    }

    return {
      available: false,
      reason: error.message
    };
  }
}

export async function getStorageTelemetry(storageRoot) {
  const status = await getStorageStatus(storageRoot);

  if (!status.available) {
    return {
      ...status,
      usage: null
    };
  }

  try {
    const filesystem = await fsp.statfs(storageRoot);
    const blockSize = filesystem.bsize || 0;
    const totalBytes = filesystem.blocks * blockSize;
    const freeBytes = filesystem.bavail * blockSize;
    const usedBytes = Math.max(totalBytes - freeBytes, 0);
    const healthPercent = totalBytes > 0
      ? Math.max(0, Math.min(100, Math.round((freeBytes / totalBytes) * 100)))
      : null;

    return {
      ...status,
      usage: {
        totalBytes,
        usedBytes,
        freeBytes,
        healthPercent
      }
    };
  } catch (error) {
    return {
      ...status,
      usage: null,
      reason: status.reason || error.message
    };
  }
}

export async function ensureStorageRoot(storageRoot) {
  await fsp.mkdir(storageRoot, { recursive: true });
}

export async function listDirectory(storageRoot, relativePath = "") {
  const { normalized, absolutePath } = resolveStoragePath(storageRoot, relativePath);
  const directoryEntries = await fsp.readdir(absolutePath, { withFileTypes: true });

  const items = await Promise.all(
    directoryEntries
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(async (entry) => {
        const entryRelativePath = normalized ? path.posix.join(normalized, entry.name) : entry.name;
        const entryAbsolutePath = path.join(absolutePath, entry.name);
        const stats = await fsp.stat(entryAbsolutePath);

        return {
          name: entry.name,
          path: entryRelativePath,
          type: entry.isDirectory() ? "directory" : "file",
          size: stats.size,
          modifiedAt: stats.mtime.toISOString(),
          contentType: entry.isDirectory() ? null : mime.lookup(entry.name) || "application/octet-stream"
        };
      })
  );

  return {
    currentPath: normalized,
    parentPath: dirnameRelative(normalized),
    items
  };
}

export async function createFolder(storageRoot, parentPath, folderName) {
  const safeName = String(folderName || "").trim();
  if (!safeName || safeName === "." || safeName === ".." || safeName.includes("/")) {
    throw new Error("Invalid folder name");
  }

  const targetRelativePath = parentPath ? path.posix.join(parentPath, safeName) : safeName;
  const { absolutePath, normalized } = resolveStoragePath(storageRoot, targetRelativePath);
  await fsp.mkdir(absolutePath, { recursive: true });

  return {
    path: normalized
  };
}

export async function deleteEntry(storageRoot, relativePath) {
  const { absolutePath } = resolveStoragePath(storageRoot, relativePath);
  await fsp.rm(absolutePath, { recursive: true, force: false });
}

async function getUniqueAbsolutePath(storageRoot, requestedRelativePath) {
  const extension = path.posix.extname(requestedRelativePath);
  const filename = path.posix.basename(requestedRelativePath, extension);
  const directory = dirnameRelative(requestedRelativePath);
  let counter = 0;

  while (true) {
    const candidateName = counter === 0 ? `${filename}${extension}` : `${filename} (${counter})${extension}`;
    const candidateRelativePath = directory ? path.posix.join(directory, candidateName) : candidateName;
    const { absolutePath, normalized } = resolveStoragePath(storageRoot, candidateRelativePath);

    try {
      await fsp.access(absolutePath);
      counter += 1;
    } catch {
      return { absolutePath, normalized };
    }
  }
}

export async function writeUploadedStream({
  storageRoot,
  parentPath = "",
  originalFilename,
  stream
}) {
  const requestedRelativePath = parentPath
    ? path.posix.join(parentPath, originalFilename)
    : originalFilename;

  const cleanedRequestedPath = requestedRelativePath
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.trim())
    .join("/");

  if (!cleanedRequestedPath) {
    throw new Error("Invalid upload path");
  }

  const { absolutePath, normalized } = await getUniqueAbsolutePath(storageRoot, cleanedRequestedPath);
  await fsp.mkdir(path.dirname(absolutePath), { recursive: true });
  const writeStream = fs.createWriteStream(absolutePath, { flags: "wx" });

  await pipeline(stream, writeStream);

  const stats = await fsp.stat(absolutePath);

  return {
    name: basenameRelative(normalized),
    path: normalized,
    size: stats.size,
    modifiedAt: stats.mtime.toISOString()
  };
}

export async function resolveDownload(storageRoot, relativePath) {
  const { absolutePath, normalized } = resolveStoragePath(storageRoot, relativePath);
  const stats = await fsp.stat(absolutePath);

  if (!stats.isFile()) {
    throw new Error("Path is not a file");
  }

  return {
    absolutePath,
    normalized,
    stats,
    contentType: mime.lookup(absolutePath) || "application/octet-stream"
  };
}
