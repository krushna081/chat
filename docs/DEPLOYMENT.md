# Deployment guide

RelayChat is one Node service:

- Express serves `client/dist`.
- Express serves `/api`.
- Socket.IO runs on `/socket.io`.
- MongoDB is the only external service.

Do not split the client and backend across Vercel/serverless functions for this design. The Socket.IO server must be a long-running process.

## Build and start commands

```bash
# Build
npm ci
npm ci --prefix server
npm ci --prefix client
npm run build

# Start
npm start
```

The service listens on `PORT` (default `5000`). Health check: `GET /api/health`.

## Required production variables

```dotenv
NODE_ENV=production
PORT=5000
TRUST_PROXY=1
MONGODB_URI=<secret Atlas connection string>
JWT_SECRET=<32+ random characters>
JWT_REFRESH_SECRET=<different 32+ random characters>
CLIENT_URL=https://your-public-origin.example
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
SERVE_CLIENT=true
RESEND_API_KEY=<secret>
EMAIL_FROM=RelayChat <noreply@your-verified-domain.example>
```

Optional:

```dotenv
ALLOWED_ORIGINS=
COOKIE_DOMAIN=
CLIENT_DIST=client/dist
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
MAX_LOGIN_ATTEMPTS=5
LOGIN_LOCK_MINUTES=15
```

`CLIENT_URL` must be the public origin that the browser uses. Since the client and API share an origin, it should match the deployed service URL (or custom domain).

## Render

1. Create a new Web Service from the repository.
2. Set the build command to:

   ```bash
   npm ci && npm ci --prefix server && npm ci --prefix client && npm run build
   ```

3. Set the start command to:

   ```bash
   npm start
   ```

4. Add the environment variables above. Use Render's secret environment variables for MongoDB and JWT values.
5. Set the health check path to `/api/health`.
6. Use a plan that supports long-running WebSocket connections. Free instances may sleep and interrupt connections.

## Railway

1. Create a project from the repository.
2. Railway can use the included `Dockerfile` or the same install/build/start commands.
3. Add the environment variables and expose the service port.
4. Set `PORT` to the port Railway provides if it requires one.
5. Configure the public domain and set `CLIENT_URL` to that exact HTTPS origin.

## Fly.io

1. Install `flyctl` and launch an app.
2. Use the included `Dockerfile`.
3. Set secrets with `fly secrets set KEY=value`.
4. Set `CLIENT_URL` to the public Fly hostname.
5. Ensure the internal port matches `PORT` and that the app listens on `0.0.0.0`.

## VPS / Docker

```bash
docker build -t relaychat .
docker run -d \
  --name relaychat \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file .env \
  relaychat
```

Put a reverse proxy such as Caddy or Nginx in front:

- proxy `/` and `/api` to `127.0.0.1:5000`;
- forward WebSocket upgrades for `/socket.io`;
- terminate TLS;
- set `TRUST_PROXY=1` and `COOKIE_SECURE=true`.

Example Nginx location block:

```nginx
location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## Single-instance constraint

Socket.IO rooms are held in process memory. Do not run multiple RelayChat instances behind a load balancer without adding a Socket.IO Redis adapter and shared session logic. For one server, the current design is complete.

## First-run checklist

- [ ] MongoDB Atlas user has only the needed database permissions.
- [ ] `MONGODB_URI` is stored as a secret, not in Git.
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are different and not reused.
- [ ] `CLIENT_URL` exactly matches the browser origin.
- [ ] `COOKIE_SECURE=true` and HTTPS are active.
- [ ] `TRUST_PROXY=1` behind a proxy.
- [ ] Resend sender domain is verified.
- [ ] `/api/health` returns 200.
- [ ] Signup, OTP verification, login, room creation, private-room join, message send, and logout work in a real browser.
- [ ] Refresh and multiple tabs work.
- [ ] Socket reconnect works after a temporary network interruption.
- [ ] Logout invalidates the session and disconnects live sockets.

Live verification is the operator's responsibility. No live URL is claimed by this repository.
