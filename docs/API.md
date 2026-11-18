# API reference

Base URL in the single-service deployment: `/api`.

All responses are JSON. Errors use:

```json
{
  "success": false,
  "message": "Human-readable message"
}
```

Authentication uses httpOnly cookies. Successful signup verification, login, and refresh set:

- `accessToken` — httpOnly, path `/`, short-lived.
- `refreshToken` — httpOnly, path `/api/auth`, longer-lived.

Browsers must send cookies (`withCredentials` / same-origin fetch). The API does not return tokens in JSON. Mutating requests from browsers must include an allowed `Origin`; in production, arbitrary origins and missing origins are rejected.

## Health

### `GET /api/health`

Public. Returns `{ success: true, service: "relaychat", status: "ok", timestamp }`.

## Auth

### `POST /api/auth/signup`

```json
{ "username": "krushna_081", "email": "user@example.com", "password": "RelayChat1!" }
```

Requests a verification code for a new account. The response is deliberately generic:

```json
{ "success": true, "message": "If the details are available, a verification code has been sent" }
```

Username: 3–24 characters, letters/numbers/dot/dash/underscore. Password: 8–72 characters with uppercase, lowercase, number, and symbol. Rate limited.

### `POST /api/auth/verify-otp`

```json
{
  "email": "user@example.com",
  "username": "krushna_081",
  "otp": "123456",
  "password": "RelayChat1!"
}
```

On success sets auth cookies and returns:

```json
{ "success": true, "message": "Account created", "user": { "...": "..." } }
```

The password is re-sent because the signup page does not carry it through navigation state. OTPs expire after five minutes and have a limited number of attempts.

### `POST /api/auth/login`

```json
{ "email": "user@example.com", "password": "RelayChat1!" }
```

On success sets auth cookies and returns the user. Failed passwords are rate limited and accounts lock temporarily after repeated failures. The response does not reveal whether an email exists.

### `POST /api/auth/refresh`

Reads the refresh cookie, validates the user's session version, reissues both cookies, and returns the user. Returns `401` when the refresh token is missing, expired, invalid, or revoked.

### `POST /api/auth/logout`

Clears cookies, increments the user's `tokenVersion` (invalidating existing sessions), and disconnects that user's live Socket.IO connections. Always returns success when the request is well-formed.

### `POST /api/auth/resend-otp`

```json
{ "email": "user@example.com" }
```

Generic response. Sends a new code when there is no verified account for the email; accounts that are already verified receive no code. Rate limited.

### `POST /api/auth/forgot-password-request`

```json
{ "email": "user@example.com" }
```

Generic response that does not reveal whether an account exists. Rate limited. Creates a password-reset OTP when the account exists.

### `POST /api/auth/verify-reset-otp`

```json
{ "email": "user@example.com", "otp": "123456", "newPassword": "NewRelayChat1!" }
```

Validates the reset code and password policy, updates the password, increments `tokenVersion`, clears cookies, and disconnects live sockets. All existing sessions are invalidated.

## Chat rooms

All chat routes require authentication.

### `POST /api/chat/create-room`

```json
{
  "roomName": "Project room",
  "messageExpiry": "24h",
  "password": "optional-room-password",
  "roomPicture": "https://example.com/room.png"
}
```

`messageExpiry` is one of `1h`, `24h`, `3d`, `1w`, or `permanent`. A non-empty password makes the room private; it must be 8–72 characters. `roomPicture` must be an HTTPS URL or a supported raster data URL under 512 KB.

On success returns the safe room summary **plus the room encryption key** for the creator:

```json
{
  "success": true,
  "chatRoom": {
    "_id": "...",
    "roomId": "0123456789abcdef",
    "roomName": "Project room",
    "isPrivate": true,
    "participantCount": 1,
    "messageExpiry": "24h",
    "roomKey": "<64 hex characters>"
  }
}
```

### `POST /api/chat/join-room`

```json
{ "roomId": "0123456789abcdef", "password": "optional-room-password" }
```

A new member of a private room must supply the password. Existing members can rejoin without re-entering it. Public rooms do not require a password. Returns the safe room summary plus `roomKey`.

### `GET /api/chat/rooms`

Returns public rooms and private rooms the caller belongs to. The response never contains room passwords or encryption keys in the list. Each item includes `isMember` and `participantCount`; it does not expose the participant list.

### `GET /api/chat/messages/:roomId?page=1`

Requires membership in the room. Returns up to 50 newest messages per page in chronological order:

```json
{
  "success": true,
  "messages": [
    {
      "_id": "...",
      "roomId": "0123456789abcdef",
      "senderId": "...",
      "senderName": "krushna_081",
      "senderAvatar": null,
      "encryptedMessage": "<hex ciphertext>",
      "iv": "<24 hex characters>",
      "deliveryStatus": "delivered",
      "createdAt": "...",
      "expiresAt": "..."
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 1, "pages": 1 }
}
```

Plaintext is never returned by the API.

### `POST /api/chat/leave/:roomId`

Removes the caller from the room and removes the caller's sockets from the Socket.IO room. The caller must already be a member.

## User

### `GET /api/user/profile`

Returns the authenticated user without password or session internals.

### `PUT /api/user/profile`

Allowed fields: `username`, `avatar`, `theme`. `theme` is `dark` or `light`. `avatar` accepts `null`, an HTTPS URL, or a supported raster data URL under 512 KB. Email, password, and privilege fields cannot be changed here.

### `POST /api/user/mute-notifications`

```json
{ "roomId": "0123456789abcdef" }
```

Adds the room to the user's muted list. The caller must be a member.

### `POST /api/user/unmute-notifications`

Same input; removes the room from the muted list.

## Socket.IO

Connect with `withCredentials: true` to the same origin. The server authenticates the socket from the access cookie, then validates the user's session version. Tokens are not accepted in the Socket.IO handshake payload.

### Client to server

| Event          | Payload                            |
| -------------- | ---------------------------------- |
| `join_room`    | `roomId` string                    |
| `leave_room`   | `roomId` string                    |
| `send_message` | `{ roomId, encryptedMessage, iv }` |
| `typing`       | `roomId` string                    |
| `stop_typing`  | `roomId` string                    |
| `message_read` | `{ messageId }`                    |

`send_message` rejects plaintext and malformed ciphertext. The server verifies membership again before storing the message. Messages are limited to 20 per 10 seconds per socket.

### Server to client

| Event                 | Payload                                                       |
| --------------------- | ------------------------------------------------------------- |
| `room_joined`         | `{ roomId }`                                                  |
| `user_joined`         | `{ userId, username, message }`                               |
| `receive_message`     | encrypted message fields plus `senderName` and `senderAvatar` |
| `app_error`           | `{ message }`                                                 |
| `user_typing`         | `{ userId }`                                                  |
| `user_stopped_typing` | `{ userId }`                                                  |
| `message_read`        | `{ messageId, userId }`                                       |
| `connect_error`       | Authentication or connection failure                          |

The client decrypts `encryptedMessage` with the room key it obtained from the join/create response. If decryption fails, it displays an unavailable-message placeholder rather than ciphertext.
