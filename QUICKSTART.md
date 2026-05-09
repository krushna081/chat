# Quick Start Guide - SecureChat

Get up and running in minutes!

## 🚀 5-Minute Setup

### Prerequisites
- Node.js 16+ 
- MongoDB (local or Atlas)
- npm

### 1. Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd secure-chat-app

# Backend setup
cd server
npm install
cp .env.example .env

# Frontend setup (new terminal)
cd client
npm install
cp .env.example .env
```

### 2. Configure Environment

**Backend (.env):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/securechat
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=another-super-secret-key
RESEND_API_KEY=re_test_key_optional
GOOGLE_CLIENT_ID=optional
GOOGLE_CLIENT_SECRET=optional
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=optional
```

### 3. Start MongoDB

```bash
# If installed locally
mongod

# Or use MongoDB Atlas (update MONGODB_URI in .env)
```

### 4. Start Servers

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
# Opens http://localhost:5173
```

## 🧪 Test It Out

1. **Create Account**
   - Go to http://localhost:5173
   - Click "Sign Up"
   - Enter: username, email, password
   - Password example: `SecurePass123!@`
   - Check console for OTP (development mode)
   - Enter OTP code

2. **Create Chat Room**
   - Click "Create New Room"
   - Enter room name: "Test Room"
   - Keep defaults (24h expiry)
   - Click "Create Room"

3. **Send Message**
   - Click on room
   - Type message
   - Messages are E2E encrypted!

4. **Verify Encryption**
   - DevTools → Local Storage → `encryptionKey`
   - Check your message is encrypted in DB
   - Paste encrypted data → original message unreadable

## 📁 Project Structure

```
secure-chat-app/
├── server/                    # Backend
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API routes
│   ├── controllers/          # Business logic
│   ├── sockets/              # Socket.io handlers
│   ├── middleware/           # Auth middleware
│   ├── utils/                # Encryption, email
│   └── server.js             # Entry point
│
├── client/                    # Frontend
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── components/       # Reusable components
│   │   ├── hooks/            # Custom hooks
│   │   ├── context/          # Zustand stores
│   │   ├── services/         # API client
│   │   ├── utils/            # Encryption, helpers
│   │   ├── styles/           # CSS
│   │   └── App.jsx           # Root component
│   ├── vite.config.js        # Vite config
│   └── tailwind.config.js    # Tailwind
│
├── docs/                      # Documentation
│   ├── SETUP.md              # Detailed setup
│   ├── API.md                # API reference
│   ├── SECURITY.md           # Security guide
│   └── DEPLOYMENT.md         # Deploy guide
│
└── README.md
```

## 🔑 Key Features

✅ **Security**
- End-to-End Encryption (AES-256-GCM)
- Email OTP Verification
- JWT Authentication
- Strong Password Requirements

✅ **Messaging**
- Real-Time Chat (Socket.io)
- Self-Destructing Messages (1h/12h/24h)
- Typing Indicators
- Online/Offline Status

✅ **UI/UX**
- Modern Glassmorphism Design
- Dark/Light/Cyber Themes
- Responsive Mobile Design
- Smooth Animations

✅ **Tech Stack**
- Frontend: React.js 18 + Vite
- Backend: Express.js + Node.js
- Database: MongoDB
- Realtime: Socket.io
- Encryption: Web Crypto API

## 📚 Documentation

- **[SETUP.md](./docs/SETUP.md)** - Detailed installation guide
- **[API.md](./docs/API.md)** - Complete API reference
- **[SECURITY.md](./docs/SECURITY.md)** - Security best practices
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Production deployment

## 🆘 Common Issues

### "MongoDB connection error"
```bash
# Make sure MongoDB is running
mongod
```

### "Port already in use"
```bash
# Change port in .env
PORT=5001

# Or kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

### "CORS error"
Check `CLIENT_URL` in backend `.env` matches your frontend URL

### "Encryption key missing"
Refresh browser and localStorage should populate automatically

## 🚀 Deploy to Production

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for:
- Vercel (Frontend)
- Railway (Backend)
- MongoDB Atlas (Database)

## 🔐 Security Notes

- ✓ Passwords hashed with bcryptjs
- ✓ Messages encrypted E2E before sending
- ✓ OTPs hashed and auto-expire
- ✓ JWT tokens stored in HttpOnly cookies
- ✓ Rate limiting on auth endpoints
- ✓ Input validation on all routes

## 📊 Test Accounts

Use these for testing:

```
Email: test@example.com
Password: TestPass123!@
Username: testuser
```

## 🛠️ Development Commands

```bash
# Backend
cd server
npm run dev        # Start dev server
npm start          # Start production

# Frontend
cd client
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

## 📞 Support

- Check documentation in `/docs`
- Review code comments
- Check GitHub issues
- Read Security section

## 🎓 Learning Resources

- [React.js Docs](https://react.dev)
- [Node.js Guides](https://nodejs.org/en/docs/guides/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Socket.io Docs](https://socket.io/docs/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

## 📝 Next Steps

1. ✅ Follow this quick start
2. 📖 Read [SETUP.md](./docs/SETUP.md) for detailed config
3. 🔐 Review [SECURITY.md](./docs/SECURITY.md) for security info
4. 🚀 Deploy using [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

**Welcome to SecureChat! 🔐**

Built with ❤️ for privacy and security.
