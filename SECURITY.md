# Security policy

## Supported version

The current `main` branch is the supported version.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Use GitHub's
private vulnerability reporting / security advisory feature for this repository.
Include:

- a short description of the impact;
- steps to reproduce;
- the affected endpoint or component;
- whether the issue is reproducible against `main`.

Do not include real passwords, tokens, MongoDB connection strings, API keys, or
other people's personal data. Use test accounts and redacted values.

## Security model

RelayChat currently uses **server-managed encryption**:

- Messages are encrypted with AES-256-GCM in the browser before storage.
- The server distributes room keys to authorized room members.
- The server stores room keys and can decrypt stored messages.
- This is **not end-to-end encryption**. Do not describe or use RelayChat as an
  E2EE product until a separate E2EE design has been implemented and reviewed.
- Password-protected rooms are an access-control feature; they are not a
  substitute for E2EE.

## Operational recommendations

- Rotate `JWT_SECRET` and `JWT_REFRESH_SECRET` if they were ever exposed.
- Keep `.env` out of source control and out of logs.
- Use HTTPS in production. Set `COOKIE_SECURE=true`.
- Use a dedicated MongoDB Atlas database user with the minimum required role.
- Keep dependencies updated and review CI audit results.
- Restrict `CLIENT_URL` and `ALLOWED_ORIGINS` to the real public origin.
