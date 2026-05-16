# API Documentation - SecureChat

Complete REST API reference for SecureChat backend.

## Base URL

Development: ``
Production: ``

## Authentication

All protected routes require:
- Authorization header: `Bearer <accessToken>`
- Or cookie: `accessToken=<token>`

## Response Format

All responses follow standard JSON format:

```json
{
  "success": true/false,
  "message": "Status message",
  "data": {
    // Response data
  },
  "error": "Error details (if failed)"
}
```

---

# Auth Endpoints

## POST /auth/signup

Register a new user account.

**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!@"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to email",
  "tempData": {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "hashed"
  }
}
```

**Errors:**
- `400` - Invalid input or user already exists
- `500` - Server error

---

## POST /auth/verify-otp

Verify email OTP and create account.

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "username": "johndoe",
  "password": "SecurePass123!@"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "isEmailVerified": true,
    "theme": "dark"
  }
}
```

**Cookies Set:**
- `accessToken` (15m expiry)
- `refreshToken` (7d expiry)

**Errors:**
- `400` - Invalid OTP or max attempts exceeded
- `404` - OTP not found or expired

---

## POST /auth/login

Login user account.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!@"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "isOnline": true,
    "lastSeen": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `400` - Invalid credentials
- `400` - Email not verified

---

## POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```
Cookie: refreshToken=<token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed"
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

## POST /auth/logout

Logout user.

**Request:**
```
GET /auth/logout
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## POST /auth/resend-otp

Resend OTP to email.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP resent"
}
```

---

# Chat Endpoints

All chat endpoints require authentication.

## POST /chat/create-room

Create a new chat room.

**Request:**
```json
{
  "roomName": "Tech Discussion",
  "messageExpiry": "24h",
  "password": "optional_password"
}
```

**Parameters:**
- `roomName` (string, required): Name of chat room
- `messageExpiry` (string): "1h", "12h", or "24h"
- `password` (string, optional): For password-protected rooms

**Response (201):**
```json
{
  "success": true,
  "message": "Chat room created",
  "chatRoom": {
    "_id": "507f1f77bcf86cd799439011",
    "roomId": "a1b2c3d4e5f6g7h8",
    "roomName": "Tech Discussion",
    "participants": ["507f1f77bcf86cd799439011"],
    "creator": "507f1f77bcf86cd799439011",
    "messageExpiry": "24h",
    "isPrivate": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## POST /chat/join-room

Join an existing chat room.

**Request:**
```json
{
  "roomId": "a1b2c3d4e5f6g7h8",
  "password": "room_password"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Joined room",
  "chatRoom": {
    "_id": "507f1f77bcf86cd799439011",
    "roomId": "a1b2c3d4e5f6g7h8",
    "roomName": "Tech Discussion",
    "participants": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "messageExpiry": "24h"
  }
}
```

**Errors:**
- `404` - Room not found
- `403` - Invalid password

---

## GET /chat/rooms

Get all chat rooms for authenticated user.

**Query Parameters:**
- None

**Response (200):**
```json
{
  "success": true,
  "chatRooms": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "roomId": "a1b2c3d4e5f6g7h8",
      "roomName": "Tech Discussion",
      "participants": ["507f1f77bcf86cd799439011"],
      "creator": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "johndoe"
      },
      "messageExpiry": "24h",
      "lastActivity": "2024-01-15T14:20:00Z"
    }
  ]
}
```

---

## GET /chat/messages/:roomId

Get messages from a chat room (paginated).

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 50): Messages per page

**Response (200):**
```json
{
  "success": true,
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "roomId": "a1b2c3d4e5f6g7h8",
      "senderId": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "johndoe"
      },
      "encryptedMessage": "e3b0c44298fc1c14...",
      "iv": "a1b2c3d4e5f6g7h8i9j0k1l2",
      "deliveryStatus": "delivered",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 150,
    "pages": 3
  }
}
```

---

## POST /chat/leave/:roomId

Leave a chat room.

**Request:**
```
POST /chat/leave/a1b2c3d4e5f6g7h8
```

**Response (200):**
```json
{
  "success": true,
  "message": "Left room"
}
```

---

# User Endpoints

All user endpoints require authentication.

## GET /user/profile

Get authenticated user's profile.

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "isEmailVerified": true,
    "avatar": null,
    "lastSeen": "2024-01-15T14:20:00Z",
    "isOnline": true,
    "theme": "cyber",
    "notificationMuted": [],
    "createdAt": "2024-01-10T08:00:00Z"
  }
}
```

---

## PUT /user/profile

Update user profile.

**Request:**
```json
{
  "username": "newusername",
  "theme": "cyber"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "newusername",
    "theme": "cyber"
  }
}
```

---

## POST /user/mute-notifications

Mute notifications for a room.

**Request:**
```json
{
  "roomId": "a1b2c3d4e5f6g7h8"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "notificationMuted": ["a1b2c3d4e5f6g7h8"]
  }
}
```

---

## POST /user/unmute-notifications

Unmute notifications for a room.

**Request:**
```json
{
  "roomId": "a1b2c3d4e5f6g7h8"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "notificationMuted": []
  }
}
```

---

# Socket.io Events

Real-time communication using Socket.io.

## Client → Server

### join_room
User joins a chat room.
```javascript
socket.emit('join_room', 'a1b2c3d4e5f6g7h8');
```

### send_message
Send encrypted message.
```javascript
socket.emit('send_message', {
  roomId: 'a1b2c3d4e5f6g7h8',
  encryptedMessage: 'e3b0c44298fc1c14...',
  iv: 'a1b2c3d4e5f6g7h8i9j0k1l2'
});
```

### typing
User is typing.
```javascript
socket.emit('typing', 'a1b2c3d4e5f6g7h8');
```

### stop_typing
User stopped typing.
```javascript
socket.emit('stop_typing', 'a1b2c3d4e5f6g7h8');
```

### message_read
Mark message as read.
```javascript
socket.emit('message_read', {
  messageId: '507f1f77bcf86cd799439011'
});
```

## Server → Client

### receive_message
New message received.
```javascript
socket.on('receive_message', (message) => {
  // {
  //   _id: "507f1f77bcf86cd799439011",
  //   roomId: "a1b2c3d4e5f6g7h8",
  //   senderId: "507f1f77bcf86cd799439011",
  //   encryptedMessage: "e3b0c44298fc1c14...",
  //   iv: "a1b2c3d4e5f6g7h8i9j0k1l2",
  //   deliveryStatus: "delivered",
  //   createdAt: "2024-01-15T10:30:00Z"
  // }
});
```

### user_joined
User joined room.
```javascript
socket.on('user_joined', (data) => {
  // { userId: "507f1f77bcf86cd799439011", message: "..." }
});
```

### user_typing
User is typing in room.
```javascript
socket.on('user_typing', (data) => {
  // { userId: "507f1f77bcf86cd799439011" }
});
```

### user_stopped_typing
User stopped typing.
```javascript
socket.on('user_stopped_typing', (data) => {
  // { userId: "507f1f77bcf86cd799439011" }
});
```

---

# Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal error |

---

# Rate Limiting

- Auth endpoints: 100 requests per 15 minutes per IP
- Chat endpoints: 100 requests per 15 minutes per user
- Socket.io: Unlimited (abuse detected server-side)

---

# Pagination

Messages use cursor-based pagination:
- Page 1: First 50 messages
- Page 2: Next 50 messages
- etc.

---

# Best Practices

1. **Error Handling**: Check `success` field in response
2. **Token Refresh**: Auto-refresh on 401 response
3. **Socket Connection**: Maintain persistent connection
4. **Message Encryption**: Encrypt before sending
5. **Rate Limiting**: Implement backoff strategy

---

**Last Updated:** January 15, 2024
