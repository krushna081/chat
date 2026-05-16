# SecureChat - How It Works

## Overview
SecureChat is a production-grade encrypted messaging app. It uses a React frontend with a Node.js backend, featuring end-to-end encryption, self-destructing messages, and real-time chat via Socket.io.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Real-time | Socket.io |
| Encryption | Web Crypto API (AES-256-GCM) |
| Storage | LocalStorage (client) + MongoDB (server) |
| Auth | JWT + OTP (email verification) |

---

## App Flow

### 1. Landing Page
- Shows hero section with features: E2EE, self-destructing messages, real-time
- Navigation to Login / Sign Up

### 2. Authentication
- **Sign Up**: Username, email, password (must meet strength requirements)
- **OTP Verification**: 6-digit code sent to email
- **Login**: Email + password, JWT token stored in localStorage
- Protected routes redirect to login if not authenticated

### 3. Dashboard (Chat List)
- Displays all available chat rooms
- **Create Room**: Name, message expiry (1h/12h/24h), optional password
- **Join Room**: Password-protected rooms prompt for password
- Room cards show: name, participants count, expiry time, private badge
- Encryption keys stored locally per room

### 4. Chat Room
- **Real-time messaging** via Socket.io
- Messages encrypted client-side before sending
- **Received messages** decrypted on arrival using stored room key
- Sent messages aligned right (teal), received messages aligned left (dark gray)
- **Typing indicator**: shows when others are typing
- **Auto-scroll** to latest message
- **Timestamp** with double checkmark for sent messages
- **Sticky bottom input** with auto-resizing textarea

### 5. Settings
- **Theme selection**: Dark, Light, Teal, Blue, Pure Black, White
- Security info (E2EE, self-destruct, local keys, zero-knowledge)
- Privacy info (no media, no third-party integrations)

---

## Key Features

### End-to-End Encryption
1. On room creation/join, server generates a `roomKey`
2. Key stored in browser's localStorage (per room)
3. Before sending a message, client encrypts: `encryptMessage(plaintext, key)` → `{ iv, encryptedData }`
4. Only `encryptedData + iv` sent to server
5. Recipient decrypts using their locally stored key

### Message Expiry
- Server auto-deletes messages after configured time (1h/12h/24h)
- Messages removed from DB, not just marked as expired

### Socket Events
| Event | Direction | Purpose |
|---|---|---|
| `join_room` | Client → Server | Join a chat room |
| `send_message` | Client → Server | Send encrypted message |
| `receive_message` | Server → Client | Broadcast message to room |
| `typing` | Client → Server | Broadcast typing indicator |
| `stop_typing` | Client → Server | Stop typing indicator |
| `user_typing` | Server → Client | Notify user is typing |
| `user_stopped_typing` | Server → Client | Notify user stopped typing |

---

## File Structure (Client)

```
src/
├── App.jsx              # Router, theme setup, toaster
├── main.jsx             # React entry point
├── pages/
│   ├── LandingPage.jsx      # Landing page
│   ├── LoginPage.jsx        # Login form
│   ├── SignupPage.jsx        # Signup form
│   ├── OTPVerificationPage.jsx  # Email OTP
│   ├── DashboardPage.jsx    # Chat room list
│   ├── ChatRoomPage.jsx     # Chat view
│   ├── SettingsPage.jsx     # Settings
│   └── NotFoundPage.jsx
├── context/
│   └── store.js         # Zustand stores (auth, chat, theme)
├── services/
│   └── api.js           # Axios API calls
├── utils/
│   └── encryption.js    # AES-256-GCM encrypt/decrypt
└── styles/
    ├── globals.css           # Theme system, base styles
    ├── ChatRoomPage.css      # Chat bubble styles
    ├── DashboardPage.css     # Chat list styles
    ├── LoginPage.css         # Auth pages shared styles
    ├── LandingPage.css      # Landing page styles
    ├── SettingsPage.css     # Settings styles
    └── OTPVerificationPage.css  # OTP styles
```

---

## Theme System

Six themes: `dark` (default), `light`, `cyber`, `blue`, `black`, `white`

Each theme overrides:
- Background color
- Card/glass backgrounds
- Text colors
- Accent colors (buttons, links)
- Message bubble colors
- Scrollbar colors

Theme stored in localStorage and persisted to backend.

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | Backend API URL | API endpoint |
| `VITE_USE_ENCRYPTION` | `true` | Toggle E2EE |

---

## Build & Run

```bash
# Frontend
cd client
npm install
npm run dev          # Development
npm run build        # Production build

# Backend (separate)
cd server
npm install
npm run dev          # Development
```

Backend runs on port (default: likely 3000/5000), frontend proxies API requests.