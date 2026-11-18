# Security notes

## Current model

RelayChat provides:

- password-based accounts with email verification codes;
- room-level authorization for REST and Socket.IO;
- optional room passwords;
- AES-256-GCM encryption of message contents before storage;
- httpOnly session cookies;
- session revocation through a `tokenVersion` field;
- rate limits, input validation, CORS allowlisting, origin checks, and security headers.

It does **not** provide end-to-end encryption. The server distributes room keys, stores them, and can decrypt stored messages. This limitation is deliberate for Phase 1 and is stated in the UI and API documentation. True E2EE requires a separate design and review.

## Assets and trust boundaries

| Asset            | Where it lives                 | Protection                                            |
| ---------------- | ------------------------------ | ----------------------------------------------------- |
| Account password | Hash in MongoDB                | bcrypt, 12 rounds; never returned or logged           |
| Access session   | httpOnly cookie                | 15 min default, signed HS256, session version checked |
| Refresh session  | httpOnly cookie, `/api/auth`   | 7 day default, reissued on refresh, session version   |
| Room password    | Hash in MongoDB                | bcrypt, 12 rounds; never returned                     |
| Room key         | MongoDB and authorized clients | Returned only by create/join to room members          |
| Message contents | AES-GCM ciphertext in MongoDB  | Decrypted in the browser; server can decrypt          |
| OTP              | bcrypt hash in MongoDB         | Five-minute expiry, five attempts, rate limited       |

The server is trusted. Anyone with server access, database access, or the JWT secrets can access room keys and message contents.

## Implemented protections

- Signup does not return the submitted password or an existing user record.
- Verification and reset OTPs are hashed; OTP values are not written to production logs.
- Reset and verification codes expire and have limited attempts.
- Login uses a dummy bcrypt comparison for unknown emails and generic errors to reduce account enumeration.
- Failed logins lock the account temporarily.
- Access and refresh tokens are separated by secret and token type.
- Every authenticated request checks the user's current `tokenVersion`.
- Logout and password reset increment `tokenVersion` and disconnect live sockets.
- The API never serializes password hashes, room password hashes, or room keys in listings.
- Room join and message reads require membership.
- Socket room joins and message sends re-check membership server-side.
- Plaintext socket messages are rejected; ciphertext and IV must be valid hexadecimal.
- CORS is allowlisted, credentials are enabled, and mutating requests require a trusted origin in production.
- Helmet sets CSP and related headers. The CSP reflects the Google Fonts stylesheet used by the client.
- Static uploads are limited to raster image data URLs/HTTPS URLs; SVG data URLs are rejected.
- Message payloads, room names, room IDs, avatars, and passwords are length/format validated.

## Known limitations and residual risks

1. **Not E2EE.** The server holds room keys.
2. **Single process.** Socket.IO rooms are in memory. Multiple instances require a Redis adapter and a shared revocation strategy.
3. **No MFA.** A compromised password plus email access can compromise an account.
4. **XSS impact.** Any successful XSS in the client could read decrypted messages and in-memory keys. CSP and React escaping reduce, but do not eliminate, this risk.
5. **Email dependency.** Production signup and reset depend on Resend. Email delivery failures are logged server-side and return generic responses, so account existence is not exposed.
6. **Legacy data.** Old rooms without a `roomKey` cannot use the new encrypted flow. Old plaintext message fields remain `select: false` and are never served, but they may still exist in the database. A migration should delete or re-encrypt them.
7. **No Redis rate-limit store.** Limits are per process. That is acceptable for the current single-service design.
8. **No message audit log.** Read receipts are best-effort and not a security control.
9. **Room key lifecycle.** Keys are not rotated after member removal. A removed member who retained the key could decrypt previously obtained ciphertext. Removing a member from the participant list stops new API/socket access but does not retroactively revoke knowledge of the key. Phase 2 should address key rotation if this threat matters.
10. **No E2EE key verification.** There is no safety-number or device-verification flow.
11. **Refresh tokens are not single-use.** A copied refresh token remains valid until it expires or the session version is revoked by logout or password reset. Phase 2 can add refresh-token rotation with replay detection.
12. **Socket session lifetime.** Socket.IO authenticates at handshake. Logout and password reset disconnect the user's live sockets, but access-token expiry is not rechecked on every socket event. A socket that stays connected can outlive the access-token TTL until it reconnects.

## Secret handling

- Keep `.env` out of Git and out of logs.
- Use different `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- Rotate both secrets if exposed. Rotating them invalidates existing sessions.
- Rotate the MongoDB user password and Resend key if exposed.
- Do not print connection strings in shell history or issue trackers.

## Reporting

See [`../SECURITY.md`](../SECURITY.md). Use GitHub private vulnerability reporting; do not post secrets or personal data in a public issue.
