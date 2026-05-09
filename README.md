# SecureChat - Secure E2EE Chat Application

A production-grade secure encrypted chat web application with end-to-end encryption, self-destructing messages, and modern cybersecurity-focused design.

## 🚀 Features

### 🔐 Security
- **End-to-End Encryption (E2EE)**: AES-256-GCM client-side encryption
- **Self-Destructing Messages**: Auto-delete after configurable time (1h, 12h, 24h)
- **Secure Authentication**: JWT + OTP email verification
- **Password Security**: 8+ chars, uppercase, lowercase, numbers, symbols
- **Helmet.js**: Secure HTTP headers
- **Rate Limiting**: Prevents brute-force attacks
- **CORS Protection**: Strict origin policy
- **Input Sanitization**: XSS & Mongo injection prevention

### 💬 Messaging
- **Real-Time Chat**: Socket.io instant messaging
- **Typing Indicators**: See when users are typing
- **Delivery Status**: sent → delivered → read
- **Online/Offline Status**: Real-time presence detection
- **Message Pagination**: Efficient loading for large chat histories

### 🎨 UI/UX
- **Glassmorphism Design**: Modern frosted glass effect
- **Cyber Neon Theme**: Glowing animations and effects
- **Multiple Themes**: Dark, Light, and Cyber modes
- **Responsive Design**: Mobile-first approach
- **Smooth Animations**: Framer Motion transitions
- **Dark Mode**: OLED-optimized dark theme

### 👥 User Management
- **User Registration**: Email-based signup with OTP
- **Google OAuth**: One-click authentication
- **Profile Management**: Customize username and theme
- **Session Persistence**: Auto-login on refresh

## 📋 Requirements

### Frontend
- Node.js 16+
- React.js 18
- Vite
- Tailwind CSS

### Backend
- Node.js 16+
- Express.js
- MongoDB
- Socket.io

## ⚙️ Installation

### Backend Setup

```bash
cd server
npm install

# Create .env file
cp .env.example .env

# Update .env with your configuration
```

**Environment Variables:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/securechat
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_refresh_token_secret
RESEND_API_KEY=re_your_resend_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Start Backend:**
```bash
npm run dev
```

### Frontend Setup

```bash
cd client
npm install

# Create .env file
cp .env.example .env

# Update .env
```

**Environment Variables:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**Start Frontend:**
```bash
npm run dev
```

## 🔐 Security Implementation

### End-to-End Encryption (E2EE)

Messages are encrypted on the client using Web Crypto API before transmission:

```javascript
// Generate 256-bit AES key
const key = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);

// Encrypt message
const iv = crypto.getRandomValues(new Uint8Array(12));
const encryptedBuffer = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  messageBuffer
);

// Send encrypted data + IV to server
```

**Key Points:**
- Encryption happens client-side before transmission
- Server never sees plaintext messages
- Each message has unique IV (Initialization Vector)
- Key is stored in browser localStorage (local encryption)
- In production: use Keychain/SecureStorage

### Password Security

Passwords must meet strict requirements:
- ✓ Minimum 8 characters
- ✓ At least one uppercase letter
- ✓ At least one lowercase letter
- ✓ At least one number
- ✓ At least one special character (@$!%*?&)

Hashed using bcryptjs with 12 salt rounds:
```javascript
const hashedPassword = await bcryptjs.hash(password, 12);
```

### OTP Email Verification

During signup:
1. Generate 6-digit OTP
2. Hash OTP before storage
3. Send via Resend API
4. OTP expires after 5 minutes
5. Maximum 5 verification attempts
6. Auto-delete after expiration (MongoDB TTL)

### JWT Token Management

```javascript
// Access Token: 15 minutes validity
const accessToken = jwt.sign(
  { id: userId },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

// Refresh Token: 7 days validity
const refreshToken = jwt.sign(
  { id: userId },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' }
);

// Stored as HttpOnly cookies
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/verify-otp` - Verify email OTP
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/resend-otp` - Resend OTP

### Chat
- `POST /api/chat/create-room` - Create chat room
- `POST /api/chat/join-room` - Join room with password
- `GET /api/chat/rooms` - Get user's chat rooms
- `GET /api/chat/messages/:roomId` - Get room messages (paginated)
- `POST /api/chat/leave/:roomId` - Leave room

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `POST /api/user/mute-notifications` - Mute room notifications
- `POST /api/user/unmute-notifications` - Unmute notifications

## 🔌 Socket.io Events

### Emitted by Client
- `join_room` - Join chat room
- `send_message` - Send encrypted message
- `typing` - User is typing
- `stop_typing` - User stopped typing
- `message_read` - Mark message as read

### Received from Server
- `receive_message` - New message arrived
- `user_joined` - User joined room
- `user_typing` - User is typing
- `user_stopped_typing` - User stopped typing
- `online_status` - User online/offline status

## 📊 MongoDB Models

### User Schema
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  isEmailVerified: Boolean,
  googleId: String,
  avatar: String,
  lastSeen: Date,
  isOnline: Boolean,
  theme: String (dark|light|cyber),
  notificationMuted: [RoomID],
  createdAt: Date
}
```

### ChatRoom Schema
```javascript
{
  roomId: String (unique),
  roomName: String,
  isPrivate: Boolean,
  password: String (optional),
  participants: [UserID],
  creator: UserID,
  messageExpiry: String (1h|12h|24h),
  createdAt: Date,
  lastActivity: Date
}
```

### Message Schema
```javascript
{
  roomId: String,
  senderId: UserID,
  encryptedMessage: String,
  iv: String,
  deliveryStatus: String (sent|delivered|read),
  expiresAt: Date (TTL index for auto-deletion),
  createdAt: Date
}
```

### OTP Schema
```javascript
{
  email: String,
  hashedOtp: String,
  expiresAt: Date (TTL index for auto-deletion),
  attempts: Number,
  maxAttempts: Number,
  verified: Boolean
}
```

## 🎨 Theme System

Three available themes with instant switching:

### Dark Theme
```css
Background: #1a1a2e
Text: #ffffff
Accent: #00ff88
```

### Light Theme
```css
Background: #ffffff
Text: #1a1a2e
Accent: #00d4ff
```

### Cyber Neon
```css
Background: Gradient (#1a1a2e → #16213e)
Text: #00ff88
Accent: Glowing neon effects
```

## 🛡️ Security Best Practices Implemented

### Backend
- ✓ Helmet.js for secure headers
- ✓ Rate limiting on auth endpoints
- ✓ Input validation with express-validator
- ✓ CORS with strict origin policy
- ✓ HttpOnly secure cookies
- ✓ Bcryptjs password hashing (12 rounds)
- ✓ JWT token rotation
- ✓ Error message sanitization
- ✓ Mongo injection prevention
- ✓ XSS protection via Content-Security-Policy

### Frontend
- ✓ Client-side E2EE encryption
- ✓ Password strength validation
- ✓ Secure token storage in cookies
- ✓ Input sanitization before sending
- ✓ CSRF protection via SameSite cookies
- ✓ Secure random IV generation
- ✓ No sensitive data in localStorage (except encryption key)

## 📱 Supported Features

### ✅ Allowed
- Text messages with emoji
- Real-time messaging
- Typing indicators
- Online/offline status
- Message expiration
- Password-protected rooms
- Email OTP verification
- Google OAuth login

### ❌ Not Supported
- File uploads
- Image sharing
- Video calls
- Audio messages
- Media attachments
- Screen sharing
- Extensions/plugins

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd client
npm run build
# Deploy to Vercel
```

### Backend (Railway/Render)
```bash
cd server
npm run build
# Deploy with environment variables
```

### Database (MongoDB Atlas)
- Create free cluster
- Add connection string to `.env`
- Enable auto-backup

## 📦 Project Structure

```
secure-chat-app/
├── client/                  # React.js frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── context/         # Zustand stores
│   │   ├── utils/           # Utility functions
│   │   ├── services/        # API services
│   │   ├── styles/          # CSS files
│   │   └── animations/      # Animation definitions
│   ├── vite.config.js       # Vite config
│   ├── tailwind.config.js   # Tailwind config
│   └── package.json
│
├── server/                  # Node.js backend
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Express middleware
│   ├── sockets/             # Socket.io handlers
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   ├── config/              # Configuration
│   ├── server.js            # Entry point
│   └── package.json
│
├── shared/                  # Shared types/constants
├── docs/                    # Documentation
└── README.md
```

## 🔧 Development

### Frontend Development
```bash
cd client
npm run dev         # Start dev server with HMR
npm run build       # Build for production
npm run preview     # Preview production build
```

### Backend Development
```bash
cd server
npm run dev         # Start with nodemon
npm start           # Start production
```

## 🧪 Testing

### Run backend in development
```bash
cd server
npm run dev
```

### Run frontend in development
```bash
cd client
npm run dev
```

### Test Encryption
1. Send a message
2. Check browser DevTools → Storage → Local Storage
3. Encryption key is stored as hex string
4. Messages in DB show encrypted data + IV

## 📝 Environment Setup

### MongoDB Setup
```bash
# Local MongoDB
mongod

# Or MongoDB Atlas
# 1. Create cluster
# 2. Get connection string
# 3. Add to .env
```

### Resend API
```bash
# 1. Sign up at https://resend.com
# 2. Get API key
# 3. Add to RESEND_API_KEY in .env
```

### Google OAuth
```bash
# 1. Go to Google Cloud Console
# 2. Create OAuth app
# 3. Get credentials
# 4. Add to GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
```

## 🎯 Performance Optimization

- ✓ React.lazy for code splitting
- ✓ Memoization with React.memo
- ✓ Socket.io connection pooling
- ✓ Message pagination (50 per page)
- ✓ Lazy loading of chat rooms
- ✓ Debounced typing events
- ✓ Optimized re-renders

## 🐛 Known Issues & Limitations

- Encryption keys are stored in localStorage (local only)
- In production, use OS keychain or secure enclave
- Maximum message size: 10KB (Helmet limit)
- Single device per user (no multi-device sync)

## 📄 License

MIT License - See LICENSE file

## 🤝 Contributing

Contributions welcome! Please follow security best practices.

## 📞 Support

For issues or questions, please create an issue on GitHub.

---

**Built with ❤️ for privacy and security**

Made with React.js, Node.js, and Web Crypto API | 🔐 Secure by Design
#   c h a t  
 