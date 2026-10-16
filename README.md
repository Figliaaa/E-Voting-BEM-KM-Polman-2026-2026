# PEMIRA 2026 Voting System

## Overview
PEMIRA is a full‑stack web‑based voting system designed for student elections at Polman. It focuses on **security**, **reliability**, and **real‑time updates**. Both on‑site (offline devices) and remote (online) voting are supported.

---

## Tech Stack
| Layer    | Technology |
| -------- | ---------- |
| Backend  | Node.js, Express |
| Frontend | React, Vite |
| Database | MySQL |
| Auth     | JWT |
| Security | bcryptjs, Helmet, Rate Limiting |
| Realtime | Socket.IO |

---

## Project Structure
```
project-root/
│
├─ backend/
│   ├─ server.js
│   ├─ db.js
│   ├─ middleware/
│   ├─ database_setup.sql   # schema & seed data
│   └─ .env                # backend environment variables
│
├─ frontend/
│   ├─ src/
│   ├─ components/
│   ├─ pages/
│   └─ .env                # frontend environment variables
│
├─ COMPLETE_SETUP_GUIDE.md
├─ PROJECT_STATUS.md
├─ QUICK_REFERENCE.md
└─ README.md
```

---

## Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- **MySQL** ≥ 5.7 (XAMPP / Laragon works out of the box)
- **Git** (optional, for version control)

---

## Installation & Setup
### 1️⃣ Database Setup
```bash
# Open MySQL client as root
mysql -u root -p
```
```sql
CREATE DATABASE db_pemira;
CREATE USER 'pemira_user'@'localhost' IDENTIFIED BY 'pemira_password123';
GRANT ALL PRIVILEGES ON db_pemira.* TO 'pemira_user'@'localhost';
FLUSH PRIVILEGES;
```
Import the schema and seed data:
```bash
mysql -u pemira_user -p db_pemira < backend/database_setup.sql
```
> **Tip:** The seed includes an admin account and a few sample voters.

### 2️⃣ Backend Setup
```bash
cd backend
npm install      # installs dependencies (bcryptjs replaces native bcrypt)
npm start          # starts the server on http://localhost:3001
```
The server will automatically load environment variables from `backend/.env`.

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run dev       # starts Vite on http://localhost:5173
```
The frontend expects the backend API at `http://localhost:3001` (see `.env` below).

---

## Environment Configuration
### Backend (`backend/.env`)
```env
# Database connection
DB_HOST=localhost
DB_PORT=3306
DB_USER=pemira_user
DB_PASSWORD=pemira_password123
DB_NAME=db_pemira

# Server
PORT=3001               # <-- keep this in sync with README
NODE_ENV=development

# JWT secrets (change for production!)
JWT_SECRET_VOTER=your_voter_secret
JWT_SECRET_ADMIN=your_admin_secret

# CORS – allow the Vite dev server
CORS_ORIGIN=http://localhost:5173
```
### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```
> **Important:** Never commit these `.env` files to a public repository.

---

## Default Credentials (Development Only)
```text
# Admin
username: admin
password: admin123

# Sample Voter
NIM: 221001001
Token: ABC123   (already activated)
```
⚠️ Change all credentials before deploying to production.

---

## API Overview
### Voter Endpoints
- `POST /api/voter/login` – login with NIM & token
- `POST /api/voter/vote` – cast a vote (requires auth token)
- `GET /api/voter/status` – check voting status

### Admin Endpoints
- `POST /api/admin/login` – admin login
- `GET /api/admin/candidates` – list all candidates
- `POST /api/admin/candidates` – add a candidate
- `PUT /api/admin/candidates/:id` – update a candidate
- `DELETE /api/admin/candidates/:id` – remove a candidate
- `GET /api/admin/voters` – list voters
- `POST /api/admin/voters/activate` – bulk token activation

---

## Running the Application
1. Start MySQL (XAMPP/Laragon).
2. `npm start` in `backend/` → API available at **http://localhost:3001**.
3. `npm run dev` in `frontend/` → UI available at **http://localhost:5173**.
4. Open the URL, log in with the sample credentials above, and explore the voting flow.

---

## Known Issues & Tips
- The project uses **bcryptjs** instead of native `bcrypt` to avoid compilation problems on Windows.
- If you change the backend port, update `backend/.env` **PORT** and the `VITE_API_URL` / `VITE_WS_URL` in `frontend/.env`.
- For production, replace JWT secrets, disable the `CORS_ORIGIN=*` fallback, and secure the MySQL credentials.

---

## Contributing
Feel free to open issues or submit pull requests. When contributing, keep the README up‑to‑date and add appropriate documentation for any new features.
