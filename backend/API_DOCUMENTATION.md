# PEMIRA 2026-2027 Voting System - Backend API Documentation

## Overview
Complete backend API for college student voting system with admin panel. Features include voter authentication, secure voting mechanism, real-time score updates via WebSocket, and comprehensive admin management.

---

## Table of Contents
1. [Setup & Installation](#setup--installation)
2. [Database Schema](#database-schema)
3. [Authentication](#authentication)
4. [Voter Endpoints](#voter-endpoints)
5. [Admin Endpoints](#admin-endpoints)
6. [Public Endpoints](#public-endpoints)
7. [WebSocket Events](#websocket-events)
8. [Security Features](#security-features)
9. [Error Handling](#error-handling)

---

## Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Create .env File
```bash
cp .env.example .env
```

Configure your .env with database credentials and secrets:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=db_pemira
ADMIN_SECRET=your_random_admin_secret
VOTER_SECRET=your_random_voter_secret
NODE_ENV=development
PORT=3001
```

### 3. Setup Database
```bash
# Run SQL setup queries from database_setup.sql in your MySQL client
# This creates admin table, adds columns to kandidat, and creates audit tables
mysql -u root -p db_pemira < database_setup.sql
```

### 4. Generate Voter Tokens
```bash
# Generate random 6-character hex tokens for all voters
node generate.js
```

### 5. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

---

## Database Schema

### Tables

#### `pemilih` (Voters)
```
nim             VARCHAR(20)    - Primary Key, Student ID
nama            VARCHAR(100)   - Student Name
token           VARCHAR(50)    - Access token (6-char hex)
status_pilih    TINYINT(1)    - Has voted (0/1)
token_diambil   TINYINT(1)    - Token activated by admin (0/1)
waktu_pilih     DATETIME      - When voter voted
```

#### `kandidat` (Candidates)
```
id              INT           - Primary Key
nama_ketua      VARCHAR(100)  - Chairman name
nama_wakil      VARCHAR(100)  - Vice-chairman name
jumlah_suara    INT          - Vote count
deskripsi       TEXT         - Candidate description
foto_url        VARCHAR(255) - Candidate photo URL
created_at      TIMESTAMP    - Creation timestamp
updated_at      TIMESTAMP    - Last update timestamp
```

#### `admin` (Admin Users)
```
id              INT          - Primary Key
username        VARCHAR(50)  - Login username
password_hash   VARCHAR(255) - bcrypt hashed password
full_name       VARCHAR(100) - Admin's full name
created_at      TIMESTAMP    - Creation timestamp
updated_at      TIMESTAMP    - Last update timestamp
```

---

## Authentication

### Token Types

#### Voter Token (JWT)
- **Duration**: 30 minutes
- **Payload**: `{ nim, type: 'voter' }`
- **Used for**: Voter login and voting

#### Admin Token (JWT)
- **Duration**: 24 hours
- **Payload**: `{ adminId, username, role: 'admin', type: 'admin' }`
- **Used for**: Admin operations

### Adding New Admin User

Generate password hash:
```bash
node -e "require('bcrypt').hash('your_password', 10).then(h => console.log(h))"
```

Then insert into database:
```sql
INSERT INTO admin (username, password_hash, full_name)
VALUES ('username', 'hash_from_above', 'Full Name');
```

---

## Voter Endpoints

### 1. Login - Get Access Token
**POST** `/api/voter/login`

Get JWT token for voting session.

**Request Body:**
```json
{
  "nim": "112140001",
  "token": "A1B2C3"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "voter": {
    "nim": "112140001",
    "nama": "John Doe"
  }
}
```

**Response Errors:**
- `401`: NIM tidak terdaftar
- `403`: Token belum diakses (not activated by admin)
- `401`: Token salah
- `403`: Sudah memilih (already voted)

---

### 2. Cast Vote
**POST** `/api/voter/vote`

Submit a vote (one vote per voter maximum).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "candidateId": 1
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Vote berhasil direkam"
}
```

**Features:**
- ✅ Database transaction ensures atomicity
- ✅ One vote per voter guaranteed with `FOR UPDATE` lock
- ✅ Real-time score update via WebSocket

**Response Errors:**
- `401`: Token expired/invalid
- `404`: Kandidat tidak ditemukan
- `403`: Anda sudah melakukan pemilihan

---

### 3. Get Voter Status
**GET** `/api/voter/status`

Check if current voter has already voted.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success 200):**
```json
{
  "success": true,
  "voter": {
    "nim": "112140001",
    "nama": "John Doe",
    "sudahMemilih": false,
    "waktuMemilih": null
  }
}
```

---

## Admin Endpoints

### Authentication

### 1. Admin Login
**POST** `/api/admin/login`

Login with admin credentials.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Login admin berhasil",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "username": "admin"
  }
}
```

---

### Candidate Management

### 2. Get All Candidates
**GET** `/api/admin/candidates`

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Response (Success 200):**
```json
{
  "success": true,
  "candidates": [
    {
      "id": 1,
      "nama_ketua": "Budi Santoso",
      "nama_wakil": "Ani Wijaya",
      "jumlah_suara": 150,
      "deskripsi": "Program fokus pada kesejahteraan mahasiswa",
      "foto_url": "https://example.com/candidate1.jpg",
      "created_at": "2026-04-11T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Add New Candidate
**POST** `/api/admin/candidates`

**Headers:**
```
Authorization: Bearer <adminToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "nama_ketua": "Budi Santoso",
  "nama_wakil": "Ani Wijaya",
  "deskripsi": "Program fokus pada kesejahteraan mahasiswa",
  "foto_url": "https://example.com/candidate1.jpg"
}
```

**Response (Success 201):**
```json
{
  "success": true,
  "message": "Kandidat berhasil ditambahkan",
  "candidateId": 1
}
```

---

### 4. Update Candidate
**PUT** `/api/admin/candidates/:id`

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Request Body (any combination):**
```json
{
  "nama_ketua": "Budiman Santoso",
  "deskripsi": "Updated description",
  "foto_url": "https://example.com/new_photo.jpg"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Kandidat berhasil diperbarui"
}
```

---

### 5. Delete Candidate
**DELETE** `/api/admin/candidates/:id`

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Kandidat berhasil dihapus"
}
```

---

### Voter Management

### 6. Get All Voters (Paginated)
**GET** `/api/admin/voters?page=1&limit=50&search=112140001`

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Query Parameters:**
- `page` (optional, default 1): Page number
- `limit` (optional, default 50, max 100): Results per page
- `search` (optional): Search by NIM or name

**Response (Success 200):**
```json
{
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2500,
    "totalPages": 50
  },
  "voters": [
    {
      "nim": "112140001",
      "nama": "John Doe",
      "sudahMemilih": false,
      "tokenDiambil": false,
      "waktuMemilih": null
    }
  ]
}
```

---

### 7. Get Voter Details
**GET** `/api/admin/voters/:nim`

Get specific voter information including their token.

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Response (Success 200):**
```json
{
  "success": true,
  "voter": {
    "nim": "112140001",
    "nama": "John Doe",
    "token": "A1B2C3",
    "tokenDiambil": false,
    "sudahMemilih": false,
    "waktuMemilih": null
  }
}
```

---

### 8. Activate Token for Single Voter
**POST** `/api/admin/voters/:nim/activate-token`

Mark a token as taken/activated so voter can use it.

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Token berhasil diaktifkan untuk pemilih"
}
```

---

### 9. Bulk Activate Tokens
**POST** `/api/admin/voters/bulk-activate`

Activate tokens for multiple voters at once (max 500).

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Request Body:**
```json
{
  "nims": ["112140001", "112140002", "112140003"]
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "3 token berhasil diaktifkan",
  "activated": 3
}
```

---

### 10. Reset Voter Vote
**POST** `/api/admin/voters/:nim/reset-vote`

Reset a voter's voting status (careful - vote count won't decrease).

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Status pemilihan berhasil direset. Catatan: Vote counter tidak dikurangi."
}
```

---

## Public Endpoints

### 1. Get All Candidates
**GET** `/api/candidates`

No authentication required.

**Response (Success 200):**
```json
{
  "success": true,
  "candidates": [
    {
      "id": 1,
      "nama_ketua": "Budi Santoso",
      "nama_wakil": "Ani Wijaya",
      "jumlah_suara": 150,
      "deskripsi": "Program fokus pada kesejahteraan mahasiswa",
      "foto_url": "https://example.com/candidate1.jpg"
    }
  ]
}
```

---

### 2. Get Voting Statistics Summary
**GET** `/api/stats/summary`

No authentication required. Updated in real-time.

**Response (Success 200):**
```json
{
  "success": true,
  "statistics": {
    "totalVoters": 2500,
    "votedCount": 1250,
    "remainingVoters": 1250,
    "votingPercentage": 50.0,
    "totalCandidates": 3
  },
  "candidates": [
    {
      "id": 1,
      "nama_ketua": "Budi Santoso",
      "nama_wakil": "Ani Wijaya",
      "jumlah_suara": 500,
      "percentage": "20.00"
    }
  ]
}
```

---

### 3. Get Detailed Statistics (Admin)
**GET** `/api/stats/detailed`

**Headers:**
```
Authorization: Bearer <adminToken>
```

**Response (Success 200):**
```json
{
  "success": true,
  "statistics": {
    "timeline": [
      {
        "hour": "2026-04-11 14:00:00",
        "votes": 45
      }
    ],
    "tokenStatus": [
      {
        "status": "Sudah Memilih",
        "count": 1250
      }
    ],
    "topCandidates": [
      {
        "id": 1,
        "nama_ketua": "Budi Santoso",
        "nama_wakil": "Ani Wijaya",
        "jumlah_suara": 500,
        "ranking": 1
      }
    ]
  }
}
```

---

### 4. Health Check
**GET** `/api/health`

Server status check.

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-04-11T14:30:00.000Z"
}
```

---

## WebSocket Events

### Real-time Vote Updates

#### Event: `update_scores`
Emitted to all connected clients whenever a vote is cast.

**Payload:**
```json
[
  {
    "id": 1,
    "nama_ketua": "Budi Santoso",
    "nama_wakil": "Ani Wijaya",
    "jumlah_suara": 500
  }
]
```

#### Admin Connection
```javascript
socket.emit('admin-connect'); // Register admin dashboard
```

---

## Security Features

### 1. **Authentication & Authorization**
- ✅ JWT tokens with expiration (30m voter, 24h admin)
- ✅ Role-based access control (admin/voter)
- ✅ Password hashing with bcrypt

### 2. **Data Integrity**
- ✅ Database transactions for voting (ACID properties)
- ✅ `FOR UPDATE` locks prevent race conditions
- ✅ Atomicity ensures one vote per voter

### 3. **API Security**
- ✅ Helmet.js for security headers
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Input validation with Joi
- ✅ CORS enabled for origin control

### 4. **Database Security**
- ✅ Parameterized queries prevent SQL injection
- ✅ Connection pooling for stability
- ✅ Character set properly configured (UTF8MB4)

### 5. **Audit & Logging**
- ✅ All admin actions logged
- ✅ Voting timestamps recorded
- ✅ Error logging with rotation
- ✅ Request logging middleware

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error message in Indonesian",
  "errors": [
    {
      "field": "fieldname",
      "message": "Validation error message"
    }
  ]
}
```

### Common Status Codes
- `200`: Success
- `201`: Resource created
- `400`: Bad request / validation error
- `401`: Unauthorized / invalid token
- `403`: Forbidden / already voted
- `404`: Resource not found
- `429`: Too many requests (rate limit)
- `500`: Server error

### Validation Errors
Invalid input returns 400 with detailed error array:
```json
{
  "success": false,
  "errors": [
    {
      "field": "nim",
      "message": "NIM harus 9 digit"
    },
    {
      "field": "token",
      "message": "Token diperlukan"
    }
  ]
}
```

---

## Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Response**: 429 Too Many Requests

---

## Logging

Logs are saved in `/logs/` directory:
- `info.log` - Information messages
- `warn.log` - Warnings
- `error.log` - Errors
- `debug.log` - Debug info (when DEBUG=true in .env)

---

## Running with Cloudflare Tunnel

### Setup Tunnel
```bash
cloudflare tunnel create pemira-voting
cloudflare tunnel route dns pemira-voting voting.example.com
cloudflare tunnel run --url localhost:3001 pemira-voting
```

### CORS Configuration
Update `.env` with your tunnel domain:
```env
CORS_ORIGIN=https://voting.example.com
```

---

## Performance Tips

1. **Database Indexing**: Ensure indexes are created on frequently queried fields
2. **Connection Pool**: Adjust `connectionLimit` in db.js based on load
3. **Token Expiration**: Adjust JWT expiration times as needed
4. **Rate Limiting**: Adjust based on expected traffic

---

## Troubleshooting

### "Token tidak valid"
- Ensure token sent in Authorization header with "Bearer " prefix
- Check token hasn't expired (30m for voter, 24h for admin)

### "Sudah memilih"
- Voter has already voted - database transaction prevents double votes
- Admin can reset vote status if needed

### "Token belum diakses"
- Admin hasn't activated voter's token yet
- Use activate token endpoint to enable voting

### WebSocket not updating
- Check browser console for connection errors
- Ensure Socket.IO is properly connected
- Verify CORS settings match your frontend URL

---

## Future Enhancements

1. **Vote Verification Audit Table**: Track which candidate each voter chose
2. **Two-Factor Authentication**: SMS or email verification for voters
3. **Vote Encryption**: End-to-end encryption for votes
4. **Blockchain Verification**: Optional immutable vote recording
5. **Analytics Dashboard**: Advanced voter behavior analytics
6. **Export to PDF**: Generate official voting results

---

## License & Support

For issues or questions, contact the PEMIRA 2026-2027 development team.

---

**Last Updated**: April 2026  
**System Status**: Production Ready ✅
