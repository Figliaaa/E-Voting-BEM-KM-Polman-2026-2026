# Complete Integration Guide - PEMIRA System

## Overview
This guide walks through the complete setup process for running both backend and frontend together.

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **MySQL**: 5.7 or later
- **RAM**: 2GB minimum (4GB recommended)
- **Disk Space**: 500MB minimum

### Verify Installation
```bash
node --version      # Should be v18.0.0 or higher
npm --version       # Should be 9.0.0 or higher
mysql --version     # Should be 5.7+
```

## 🗄️ Database Setup

### 1. Create Database

**Open MySQL Client:**
```bash
mysql -u root -p
```

**Create Database & User:**
```sql
CREATE DATABASE db_pemira;
CREATE USER 'pemira_user'@'localhost' IDENTIFIED BY 'pemira_password123';
GRANT ALL PRIVILEGES ON db_pemira.* TO 'pemira_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Import Schema

Navigate to backend directory and run:
```bash
mysql -u pemira_user -p db_pemira < database_setup.sql
```

When prompted, enter password: `pemira_password123`

### 3. Verify Setup
```bash
mysql -u pemira_user -p db_pemira
mysql> SHOW TABLES;
```

Should show: `admin`, `kandidat`, `pemilih`, `voting_log`, `admin_action_log`

## 🚀 Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create Backend Configuration

Create `.env` file in backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=pemira_user
DB_PASSWORD=pemira_password123
DB_NAME=db_pemira

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET_VOTER=voter_secret_key_2026_2027
JWT_SECRET_ADMIN=admin_secret_key_2026_2027
JWT_EXPIRY_VOTER=30m
JWT_EXPIRY_ADMIN=24h

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Verify Database Connection

Run the test script:
```bash
npm run test:db
```

Should output:
```
✅ Successfully connected to database
✅ db_pemira database ready
```

### 4. Generate Admin Password Hash

Run:
```bash
npm run generate:admin
```

Output will show:
```
Admin user created/updated successfully
Username: admin
Password: admin123
Hash stored in database
```

### 5. Seed Test Data (Optional)

```bash
npm run seed:voters
```

This creates 100 test voters:
- Format: NIM starting from 1000000001
- Format: Token format like A1B2C3

### 6. Start Backend Server

```bash
npm start
```

Should output:
```
🚀 PEMIRA Backend Server Running
📍 Server: http://localhost:5000
📊 WebSocket: Active on port 5000
🗄️  Database: Connected
🔐 Security: Helmet, Rate Limit, CORS enabled
```

**Keep this terminal open** - Backend must be running for frontend to work.

## 🎨 Frontend Setup

### 1. Install Dependencies

Open new terminal/command prompt:

```bash
cd frontend
npm install
```

### 2. Configure Environment

Verify `.env` file exists with:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Frontend Development Server

```bash
npm run dev
```

Should output:
```
  VITE v8.0.4
  ➜ Local: http://localhost:5173/
  ➜ press h + enter to show help
```

## ✅ Verification Checklist

### Backend Health Check

Open browser and navigate to:
```
http://localhost:5000/api/health
```

Should return:
```json
{
  "status": "OK",
  "server": "PEMIRA Backend",
  "environment": "development",
  "database": "connected",
  "websocket": "active"
}
```

### Frontend Access

Open browser and navigate to:
```
http://localhost:5173/
```

Should show:
- 🤠 PEMIRA title
- 👤 Voter and 🤠 Staff buttons
- Wild west themed interface

### Database Connection

Run in backend directory:
```bash
npm run test:db
```

Should show all tables created successfully.

## 🧪 Testing the System

### Complete Voter Flow

1. **Open Frontend** → http://localhost:5173
2. **Click "I'M A VOTER"**
3. **Login with Test Credentials:**
   - NIM: `1000000001` (or any voter from seed)
   - Token: `A1B2C3` (or actual token from database)
4. **Click on Candidate** to select
5. **Click "PULL THE TRIGGER"** to vote
6. **See Success Screen** with celebration animation
7. **Verify Real-time Update** - Open another browser tab and see vote count increase

### Complete Admin Flow

1. **Open Frontend** → http://localhost:5173
2. **Click "I'M STAFF"**
3. **Login with Credentials:**
   - Username: `admin`
   - Password: `admin123`
4. **View Dashboard:**
   - Check statistics
   - View candidate leaderboard
   - Check participation rate
5. **Manage Candidates:**
   - Add new candidate
   - Edit existing candidate
   - View vote counts
6. **Manage Voters:**
   - Search by NIM
   - Activate individual tokens
   - Upload CSV for bulk activation

### Real-time Updates Test

1. Have admin dashboard open in one browser
2. Have voter voting page open in another browser
3. Cast vote in voter browser
4. Watch admin dashboard update instantly with new vote count

## 🌐 Network Access (Optional)

### Access from Other Machines

#### For Backend:

1. **Find Your Machine IP:**
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.x.x)
   
   # Mac/Linux
   ifconfig | grep "inet "
   ```

2. **Update Backend .env:**
   ```env
   CORS_ORIGIN=http://192.168.x.x:5173
   ```

3. **Update Frontend .env:**
   ```env
   VITE_API_URL=http://192.168.x.x:5000/api
   ```

4. **Access from Other Machine:**
   - Backend: `http://192.168.x.x:5000`
   - Frontend: `http://192.168.x.x:5173`

### Using Cloudflare Tunnel (Internet Access)

#### Backend Tunnel:

1. **Install Cloudflare Tunnel:**
   ```bash
   npm install -g @cloudflare/wrangler
   ```

2. **Create Tunnel in Backend:**
   ```bash
   wrangler tunnel login
   wrangler tunnel create pemira-backend
   wrangler tunnel route dns pemira-backend.trycloudflare.com
   ```

3. **Update Frontend .env:**
   ```env
   VITE_API_URL=https://pemira-backend.trycloudflare.com/api
   ```

## 📊 Monitoring

### View Backend Logs

Backend creates logs in `backend/logs/` directory:

```bash
tail -f backend/logs/app.log
```

### Monitor Database Activity

```bash
mysql -u pemira_user -p db_pemira
mysql> SELECT * FROM admin_action_log ORDER BY created_at DESC LIMIT 10;
```

### Real-time WebSocket Connection

Open browser developer tools (F12) → Network tab → Filter by "WS"

Should show active WebSocket connection to backend.

## 🛠️ Troubleshooting

### Backend Won't Start

**Error: "Cannot connect to database"**
```
Solution:
1. Verify MySQL is running
2. Check DB_HOST, DB_USER, DB_PASSWORD in .env
3. Run: npm run test:db
```

**Error: "Port 5000 already in use"**
```
Solution:
1. Find process using port 5000:
   # Windows: netstat -ano | findstr :5000
   # Mac/Linux: lsof -i :5000
2. Kill process or change PORT in .env
```

### Frontend Won't Connect to Backend

**Error: "Failed to fetch from API"**
```
Solution:
1. Verify VITE_API_URL in .env
2. Verify backend is running
3. Check browser console (F12)
4. Try curl: curl http://localhost:5000/api/health
```

**Error: "WebSocket connection failed"**
```
Solution:
1. Check firewall allows port 5000
2. Verify Socket.IO configured in backend
3. Check browser developer tools → Network
```

### Database Issues

**Error: "Access denied"**
```
Solution:
mysql -u root -p
mysql> ALTER USER 'pemira_user'@'localhost' IDENTIFIED BY 'pemira_password123';
mysql> FLUSH PRIVILEGES;
```

**Error: "Table doesn't exist"**
```
Solution:
1. Re-run database setup script
2. Verify database_setup.sql exists
3. Ensure correct database selected
```

### Vote Not Being Recorded

**Troubleshooting Steps:**
1. Check backend logs for errors
2. Verify JWT token valid in local storage
3. Check database for entry in `voting_log`
4. Try logging out and back in

## 🔄 Restart Procedures

### Clean Restart (Keep Data)

```bash
# Backend
cd backend
npm start

# Frontend (new terminal)
cd frontend
npm run dev
```

### Full Reset (Clear Data - CAREFUL!)

```bash
# Clear votes only
mysql -u pemira_user -p db_pemira
mysql> UPDATE pemilih SET status_pilih = 0;
mysql> UPDATE kandidat SET jumlah_suara = 0;
mysql> TRUNCATE TABLE voting_log;
mysql> TRUNCATE TABLE admin_action_log;
```

### Hard Reset (Recreate Everything)

```bash
# Database
mysql -u root -p
mysql> DROP DATABASE db_pemira;
mysql> Create from scratch (see Database Setup above)

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend  
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📈 Performance Tips

### For Large Voter Lists (1000+)

1. **Enable Database Caching:**
   ```env
   DB_CONNECTION_POOL=100
   ```

2. **Optimize Queries:**
   - Already done in backend with indexes
   - Check `database_setup.sql` for INDEX definitions

3. **Frontend Optimization:**
   - Use pagination on voter lists
   - Lazy load candidate images

### WebSocket Performance

If experiencing lag:

1. **Increase Connection Pool:**
   ```env
   DB_CONNECTION_POOL=50  # Default
   DB_CONNECTION_POOL=100 # For 1000+ voters
   ```

2. **Reduce Update Frequency:**
   - Backend broadcasts on each vote
   - Add throttling if needed

## 🔐 Security Checklist (Production)

- [ ] Change default admin password immediately
- [ ] Change JWT secrets to strong random values
- [ ] Enable HTTPS/SSL on production
- [ ] Update CORS_ORIGIN to production domain
- [ ] Enable rate limiting (already configured)
- [ ] Set NODE_ENV=production
- [ ] Use strong database password
- [ ] Backup database regularly
- [ ] Monitor error logs for suspicious activity
- [ ] Keep Node.js and dependencies updated

## 📞 Support Contacts

### Backend Issues
- Check `backend/logs/app.log`
- Review API endpoints in API_DOCUMENTATION.md
- Test with curl: `curl http://localhost:5000/api/health`

### Frontend Issues
- Check browser console (F12)
- Clear browser cache and localStorage
- Test with different browser

### Database Issues
- Verify MySQL running: `sudo systemctl status mysql`
- Check permissions: `mysql -u root -p -e "SHOW GRANTS FOR 'pemira_user'@'localhost';"`

## 📝 Quick Command Reference

```bash
# Backend
cd backend
npm install          # Install dependencies
npm start           # Start server
npm run test:db     # Test database connection
npm run generate:admin  # Generate admin user
npm run seed:voters # Create test voters
npm run build       # Build for production

# Frontend
cd frontend
npm install         # Install dependencies
npm run dev         # Start dev server
npm run build       # Build for production
npm run lint        # Check code style
npm run preview     # Preview production build

# Database
mysql -u pemira_user -p db_pemira      # Connect to database
SHOW TABLES;                            # List all tables
SELECT * FROM admin;                    # View admins
SELECT COUNT(*) FROM pemilih;          # Count voters
SELECT COUNT(*) FROM voting_log;       # Count votes cast
```

## 🎉 You're All Set!

Your PEMIRA voting system is now ready. Visit `http://localhost:5173` to start voting!

Remember:
- ✅ Backend must always be running
- ✅ Frontend connects to backend via API
- ✅ Database persists all data
- ✅ Each voter can only vote once (backend enforces)
- ✅ Admin can manage candidates and voters
- ✅ Real-time updates show live results

Happy voting! 🤠
