import { useEffect, useMemo, useState } from "react";
import { FileManager } from "./components/FileManager";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8787").replace(/\/$/, "");
const STATUS_POLL_MS = Number.parseInt(import.meta.env.VITE_STATUS_POLL_MS || "5000", 10);

function formatDuration(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) {
    return "--";
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

function formatLatency(latencyMs) {
  if (!Number.isFinite(latencyMs)) {
    return "--";
  }

  return `${latencyMs}ms`;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return `${value}%`;
}

function LedDot({ status }) {
  return <span className={`led led--${status}`} aria-hidden="true" />;
}

function SystemBadge({ label, status, value }) {
  return (
    <div className={`system-badge system-badge--${status}`}>
      <LedDot status={status} />
      <span>{label}</span>
      {value ? <strong>{value}</strong> : null}
    </div>
  );
}

function TerminalStatusScreen({
  eyebrow,
  title,
  description,
  code,
  lines,
  accent,
  checkedAt,
  onRetry
}) {
  return (
    <section className="status-shell">
      <div className={`terminal-state terminal-state--${accent}`}>
        <div className="terminal-state__header">
          <p className="eyebrow">{eyebrow}</p>
          <span className="terminal-state__code">{code}</span>
        </div>
        <h1>{title}</h1>
        <p className="status-copy">{description}</p>

        <div className="terminal-state__body">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <span className="terminal-cursor" aria-hidden="true">
            ▌
          </span>
        </div>

        <div className="terminal-state__footer">
          <button className="command-button" type="button" onClick={onRetry}>
            $ reconnect --force
          </button>
          <span className="mono">last_check={checkedAt || "pending"}</span>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [status, setStatus] = useState({
    connection: "checking",
    checkedAt: null,
    message: null,
    pollIntervalMs: STATUS_POLL_MS,
    latencyMs: null,
    host: null,
    storageUsage: null
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return window.localStorage.getItem("ssd-cloud-theme") || "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("ssd-cloud-theme", theme);
  }, [theme]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      const startedAt = performance.now();

      try {
        const response = await fetch(`${API_BASE_URL}/api/status`);
        const payload = await response.json();
        const latencyMs = Math.round(performance.now() - startedAt);

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setStatus({
            connection: "mac-offline",
            checkedAt: new Date().toISOString(),
            message: payload.message || "The backend is unreachable.",
            pollIntervalMs: STATUS_POLL_MS,
            latencyMs,
            host: null,
            storageUsage: null
          });
          return;
        }

        setStatus({
          connection: payload.storage === "online" ? "online" : "ssd-offline",
          checkedAt: payload.checkedAt,
          message: payload.message,
          pollIntervalMs: payload.pollIntervalMs || STATUS_POLL_MS,
          latencyMs,
          host: payload.host,
          storageUsage: payload.storageUsage
        });
      } catch (error) {
        if (!cancelled) {
          setStatus({
            connection: "mac-offline",
            checkedAt: new Date().toISOString(),
            message: error.message,
            pollIntervalMs: STATUS_POLL_MS,
            latencyMs: null,
            host: null,
            storageUsage: null
          });
        }
      }
    }

    fetchStatus();
    const intervalId = window.setInterval(fetchStatus, status.pollIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [refreshKey, status.pollIntervalMs]);

  const uptimeText = useMemo(() => {
    if (!status.host?.uptimeSeconds || !status.checkedAt) {
      return "--";
    }

    const elapsedSinceCheck = Math.max(0, Math.floor((now - new Date(status.checkedAt).getTime()) / 1000));
    return formatDuration(status.host.uptimeSeconds + elapsedSinceCheck);
  }, [now, status.checkedAt, status.host]);

  const healthPercent = status.storageUsage?.healthPercent ?? null;

  if (status.connection === "checking") {
    return (
      <TerminalStatusScreen
        accent="checking"
        eyebrow="Boot sequence"
        code="SYS_INIT"
        title="Checking your storage host"
        description="The interface is online. Waiting for the SSD control plane to answer the first health probe."
        checkedAt={status.checkedAt}
        onRetry={() => setRefreshKey((value) => value + 1)}
        lines={[
          "[init] frontend: ready",
          `[probe] target=${API_BASE_URL}/api/status`,
          "[await] waiting for host acknowledgement"
        ]}
      />
    );
  }

  if (status.connection === "mac-offline") {
    return (
      <TerminalStatusScreen
        accent="offline"
        eyebrow="Host offline"
        code="HOST_UNREACHABLE"
        title="Your Mac is currently turned off or unreachable"
        description={status.message || "The tunnel or backend is not responding to external probes."}
        checkedAt={status.checkedAt}
        onRetry={() => setRefreshKey((value) => value + 1)}
        lines={[
          "[error] edge route failed to reach localhost:8787",
          `[hint] verify cloudflared and node are still running`,
          `[trace] message=${status.message || "unreachable"}`
        ]}
      />
    );
  }

  if (status.connection === "ssd-offline") {
    return (
      <TerminalStatusScreen
        accent="warning"
        eyebrow="SSD disconnected"
        code="DISK_NOT_FOUND"
        title="The server is alive, but the storage bus is missing the SSD"
        description={status.message || "Reconnect the SSD and the interface will recover on the next probe cycle."}
        checkedAt={status.checkedAt}
        onRetry={() => setRefreshKey((value) => value + 1)}
        lines={[
          "[panic] volume lookup failed at /Volumes/My SSD/MyCloudStorage",
          "[recovery] reconnect drive, verify mount, retry probe",
          `[trace] status=503 storage=offline`
        ]}
      />
    );
  }

  return (
    <main className="app-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-noise" aria-hidden="true" />

      <section className="topbar glass-panel">
        <div className="topbar__group mono">
          <span>host:{status.host?.hostname || "local-node"}</span>
          <span>user:{status.host?.user || "operator"}</span>
        </div>
        <div className="topbar__group mono">
          <span>health:{formatPercent(healthPercent)}</span>
          <button
            className="settings-button"
            type="button"
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            aria-label="Toggle theme"
          >
            ⚙
          </button>
        </div>
      </section>

      <header className="hero glass-panel">
        <div className="hero-copy">
          <p className="eyebrow">SSD Cloud Storage</p>
          <h1>Finder-visible storage with a persistent web front door.</h1>
          <p className="hero-subcopy">
            Precision storage control for a personal SSD server with live telemetry, direct filesystem access,
            and remote visibility engineered for low friction.
          </p>
        </div>

        <div className="hero-aside">
          <div className="hero-badges">
            <SystemBadge label="Mac" status="online" value="online" />
            <SystemBadge label="SSD" status="online" value="mounted" />
          </div>

          <div className="hero-metrics">
            <div className="metric-card">
              <span className="metric-card__label">Uptime</span>
              <strong className="mono">{uptimeText}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-card__label">Last ping</span>
              <strong className="mono">{formatLatency(status.latencyMs)}</strong>
            </div>
            <div className="metric-card">
              <span className="metric-card__label">Storage health</span>
              <strong className="mono">{formatPercent(healthPercent)}</strong>
            </div>
          </div>
        </div>
      </header>

      <FileManager
        apiBaseUrl={API_BASE_URL}
        host={status.host}
        latencyMs={status.latencyMs}
        storageUsage={status.storageUsage}
        onRefreshStatus={() => setRefreshKey((value) => value + 1)}
      />
    </main>
  );
}
