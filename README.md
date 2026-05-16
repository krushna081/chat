# SecureChat - Secure End-to-End Encrypted Chat Application

## 🔒 What is SecureChat?

SecureChat is a privacy-focused messaging application that provides **end-to-end encryption** for all your conversations. Unlike regular messaging apps, your messages are encrypted on your device before they ever leave your browser, meaning **not even the server can read your messages**.

### 🎯 Purpose
The purpose of SecureChat is to provide a secure, private communication platform where:
- Your conversations remain completely private and secure
- You can chat with confidence knowing no third parties can access your messages
- Messages automatically self-destruct after a set time for extra privacy
- You have full control over your data and privacy settings

## 🔑 How to Login

### Option 1: Email & Password (Recommended)
1. Visit the application at **https://your-securechat-domain.com** (or locally at `http://localhost:5173` during development)
2. Click **"Sign Up"** if you're a new user
3. Enter:
   - **Username**: Your chosen display name
   - **Email**: Your valid email address (for verification)
   - **Password**: A strong password (must include: 8+ chars, uppercase, lowercase, number, special character)
4. Check your email for a **6-digit OTP code**
5. Enter the OTP code to verify your email
6. You're now logged in!

### Option 2: Google OAuth (Quick Login)
1. Click the **"Sign in with Google"** button on the login page
2. Select your Google account
3. Authorize SecureChat to access your basic profile information
4. You're automatically logged in - no additional verification needed!

### Logging In After Registration
1. Go to the login page
2. Enter your email and password
3. Click "Login"
4. Access granted!

## 🚀 How to Use SecureChat

### Creating Your First Chat Room
1. After logging in, you'll see the **Dashboard**
2. Click the **"Create New Room"** button (+ icon)
3. Fill in:
   - **Room Name**: What you want to call your chat (e.g., "Work Project", "Family Chat")
   - **Privacy Setting**: Choose between:
     - **Public**: Anyone with the link can join (if they know the room ID)
     - **Private**: Requires approval to join (more secure)
   - **Message Expiry**: How long messages should last before auto-deleting:
     - **1 Hour**: Messages disappear after 1 hour
     - **12 Hours**: Messages disappear after 12 hours
     - **24 Hours**: Messages disappear after 24 hours
   - **Room Password** (Optional): Add a password for extra security
4. Click **"Create Room"**
5. Share the **Room ID** with your friends so they can join!

### Joining a Chat Room
1. Obtain the Room ID from the room creator
2. On your Dashboard, click **"Join Room"**
3. Enter the Room ID
4. If the room has a password, enter it when prompted
5. Click **"Join"** - you're now in the chat!

### Sending Encrypted Messages
1. Select a chat room from your dashboard or join a new one
2. Type your message in the input box at the bottom
3. Press **Enter** or click the **Send** button (→)
4. **Watch the encryption happen in real-time:**
   - Your message is encrypted on your device before sending
   - The server only sees scrambled, unreadable data
   - Only recipients in the room can decrypt and read your message
5. See delivery status indicators:
   - 📤 **Sent**: Message left your device
   - **✓ Delivered**: Message reached recipient's device
   - **✓✓ Read**: Message has been read by recipient

### Security Features You'll Notice
- **Encryption Indicator**: Each message shows a small lock icon 🔒 indicating it's end-to-end encrypted
- **Typing Indicators**: See when others are typing (with privacy controls)
- **Online Status**: Green dot shows when users are online
- **Self-Destruct Timer**: See when messages are set to expire
- **Theme Customization**: Switch between Dark, Light, and Cyber themes in Settings

## 🔐 How Encryption Works (Your Messages Stay Private)

### Client-Side Encryption Process
When you send a message in SecureChat:

1. **On Your Device (Before Sending):**
   - Your message is encrypted using **AES-256-GCM** encryption
   - A unique **Initialization Vector (IV)** is generated for each message
   - Encryption happens in your browser using the Web Crypto API
   - Only the encrypted data and IV are sent to our servers

2. **During Transmission:**
   - The server receives only: `encrypted_message + iv`
   - **Never sees your original message** - it appears as random gibberish
   - No way for anyone (including us) to decrypt without your key

3. **On Recipient's Device (When Receiving):**
   - The encrypted message and IV are sent to your friend's device
   - Their device uses the same encryption key to decrypt
   - The original message appears only on their screen
   - Decryption happens locally - never on our servers

### Key Management
- Your encryption key is generated when you first log in
- Stored securely in your browser's local storage
- **Never transmitted to our servers**
- If you clear browser data or use a new device, you'll need to generate a new key
- For production use: Consider using your device's secure keychain

## 🔒 Password Security Features

### Strong Password Requirements
To protect your account, SecureChat enforces:
- **Minimum 8 characters**
- **At least one uppercase letter** (A-Z)
- **At least one lowercase letter** (a-z)
- **At least one number** (0-9)
- **At least one special character** (@ $ ! % * ? &)

### Password Protection
- Passwords are hashed using **bcrypt** with 12 salt rounds
- Even if our database were compromised, attackers couldn't recover your password
- The hash is irreversible - only your password can produce that specific hash
- We never store or have access to your actual password

### Additional Security Layers
- **Rate Limiting**: Prevents brute-force attacks on login
- **Account Lockout**: Temporary lock after too many failed attempts
- **Secure Cookies**: Authentication tokens stored in HTTP-only, secure cookies
- **Session Management**: Automatic logout on suspicious activity

## 🌟 All Features Explained

### 🛡️ Security & Privacy
- **End-to-End Encryption (E2EE)**: Military-grade AES-256-GCM encryption
- **Zero Knowledge Architecture**: We cannot access your messages
- **Self-Destructing Messages**: Auto-delete after 1h, 12h, or 24h
- **Password-Protected Rooms**: Extra layer of security for sensitive chats
- **Private Rooms**: Invite-only access control
- **Local Encryption Keys**: Keys stay on your device
- **No Message Storage**: Servers only store encrypted blobs temporarily

### 💬 Messaging Experience
- **Real-Time Communication**: Instant message delivery via Socket.io
- **Read Receipts**: See when your messages are read
- **Delivery Status**: Track message delivery progress
- **Typing Indicators**: See when others are composing replies
- **Online Presence**: Know who's available to chat
- **Emoji Support**: Express yourself fully
- **Message Persistence**: Messages stay until expiration time

### 👥 User & Room Management
- **Profile Customization**: Set your username and avatar
- **Theme Preferences**: Save your preferred theme (Dark/Light/Cyber)
- **Room Management**: Create, join, leave, and manage rooms
- **Notification Controls**: Mute specific rooms or all notifications
- **Multi-Device**: Log in from different devices (separate encryption keys per device)

### 🎨 User Interface & Experience
- **Modern Design**: Clean, intuitive interface
- **Three Themes**: 
  - **Dark**: Easy on the eyes, OLED friendly
  - **Light**: Clean and professional
  - **Cyber**: Neon accents with glowing effects
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Smooth Animations**: Pleasant transitions and feedback
- **Accessible**: Keyboard navigable and screen reader friendly

### ⚙️ Technical Excellence
- **Built with Modern Stack**: React 18, Vite, Node.js, Express
- **Efficient Performance**: Code splitting, lazy loading, memoization
- **Reliable Real-Time**: Socket.io with automatic reconnection
- **Scalable Architecture**: Ready for thousands of concurrent users
- **Production Ready**: Docker-ready, HTTPS compatible

## 🔗 Important Links

### 🌐 Access the Application
- **Production App**: [https://securechat.app](https://securechat.app) *(example - replace with actual domain)*
- **Local Development**: `http://localhost:5173` (when running locally)
- **Documentation**: [https://docs.securechat.app](https://docs.securechat.app) *(example)*

### 📚 Help & Support
- **Getting Started**: [Quick Start Guide](./QUICKSTART.md)
- **Detailed Setup**: [Setup Guide](./docs/SETUP.md)
- **API Reference**: [API Documentation](./docs/API.md)
- **Security Details**: [Security Guide](./docs/SECURITY.md)
- **Deployment Help**: [Deployment Guide](./docs/DEPLOYMENT.md)

### 📱 Download & Platforms
- **Web App**: Access via any modern browser
- **Progressive Web App**: Installable on mobile/desktop (coming soon)
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest versions)

## 🛡️ Privacy Commitment

### What We Do NOT Collect
- ✗ **Message Content**: Encrypted before it leaves your device
- ✗ **Encryption Keys**: Never transmitted or stored by us
- ✗ **Passwords**: Only salted hashes stored
- ✗ **Personal Data**: Minimal collection (username, email for auth)
- ✗ **Conversation Metadata**: No tracking of who you talk to or when

### What We Do Collect (Minimal & Necessary)
- ✓ **Email Address**: For account verification and recovery (hashed in DB)
- ✓ **Username**: Your chosen display name
- ✓ **Authentication Tokens**: Temporary, secure cookies for login state
- ✓ **Encrypted Message Blobs**: Temporary storage until expiration
- ✓ **Room Metadata**: Room names, expiry settings (not content)

### Your Data, Your Control
- **Delete Account**: Permanently removes all your data
- **Export Data**: Download your account information
- **Privacy Settings**: Control what others can see about you
- **Data Retention**: Messages auto-delete; account data only kept as needed

## 💡 Tips for Maximum Security

1. **Use Strong Passwords**: Follow the password requirements - they're there for your protection
2. **Verify Contacts**: When sharing sensitive information, verify you're chatting with the right person
3. **Check Encryption**: Look for the 🔒 lock icon on every message
4. **Use Expiry Times**: Set appropriate message expiration for sensitive conversations
5. **Secure Your Device**: Use device passcodes and biometrics
6. **Log Out Shared Devices**: Always log out when using public or shared computers
7. **Keep Browser Updated**: Ensures you have the latest security protections

## 🚀 Getting Started Right Now

1. **Visit**: Open your browser and go to [https://securechat.app](https://securechat.app) (or localhost:5173 for development)
2. **Sign Up**: Create your account with email and strong password
3. **Verify**: Check your email and enter the 6-digit OTP code
4. **Create**: Make your first chat room and invite friends
5. **Chat**: Start sending completely private, encrypted messages

### First Message Suggestion
Try sending: "Hello, this is my first end-to-end encrypted message!" and notice how only you and the recipient can read it - not even the server administrators.

## 📞 Need Help?

- **Check the Guides**: See the documentation links above
- **Community Support**: Visit our forums or discussion boards
- **Feedback**: We welcome your suggestions to make SecureChat even more secure and user-friendly

---

**SecureChat: Where Privacy Meets Simplicity**  
*Your conversations deserve the strongest protection available.*

Built with ❤️ for privacy and security.  
© 2026 SecureChat - All rights reserved.

**Remember**: If it's not encrypted, it's not private.  
With SecureChat, **every message is locked with military-grade encryption** - because your privacy isn't optional, it's essential.