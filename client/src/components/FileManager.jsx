import { useEffect, useMemo, useRef, useState } from "react";

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = -1;

  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatGigabytes(bytes) {
  if (!Number.isFinite(bytes)) {
    return "--";
  }

  return `${(bytes / 1024 ** 3).toFixed(bytes >= 1024 ** 3 * 100 ? 0 : 1)} GB`;
}

function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1]
  ];

  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds || unit === "second") {
      return formatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }

  return isoString;
}

function buildCliProgress(loadedBytes, totalBytes) {
  if (!totalBytes) {
    return "[░░░░░░░░░░░░] --%";
  }

  const segments = 12;
  const ratio = Math.max(0, Math.min(loadedBytes / totalBytes, 1));
  const filled = Math.round(ratio * segments);

  return `[${"█".repeat(filled)}${"░".repeat(segments - filled)}] ${Math.round(ratio * 100)}%`;
}

function joinApiUrl(apiBaseUrl, pathname, searchParams) {
  const url = new URL(`${apiBaseUrl}${pathname}`);
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

function FileIcon({ item }) {
  const extension = item.name.split(".").pop()?.toLowerCase();
  let path = (
    <>
      <path d="M8 3.5h5.5L18.5 8v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6.5 20V5A1.5 1.5 0 0 1 8 3.5Z" />
      <path d="M13.5 3.5V8h5" />
    </>
  );

  if (item.type === "directory") {
    path = (
      <>
        <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l1.4 1.5h8.1A1.5 1.5 0 0 1 20 9v8A2.5 2.5 0 0 1 17.5 19.5h-13A2.5 2.5 0 0 1 2 17V9A1.5 1.5 0 0 1 3.5 7.5Z" />
      </>
    );
  } else if (extension === "pdf") {
    path = (
      <>
        <path d="M8 3.5h5.5L18.5 8v12a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6.5 20V5A1.5 1.5 0 0 1 8 3.5Z" />
        <path d="M13.5 3.5V8h5" />
        <path d="M8.7 16.5h6.6" />
        <path d="M8.7 13.5h4.5" />
      </>
    );
  } else if (["zip", "tar", "gz", "rar", "7z"].includes(extension)) {
    path = (
      <>
        <rect x="5.5" y="5.5" width="13" height="13" rx="2" />
        <path d="M12 5.5v13" />
        <path d="M12 8h.01M12 11h.01M12 14h.01" />
      </>
    );
  }

  return (
    <span className="file-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {path}
      </svg>
    </span>
  );
}

export function FileManager({ apiBaseUrl, host, latencyMs, storageUsage, onRefreshStatus }) {
  const [currentPath, setCurrentPath] = useState("");
  const [listing, setListing] = useState({
    currentPath: "",
    parentPath: "",
    items: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [folderName, setFolderName] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [uploadState, setUploadState] = useState(null);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchListing() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(joinApiUrl(apiBaseUrl, "/api/files", { path: currentPath }));
        const payload = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(payload.message || "Unable to load files");
        }

        setListing(payload);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchListing();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, currentPath, refreshKey]);

  const breadcrumbs = useMemo(() => {
    if (!listing.currentPath) {
      return [{ label: "Root", path: "" }];
    }

    const segments = listing.currentPath.split("/");
    return [{ label: "Root", path: "" }].concat(
      segments.map((segment, index) => ({
        label: segment,
        path: segments.slice(0, index + 1).join("/")
      }))
    );
  }, [listing.currentPath]);

  const storagePercent = useMemo(() => {
    if (!storageUsage?.totalBytes) {
      return 0;
    }

    return Math.round((storageUsage.usedBytes / storageUsage.totalBytes) * 100);
  }, [storageUsage]);

  async function createFolder() {
    if (!folderName.trim()) {
      return;
    }

    setActionBusy(true);
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/mkdir`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          path: listing.currentPath,
          name: folderName.trim()
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Unable to create folder");
      }

      setFolderName("");
      setRefreshKey((value) => value + 1);
      onRefreshStatus();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionBusy(false);
    }
  }

  async function uploadFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) {
      return;
    }

    setActionBusy(true);
    setError("");

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    setUploadState({
      label: files.length === 1 ? files[0].name : `${files.length} items`,
      loadedBytes: 0,
      totalBytes,
      fileCount: files.length,
      phase: "uploading"
    });

    try {
      const formData = new FormData();
      files.forEach((file) => {
        const relativeName = file.webkitRelativePath || file.name;
        formData.append(`file:${relativeName}`, file, file.name);
      });

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", joinApiUrl(apiBaseUrl, "/api/upload", { path: listing.currentPath }));

        xhr.upload.addEventListener("progress", (event) => {
          setUploadState((current) => ({
            ...(current || {}),
            label: files.length === 1 ? files[0].name : `${files.length} items`,
            loadedBytes: event.loaded,
            totalBytes: event.lengthComputable ? event.total : totalBytes,
            fileCount: files.length,
            phase: "uploading"
          }));
        });

        xhr.addEventListener("load", () => {
          let payload = {};

          try {
            payload = JSON.parse(xhr.responseText || "{}");
          } catch {
            payload = {};
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(payload);
            return;
          }

          reject(new Error(payload.message || "Upload failed"));
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.send(formData);
      });

      setUploadState((current) => ({
        ...(current || {}),
        loadedBytes: totalBytes,
        totalBytes,
        phase: "complete"
      }));
      window.setTimeout(() => setUploadState(null), 1800);
      setRefreshKey((value) => value + 1);
      onRefreshStatus();
    } catch (requestError) {
      setUploadState((current) => ({
        ...(current || {}),
        phase: "error"
      }));
      setError(requestError.message);
    } finally {
      setActionBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (folderInputRef.current) {
        folderInputRef.current.value = "";
      }
    }
  }

  async function removeItem(itemPath) {
    setActionBusy(true);
    setError("");

    try {
      const response = await fetch(joinApiUrl(apiBaseUrl, "/api/files", { path: itemPath }), {
        method: "DELETE"
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Delete failed");
      }

      setRefreshKey((value) => value + 1);
      onRefreshStatus();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <section className="manager-shell">
      <div className="control-grid">
        <section className="glass-panel control-panel">
          <div className="panel-kicker mono">control plane</div>
          <h2>Ingress + transfer controls</h2>
          <p className="panel-copy">
            Direct writes to the mounted SSD, no virtual disk, no proprietary blob layer.
          </p>

          <div className="control-metrics mono">
            <span>latency={latencyMs ?? "--"}ms</span>
            <span>host={host?.hostname || "local-node"}</span>
          </div>

          <div className="action-row">
            <label className="action-button">
              upload files
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(event) => uploadFiles(event.target.files)}
                hidden
              />
            </label>

            <label className="action-button action-button--secondary">
              upload folder
              <input
                ref={folderInputRef}
                type="file"
                multiple
                webkitdirectory=""
                directory=""
                onChange={(event) => uploadFiles(event.target.files)}
                hidden
              />
            </label>
          </div>

          <div className="folder-maker">
            <input
              className="text-input mono"
              placeholder="mkdir ~/Root/new-directory"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
            />
            <button className="primary-button" type="button" onClick={createFolder} disabled={actionBusy}>
              create
            </button>
          </div>

          <div className="transfer-console mono">
            <div className="transfer-console__header">
              <span>transfer status</span>
              <span>{uploadState?.phase || "idle"}</span>
            </div>
            <div className="transfer-console__body">
              <p>{uploadState?.label || "No active transfer"}</p>
              <p>{uploadState ? buildCliProgress(uploadState.loadedBytes, uploadState.totalBytes) : "[░░░░░░░░░░░░] 0%"}</p>
              <p>
                {uploadState
                  ? `${formatBytes(uploadState.loadedBytes)} / ${formatBytes(uploadState.totalBytes)}`
                  : "0 B / 0 B"}
              </p>
            </div>
          </div>

          {error ? <p className="error-text mono">// {error}</p> : null}
        </section>

        <section className="glass-panel explorer-panel">
          <div className="explorer-panel__header">
            <div>
              <p className="panel-kicker mono">filesystem</p>
              <h2>
                Live storage view
                <span className="terminal-cursor" aria-hidden="true">
                  ▌
                </span>
              </h2>
            </div>
            <button
              className="ghost-button mono"
              type="button"
              onClick={() => {
                setRefreshKey((value) => value + 1);
                onRefreshStatus();
              }}
              disabled={actionBusy}
            >
              refresh --now
            </button>
          </div>

          <div className="utilization-shell">
            <div className="utilization-shell__meta mono">
              <span>used {formatGigabytes(storageUsage?.usedBytes)}</span>
              <span>total {formatGigabytes(storageUsage?.totalBytes)}</span>
            </div>
            <div className="utilization-bar">
              <div className="utilization-bar__fill" style={{ width: `${storagePercent}%` }} />
            </div>
          </div>

          <div className="path-bar mono">
            <span className="path-bar__prefix">~/</span>
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.path || "root"}>
                <button type="button" onClick={() => setCurrentPath(crumb.path)}>
                  {crumb.label}
                </button>
                {index < breadcrumbs.length - 1 ? <span>/</span> : null}
              </span>
            ))}
          </div>

          <div className="explorer-table mono">
            <div className="explorer-row explorer-row--header">
              <span>name</span>
              <span>modified</span>
              <span>size</span>
              <span>ops</span>
            </div>

            {!loading && listing.currentPath ? (
              <div className="explorer-row explorer-row--system">
                <span>
                  <button type="button" className="link-button link-button--terminal" onClick={() => setCurrentPath(listing.parentPath || "")}>
                    ../
                  </button>
                </span>
                <span>parent</span>
                <span>--</span>
                <span>cd</span>
              </div>
            ) : null}

            {listing.items.map((item) => (
              <div className="explorer-row explorer-row--item" key={item.path}>
                <div className="explorer-row__name">
                  <FileIcon item={item} />
                  {item.type === "directory" ? (
                    <button
                      className="link-button link-button--terminal"
                      type="button"
                      onClick={() => setCurrentPath(item.path)}
                    >
                      {item.name}/
                    </button>
                  ) : (
                    <span>{item.name}</span>
                  )}
                  <div className="code-tooltip">
                    <span>// modified {formatRelativeTime(item.modifiedAt)}</span>
                    <span>· {formatBytes(item.size)}</span>
                    <span>· {item.path}</span>
                  </div>
                </div>
                <span>{formatRelativeTime(item.modifiedAt)}</span>
                <span>{item.type === "directory" ? "--" : formatBytes(item.size)}</span>
                <span className="row-actions">
                  {item.type === "file" ? (
                    <a className="mini-button mono" href={joinApiUrl(apiBaseUrl, "/api/download", { path: item.path })}>
                      get
                    </a>
                  ) : null}
                  <button className="mini-button mini-button--danger mono" type="button" onClick={() => removeItem(item.path)}>
                    rm
                  </button>
                </span>
              </div>
            ))}

            {!loading && !listing.items.length ? (
              <div className="empty-state mono">
                <p>// current directory is empty</p>
                <p>// uploads and Finder changes will appear here in real time</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
