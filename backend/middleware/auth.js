const jwt = require('jsonwebtoken');

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'BEM_ADMIN_SECRET_2026';
const VOTER_SECRET = process.env.VOTER_SECRET || 'BEM_VOTER_SECRET_2026';

const verifyVoterToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token diperlukan' });
    }

    try {
        const decoded = jwt.verify(token, VOTER_SECRET);
        req.voter = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token sudah kadaluarsa' });
        }
        return res.status(401).json({ success: false, message: 'Token tidak valid' });
    }
};

const verifyAdminToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token admin diperlukan' });
    }

    try {
        const decoded = jwt.verify(token, ADMIN_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Hanya admin yang dapat mengakses' });
        }
        
        req.admin = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token admin sudah kadaluarsa' });
        }
        return res.status(401).json({ success: false, message: 'Token admin tidak valid' });
    }
};

// Generate voter token
const generateVoterToken = (nim) => {
    return jwt.sign(
        { nim, type: 'voter' },
        VOTER_SECRET,
        { expiresIn: '30m' }  
    );
};

const generateAdminToken = (adminId, username) => {
    return jwt.sign(
        { adminId, username, role: 'admin', type: 'admin' },
        ADMIN_SECRET,
        { expiresIn: '24h' }
    );
};

module.exports = {
    verifyVoterToken,
    verifyAdminToken,
    generateVoterToken,
    generateAdminToken,
    ADMIN_SECRET,
    VOTER_SECRET
};
