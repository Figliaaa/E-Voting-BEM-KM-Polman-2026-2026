const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
require('dotenv').config();

const db = require('./db.js');
const { 
    verifyVoterToken, 
    verifyAdminToken, 
    generateVoterToken, 
    generateAdminToken 
} = require('./middleware/auth.js');
const { 
    validate, 
    loginSchema, 
    voteSchema, 
    adminLoginSchema, 
    candidateSchema, 
    updateCandidateSchema 
} = require('./middleware/validators.js');
const { 
    logger, 
    errorHandler, 
    requestLogger 
} = require('./middleware/errorHandler.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: process.env.CORS_ORIGIN || "*",
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    } 
});

// ============================================
// MIDDLEWARE SETUP
// ============================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet()); // Security headers
app.use(express.json());
app.use(requestLogger);

const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: 'Terlalu banyak permintaan, silahkan coba lagi nanti'
});
app.use('/api/', limiter);

// ============================================
// SOCKET.IO SETUP - Real-time updates
// ============================================
const connectedAdmins = new Set();

io.on('connection', (socket) => {
    logger.info('New WebSocket connection', { socketId: socket.id });
    
    socket.on('admin-connect', () => {
        connectedAdmins.add(socket.id);
        logger.info('Admin connected to dashboard', { admins: connectedAdmins.size });
    });
    
    socket.on('disconnect', () => {
        connectedAdmins.delete(socket.id);
        logger.info('User disconnected', { socketId: socket.id });
    });
});

const broadcastScores = async () => {
    try {
        const [candidates] = await db.execute(
            'SELECT id, nama_ketua, nama_wakil, jumlah_suara FROM kandidat ORDER BY jumlah_suara DESC'
        );
        io.emit('update_scores', candidates);
    } catch (err) {
        logger.error('Error broadcasting scores', { error: err.message });
    }
};

// ============================================
// VOTER AUTHENTICATION ENDPOINTS
// ============================================

/**
 * POST /api/voter/login
 * Login with NIM + Token
 * Body: { nim: string, token: string }
 * Returns: { success: boolean, message: string, accessToken?: string }
 */
app.post('/api/voter/login', validate(loginSchema), async (req, res, next) => {
    try {
        const { nim, token } = req.validatedData;

        const [rows] = await db.execute(
            'SELECT nim, nama, status_pilih, token_diambil FROM pemilih WHERE nim = ?',
            [nim]
        );

        if (rows.length === 0) {
            logger.warn('Login attempt with invalid NIM', { nim });
            return res.status(401).json({ 
                success: false, 
                message: 'NIM tidak terdaftar' 
            });
        }

        const voter = rows[0];

        if (!voter.token_diambil) {
            logger.warn('Token not activated', { nim });
            return res.status(403).json({ 
                success: false, 
                message: 'Token belum diakses. Hubungi admin untuk aktivasi token.' 
            });
        }

        // Verify token (simple comparison, can upgrade to bcrypt if needed)
        // Note: In generate.js, tokens are stored as plain hex strings
        // For production, consider hashing tokens
        const [tokenCheck] = await db.execute(
            'SELECT token FROM pemilih WHERE nim = ? AND token = ?',
            [nim, token.toUpperCase()]
        );

        if (tokenCheck.length === 0) {
            logger.warn('Login attempt with invalid token', { nim });
            return res.status(401).json({ 
                success: false, 
                message: 'Token salah' 
            });
        }

        if (voter.status_pilih) {
            logger.warn('Voter already voted', { nim });
            return res.status(403).json({ 
                success: false, 
                message: 'Anda sudah melakukan pemilihan' 
            });
        }

        const accessToken = generateVoterToken(nim);
        
        logger.info('Voter logged in successfully', { nim });
        
        res.json({ 
            success: true, 
            message: 'Login berhasil',
            accessToken,
            voter: {
                nim,
                nama: voter.nama
            }
        });

    } catch (error) {
        logger.error('Login error', { error: error.message });
        next(error);
    }
});

/**
 * POST /api/voter/vote
 * Cast a vote (One vote per voter, uses transaction)
 * Headers: Authorization: Bearer <accessToken>
 * Body: { candidateId: number }
 * Returns: { success: boolean, message: string }
 */
app.post('/api/voter/vote', verifyVoterToken, validate(voteSchema), async (req, res, next) => {
    const connection = await db.getConnection();
    
    try {
        const { candidateId } = req.validatedData;
        const { nim } = req.voter;

        const [candidateCheck] = await connection.execute(
            'SELECT id FROM kandidat WHERE id = ?',
            [candidateId]
        );

        if (candidateCheck.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kandidat tidak ditemukan' 
            });
        }

        await connection.beginTransaction();

        const [statusCheck] = await connection.execute(
            'SELECT status_pilih FROM pemilih WHERE nim = ? FOR UPDATE',
            [nim]
        );

        if (statusCheck.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ 
                success: false, 
                message: 'Pemilih tidak ditemukan' 
            });
        }

        if (statusCheck[0].status_pilih) {
            await connection.rollback();
            connection.release();
            logger.warn('Double vote attempt', { nim, candidateId });
            return res.status(403).json({ 
                success: false, 
                message: 'Anda sudah melakukan pemilihan' 
            });
        }

        const [updateVoter] = await connection.execute(
            'UPDATE pemilih SET status_pilih = 1, waktu_pilih = NOW() WHERE nim = ?',
            [nim]
        );

        const [updateCandidate] = await connection.execute(
            'UPDATE kandidat SET jumlah_suara = jumlah_suara + 1 WHERE id = ?',
            [candidateId]
        );

        await connection.commit();
        connection.release();

        logger.info('Vote cast successfully', { nim, candidateId });

        await broadcastScores();

        res.json({ 
            success: true, 
            message: 'Vote berhasil direkam' 
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        logger.error('Voting error', { error: error.message, nim: req.voter.nim });
        next(error);
    }
});

/**
 * GET /api/voter/status
 * Get current voter's voting status and info
 * Headers: Authorization: Bearer <accessToken>
 */
app.get('/api/voter/status', verifyVoterToken, async (req, res, next) => {
    try {
        const { nim } = req.voter;

        const [rows] = await db.execute(
            'SELECT nim, nama, status_pilih, waktu_pilih FROM pemilih WHERE nim = ?',
            [nim]
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pemilih tidak ditemukan' 
            });
        }

        const voter = rows[0];

        res.json({ 
            success: true,
            voter: {
                nim: voter.nim,
                nama: voter.nama,
                sudahMemilih: voter.status_pilih === 1,
                waktuMemilih: voter.waktu_pilih
            }
        });

    } catch (error) {
        logger.error('Get voter status error', { error: error.message });
        next(error);
    }
});

// ============================================
// ADMIN AUTHENTICATION ENDPOINTS
// ============================================

/**
 * POST /api/admin/login
 * Admin login
 * Body: { username: string, password: string }
 */
app.post('/api/admin/login', validate(adminLoginSchema), async (req, res, next) => {
    try {
        const { username, password } = req.validatedData;

        const [admins] = await db.execute(
            'SELECT id, username, password_hash, full_name FROM admin WHERE username = ?',
            [username]
        );

        if (admins.length === 0) {
            logger.warn('Admin login attempt with invalid username', { username });
            return res.status(401).json({ 
                success: false, 
                message: 'Username atau password salah' 
            });
        }

        const admin = admins[0];

        const passwordMatch = await bcrypt.compare(password, admin.password_hash);

        if (!passwordMatch) {
            logger.warn('Admin login attempt with invalid password', { username });
            return res.status(401).json({ 
                success: false, 
                message: 'Username atau password salah' 
            });
        }

        const accessToken = generateAdminToken(admin.id, admin.username);

        logger.info('Admin logged in successfully', { username });

        res.json({ 
            success: true, 
            message: 'Login admin berhasil',
            accessToken,
            admin: {
                id: admin.id,
                username: admin.username,
                full_name: admin.full_name
            }
        });

    } catch (error) {
        logger.error('Admin login error', { error: error.message });
        next(error);
    }
});

// ============================================
// CANDIDATE MANAGEMENT ENDPOINTS (Admin Only)
// ============================================

/**
 * GET /api/admin/candidates
 * Get all candidates
 * Headers: Authorization: Bearer <adminToken>
 */
app.get('/api/admin/candidates', verifyAdminToken, async (req, res, next) => {
    try {
        const [candidates] = await db.execute(
            'SELECT id, nama_ketua, nama_wakil, jumlah_suara, deskripsi, foto_url, created_at FROM kandidat ORDER BY id ASC'
        );

        res.json({ 
            success: true,
            candidates 
        });

    } catch (error) {
        logger.error('Get candidates error', { error: error.message });
        next(error);
    }
});

/**
 * POST /api/admin/candidates
 * Add new candidate
 * Headers: Authorization: Bearer <adminToken>
 * Body: { nama_ketua, nama_wakil, deskripsi?, foto_url? }
 */
app.post('/api/admin/candidates', verifyAdminToken, validate(candidateSchema), async (req, res, next) => {
    try {
        const { nama_ketua, nama_wakil, deskripsi, foto_url } = req.validatedData;

        const [result] = await db.execute(
            'INSERT INTO kandidat (nama_ketua, nama_wakil, deskripsi, foto_url, jumlah_suara) VALUES (?, ?, ?, ?, 0)',
            [nama_ketua, nama_wakil, deskripsi || null, foto_url || null]
        );

        logger.info('New candidate added', { 
            id: result.insertId, 
            nama_ketua, 
            nama_wakil,
            adminId: req.admin.adminId 
        });

        res.status(201).json({ 
            success: true, 
            message: 'Kandidat berhasil ditambahkan',
            candidateId: result.insertId
        });

    } catch (error) {
        logger.error('Add candidate error', { error: error.message });
        next(error);
    }
});

/**
 * PUT /api/admin/candidates/:id
 * Update candidate
 * Headers: Authorization: Bearer <adminToken>
 * Body: { nama_ketua?, nama_wakil?, deskripsi?, foto_url? }
 */
app.put('/api/admin/candidates/:id', verifyAdminToken, validate(updateCandidateSchema), async (req, res, next) => {
    try {
        const candidateId = req.params.id;
        const updates = req.validatedData;

        // Build dynamic update query
        const updateFields = Object.keys(updates)
            .map(field => `${field} = ?`)
            .join(', ');
        
        const updateValues = [
            ...Object.values(updates),
            candidateId
        ];

        const [result] = await db.execute(
            `UPDATE kandidat SET ${updateFields} WHERE id = ?`,
            updateValues
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kandidat tidak ditemukan' 
            });
        }

        logger.info('Candidate updated', { 
            candidateId,
            updates,
            adminId: req.admin.adminId 
        });

        res.json({ 
            success: true, 
            message: 'Kandidat berhasil diperbarui' 
        });

    } catch (error) {
        logger.error('Update candidate error', { error: error.message });
        next(error);
    }
});

/**
 * DELETE /api/admin/candidates/:id
 * Delete candidate
 * Headers: Authorization: Bearer <adminToken>
 */
app.delete('/api/admin/candidates/:id', verifyAdminToken, async (req, res, next) => {
    try {
        const candidateId = req.params.id;

        const [result] = await db.execute(
            'DELETE FROM kandidat WHERE id = ?',
            [candidateId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kandidat tidak ditemukan' 
            });
        }

        logger.info('Candidate deleted', { 
            candidateId,
            adminId: req.admin.adminId 
        });

        res.json({ 
            success: true, 
            message: 'Kandidat berhasil dihapus' 
        });

    } catch (error) {
        logger.error('Delete candidate error', { error: error.message });
        next(error);
    }
});

// ============================================
// VOTER MANAGEMENT ENDPOINTS (Admin Only)
// ============================================

/**
 * GET /api/admin/voters
 * Get all voters with pagination
 * Query: ?page=1&limit=50&search=nim_or_name
 * Headers: Authorization: Bearer <adminToken>
 */
app.get('/api/admin/voters', verifyAdminToken, async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 50);
        const search = req.query.search || '';
        const offset = (page - 1) * limit;

        let query = 'SELECT nim, nama, status_pilih, token_diambil, waktu_pilih FROM pemilih';
        let countQuery = 'SELECT COUNT(*) as total FROM pemilih';
        const params = [];

        if (search) {
            query += ' WHERE nim LIKE ? OR nama LIKE ?';
            countQuery += ' WHERE nim LIKE ? OR nama LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Get total count
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        // Get paginated results
        const [voters] = await db.execute(
            query + ' ORDER BY nim ASC LIMIT ? OFFSET ?',
            [...params, limit, offset]
        );

        res.json({ 
            success: true,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            voters: voters.map(v => ({
                nim: v.nim,
                nama: v.nama,
                sudahMemilih: v.status_pilih === 1,
                tokenDiambil: v.token_diambil === 1,
                waktuMemilih: v.waktu_pilih
            }))
        });

    } catch (error) {
        logger.error('Get voters error', { error: error.message });
        next(error);
    }
});

/**
 * GET /api/admin/voters/:nim
 * Get specific voter details
 * Headers: Authorization: Bearer <adminToken>
 */
app.get('/api/admin/voters/:nim', verifyAdminToken, async (req, res, next) => {
    try {
        const { nim } = req.params;

        const [voters] = await db.execute(
            'SELECT nim, nama, status_pilih, token_diambil, waktu_pilih, token FROM pemilih WHERE nim = ?',
            [nim]
        );

        if (voters.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pemilih tidak ditemukan' 
            });
        }

        const voter = voters[0];

        res.json({ 
            success: true,
            voter: {
                nim: voter.nim,
                nama: voter.nama,
                token: voter.token,
                tokenDiambil: voter.token_diambil === 1,
                sudahMemilih: voter.status_pilih === 1,
                waktuMemilih: voter.waktu_pilih
            }
        });

    } catch (error) {
        logger.error('Get voter details error', { error: error.message });
        next(error);
    }
});

/**
 * POST /api/admin/voters/:nim/activate-token
 * Mark token as taken/activated by voter
 * Headers: Authorization: Bearer <adminToken>
 */
app.post('/api/admin/voters/:nim/activate-token', verifyAdminToken, async (req, res, next) => {
    try {
        const { nim } = req.params;

        const [voters] = await db.execute(
            'SELECT token_diambil FROM pemilih WHERE nim = ?',
            [nim]
        );

        if (voters.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pemilih tidak ditemukan' 
            });
        }

        if (voters[0].token_diambil) {
            return res.status(400).json({ 
                success: false, 
                message: 'Token sudah diaktifkan sebelumnya' 
            });
        }

        const [result] = await db.execute(
            'UPDATE pemilih SET token_diambil = 1 WHERE nim = ?',
            [nim]
        );

        logger.info('Voter token activated', { 
            nim,
            adminId: req.admin.adminId 
        });

        res.json({ 
            success: true, 
            message: 'Token berhasil diaktifkan untuk pemilih' 
        });

    } catch (error) {
        logger.error('Activate token error', { error: error.message });
        next(error);
    }
});

/**
 * POST /api/admin/voters/bulk-activate
 * Bulk activate tokens for multiple voters
 * Headers: Authorization: Bearer <adminToken>
 * Body: { nims: string[] }
 */
app.post('/api/admin/voters/bulk-activate', verifyAdminToken, async (req, res, next) => {
    try {
        const { nims } = req.body;

        if (!Array.isArray(nims) || nims.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'List NIM tidak valid' 
            });
        }

        if (nims.length > 500) {
            return res.status(400).json({ 
                success: false, 
                message: 'Maksimal 500 NIM per bulk activation' 
            });
        }

        const placeholders = nims.map(() => '?').join(',');
        
        const [result] = await db.execute(
            `UPDATE pemilih SET token_diambil = 1 WHERE nim IN (${placeholders}) AND token_diambil = 0`,
            nims
        );

        logger.info('Bulk token activation', { 
            count: result.affectedRows,
            adminId: req.admin.adminId 
        });

        res.json({ 
            success: true, 
            message: `${result.affectedRows} token berhasil diaktifkan`,
            activated: result.affectedRows
        });

    } catch (error) {
        logger.error('Bulk activate error', { error: error.message });
        next(error);
    }
});

/**
 * DELETE /api/admin/voters/:nim/reset-vote
 * Reset voter's vote status (Admin only, use with caution)
 * Headers: Authorization: Bearer <adminToken>
 */
app.post('/api/admin/voters/:nim/reset-vote', verifyAdminToken, async (req, res, next) => {
    const connection = await db.getConnection();
    
    try {
        const { nim } = req.params;

        await connection.beginTransaction();

        // Get voter's current candidate if voted
        const [voter] = await connection.execute(
            'SELECT status_pilih FROM pemilih WHERE nim = ?',
            [nim]
        );

        if (voter.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ 
                success: false, 
                message: 'Pemilih tidak ditemukan' 
            });
        }

        // Note: We don't track which candidate they voted for, so we can't decrement votes
        // This is a limitation of the current schema. Consider adding a vote record table.
        
        const [result] = await connection.execute(
            'UPDATE pemilih SET status_pilih = 0, waktu_pilih = NULL WHERE nim = ?',
            [nim]
        );

        await connection.commit();
        connection.release();

        logger.warn('Voter vote reset', { 
            nim,
            adminId: req.admin.adminId 
        });

        res.json({ 
            success: true, 
            message: 'Status pemilihan berhasil direset. Catatan: Vote counter tidak dikurangi.' 
        });

    } catch (error) {
        await connection.rollback();
        connection.release();
        logger.error('Reset vote error', { error: error.message });
        next(error);
    }
});

// ============================================
// STATISTICS & DASHBOARD ENDPOINTS
// ============================================

/**
 * GET /api/stats/summary
 * Get voting statistics summary (Public endpoint)
 */
app.get('/api/stats/summary', async (req, res, next) => {
    try {
        // Total voters
        const [totalVotersResult] = await db.execute(
            'SELECT COUNT(*) as total FROM pemilih'
        );

        // Voters who have voted
        const [votedResult] = await db.execute(
            'SELECT COUNT(*) as total FROM pemilih WHERE status_pilih = 1'
        );

        // Candidates with votes
        const [candidates] = await db.execute(
            'SELECT id, nama_ketua, nama_wakil, jumlah_suara FROM kandidat ORDER BY jumlah_suara DESC'
        );

        const totalVoters = totalVotersResult[0].total;
        const votedCount = votedResult[0].total;
        const votingPercentage = totalVoters > 0 ? ((votedCount / totalVoters) * 100).toFixed(2) : 0;

        res.json({ 
            success: true,
            statistics: {
                totalVoters,
                votedCount,
                remainingVoters: totalVoters - votedCount,
                votingPercentage: parseFloat(votingPercentage),
                totalCandidates: candidates.length
            },
            candidates: candidates.map(c => ({
                id: c.id,
                nama_ketua: c.nama_ketua,
                nama_wakil: c.nama_wakil,
                jumlah_suara: c.jumlah_suara,
                percentage: totalVoters > 0 ? ((c.jumlah_suara / totalVoters) * 100).toFixed(2) : 0
            }))
        });

    } catch (error) {
        logger.error('Get statistics error', { error: error.message });
        next(error);
    }
});

/**
 * GET /api/stats/detailed
 * Get detailed statistics (Admin only)
 * Headers: Authorization: Bearer <adminToken>
 */
app.get('/api/stats/detailed', verifyAdminToken, async (req, res, next) => {
    try {
        // Voting timeline (votes per hour)
        const [timeline] = await db.execute(`
            SELECT 
                DATE_FORMAT(waktu_pilih, '%Y-%m-%d %H:00:00') as hour,
                COUNT(*) as votes
            FROM pemilih
            WHERE status_pilih = 1 AND waktu_pilih IS NOT NULL
            GROUP BY DATE_FORMAT(waktu_pilih, '%Y-%m-%d %H:00:00')
            ORDER BY hour DESC
            LIMIT 24
        `);

        const [tokenStats] = await db.execute(`
            SELECT 
                CASE 
                    WHEN token_diambil = 1 AND status_pilih = 1 THEN 'Sudah Memilih'
                    WHEN token_diambil = 1 AND status_pilih = 0 THEN 'Token Diambil Belum Vote'
                    WHEN token_diambil = 0 THEN 'Token Belum Diambil'
                END as status,
                COUNT(*) as count
            FROM pemilih
            GROUP BY token_diambil, status_pilih
        `);

        const [topCandidates] = await db.execute(`
            SELECT 
                id,
                nama_ketua,
                nama_wakil,
                jumlah_suara,
                RANK() OVER (ORDER BY jumlah_suara DESC) as ranking
            FROM kandidat
            ORDER BY jumlah_suara DESC
        `);

        res.json({ 
            success: true,
            statistics: {
                timeline,
                tokenStatus: tokenStats,
                topCandidates
            }
        });

    } catch (error) {
        logger.error('Get detailed statistics error', { error: error.message });
        next(error);
    }
});

// ============================================
// PUBLIC ENDPOINTS
// ============================================

/**
 * GET /api/candidates
 * Get all candidates (Public)
 */
app.get('/api/candidates', async (req, res, next) => {
    try {
        const [candidates] = await db.execute(
            'SELECT id, nama_ketua, nama_wakil, jumlah_suara, deskripsi, foto_url FROM kandidat ORDER BY id ASC'
        );

        res.json({ 
            success: true,
            candidates 
        });

    } catch (error) {
        logger.error('Get public candidates error', { error: error.message });
        next(error);
    }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} tidak ditemukan`
    });
});

app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    logger.info(`🚀 Voting System Server running on port ${PORT}`);
    logger.info(`📊 WebSocket ready for live updates`);
    logger.info(`🔒 Security features enabled: Helmet, Rate Limiting, JWT Auth`);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

module.exports = { app, io };