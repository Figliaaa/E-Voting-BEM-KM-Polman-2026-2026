const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASS || '', 
    database: process.env.DB_NAME || 'db_pemira',
    waitForConnections: true,
    connectionLimit: 50,          
    queueLimit: 100,               
    enableKeepAlive: true,
    keepAliveInitialDelayMs: 0,
    charset: 'UTF8MB4_UNICODE_CI'
});

// Test connection on startup
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
    if (connection) {
        connection.release();
        console.log('✓ Database connected successfully');
    }
});

module.exports = pool.promise();