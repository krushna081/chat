# RelayChat

RelayChat is a single-service real-time chat application. One Node process serves the React client, the REST API, and Socket.IO, backed by MongoDB.

## What it does

- Email/password signup with a six-digit email verification code.
- Public rooms and optional password-protected rooms.
- Room-level access checks for both REST and Socket.IO.
- AES-256-GCM message encryption before storage.
- Per-room message timers using MongoDB TTL indexes.
- Dark and light themes with a responsive interface.
- HttpOnly access and refresh cookies instead of tokens in `localStorage`.

## Security model (important)

RelayChat uses **server-managed encryption**, not end-to-end encryption (E2EE).

- Messages are encrypted in the browser with AES-256-GCM.
- The server gives the room key to authorized room members.
- The server stores the room key and can decrypt stored messages.
- The server can therefore read message contents. Do not describe RelayChat as E2EE.
- Password-protected rooms are an access-control feature, not a replacement for E2EE.

See [`SECURITY.md`](SECURITY.md) and [`docs/SECURITY.md`](docs/SECURITY.md) for the full model.

## Architecture

```text
Browser
  │  same origin
  ▼
Node / Express ── MongoDB Atlas
  ├── /api/*          REST API
  ├── /socket.io      Socket.IO
  └── /*              client/dist (React build)
```

The client build is served by Express when `SERVE_CLIENT=true` and `client/dist/index.html` exists. This is the recommended production mode: one server, one origin, one deployment.

## Local development

Requirements: Node.js 20.19 or newer (Node 24 recommended), npm, and a MongoDB connection string.

```bash
npm ci
npm ci --prefix server
npm ci --prefix client

cp .env.example .env
# Edit .env. At minimum set MONGODB_URI and two different JWT secrets.

npm run dev
```

`npm run dev` starts the Express server and the Vite dev server. Vite proxies `/api` and `/socket.io` to `http://localhost:5000`, so cookies stay same-origin and no extra client URL configuration is needed.

Open `http://localhost:5173`.

## Production on one server

```bash
npm ci
npm ci --prefix server
npm ci --prefix client

cp .env.example .env
# Set NODE_ENV=production, CLIENT_URL=https://your-domain.example,
# COOKIE_SECURE=true, TRUST_PROXY=1, SERVE_CLIENT=true, and real secrets.

npm run build
npm start
```

The server listens on `PORT` (default `5000`). `GET /api/health` is available for platform health checks. The React app is served from `/`, and client-side routes fall back to `index.html`.

For Render, Railway, Fly.io, a VPS, or Docker, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

> Vercel is not a suitable host for this design because it cannot run a persistent Socket.IO server. RelayChat is intentionally a single long-running Node service.

## Environment variables

| Variable              | Required | Notes                                                                |
| --------------------- | -------- | -------------------------------------------------------------------- |
| `NODE_ENV`            | no       | Defaults to `development`; use `production` in deployments.          |
| `PORT`                | no       | Defaults to `5000`.                                                  |
| `MONGODB_URI`         | yes      | MongoDB Atlas connection string. Never commit it.                    |
| `JWT_SECRET`          | yes      | 32+ random characters for short-lived access tokens.                 |
| `JWT_REFRESH_SECRET`  | yes      | A different 32+ character secret for refresh tokens.                 |
| `CLIENT_URL`          | prod     | Public URL of the single service, e.g. `https://chat.example.com`.   |
| `ALLOWED_ORIGINS`     | no       | Comma-separated extra origins.                                       |
| `TRUST_PROXY`         | no       | `1`/`true` behind Render/Railway/Fly/reverse proxy; `false` locally. |
| `COOKIE_SECURE`       | no       | Defaults to `true` in production.                                    |
| `COOKIE_SAME_SITE`    | no       | Defaults to `lax`; same-origin deployments should keep `lax`.        |
| `COOKIE_DOMAIN`       | no       | Optional cookie domain; leave blank for host-only cookies.           |
| `ACCESS_TOKEN_TTL`    | no       | Access token lifetime; defaults to `15m`.                            |
| `REFRESH_TOKEN_TTL`   | no       | Refresh token lifetime; defaults to `7d`.                            |
| `MAX_LOGIN_ATTEMPTS`  | no       | Failed attempts before a temporary lock; defaults to `5`.            |
| `LOGIN_LOCK_MINUTES`  | no       | Lock duration; defaults to `15`.                                     |
| `MONGODB_DNS_SERVERS` | no       | Optional comma-separated DNS servers for restricted networks.        |
| `RESEND_API_KEY`      | prod     | Required for real verification and reset emails.                     |
| `EMAIL_FROM`          | no       | Verified Resend sender, e.g. `RelayChat <noreply@example.com>`.      |
| `RESEND_TEST_EMAIL`   | no       | Development-only redirect for test emails.                           |
| `SERVE_CLIENT`        | no       | Defaults to `true`; set `false` if another proxy serves the build.   |
| `CLIENT_DIST`         | no       | Defaults to `client/dist`.                                           |

Generate secrets with:

```bash
openssl rand -hex 32
```

## Scripts

```bash
npm run dev          # Express + Vite
npm run build        # Build client/dist
npm start            # Run the single service
npm test             # Server and client tests
npm run lint         # ESLint
npm run format:check # Prettier check
npm run check        # Lint, format, tests, build, and static check
node scripts/verify-static.mjs  # Verify express serves the built SPA
```

## API and Socket.IO

See [`docs/API.md`](docs/API.md). Authentication is cookie-based:

- `accessToken`: httpOnly, path `/`, short-lived.
- `refreshToken`: httpOnly, path `/api/auth`, longer-lived.
- `POST /api/auth/refresh` reissues both cookies and validates the session version.
- Email/password login does not return tokens in JSON.

Socket.IO uses the same access cookie. A socket must be authenticated before it can join a room, and every message must contain AES-GCM ciphertext and an IV; plaintext message payloads are rejected.

## Limitations

- Not end-to-end encrypted.
- Single-process Socket.IO only. A Redis adapter would be required before running multiple API instances.
- No password reset link; reset uses a six-digit email code.
- No MFA.
- No message editing or file attachments.
- Existing rooms without a `roomKey` cannot use the new encrypted message flow until they are recreated or migrated.
- Live deployment and live verification are the operator's responsibility.

## License

MIT. See [`LICENSE`](LICENSE).
