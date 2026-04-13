---

# PEMIRA 2026–2027 Voting System

## Overview

PEMIRA is a full-stack web-based voting system designed to handle student elections with a focus on **security, reliability, and real-time updates**.
The system supports both **on-site voting (offline devices)** and **remote access (online users)**.

Built using a modern stack:

* **Backend:** Node.js (Express)
* **Frontend:** React (Vite)
* **Database:** MySQL
* **Real-time:** WebSocket (Socket.IO)

---

## Key Features

### Voter System

* Secure login using **NIM + unique token**
* One-vote enforcement (database-level guarantee)
* Real-time vote submission
* Interactive voting interface
* Immediate confirmation after voting

### Admin Panel

* Authentication-protected dashboard
* Candidate management (CRUD)
* Voter management & token activation
* Bulk token activation via CSV
* Real-time statistics & leaderboard

### System Capabilities

* Handles **2,500+ voters**
* Real-time vote updates using WebSocket
* Audit logging for transparency
* Scalable architecture

---

## Tech Stack

| Layer    | Technology                    |
| -------- | ----------------------------- |
| Backend  | Node.js, Express              |
| Frontend | React, Vite                   |
| Database | MySQL                         |
| Auth     | JWT                           |
| Security | bcrypt, Helmet, Rate Limiting |
| Realtime | Socket.IO                     |

---

## Project Structure

```
project-root/
│
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── middleware/
│   ├── database_setup.sql
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── .env
│
├── COMPLETE_SETUP_GUIDE.md
├── PROJECT_STATUS.md
├── QUICK_REFERENCE.md
└── README.md
```

---

## Installation & Setup

### 1. Database Setup

```bash
mysql -u root -p
```

```sql
CREATE DATABASE db_pemira;
CREATE USER 'pemira_user'@'localhost' IDENTIFIED BY 'pemira_password123';
GRANT ALL PRIVILEGES ON db_pemira.* TO 'pemira_user'@'localhost';
FLUSH PRIVILEGES;
```

Import schema:

```bash
mysql -u pemira_user -p db_pemira < backend/database_setup.sql
```

---

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```

Backend runs on:

```
http://localhost:3001
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## Environment Configuration

### Backend (.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=pemira_user
DB_PASSWORD=pemira_password123
DB_NAME=db_pemira

PORT=5000
NODE_ENV=development

JWT_SECRET_VOTER=your_voter_secret
JWT_SECRET_ADMIN=your_admin_secret

CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
```

---

## Default Credentials (Development Only)

```
Admin:
username: admin
password: admin123

Voter:
NIM: 1000000001
Token: A1B2C3
```

> ⚠️ Change all credentials before production deployment.

---

## API Overview

### Voter

* `POST /api/voter/login`
* `POST /api/voter/vote`
* `GET /api/voter/status`

### Admin

* `POST /api/admin/login`
* `GET /api/admin/candidates`
* `POST /api/admin/add-candidate`
* `PUT /api/admin/candidates/:id`
* `DELETE /api/admin/candidates/:id`
* `GET /api/admin/voters`
* `POST /api/admin/activate-token`
* `POST /api/admin/bulk-activate`
* `GET /api/admin/statistics`

### Public

* `GET /api/candidates`
* `GET /api/statistics`
* `GET /api/health`

---

## Security Implementation

* JWT-based authentication (separate roles)
* Password hashing using bcrypt
* Rate limiting (100 requests / 15 minutes)
* Input validation (Joi)
* SQL injection prevention (parameterized queries)
* CORS configuration
* Audit logging for all actions

---

## Testing

### Voter Flow

1. Login with NIM + Token
2. Select candidate
3. Submit vote
4. Receive confirmation

### Admin Flow

1. Login as admin
2. Access dashboard
3. Manage candidates & voters
4. Monitor real-time voting

---

## Performance & Scalability

* Optimized for **2,500+ concurrent voters**
* Database indexing applied
* Connection pooling enabled
* WebSocket-based efficient updates

---

## Deployment Checklist

* [ ] Change default admin credentials
* [ ] Replace JWT secrets
* [ ] Enable HTTPS
* [ ] Configure production database
* [ ] Set `NODE_ENV=production`
* [ ] Configure CORS properly
* [ ] Enable logging & monitoring

---

## Project Status

**Status:** Production Ready

* Backend: Complete
* Frontend: Complete
* Database: Stable
* Security: Implemented
* Real-time Features: Active

---

## License

This project is intended for academic and organizational use.
You may modify and adapt it based on your needs.

---

## Author

Developed as a PEMIRA voting solution with focus on:

* Security
* Real-time interaction
* Scalability
* Clean architecture

---
