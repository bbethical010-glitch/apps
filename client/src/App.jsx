import { useEffect, useState } from "react";
import { FileManager } from "./components/FileManager";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8787").replace(/\/$/, "");
const STATUS_POLL_MS = Number.parseInt(import.meta.env.VITE_STATUS_POLL_MS || "5000", 10);

function StatusScreen({ eyebrow, title, description, accent, checkedAt }) {
  return (
    <section className="status-shell">
      <div className={`status-card status-card--${accent}`}>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="status-copy">{description}</p>
        <div className="status-meta">
          <span>Frontend: GitHub Pages ready</span>
          <span>Last checked: {checkedAt ? new Date(checkedAt).toLocaleTimeString() : "pending"}</span>
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
    pollIntervalMs: STATUS_POLL_MS
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/status`);
        const payload = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setStatus({
            connection: "mac-offline",
            checkedAt: new Date().toISOString(),
            message: payload.message || "The backend is unreachable.",
            pollIntervalMs: STATUS_POLL_MS
          });
          return;
        }

        setStatus({
          connection: payload.storage === "online" ? "online" : "ssd-offline",
          checkedAt: payload.checkedAt,
          message: payload.message,
          pollIntervalMs: payload.pollIntervalMs || STATUS_POLL_MS
        });
      } catch (error) {
        if (!cancelled) {
          setStatus({
            connection: "mac-offline",
            checkedAt: new Date().toISOString(),
            message: error.message,
            pollIntervalMs: STATUS_POLL_MS
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
  }, [status.pollIntervalMs]);

  if (status.connection === "checking") {
    return (
      <StatusScreen
        accent="checking"
        eyebrow="Boot sequence"
        title="Checking your storage host"
        description="The UI is online. Waiting for the Mac API to answer the first health check."
        checkedAt={status.checkedAt}
      />
    );
  }

  if (status.connection === "mac-offline") {
    return (
      <StatusScreen
        accent="offline"
        eyebrow="Host offline"
        title="Your Mac is currently turned off or unreachable"
        description={status.message || "The frontend is available, but the Cloudflare tunnel/API is not responding."}
        checkedAt={status.checkedAt}
      />
    );
  }

  if (status.connection === "ssd-offline") {
    return (
      <StatusScreen
        accent="warning"
        eyebrow="SSD disconnected"
        title="The server is online, but the storage drive is missing"
        description={status.message || "Reconnect the SSD to the Mac and the file manager will reappear automatically."}
        checkedAt={status.checkedAt}
      />
    );
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">SSD Cloud Storage</p>
          <h1>Finder-visible storage with a persistent web front door.</h1>
        </div>
        <div className="hero-status">
          <span className="status-pill">Mac online</span>
          <span className="status-pill">SSD online</span>
        </div>
      </header>

      <FileManager apiBaseUrl={API_BASE_URL} />
    </main>
  );
}
