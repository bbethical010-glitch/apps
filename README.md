# SSD Cloud Storage

A hybrid cloud-storage project that keeps the frontend online on GitHub Pages while a lightweight Node.js API runs on your Mac and writes normal files directly to an SSD.

## What this repo includes

- `server/`: Express API for health checks, file listing, streamed uploads, downloads, folder creation, and deletion.
- `client/`: React + Vite frontend that polls backend status and switches between:
  - Host offline
  - SSD disconnected
  - File manager online

## Architecture

- Frontend: static React app deployable to GitHub Pages
- Backend: Node.js + Express running on macOS
- Transport: Cloudflare Tunnel exposing the API securely
- Storage: regular files written directly under `STORAGE_ROOT`

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Configure the backend:

```bash
cp server/.env.example server/.env
```

Set `STORAGE_ROOT` to your SSD folder, for example:

```env
STORAGE_ROOT=/Volumes/My\ SSD/MyCloudStorage
```

3. Configure the frontend:

```bash
cp client/.env.example client/.env
```

For local development:

```env
VITE_API_BASE_URL=http://localhost:8787
```

For production, point `VITE_API_BASE_URL` at your Cloudflare Tunnel hostname.
For this repository, the GitHub Pages base path should be:

```env
VITE_APP_BASE_PATH=/apps/
```

4. Start the backend:

```bash
npm run dev:server
```

5. Start the frontend:

```bash
npm run dev:client
```

## API endpoints

- `GET /api/status`: reports API reachability and SSD availability
- `GET /api/files?path=<relative-folder>`: lists files and folders
- `POST /api/upload?path=<relative-folder>`: streams multipart uploads to disk
- `GET /api/download?path=<relative-file>`: streams a file to the client
- `POST /api/mkdir`: creates a folder from JSON `{ path, name }`
- `DELETE /api/files?path=<relative-path>`: deletes a file or directory

All paths are resolved relative to `STORAGE_ROOT` and sanitized to block traversal outside the storage root.

## Deployment

### GitHub Pages

1. Push this repo to GitHub.
2. Set `client/.env.production` or repository build env vars:

```env
VITE_API_BASE_URL=https://your-tunnel-domain.example.com
VITE_APP_BASE_PATH=/apps/
```

3. Deploy:

```bash
cd client
npm run deploy
```

### Cloudflare Tunnel

Install `cloudflared` on the Mac, authenticate it, and route a stable hostname to the local API port:

```bash
cloudflared tunnel --url http://localhost:8787
```

For a persistent named tunnel, create it in Cloudflare Zero Trust and map your DNS hostname to that tunnel.

For a full quick-tunnel and named-tunnel walkthrough, see [CLOUDFLARE_SETUP.md](/Users/prathampandey/Desktop/data/CLOUDFLARE_SETUP.md).

## Verification

Run the backend tests:

```bash
npm test
```

Build the frontend:

```bash
npm run build
```

Manual checks:

- Turn off the Mac and confirm the frontend still loads but shows host offline.
- Start the Mac with the SSD unplugged and confirm the UI shows SSD disconnected.
- Upload files and confirm they appear in Finder under `STORAGE_ROOT`.
- Upload a folder and confirm nested files are recreated on disk.
