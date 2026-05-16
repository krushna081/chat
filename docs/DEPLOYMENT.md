# Deployment Guide - SecureChat

Step-by-step guide to deploy SecureChat to production.

## Overview

**Architecture:**
```
┌─────────────────────┐
│  Frontend (Vercel)  │
│   React + Vite      │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │ HTTPS/CORS  │
    └──────┬──────┘
           │
┌──────────┴──────────┐
│ Backend (Railway)   │
│  Express + Node.js  │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │  Socket.io  │
    └──────┬──────┘
           │
┌──────────┴──────────┐
│ Database (Atlas)    │
│    MongoDB          │
└─────────────────────┘
```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Code

```bash
# Build frontend
cd client
npm run build

# Verify build
npm run preview
```

### Step 2: Connect to Vercel

**Option A: Git Integration**
1. Push to GitHub
2. Go to https://vercel.com
3. Import repository
4. Configure build settings
5. Deploy

**Build Settings:**
```
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

### Step 3: Environment Variables

Add in Vercel dashboard:
```
VITE_API_URL=https://api.yourdomain.com/api
VITE_GOOGLE_CLIENT_ID=your_production_client_id
```

### Step 4: Custom Domain

1. Go to Settings → Domains
2. Add your domain
3. Update DNS records
4. Wait for SSL certificate

**DNS Records:**
```
CNAME: www.yourdomain.com → alias.vercel.sh
A: yourdomain.com → 76.76.19.0 (or Vercel IP)
```

### Step 5: Verify Deployment

- [ ] Site loads at https://yourdomain.com
- [ ] No mixed content warnings
- [ ] API calls work
- [ ] Socket connection works

---

## Backend Deployment (Railway)

### Step 1: Prepare Backend

```bash
cd server

# Test build
npm start

# Install production dependencies
npm install --production
```

### Step 2: Create Procfile (Railway)

```
web: node server.js
```

### Step 3: Connect to Railway

1. Go to https://railway.app
2. Create new project
3. Connect GitHub repository
4. Select `server` directory

### Step 4: Configure Environment

In Railway dashboard, set variables:

```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/securechat
JWT_SECRET=generate_very_long_random_secret_key
JWT_REFRESH_SECRET=generate_another_very_long_secret_key
RESEND_API_KEY=re_your_production_key
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
CLIENT_URL=https://yourdomain.com
NODE_ENV=production
```

### Step 5: Deploy

1. Connect repository
2. Select `server` directory
3. Configure variables
4. Click Deploy

### Step 6: Get Backend URL

Backend will be available at:
```
https://yourdomain-production-xxxx.railway.app
```

Update frontend `VITE_API_URL`:
```env
VITE_API_URL=https://yourdomain-production-xxxx.railway.app/api
```

---

## Database Setup (MongoDB Atlas)

### Step 1: Create Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create new cluster
4. Choose AWS (most regions)
5. Create cluster (takes ~3 min)

### Step 2: Create User

1. Go to Security → Database Access
2. Add Database User
3. Username: `securechat`
4. Generate secure password
5. Save password securely

### Step 3: Set IP Whitelist

1. Go to Security → Network Access
2. Add IP Address
3. For development: `0.0.0.0/0` (allow all)
4. For production: Add specific IPs

### Step 4: Get Connection String

1. Go to Clusters → Connect
2. Choose "Connect your application"
3. Copy MongoDB Connection String

```
mongodb+srv://securechat:PASSWORD@cluster0.xxxxx.mongodb.net/securechat?retryWrites=true&w=majority
```

### Step 5: Configure Backups

1. Go to Backup → Configure Backup Policy
2. Enable daily backups
3. Set retention to 35 days
4. Test restore process

---

## Email Service (Resend)

### Step 1: Setup Resend

1. Go to https://resend.com
2. Create account
3. Verify email domain (or use default)
4. Create API key

### Step 2: Add to Backend

```env
RESEND_API_KEY=re_your_production_api_key
```

### Step 3: Test Email

```javascript
import { sendOTPEmail } from './utils/sendEmail.js';

await sendOTPEmail('test@example.com', '123456');
```

---

## Google OAuth Production

### Step 1: Setup Google Cloud

1. Go to https://console.cloud.google.com
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials

### Step 2: Configure URLs

**Authorized redirect URIs:**
```
https://yourdomain.com/login
https://yourdomain.com/auth/callback
```

### Step 3: Add Credentials

Backend `.env`:
```env
GOOGLE_CLIENT_ID=your.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

Frontend `.env`:
```env
VITE_GOOGLE_CLIENT_ID=your.apps.googleusercontent.com
```

---

## SSL/TLS Certificate

### Automatic (Vercel/Railway)

- Both platforms provide free SSL certificates
- Automatically renewed
- No additional configuration needed

### Manual Setup (if needed)

1. Use Let's Encrypt (free)
2. Or purchase from certificate authority
3. Add to server configuration
4. Setup auto-renewal

---

## Performance Optimization

### Frontend Optimization

```bash
cd client

# Build analysis
npm run build

# Check bundle size
npm install -g webpack-bundle-analyzer
```

### Backend Optimization

```javascript
// Enable compression
import compression from 'compression';
app.use(compression());

// Enable caching
app.set('view cache', true);

// Use connection pooling
mongoose.set('maxPoolSize', 10);
```

### Database Optimization

1. Create indexes on frequently queried fields
2. Archive old messages
3. Setup read replicas
4. Enable Atlas search

---

## Monitoring & Alerts

### Application Monitoring

**Vercel:**
- Go to Analytics
- Monitor response times
- Check error rates

**Railway:**
- Go to Deployments
- View logs
- Set up alerts

### Database Monitoring

**MongoDB Atlas:**
- Go to Metrics
- Monitor query performance
- Check connection usage
- Setup alerts

### Uptime Monitoring

Use third-party service:
1. Go to https://uptimerobot.com
2. Monitor endpoints:
   - `https://yourdomain.com`
   - `https://api.yourdomain.com/api/auth/login`
3. Setup email alerts

---

## Logging & Analytics

### Structured Logging

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Error Tracking

Setup Sentry:
```bash
npm install @sentry/node
```

```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

---

## Backup & Disaster Recovery

### Database Backups

**MongoDB Atlas:**
1. Automatic daily backups included
2. Point-in-time recovery available
3. Download backups from Atlas dashboard
4. Test restore process monthly

### Application Backups

**GitHub:**
- All code in version control
- Easy rollback if needed
- Tag releases

**Deploy Configuration:**
- Document all environment variables
- Store secrets in secrets manager
- Keep deployment procedure documented

### Recovery Process

1. **Identify Issue**
   - Check logs
   - Analyze metrics

2. **Restore Database**
   - Use MongoDB backup
   - Verify data integrity

3. **Redeploy Application**
   - Rollback to previous version
   - Or fix and deploy

4. **Test Everything**
   - Run smoke tests
   - Verify user functionality

---

## Security Hardening

### HTTPS Enforcement

**Backend:**
```javascript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});
```

### HSTS Headers

```javascript
app.use(helmet.hsts({
  maxAge: 31536000,      // 1 year
  includeSubDomains: true,
  preload: true
}));
```

### Rate Limiting

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // Limit each IP to 100 requests
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);
```

---

## Domain Configuration

### Buy Domain

1. Go to domain registrar (Namecheap, GoDaddy)
2. Search and purchase domain
3. Point to Vercel and Railway

### Configure DNS

**For Vercel (Frontend):**
```
CNAME: www.yourdomain.com → alias.vercel.sh
A: yourdomain.com → 76.76.19.0
```

**For Railway (Backend API):**
```
CNAME: api.yourdomain.com → domain.railway.app
```

### Verify DNS

```bash
# Test DNS resolution
nslookup yourdomain.com
dig yourdomain.com

# Check certificate
curl https://yourdomain.com
```

---

## Post-Deployment Checklist

- [ ] Frontend loads at https://yourdomain.com
- [ ] Backend API responds at https://api.yourdomain.com
- [ ] HTTPS redirect works
- [ ] SSL certificate valid
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Database backups working
- [ ] Monitoring setup
- [ ] Error tracking setup
- [ ] Load testing passed
- [ ] Security audit completed
- [ ] Performance acceptable

---

## Troubleshooting

### Frontend Not Loading

```bash
# Check build
npm run build

# Check environment variables
echo $VITE_API_URL

# Clear Vercel cache
vercel --prod --force
```

### API Not Responding

```bash
# Check backend logs
railway logs

# Test locally
curl https://api.yourdomain.com/health

# Check database connection
mongosh <connection_string>
```

### Socket Connection Failing

```javascript
// Check Socket.io CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
});
```

### Database Connection Issues

1. Check MongoDB Atlas IP whitelist
2. Verify connection string
3. Check database user credentials
4. Test connection locally

---

## Performance Metrics

Target values:
- **Frontend Load:** < 2s
- **API Response:** < 200ms
- **Database Query:** < 50ms
- **Uptime:** 99.9%
- **Error Rate:** < 0.1%

---

**Deployment successful! 🚀**
