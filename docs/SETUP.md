# Setup guide

## 1. Requirements

- Node.js 20.19+ (Node 24 recommended)
- npm
- A MongoDB database (MongoDB Atlas or local MongoDB)
- A Resend account for production email delivery

## 2. Install dependencies

From the repository root:

```bash
npm ci
npm ci --prefix server
npm ci --prefix client
```

If lockfiles are missing in a fresh checkout, use `npm install` in each package once, then commit the generated lockfiles.

## 3. Create the environment file

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/relaychat
JWT_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<different openssl rand -hex 32>
CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
SERVE_CLIENT=true
```

Never commit `.env`. The server checks for `.env` in the working directory and then at the repository root.

## 4. MongoDB Atlas

1. Create a free Atlas cluster.
2. Create a database user with read/write access to the RelayChat database only.
3. Add your current IP address to the network access list. For a deployed service, add the provider's egress addresses or use an appropriately restricted network rule.
4. Copy the connection string and set `MONGODB_URI`. URL-encode special characters in the password.
5. The app creates indexes on startup when Mongoose writes the models. Ensure the database user can create indexes.

If SRV DNS is blocked on your network, set `MONGODB_DNS_SERVERS` to reachable DNS servers (comma-separated).

## 5. Email with Resend

1. Create a Resend API key.
2. Verify the sending domain in Resend.
3. Set `RESEND_API_KEY` and `EMAIL_FROM`.

Without a key in development, the OTP is printed to the server console. Production requires a key and a verified sender. If email delivery is misconfigured, signup and resend still return a generic response to avoid account enumeration; check the server logs for the underlying email error. Password reset requests are also deliberately generic.

## 6. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` and `/socket.io` to `http://localhost:5000`.

Useful checks:

```bash
npm test
npm run lint
npm run build
node scripts/verify-static.mjs
```

## 7. Run the production build locally

```bash
npm run build
NODE_ENV=production \
CLIENT_URL=http://localhost:5000 \
COOKIE_SECURE=false \
TRUST_PROXY=false \
MONGODB_URI=... \
JWT_SECRET=... \
JWT_REFRESH_SECRET=... \
npm start
```

Open `http://localhost:5000`. The React build, `/api`, and `/socket.io` are served by the same process.

## 8. Troubleshooting

### Cookies are not persisted

- Same-origin `lax` cookies require the browser to talk to the same host and scheme as the server.
- In production set `COOKIE_SECURE=true` and serve over HTTPS.
- If using a reverse proxy, set `TRUST_PROXY=1` so Express sees the original protocol.
- Do not put the frontend on a different site from the backend unless you deliberately configure cross-site cookies and CORS. The recommended design is a single origin.

### Socket.IO connects but messages do not arrive

- Confirm the reverse proxy forwards WebSocket upgrade requests for `/socket.io`.
- Confirm `CLIENT_URL` matches the browser origin exactly.
- Check the server logs for `Authentication required`.

### MongoDB connection fails

- Verify the Atlas IP access list and database user permissions.
- URL-encode the password in the connection string.
- Check whether your network blocks DNS SRV lookups; set `MONGODB_DNS_SERVERS` if needed.

### Emails do not arrive

- Check that the Resend API key is active and the sender domain is verified.
- In development, omit `RESEND_API_KEY` and read the OTP from the server console.
- Check spam and Resend delivery logs.
