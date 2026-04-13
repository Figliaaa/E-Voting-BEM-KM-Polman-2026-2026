# PEMIRA System Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PEMIRA VOTING SYSTEM ARCHITECTURE            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           FRONTEND (React + Vite)                        │   │
│  │         Wild West Themed Voting Interface               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Pages:                                                   │   │
│  │  ├─ LandingPage (Role Selection)                        │   │
│  │  ├─ VoterLogin → VotingPage → VotingSuccess            │   │
│  │  └─ AdminLogin → AdminDashboard                         │   │
│  │      ├─ AdminCandidates (CRUD)                          │   │
│  │      └─ AdminVoters (Token Management)                  │   │
│  │                                                           │   │
│  │ Services:                                                │   │
│  │  ├─ api.js (HTTP Requests)                             │   │
│  │  ├─ socket.js (WebSocket)                              │   │
│  │  └─ AuthContext.jsx (State Management)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                        │
│              HTTPS/WebSocket (API Calls)                         │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         BACKEND (Express.js + Node.js)                  │   │
│  │    22 API Endpoints + WebSocket Server                  │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Modules:                                                 │   │
│  │  ├─ server.js (Main App)                                │   │
│  │  ├─ middleware/auth.js (JWT)                            │   │
│  │  ├─ middleware/validators.js (Input Validation)         │   │
│  │  └─ middleware/errorHandler.js (Error Handling)         │   │
│  │                                                           │   │
│  │ Endpoints:                                               │   │
│  │  Voter (3):     login, vote, status                     │   │
│  │  Admin (11):    login, candidates CRUD, voters, tokens  │   │
│  │  Public (4):    candidates, statistics, health          │   │
│  │                                                           │   │
│  │ Features:                                                │   │
│  │  ✅ JWT Authentication (Voter: 30min, Admin: 24hr)     │   │
│  │  ✅ Transaction-based One-Vote Guarantee               │   │
│  │  ✅ Real-time WebSocket Broadcasting                    │   │
│  │  ✅ Rate Limiting (100 req/15min)                       │   │
│  │  ✅ Input Validation (Joi)                              │   │
│  │  ✅ Security Headers (Helmet)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↓                                        │
│                    Database Layer                                 │
│                          ↓                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         MYSQL DATABASE (db_pemira)                      │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Tables:                                                  │   │
│  │  ├─ pemilih (voters)                                    │   │
│  │  │  ├─ nim (PK), nama, token, status_pilih,            │   │
│  │  │  ├─ token_diambil, waktu_pilih                       │   │
│  │  │  └─ Indexes: nim (PK), token, status_pilih          │   │
│  │  ├─ kandidat (candidates)                              │   │
│  │  │  ├─ id (PK), nama_ketua, nama_wakil,               │   │
│  │  │  ├─ deskripsi, foto_url, jumlah_suara,            │   │
│  │  │  └─ created_at, updated_at                          │   │
│  │  ├─ admin (admin users)                                │   │
│  │  │  ├─ id (PK), username (UNIQUE), password_hash,     │   │
│  │  │  ├─ full_name, created_at, updated_at              │   │
│  │  ├─ voting_log (audit trail)                           │   │
│  │  │  ├─ nim, kandidat_id, waktu_pilih, ip              │   │
│  │  └─ admin_action_log (admin actions)                   │   │
│  │     ├─ admin_id, action, details, timestamp            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagrams

### Voter Voting Flow

```
Voter Interface          Backend API              Database
┌────────────────┐      ┌──────────────┐         ┌───────────┐
│  Landing Page  │      │              │         │           │
└────────┬───────┘      │              │         │           │
         │              │              │         │           │
         ├─ Manual Input: NIM + Token  │         │           │
         │              │              │         │           │
         ├──────────────→│ /voter/login │         │           │
         │              ├─────────────→│ SELECT  │           │
         │              │ (Query: pemilih)       │           │
         │              │              │←─────────Token found │
         │              │ JWT Generated          │           │
         │              │←─────────────┤         │           │
         │              │              │         │           │
         │← JWT Token ──┤              │         │           │
         │ (localStorage)              │         │           │
         │              │              │         │           │
         ├─ View Candidates (Real-time)         │           │
         │              │              │         │           │
         ├──────────────→│ /candidates  │         │           │
         │              ├─────────────→│ SELECT  │           │
         │              │ (Query: kandidat)     │           │
         │              │              │←─────────All candidates
         │←──────────────┤              │         │           │
         │ Candidates List             │         │           │
         │              │              │         │           │
         ├─ User Selects Candidate & Clicks "Vote"            │
         │              │              │         │           │
         ├──────────────→│ /voter/vote  │         │           │
         │ (kandidat_id) ├─────────────→│ BEGIN   │           │
         │              │   TRANSACTION         │           │
         │              │              ├─────────SELECT      │
         │              │              │ FOR UPDATE (pemilih) │
         │              │              │←─────────Check if voted
         │              │ IF not voted:         │           │
         │              ├─────────────→│ UPDATE status_pilih│
         │              │              ├─────────SET 1      │
         │              │              │                    │
         │              │              ├─────────UPDATE     │
         │              │ WebSocket    │ jumlah_suara       │
         │              │ Broadcast    │                    │
         │              │ update_scores├─────────INSERT     │
         │              │              │ voting_log         │
         │              │              │                    │
         │              │              ├─────────COMMIT     │
         │              │ Success Response                  │
         │←──────────────┤              │         │           │
         │              │              │         │           │
         └─ Success Page with Confetti          │           │
```

### Admin Token Activation Flow

```
Admin Interface          Backend API              Database
┌────────────────┐      ┌──────────────┐         ┌───────────┐
│ Voters Page    │      │              │         │           │
└────────┬───────┘      │              │         │           │
         │              │              │         │           │
         ├─ Search: "1000000001"       │         │           │
         │              │              │         │           │
         ├──────────────→│ /voters?... │         │           │
         │              ├─────────────→│ SELECT  │           │
         │              │              │←─────────Voter found │
         │←──────────────Voter displayed         │           │
         │              │              │         │           │
         ├─ Click "Activate" Button   │         │           │
         │              │              │         │           │
         ├──────────────→│ /activate-token      │           │
         │ (nim)        ├─────────────→│ UPDATE │           │
         │              │              │ token_diambil=1    │
         │              │              │                    │
         │              │ INSERT admin_action_log           │
         │              │              │                    │
         │              │ Success Response                  │
         │←──────────────┤              │         │           │
         │              │              │         │           │
         └─ Show Success Alert              │           │
            "Token activated!"                │           │
```

### Real-time Vote Update Flow

```
Voter A                  WebSocket                Voter B/Admin
Votes                   Broadcast
┌─────────┐              ┌──────────┐            ┌──────────┐
│ Cast    │──POST vote──→│ Backend  │            │ Listening│
│ Vote    │              │ Database │            │ for      │
│         │              │ Updates  │            │ updates  │
└─────────┘              │          │            │          │
                         │ Emit     │            │          │
                         │ update_  │            │          │
                         │ scores   │──WebSocket→│ Receive  │
                         │ event    ││          │ event    │
                         │          ││          │ Re-render│
                         │          │           │ scores   │
                         │          │           └──────────┘
                         │          │ (Real-time update)
                         └──────────┘
```

## 🛡️ Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────┐
│        User Credentials             │
│     (NIM + Token OR Username/Pass)  │
└────────────────┬────────────────────┘
                 │
                 ├─ Validation: Joi Schema
                 │  ├─ NIM: 9 digits
                 │  ├─ Token: 6 chars
                 │  └─ Password: 4+ chars
                 │
                 ├─ Query Database
                 │  ├─ Find user/voter
                 │  └─ Compare credentials
                 │
                 ├─ If Valid:
                 │  ├─ Generate JWT Token
                 │  │  ├─ Voter: 30min expiry
                 │  │  ├─ Admin: 24hr expiry
                 │  │  └─ Signed with Secret
                 │  │
                 │  └─ Return Token to Client
                 │
                 └─ Token Stored in localStorage
                    ↓
                    All Future Requests Include:
                    Authorization: Bearer <JWT>
                    ↓
                    Middleware Verifies:
                    ├─ Token Signature Valid
                    ├─ Token Not Expired
                    └─ User Role Matches
```

### One-Vote Guarantee

```
┌──────────────────────────────────────────────────┐
│      Transaction-based One-Vote Guarantee        │
├──────────────────────────────────────────────────┤
│                                                  │
│  BEGIN TRANSACTION                               │
│  ├─ SELECT status_pilih FROM pemilih             │
│  │  WHERE nim = ?                                │
│  │  FOR UPDATE  ← LOCK THIS ROW                 │
│  │                                               │
│  │  (No other transaction can modify)            │
│  │                                               │
│  ├─ Check: IF status_pilih = 0 (not voted)     │
│  │  ├─ UPDATE pemilih SET status_pilih = 1     │
│  │  ├─ UPDATE kandidat SET jumlah_suara += 1   │
│  │  ├─ INSERT into voting_log                   │
│  │  └─ COMMIT TRANSACTION                       │
│  │                                               │
│  └─ Check: IF status_pilih = 1 (already voted)│
│     └─ ROLLBACK TRANSACTION                     │
│        Return: "You have already voted"         │
│                                                  │
│  ✅ Result: Each voter votes exactly once      │
│             Even with simultaneous requests    │
│                                                  │
└──────────────────────────────────────────────────┘
```

## 📊 API Request/Response Pattern

### Standard Success Response
```json
{
  "status": 200,
  "data": {
    "token": "eyJhbG...",
    "username": "peserta01",
    "full_name": "Peserta Satu"
  },
  "message": "Login successful"
}
```

### Standard Error Response
```json
{
  "status": 400,
  "error": "INVALID_NIM_FORMAT",
  "message": "NIM must be exactly 9 digits",
  "details": "Received: 12345"
}
```

## 🔐 Middleware Chain

```
Client Request
    ↓
CORS Check ───── ✓ Allow if origin matches
    ↓
Rate Limit ─── ✓ 100 requests per 15 minutes
    ↓
Body Parser ── ✓ Parse JSON/Form data
    ↓
Security Headers (Helmet)
    ├─ X-Frame-Options: DENY
    ├─ X-Content-Type-Options: nosniff
    ├─ Content-Security-Policy
    └─ HSTS
    ↓
Route Matching ─ Find handler
    ↓
Validation ──── Joi schema check
    ↓
Authentication ─ JWT verification (if required)
    ↓
Authorization ── Check user role/permissions
    ↓
Handler Logic ─ Execute business logic
    ↓
Error Handler ─ Catch and format errors
    ↓
Response ────── Send to client
```

## 🗂️ Database Schema

### pemilih (Voters)
```sql
CREATE TABLE pemilih (
  nim VARCHAR(20) PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  token VARCHAR(50),
  status_pilih TINYINT(1) DEFAULT 0,      -- 0: not voted, 1: voted
  token_diambil TINYINT(1) DEFAULT 0,     -- 0: not activated, 1: activated
  waktu_pilih DATETIME NULL,
  UNIQUE KEY token (token),
  INDEX status_pilih (status_pilih),
  INDEX token_diambil (token_diambil)
);
```

### kandidat (Candidates)
```sql
CREATE TABLE kandidat (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_ketua VARCHAR(100) NOT NULL,
  nama_wakil VARCHAR(100) NOT NULL,
  jumlah_suara INT DEFAULT 0,
  deskripsi TEXT,
  foto_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX jumlah_suara (jumlah_suara)
);
```

### admin
```sql
CREATE TABLE admin (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 Environment Variables

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=pemira_user
DB_PASSWORD=pemira_password123
DB_NAME=db_pemira

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET_VOTER=voter_secret_key_2026_2027
JWT_SECRET_ADMIN=admin_secret_key_2026_2027
JWT_EXPIRY_VOTER=30m
JWT_EXPIRY_ADMIN=24h

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
# API
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 📱 Component Hierarchy

```
App
├── BrowserRouter
│   └── AuthProvider
│       └── ErrorBoundary
│           └── AppRoutes
│               ├── LandingPage (/)
│               ├── VoterLogin (/login)
│               ├── VotingPage (/vote) [Protected]
│               ├── VotingSuccess (/success) [Protected]
│               ├── AdminLogin (/admin/login)
│               ├── AdminDashboard (/admin/dashboard) [Protected]
│               ├── AdminCandidates (/admin/candidates) [Protected]
│               └── AdminVoters (/admin/voters) [Protected]

Shared Components/Services
├── CommonComponents
│   ├── LoadingSpinner
│   ├── Alert
│   ├── GunShootEffect
│   ├── TumbleweedBackground
│   ├── DustEffect
│   ├── WesternTitle
│   └── ValidationInput
├── api.js (Service)
├── socket.js (WebSocket Service)
└── AuthContext (Global State)
```

## 🚀 Deployment Architecture

```
Production Environment
├── Frontend (Hosting)
│   ├─ Static files (dist/)
│   ├─ CDN for assets
│   └─ HTTPS/SSL enabled
│
├── Backend (Server)
│   ├─ Node.js process (PM2)
│   ├─ Reverse proxy (Nginx)
│   ├─ HTTPS/SSL certificates
│   └─ Rate limiting
│
├── Database (MySQL)
│   ├─ Dedicated DB server
│   ├─ Automated backups
│   ├─ Replication (optional)
│   └─ Monitoring/Alerts
│
└── Infrastructure
    ├─ Load balancer
    ├─ Monitoring (logs, errors)
    ├─ Backup system
    └─ Security (firewall, DDoS protection)
```

## 📈 Scalability Considerations

### For 1000+ voters:

1. **Database Optimization**
   - Add indexes on frequently queried columns
   - Use connection pooling (already configured)
   - Archive old voting logs

2. **Backend Scaling**
   - Multiple processes with load balancer
   - Caching layer (Redis) for statistics
   - Async job queue for bulk operations

3. **Frontend Performance**
   - Code splitting with lazy loading
   - Image optimization
   - Service workers for offline support

4. **WebSocket Efficiency**
   - Use Socket.IO rooms instead of broadcasting
   - Compress messages
   - Limit update frequency

## 🎯 Summary

This PEMIRA system is designed with:
- ✅ Security (JWT, transactions, validation)
- ✅ Performance (connection pooling, indexes)
- ✅ User Experience (real-time updates, animations)
- ✅ Maintainability (clear architecture, logging)
- ✅ Scalability (module-based, configurable)

All components work together to create a robust, secure, and engaging voting system.
