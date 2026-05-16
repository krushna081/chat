# Setup Guide - SecureChat

Complete step-by-step setup instructions for development and production.

## Prerequisites

- Node.js 16+ and npm
- MongoDB (local or MongoDB Atlas)
- Git
- Code Editor (VS Code recommended)

## Quick Start (5 minutes)

### 1. Clone Repository
```bash
git clone <repository-url>
cd secure-chat-app
```

### 2. Backend Setup
```bash
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start MongoDB locally (optional)
mongod

# Start server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup (in new terminal)
```bash
cd client

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start dev server
npm run dev
```

Frontend will open at `http://localhost:5173`

## Detailed Configuration

### Backend Configuration (.env)

```env
# Server Port
PORT=5000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/securechat
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/securechat?retryWrites=true&w=majority

# JWT Secrets (Generate long random strings)
JWT_SECRET=generate_a_long_random_string_here
JWT_REFRESH_SECRET=generate_another_long_random_string

# Resend Email API
RESEND_API_KEY=re_your_key_from_resend

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Frontend URL
CLIENT_URL=http://localhost:5173

# Environment
NODE_ENV=development
```

### Frontend Configuration (.env)

```env
# API Backend URL
VITE_API_URL=http://localhost:5000/api

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

## API Keys Setup

### 1. Resend Email Service

1. Go to https://resend.com
2. Sign up and create account
3. Create API key
4. Add to `RESEND_API_KEY` in backend `.env`

### 2. Google OAuth

1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - `http://localhost:5173/login` (development)
   - `https://yourdomain.com/login` (production)
6. Add credentials to `.env` files

### 3. MongoDB

**Local Development:**
```bash
# Install MongoDB Community Edition
# https://docs.mongodb.com/manual/installation/

# Start MongoDB
mongod
```

**Production (MongoDB Atlas):**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Get connection string
5. Add to `MONGODB_URI` in `.env`

## Testing the Application

### Test Sign Up Flow

1. Navigate to `http://localhost:5173`
2. Click "Sign Up"
3. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `SecurePass123!@`
4. You'll receive OTP in console (development mode)
5. Enter OTP
6. Verify email and create account

### Test Chat Features

1. Log in with created account
2. Create chat room: "Test Room"
3. Share room ID with another account
4. Send encrypted messages
5. Verify messages are encrypted in database

### Test Encryption

1. Send a message
2. Check browser DevTools:
   - Application → Local Storage
   - Look for `encryptionKey` (hex string)
3. Check database:
   - Messages show `encryptedMessage` and `iv`
   - Never shows plaintext

## Database Setup

### Create Collections (Auto-created by Mongoose)

Collections will be automatically created:
- `users` - User accounts
- `otps` - OTP records
- `chatrooms` - Chat rooms
- `messages` - Messages

### Create Indexes (Auto-created by Mongoose)

Indexes for performance:
- `messages.roomId` - Fast room queries
- `messages.createdAt` - Sorting
- `users.email` - Quick user lookup
- `otps.expiresAt` - TTL auto-deletion

## Running in Production

### Backend Deployment (Railway/Render)

1. Push code to GitHub
2. Connect repository to Railway/Render
3. Add environment variables
4. Deploy

**Environment Variables:**
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=use_strong_random_secret
JWT_REFRESH_SECRET=use_strong_random_secret
RESEND_API_KEY=re_your_key
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
CLIENT_URL=https://yourdomain.com
NODE_ENV=production
```

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

**Environment Variables:**
```
VITE_API_URL=https://api.yourdomain.com/api
VITE_GOOGLE_CLIENT_ID=your_id
```

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution:** Make sure MongoDB is running:
```bash
mongod
```

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Ensure `CLIENT_URL` in backend `.env` matches frontend URL

### OTP Not Received
```
Failed to send OTP email
```
**Solution:** Check `RESEND_API_KEY` is valid

### Encryption Issues
```
Decryption failed
```
**Solution:** Make sure encryption key is stored in localStorage

### Socket Connection Error
```
Failed to connect to Socket.io
```
**Solution:** Verify backend is running and socket is enabled

## Development Workflow

### 1. Frontend Development
```bash
cd client
npm run dev
# Vite HMR automatically reloads on changes
```

### 2. Backend Development
```bash
cd server
npm run dev
# Nodemon automatically restarts on changes
```

### 3. Database Monitoring
```bash
# Using MongoDB Compass (GUI)
# Connect to: mongodb://localhost:27017

# Or CLI
mongosh
db.messages.find()
```

### 4. Testing API Endpoints
```bash
# Using curl
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Or Postman
# Import from API documentation
```

## Performance Tips

1. **Message Pagination**: Load messages 50 at a time
2. **Socket Debouncing**: Debounce typing events (300ms)
3. **Lazy Loading**: Load chat rooms on demand
4. **Code Splitting**: Use React.lazy for pages
5. **Caching**: Use browser cache for static assets

## Security Checklist

- ✓ Enforce HTTPS in production
- ✓ Use strong, unique JWT secrets
- ✓ Rotate JWT secrets regularly
- ✓ Enable MongoDB authentication
- ✓ Use environment variables (never commit secrets)
- ✓ Enable rate limiting
- ✓ Set CORS to specific domains
- ✓ Use HttpOnly secure cookies
- ✓ Keep dependencies updated

## Scripts Reference

### Backend
```bash
npm run dev      # Start development server (with hot reload)
npm start        # Start production server
npm test         # Run tests
```

### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Useful Commands

### MongoDB
```bash
# Start MongoDB
mongod

# Connect to CLI
mongosh

# List databases
show dbs

# Use specific database
use securechat

# View collections
show collections

# Query messages
db.messages.find()

# Query users
db.users.find()
```

### Git
```bash
# Clone repo
git clone <url>

# Create feature branch
git checkout -b feature/name

# Commit changes
git add .
git commit -m "feat: description"

# Push to GitHub
git push origin feature/name
```

## Getting Help

- Check API documentation in `docs/`
- Review code comments
- Check GitHub issues
- Read security guidelines

---

**Happy coding! 🚀**
