# Security Best Practices - SecureChat

Comprehensive security guidelines for development and deployment.

## 🔐 Data Protection

### End-to-End Encryption (E2EE)

**What's Encrypted:**
- ✓ All chat messages
- ✓ User encryption keys (in transit)
- ✗ User credentials (passwords)
- ✗ Metadata (timestamps, room IDs)

**Encryption Method:**
```javascript
// AES-256-GCM
Algorithm: AES-GCM
Key Size: 256 bits
IV: 12 bytes (96 bits)
Authentication Tag: 128 bits
```

**Key Storage:**
- Client: Browser localStorage (local encryption only)
- Server: Never stores plaintext keys
- Production: Use OS keychain or secure enclave

### Password Security

**Requirements:**
```
✓ Minimum 8 characters
✓ Uppercase letter (A-Z)
✓ Lowercase letter (a-z)
✓ Number (0-9)
✓ Special character (@$!%*?&)
```

**Hashing:**
```javascript
// bcryptjs with 12 salt rounds
const hashedPassword = await bcryptjs.hash(password, 12);
// Never store plaintext passwords
```

**Never:**
- ✗ Send passwords via email
- ✗ Store passwords in logs
- ✗ Display passwords in plaintext
- ✗ Use simple hashing (MD5, SHA1)

### OTP Security

**Generation:**
```javascript
// 6-digit random OTP
const otp = Math.floor(100000 + Math.random() * 900000);
```

**Storage:**
- Hash before storing: `bcryptjs.hash(otp, 10)`
- Expires after 5 minutes
- Maximum 5 verification attempts
- Auto-delete on expiration (TTL)

**Transport:**
- Sent via Resend API (HTTPS only)
- Never in plain email links
- Rate-limited resend attempts

---

## 🛡️ Authentication & Authorization

### JWT Security

**Token Types:**
```javascript
// Access Token: Short-lived (15 minutes)
accessToken = jwt.sign(
  { id: userId },
  JWT_SECRET,
  { expiresIn: '15m' }
);

// Refresh Token: Long-lived (7 days)
refreshToken = jwt.sign(
  { id: userId },
  JWT_REFRESH_SECRET,
  { expiresIn: '7d' }
);
```

**Storage:**
```javascript
// HttpOnly Cookies (preferred)
res.cookie('accessToken', token, {
  httpOnly: true,        // Prevent XSS access
  secure: true,          // HTTPS only
  sameSite: 'strict',    // CSRF protection
  maxAge: 15 * 60 * 1000 // 15 minutes
});
```

**Best Practices:**
- ✓ Never store tokens in localStorage
- ✓ Use HttpOnly secure cookies
- ✓ Set SameSite=strict
- ✓ Use HTTPS in production
- ✓ Rotate secrets regularly
- ✗ Don't log tokens
- ✗ Don't include in URLs

### Authorization

**Middleware Protection:**
```javascript
export const authenticate = (req, res, next) => {
  const token = req.cookies.accessToken;
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**User Verification:**
- ✓ Verify user owns requested resource
- ✓ Check room membership before access
- ✓ Validate user permissions

---

## 🔒 Network Security

### HTTPS/SSL

**Production Requirements:**
- ✓ Valid SSL certificate
- ✓ Enforce HTTPS redirects
- ✓ Use HSTS headers
- ✗ Never use HTTP in production

### CORS Protection

**Strict CORS Policy:**
```javascript
cors({
  origin: process.env.CLIENT_URL,  // Specific domain only
  credentials: true,                // Allow cookies
  methods: ['GET', 'POST', 'PUT'],  // Specific methods only
  allowedHeaders: ['Content-Type', 'Authorization']
})
```

**Configuration:**
```env
# Only allow your frontend domain
CLIENT_URL=https://yourdomain.com

# Never use: origin: '*'
# Never allow all subdomains
```

### Helmet.js Headers

```javascript
import helmet from 'helmet';

app.use(helmet());

// Includes:
// - Content-Security-Policy
// - X-Frame-Options
// - X-Content-Type-Options
// - Strict-Transport-Security
// - X-XSS-Protection
```

---

## 🚫 Attack Prevention

### 1. SQL/Mongo Injection

**Protection:**
```javascript
// ✓ Use parameterized queries (Mongoose)
User.findOne({ email: email });

// ✗ Never use string concatenation
db.collection('users').findOne({ email: userInput })
```

### 2. XSS (Cross-Site Scripting)

**Protection:**
```javascript
// ✓ Use DOMPurify for user input
import DOMPurify from 'dompurify';
const cleanInput = DOMPurify.sanitize(userInput);

// ✓ React escapes by default
<div>{userInput}</div>  // Safe

// ✗ Never use dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 3. CSRF (Cross-Site Request Forgery)

**Protection:**
```javascript
// ✓ SameSite cookies
res.cookie('token', token, { sameSite: 'strict' });

// ✓ CSRF tokens (if using forms)
const csrfToken = req.csrfToken();
```

### 4. Brute Force

**Protection:**
```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  message: 'Too many login attempts',
  skipSuccessfulRequests: true
});

app.post('/login', loginLimiter, loginController);
```

### 5. DDoS

**Protection:**
- ✓ Rate limiting on all endpoints
- ✓ API gateway (in production)
- ✓ Load balancing
- ✓ CDN (Cloudflare)

---

## 🔑 Secrets Management

### Environment Variables

**Never:**
```javascript
// ✗ Hardcode secrets
const API_KEY = "sk_live_123456";

// ✗ Commit .env files
git add .env  // Don't do this!

// ✗ Log secrets
console.log(process.env.JWT_SECRET);

// ✗ Expose in frontend
fetch('/api/config')  // Don't return secrets
```

**Always:**
```javascript
// ✓ Use environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// ✓ Create .env.example without values
// ✓ Add .env to .gitignore
// ✓ Use secrets manager in production
```

### Secret Rotation

**In Production:**
1. Generate new secret
2. Update in secrets manager
3. Deploy without downtime
4. Old tokens remain valid
5. Eventually expire naturally

---

## 📱 Client-Side Security

### Secure Storage

```javascript
// ✓ HttpOnly cookies for tokens
// ✓ Session storage for session data
// ✗ localStorage for sensitive data

// ✓ For encryption keys (local-only)
localStorage.setItem('encryptionKey', hexKey);
// Only in browser, never sent to server
```

### Input Validation

```javascript
// ✓ Validate on client
if (!isValidEmail(email)) {
  throw new Error('Invalid email');
}

// ✓ Sanitize input
const clean = input.trim().replace(/[<>]/g, '');

// ✓ Validate on server too!
// Client validation is not enough
```

### Content Security Policy

```javascript
helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "trusted-cdn.com"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", process.env.API_URL]
  }
});
```

---

## 🚀 Deployment Security

### Pre-Deployment Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS configured
- [ ] CORS restricted to production domain
- [ ] Rate limiting enabled
- [ ] Security headers enabled (Helmet)
- [ ] Input validation on all endpoints
- [ ] Authentication on protected routes
- [ ] Logging configured (no sensitive data)
- [ ] Database backups automated
- [ ] SSL/TLS certificate valid
- [ ] Firewall rules configured
- [ ] Monitoring and alerts set up

### Production Environment

```env
# Production .env
NODE_ENV=production
PORT=5000

# Strict CORS
CLIENT_URL=https://yourdomain.com

# Strong JWT secrets (minimum 32 characters)
JWT_SECRET=generate_very_long_random_string_with_symbols_!@#$%
JWT_REFRESH_SECRET=generate_another_very_long_random_string_!@#

# Secure MongoDB Atlas connection
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/securechat

# Third-party services
RESEND_API_KEY=re_production_key
GOOGLE_CLIENT_ID=production_client_id
GOOGLE_CLIENT_SECRET=production_client_secret
```

---

## 🔍 Monitoring & Logging

### What to Log

```javascript
// ✓ Login attempts (failed only)
logger.warn(`Failed login: ${email}`);

// ✓ Security events
logger.warn(`Suspicious activity: ${userId}`);

// ✓ API errors (generic)
logger.error('Internal server error');
```

### What NOT to Log

```javascript
// ✗ Passwords
logger.info(`Password: ${password}`);

// ✗ Tokens
logger.debug(`Token: ${accessToken}`);

// ✗ API keys
logger.info(`RESEND_KEY: ${process.env.RESEND_API_KEY}`);

// ✗ User PII unnecessarily
logger.info(`User email: ${email}`);  // Avoid when possible
```

### Monitoring Tools

- PM2 (process monitoring)
- Winston (logging)
- Sentry (error tracking)
- DataDog (metrics)
- New Relic (performance)

---

## 📋 Security Audit Checklist

### Code Security
- [ ] No hardcoded secrets
- [ ] No debug logging
- [ ] All user inputs validated
- [ ] Error messages don't leak info
- [ ] Dependencies updated
- [ ] No known vulnerabilities (npm audit)

### API Security
- [ ] Authentication on all protected routes
- [ ] Authorization checks implemented
- [ ] Rate limiting configured
- [ ] CORS properly restricted
- [ ] API responses sanitized
- [ ] Error handling consistent

### Data Security
- [ ] Passwords hashed with bcrypt
- [ ] Messages encrypted E2EE
- [ ] OTPs hashed and expired
- [ ] Database backups automated
- [ ] No plaintext sensitive data in logs

### Network Security
- [ ] HTTPS enforced
- [ ] HSTS headers set
- [ ] SSL certificate valid
- [ ] TLS 1.2 minimum
- [ ] Strong ciphers configured

### Deployment
- [ ] Environment variables used
- [ ] Secrets rotated regularly
- [ ] Backup and recovery tested
- [ ] Monitoring configured
- [ ] Incident response plan

---

## 🆘 Security Incident Response

### If Breached

1. **Immediate:**
   - Rotate all secrets
   - Invalidate all tokens
   - Log the incident
   - Notify users

2. **Investigation:**
   - Analyze logs
   - Check database for tampering
   - Review access logs
   - Check for privilege escalation

3. **Recovery:**
   - Patch vulnerabilities
   - Reset user passwords
   - Update security measures
   - Deploy fixes

4. **Communication:**
   - Notify affected users
   - Be transparent
   - Provide guidance
   - Follow compliance requirements

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)

---

**Security is everyone's responsibility. Stay vigilant! 🛡️**
