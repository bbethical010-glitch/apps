import path from "node:path";

function normalizeRelativePath(input = "") {
  const normalized = path.posix.normalize(`/${String(input).replaceAll("\\", "/")}`);
  return normalized.replace(/^\/+/, "");
}

export function resolveStoragePath(storageRoot, relativePath = "") {
  const normalized = normalizeRelativePath(relativePath);
  const absolutePath = path.resolve(storageRoot, normalized);
  const relativeToRoot = path.relative(storageRoot, absolutePath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new Error("Invalid path");
  }

  return {
    normalized,
    absolutePath
  };
}

export function dirnameRelative(relativePath = "") {
  const normalized = normalizeRelativePath(relativePath);
  if (!normalized) {
    return "";
  }

  const dir = path.posix.dirname(normalized);
  return dir === "." ? "" : dir;
}

export function basenameRelative(relativePath = "") {
  return path.posix.basename(normalizeRelativePath(relativePath));
}
