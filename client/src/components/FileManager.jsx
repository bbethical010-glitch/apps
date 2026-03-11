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

export function FileManager({ apiBaseUrl }) {
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
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchListing() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          joinApiUrl(apiBaseUrl, "/api/files", { path: listing.currentPath })
        );
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
  }, [apiBaseUrl, listing.currentPath, refreshKey]);

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

    try {
      const formData = new FormData();
      files.forEach((file) => {
        const relativeName = file.webkitRelativePath || file.name;
        formData.append(`file:${relativeName}`, file, file.name);
      });

      const response = await fetch(
        joinApiUrl(apiBaseUrl, "/api/upload", { path: listing.currentPath }),
        {
          method: "POST",
          body: formData
        }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Upload failed");
      }

      setRefreshKey((value) => value + 1);
    } catch (requestError) {
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
      const response = await fetch(
        joinApiUrl(apiBaseUrl, "/api/files", { path: itemPath }),
        { method: "DELETE" }
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Delete failed");
      }

      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <section className="manager-shell">
      <div className="toolbar">
        <div className="breadcrumbs">
          {breadcrumbs.map((crumb) => (
            <button
              key={crumb.path || "root"}
              className="crumb"
              type="button"
              onClick={() => setListing((current) => ({ ...current, currentPath: crumb.path }))}
            >
              {crumb.label}
            </button>
          ))}
        </div>

        <button
          className="ghost-button"
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={actionBusy}
        >
          Refresh
        </button>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Upload and organize</h2>
            <p>Files land directly on the SSD as normal macOS-visible items.</p>
          </div>

          <div className="action-row">
            <label className="action-button">
              Upload files
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(event) => uploadFiles(event.target.files)}
                hidden
              />
            </label>

            <label className="action-button action-button--secondary">
              Upload folder
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
              className="text-input"
              placeholder="New folder name"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
            />
            <button className="primary-button" type="button" onClick={createFolder} disabled={actionBusy}>
              Create folder
            </button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
        </section>

        <section className="panel panel--wide">
          <div className="panel-heading">
            <h2>Live storage view</h2>
            <p>{loading ? "Refreshing file index..." : `${listing.items.length} item(s) visible in this folder.`}</p>
          </div>

          <div className="file-table">
            <div className="file-row file-row--header">
              <span>Name</span>
              <span>Modified</span>
              <span>Size</span>
              <span>Actions</span>
            </div>

            {!loading && listing.currentPath ? (
              <div className="file-row">
                <span>
                  <button
                    className="link-button"
                    type="button"
                    onClick={() =>
                      setListing((current) => ({ ...current, currentPath: listing.parentPath || "" }))
                    }
                  >
                    ..
                  </button>
                </span>
                <span>Parent folder</span>
                <span>-</span>
                <span>-</span>
              </div>
            ) : null}

            {listing.items.map((item) => (
              <div className="file-row" key={item.path}>
                <span>
                  {item.type === "directory" ? (
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => setListing((current) => ({ ...current, currentPath: item.path }))}
                    >
                      {item.name}/
                    </button>
                  ) : (
                    item.name
                  )}
                </span>
                <span>{new Date(item.modifiedAt).toLocaleString()}</span>
                <span>{item.type === "directory" ? "--" : formatBytes(item.size)}</span>
                <span className="row-actions">
                  {item.type === "file" ? (
                    <a
                      className="mini-button"
                      href={joinApiUrl(apiBaseUrl, "/api/download", { path: item.path })}
                    >
                      Download
                    </a>
                  ) : null}
                  <button className="mini-button mini-button--danger" type="button" onClick={() => removeItem(item.path)}>
                    Delete
                  </button>
                </span>
              </div>
            ))}

            {!loading && !listing.items.length ? (
              <div className="empty-state">
                <p>This folder is empty.</p>
                <p>Drop in files from your phone or Finder and they will appear here.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
