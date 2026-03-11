# Cloudflare Setup

This project supports two Cloudflare modes:

- Quick tunnel: fastest way to test the API from outside your home network
- Named tunnel: stable production hostname for GitHub Pages

## 1. Local backend

Prepare local config if you have not already:

```bash
cd /Users/prathampandey/Desktop/data
./scripts/bootstrap-local.sh
```

Start the API:

```bash
./scripts/start-server.sh
```

The API listens on:

```text
http://localhost:8787
```

## 2. Quick tunnel for immediate testing

Start the quick tunnel in a second terminal:

```bash
cd /Users/prathampandey/Desktop/data
./scripts/start-cloudflare-quick-tunnel.sh
```

Cloudflare will print a temporary URL ending in `trycloudflare.com`.

Important:

- This script intentionally ignores `~/.cloudflared/config.yml`.
- If you have an old named-tunnel config there, it can hijack quick tunnels and send every request to a fallback `404`.

Use that URL in local or production frontend config:

```env
VITE_API_BASE_URL=https://random-name.trycloudflare.com
```

Or let the repo parse the current tunnel URL and rebuild Pages automatically:

```bash
cd /Users/prathampandey/Desktop/data
./scripts/deploy-pages-with-current-tunnel.sh
```

Notes:

- Quick tunnel URLs change when you restart the tunnel.
- This is useful for testing, not for a permanent GitHub Pages deployment.

## 3. Named tunnel for production

This is the stable setup you should use with GitHub Pages.

### Login

```bash
cloudflared tunnel login
```

That opens a browser and asks you to authorize a Cloudflare zone you control.

### Create the tunnel

```bash
cloudflared tunnel create ssd-cloud-storage
```

This creates a tunnel UUID and a credentials JSON file in `~/.cloudflared/`.

### Create config

Copy the template:

```bash
cp /Users/prathampandey/Desktop/data/cloudflare/config.example.yml ~/.cloudflared/config.yml
```

Then replace:

- `your-tunnel-uuid`
- `credentials-file`
- `ssd-api.yourdomain.com`

The hostname should point to your local API:

```yaml
ingress:
  - hostname: ssd-api.yourdomain.com
    service: http://localhost:8787
  - service: http_status:404
```

### Route DNS

```bash
cloudflared tunnel route dns ssd-cloud-storage ssd-api.yourdomain.com
```

### Run the named tunnel

```bash
cloudflared tunnel run ssd-cloud-storage
```

## 4. Frontend production config

Once you have a stable hostname, create:

```bash
cp /Users/prathampandey/Desktop/data/client/.env.production.example /Users/prathampandey/Desktop/data/client/.env.production
```

Set:

```env
VITE_API_BASE_URL=https://ssd-api.yourdomain.com
VITE_STATUS_POLL_MS=5000
VITE_APP_BASE_PATH=/apps/
```

Then deploy:

```bash
cd /Users/prathampandey/Desktop/data/client
npm run deploy
```

## 5. Recommended run order

For local testing:

1. `./scripts/start-server.sh`
2. `./scripts/start-cloudflare-quick-tunnel.sh`
3. Put the quick tunnel URL into `client/.env.production` or `client/.env`
4. Run `npm run dev:client` or `npm --prefix client run build`

For production:

1. `./scripts/start-server.sh`
2. `cloudflared tunnel run ssd-cloud-storage`
3. Deploy GitHub Pages with the stable hostname in `client/.env.production`
